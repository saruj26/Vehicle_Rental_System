import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getPublicOwner,
  getFeaturedOwners,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema } from '../validators/schemas.js';
import { uploadAvatar } from '../config/cloudinary.js';

const router = Router();

router.get('/owners/featured', getFeaturedOwners);
router.get('/owners/:id', getPublicOwner);

router.get('/me/profile', protect, getProfile);
router.patch('/me/profile', protect, uploadAvatar.single('avatar'), updateProfile);
router.patch('/me/password', protect, validate(changePasswordSchema), changePassword);

export default router;
