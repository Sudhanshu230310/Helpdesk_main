const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMyNotifications, markRead, markAllRead } = require('../controllers/notificationController');

router.use(authenticate);

router.get('/', getMyNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

module.exports = router;
