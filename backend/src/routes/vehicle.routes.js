import { Router } from 'express';
import {
  listVehicles,
  homeFeed,
  getVehicle,
  getAvailability,
  getSimilar,
  getNearby,
  compareVehicles,
  recentlyViewed,
  recommendations,
  myVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadImages,
  manageImages,
  payPostingFee,
  submitForApproval,
  vehicleAnalytics,
  distinctBrands,
} from '../controllers/vehicle.controller.js';
import { listReviews, createReview } from '../controllers/review.controller.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadVehicleImages } from '../config/cloudinary.js';
import { vehicleSchema, vehicleUpdateSchema, reviewSchema } from '../validators/schemas.js';

const router = Router();

// ---- Public discovery ----
router.get('/', listVehicles);
router.get('/home', homeFeed);
router.get('/nearby', getNearby);
router.get('/meta/brands', distinctBrands);
router.get('/recommendations', optionalAuth, recommendations);
router.post('/compare', compareVehicles);
router.post('/recently-viewed', recentlyViewed);

// ---- Owner: my listings (declare before :idOrSlug to avoid capture) ----
router.get('/owner/mine', protect, authorize('owner', 'admin'), myVehicles);
router.post('/', protect, authorize('owner', 'admin'), validate(vehicleSchema), createVehicle);

// ---- Reviews (nested) ----
router.get('/:vehicleId/reviews', listReviews);
router.post('/:vehicleId/reviews', protect, authorize('customer'), validate(reviewSchema), createReview);

// ---- Single vehicle sub-resources ----
router.get('/:id/availability', getAvailability);
router.get('/:id/similar', getSimilar);
router.get('/:id/analytics', protect, vehicleAnalytics);
router.post(
  '/:id/images',
  protect,
  authorize('owner', 'admin'),
  uploadVehicleImages.array('images', 20),
  uploadImages,
);
router.patch('/:id/images', protect, authorize('owner', 'admin'), manageImages);
router.post('/:id/pay-fee', protect, authorize('owner', 'admin'), payPostingFee);
router.post('/:id/submit', protect, authorize('owner', 'admin'), submitForApproval);
router.patch('/:id', protect, authorize('owner', 'admin'), validate(vehicleUpdateSchema), updateVehicle);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteVehicle);

// ---- Public detail (keep last: greedy slug/id param) ----
router.get('/:idOrSlug', getVehicle);

export default router;
