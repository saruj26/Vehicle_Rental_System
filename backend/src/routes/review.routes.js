import { Router } from 'express';
import { replyToReview, deleteReview } from '../controllers/review.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/:id/reply', protect, authorize('owner', 'admin'), replyToReview);
router.delete('/:id', protect, deleteReview);

export default router;
