// ============================================================
// Notification Controller — Fetch and manage user notifications
// ============================================================
const { prisma } = require('../config/db');

/**
 * Get all notifications for the current user
 * GET /api/notifications
 */
const getMyNotifications = async (req, res, next) => {
    try {
        const uid = req.user.id;
        const notifications = await prisma.notifications.findMany({
            where: { user_id: uid },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        res.json({ notifications });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
const markRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const uid = req.user.id;

        await prisma.notifications.update({
            where: { id: parseInt(id), user_id: uid },
            data: { is_read: true }
        });

        res.json({ message: 'Notification marked as read.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
const markAllRead = async (req, res, next) => {
    try {
        const uid = req.user.id;

        await prisma.notifications.updateMany({
            where: { user_id: uid, is_read: false },
            data: { is_read: true }
        });

        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Helper to create a notification (Server-side use)
 */
const createNotification = async (userId, title, message, type = 'info') => {
    try {
        await prisma.notifications.create({
            data: {
                user_id: userId,
                title,
                message,
                type
            }
        });
    } catch (error) {
        console.error('Failed to create notification:', error.message);
    }
};

module.exports = { getMyNotifications, markRead, markAllRead, createNotification };
