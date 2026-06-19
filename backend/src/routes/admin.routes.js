import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { categorySchema, featureSchema, feeSchema, promoSchema } from '../validators/schemas.js';

import { listUsers, adminUpdateUser, adminDeleteUser } from '../controllers/user.controller.js';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { createFeature, updateFeature, deleteFeature } from '../controllers/feature.controller.js';
import { upsertFee } from '../controllers/fee.controller.js';
import {
  adminListVehicles,
  approveVehicle,
  rejectVehicle,
  featureVehicle,
} from '../controllers/vehicle.controller.js';
import { adminListBookings } from '../controllers/booking.controller.js';
import { adminListReviews, moderateReview } from '../controllers/review.controller.js';
import {
  listPromos,
  createPromo,
  updatePromo,
  deletePromo,
} from '../controllers/promo.controller.js';
import {
  adminDashboard,
  adminReports,
  getSettings,
  updateSettings,
} from '../controllers/dashboard.controller.js';

const router = Router();

// Everything here requires an authenticated admin
router.use(protect, authorize('admin'));

// Dashboard / reports / settings
router.get('/dashboard', adminDashboard);
router.get('/reports', adminReports);
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

// Users
router.get('/users', listUsers);
router.patch('/users/:id', adminUpdateUser);
router.delete('/users/:id', adminDeleteUser);

// Categories
router.post('/categories', validate(categorySchema), createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Features
router.post('/features', validate(featureSchema), createFeature);
router.patch('/features/:id', updateFeature);
router.delete('/features/:id', deleteFeature);

// Posting fees (dynamic)
router.put('/fees/:categoryId', validate(feeSchema), upsertFee);

// Vehicles moderation
router.get('/vehicles', adminListVehicles);
router.post('/vehicles/:id/approve', approveVehicle);
router.post('/vehicles/:id/reject', rejectVehicle);
router.patch('/vehicles/:id/feature', featureVehicle);

// Bookings
router.get('/bookings', adminListBookings);

// Reviews moderation
router.get('/reviews', adminListReviews);
router.patch('/reviews/:id', moderateReview);

// Promo codes
router.get('/promos', listPromos);
router.post('/promos', validate(promoSchema), createPromo);
router.patch('/promos/:id', updatePromo);
router.delete('/promos/:id', deletePromo);

export default router;
