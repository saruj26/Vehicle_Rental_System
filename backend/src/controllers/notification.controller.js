import Notification from '../models/Notification.js';
import { asyncHandler, ok, paginate, pageMeta } from '../utils/index.js';

// GET /api/notifications
export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query.page, req.query.limit);
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;
  const [notifications, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  return ok(res, { notifications, unread }, 'Notifications', 200, pageMeta(total, page, limit));
});

// GET /api/notifications/unread-count
export const unreadCount = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({ user: req.user._id, isRead: false });
  return ok(res, { unread });
});

// PATCH /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { isRead: true });
  return ok(res, null, 'Marked as read');
});

// PATCH /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  return ok(res, null, 'All marked as read');
});

// DELETE /api/notifications/:id
export const removeNotification = asyncHandler(async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
  return ok(res, null, 'Notification deleted');
});
