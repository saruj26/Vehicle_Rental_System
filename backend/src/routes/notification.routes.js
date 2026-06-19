import { Router } from 'express';
import {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  removeNotification,
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', listNotifications);
router.get('/unread-count', unreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/:id', removeNotification);

export default router;
