const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../models/db');

// GET /api/notifications - List user's notifications
router.get('/', requireAuth, (req, res) => {
  const notes = db.find('notifications', n => n.userId === req.user.id);
  notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unreadCount = notes.filter(n => !n.isRead).length;
  res.json({
    notifications: notes,
    unreadCount
  });
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', requireAuth, (req, res) => {
  const updated = db.update('notifications', n => n.id === req.params.id && n.userId === req.user.id, { isRead: true });
  res.json({ success: true });
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', requireAuth, (req, res) => {
  db.update('notifications', n => n.userId === req.user.id, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

// DELETE /api/notifications - Clear all notifications
router.delete('/', requireAuth, (req, res) => {
  db.remove('notifications', n => n.userId === req.user.id);
  res.json({ success: true, message: 'Notifications cleared.' });
});

module.exports = router;
