import { Router } from 'express';
import {
  getWishlist,
  getWishlistIds,
  toggleWishlist,
  removeWishlist,
} from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getWishlist);
router.get('/ids', getWishlistIds);
router.post('/:vehicleId', toggleWishlist);
router.delete('/:vehicleId', removeWishlist);

export default router;
