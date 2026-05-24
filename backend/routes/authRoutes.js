// ============================================================
// Auth Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    register, verifyRegistrationOTP, requestAccessOtp, verifyAccessOtp, resendOTP,
    login, ldapLogin, logout,
} = require('../controllers/authController');

// POST /api/auth/register-user — Register a new user passwordlessly
router.post('/register', register);

// POST /api/auth/verify-otp — Verify old registration OTP
router.post('/verify-otp', verifyRegistrationOTP);

// POST /api/auth/request-access-otp — Send Email OTP for login
router.post('/request-access-otp', requestAccessOtp);

// POST /api/auth/verify-access-otp — Verify Email OTP and login
router.post('/verify-access-otp', verifyAccessOtp);

// POST /api/auth/resend-otp — Resend OTP
router.post('/resend-otp', resendOTP);

// POST /api/auth/login — Email/password login
router.post('/login', login);

// POST /api/auth/ldap-login — LDAP login for technicians
router.post('/ldap-login', ldapLogin);

// POST /api/auth/logout — Logout (invalidate session)
router.post('/logout', authenticate, logout);

module.exports = router;
