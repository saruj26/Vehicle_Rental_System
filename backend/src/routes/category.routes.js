import { Router } from 'express';
import { listCategories, getCategory } from '../controllers/category.controller.js';
import { listFeatures } from '../controllers/feature.controller.js';
import { listFees, getFeeForCategory } from '../controllers/fee.controller.js';

const router = Router();

// Public catalog metadata
router.get('/categories', listCategories);
router.get('/categories/:idOrSlug', getCategory);
router.get('/features', listFeatures);
router.get('/fees', listFees);
router.get('/fees/category/:categoryId', getFeeForCategory);

export default router;
