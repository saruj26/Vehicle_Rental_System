import { Router } from 'express';
import { validatePromo } from '../controllers/promo.controller.js';
import { ownerDashboard } from '../controllers/dashboard.controller.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Promo validation (open to logged-in or anonymous quote flows)
router.post('/promos/validate', optionalAuth, validatePromo);

// Owner dashboard
router.get('/owner/dashboard', protect, authorize('owner', 'admin'), ownerDashboard);

export default router;
