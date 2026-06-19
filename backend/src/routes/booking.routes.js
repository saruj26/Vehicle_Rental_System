import { Router } from 'express';
import {
  quote,
  createBooking,
  myBookings,
  ownerBookings,
  getBooking,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  startBooking,
  completeBooking,
} from '../controllers/booking.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { quoteSchema, bookingSchema } from '../validators/schemas.js';

const router = Router();

router.post('/quote', validate(quoteSchema), quote);

router.use(protect);

router.post('/', authorize('customer'), validate(bookingSchema), createBooking);
router.get('/mine', authorize('customer'), myBookings);
router.get('/owner', authorize('owner', 'admin'), ownerBookings);
router.get('/:id', getBooking);

router.patch('/:id/accept', authorize('owner', 'admin'), acceptBooking);
router.patch('/:id/reject', authorize('owner', 'admin'), rejectBooking);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/start', authorize('owner', 'admin'), startBooking);
router.patch('/:id/complete', authorize('owner', 'admin'), completeBooking);

export default router;
