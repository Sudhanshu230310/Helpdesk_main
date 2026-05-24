// ============================================================
// Authentication Middleware — JWT verify + Role Guard
// ============================================================
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

/**
 * Verify JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from DB to ensure they're still active
        const user = await prisma.users.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found.' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated.' });
        }

        // Single-session enforcement: check session token matches
        if (decoded.sessionToken && user.session_token !== decoded.sessionToken) {
            return res.status(401).json({
                error: 'Session expired. You have been logged in from another device.',
                sessionExpired: true,
            });
        }

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        next(error);
    }
};

/**
 * Authorize based on user roles
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'technician')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Required role: ${roles.join(' or ')}`,
            });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
