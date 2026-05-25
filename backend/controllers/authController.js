// ============================================================
// Auth Controller — Registration, Login, OTP, LDAP
// ============================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/db');
const { createOTP, verifyOTP } = require('../services/otpService');
const { sendOtpEmail } = require('../services/emailService');
const { ldapAuthenticate } = require('../services/ldapService');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { name, phone, department } = req.body;
        const email = (req.body.email || '').toLowerCase().trim();

        // Check if email already exists
        const existingUser = await prisma.users.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        // Create user via Prisma (passwordless by default for users)
        const user = await prisma.users.create({
            data: {
                name,
                email,
                password_hash: null,
                phone: phone || null,
                department: department || null,
                role: 'user',
                is_verified: false,
                is_active: true
            }
        });

        // Generate and send OTP for email verification
        const otp = await createOTP(email, 'registration', user.id);
        await sendOtpEmail(email, otp, 'registration');

        res.status(201).json({
            message: 'Registration successful. Please verify your email with the OTP sent.',
            userId: user.id,
            email: user.email,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify email OTP after registration
 * POST /api/auth/verify-otp
 */
const verifyRegistrationOTP = async (req, res, next) => {
    try {
        const email = (req.body.email || '').toLowerCase().trim();
        const { otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required.' });
        }

        const result = await verifyOTP(email, otp, 'registration');

        if (!result.isValid) {
            return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }

        // Mark user as verified
        await prisma.users.update({
            where: { email },
            data: { is_verified: true, updated_at: new Date() }
        });

        res.json({ message: 'Email verified successfully. You can now login.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Request Access OTP (for existing user login)
 * POST /api/auth/request-access-otp
 */
const requestAccessOtp = async (req, res, next) => {
    try {
        console.log("hii")
        if (!req.body.email) return res.status(400).json({ error: 'Email is required.' });
        const email = req.body.email.toLowerCase().trim();

        // Use upsert to safely find-or-create without duplicate risk
        let user = await prisma.users.findUnique({ where: { email } });

        if (!user) {
            // Only create if genuinely not found
            user = await prisma.users.create({
                data: {
                    name: 'Guest User',
                    email,
                    role: 'user',
                    is_verified: false,
                    is_active: true
                }
            });
        }

        if (user.role !== 'user') {
            return res.status(403).json({ error: 'Staff members please use the Staff Login portal.' });
        }

        const otp = await createOTP(email, 'registration', user.id);
        await sendOtpEmail(email, otp, 'login');

        res.json({ message: 'OTP sent to email.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify Access OTP (for login / registration)
 * POST /api/auth/verify-access-otp
 */
const verifyAccessOtp = async (req, res, next) => {
    try {
        const email = (req.body.email || '').toLowerCase().trim();
        const { otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required.' });
        }

        const result = await verifyOTP(email, otp, 'registration');

        if (!result.isValid) {
            return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }

        // Mark as verified if not already and fetch user
        const user = await prisma.users.update({
            where: { email },
            data: { is_verified: true, updated_at: new Date() }
        });

        if (user.role !== 'user') {
            return res.status(403).json({ error: 'Staff members must use password login.' });
        }

        const sessionToken = uuidv4();
        await prisma.users.update({
            where: { id: user.id },
            data: { session_token: sessionToken, updated_at: new Date() }
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, sessionToken },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            message: 'Login successful via OTP!',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
const resendOTP = async (req, res, next) => {
    try {
        const email = (req.body.email || '').toLowerCase().trim();
        const { purpose } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const otp = await createOTP(email, purpose || 'registration');
        await sendOtpEmail(email, otp, purpose || 'registration');

        res.json({ message: 'OTP resent successfully.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Login with email/password
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { password } = req.body;
        const email = (req.body.email || '').toLowerCase().trim();

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated.' });
        }

        if (user.role === 'user') {
            return res.status(403).json({ error: 'Users must use Login with OTP instead.' });
        }

        if (!user.password_hash) {
            return res.status(401).json({ error: 'Please use LDAP login.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const sessionToken = uuidv4();
        await prisma.users.update({
            where: { id: user.id },
            data: { session_token: sessionToken, updated_at: new Date() }
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, sessionToken },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * LDAP Login for technicians
 * POST /api/auth/ldap-login
 */
const ldapLogin = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const result = await ldapAuthenticate(username, password);

        if (!result.success) {
            return res.status(401).json({ error: result.error || 'LDAP authentication failed.' });
        }

        // Upsert user
        const dbUser = await prisma.users.upsert({
            where: { email: result.user.email },
            update: {
                name: result.user.name,
                ldap_dn: result.user.ldap_dn,
                department: result.user.department || undefined,
                updated_at: new Date()
            },
            create: {
                name: result.user.name,
                email: result.user.email,
                ldap_dn: result.user.ldap_dn,
                department: result.user.department || null,
                role: 'technician',
                is_verified: true,
                is_active: true
            }
        });

        const sessionToken = uuidv4();
        await prisma.users.update({
            where: { id: dbUser.id },
            data: { session_token: sessionToken, updated_at: new Date() }
        });

        const token = jwt.sign(
            { id: dbUser.id, email: dbUser.email, role: dbUser.role, sessionToken },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            message: 'LDAP login successful',
            token,
            user: {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                role: dbUser.role,
                department: result.user.department,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout — invalidate session token
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
    try {
        await prisma.users.update({
            where: { id: req.user.id },
            data: { session_token: null, updated_at: new Date() }
        });
        res.json({ message: 'Logged out successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, verifyRegistrationOTP, requestAccessOtp, verifyAccessOtp, resendOTP, login, ldapLogin, logout };
