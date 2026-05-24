// ============================================================
// User Controller — Profile management
// ============================================================
const { prisma } = require('../config/db');

/**
 * Get current user profile
 * GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.users.findUnique({
            where: { id: req.user.id }
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        const { password_hash, session_token, ldap_dn, ...safeUser } = user;
        res.json({ user: safeUser });
    } catch (error) {
        next(error);
    }
};

/**
 * Update current user profile
 * PUT /api/users/profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, department, email_notifications_enabled } = req.body;

        const updatedUser = await prisma.users.update({
            where: { id: req.user.id },
            data: {
                name: name !== undefined ? name : undefined,
                phone: phone !== undefined ? phone : undefined,
                department: department !== undefined ? department : undefined,
                email_notifications_enabled: email_notifications_enabled !== undefined ? email_notifications_enabled : undefined,
                updated_at: new Date()
            }
        });

        const { password_hash, session_token, ldap_dn, ...safeUser } = updatedUser;

        res.json({
            message: 'Profile updated successfully.',
            user: safeUser,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getProfile, updateProfile };
