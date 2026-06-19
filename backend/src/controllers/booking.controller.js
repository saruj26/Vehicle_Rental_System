import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import PromoCode from '../models/PromoCode.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, paginate, pageMeta } from '../utils/index.js';
import { notify } from '../utils/notify.js';

const DAY = 86400000;

/** Day count (inclusive of partial days rounded up, min 1). */
function diffDays(from, to) {
  return Math.max(1, Math.ceil((new Date(to) - new Date(from)) / DAY));
}

/** True if two date ranges overlap. */
function overlaps(aFrom, aTo, bFrom, bTo) {
  return new Date(aFrom) <= new Date(bTo) && new Date(bFrom) <= new Date(aTo);
}

/**
 * Compute the full price breakdown for a vehicle + date range, applying
 * weekly/monthly tiers, dynamic surge, service fee, tax, and optional promo.
 */
async function computeQuote(vehicle, pickupDate, returnDate, promoDoc, userId) {
  const settings = await Settings.get();
  const days = diffDays(pickupDate, returnDate);

  // Best base rate using monthly/weekly tiers when cheaper per-day
  let perDay = vehicle.pricePerDay;
  if (days >= 30 && vehicle.pricePerMonth) perDay = vehicle.pricePerMonth / 30;
  else if (days >= 7 && vehicle.pricePerWeek) perDay = vehicle.pricePerWeek / 7;

  let rentalAmount = perDay * days;

  // Dynamic pricing: weekend surge if any weekend day in range
  if (vehicle.dynamicPricing?.enabled) {
    const start = new Date(pickupDate);
    let weekendDays = 0;
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start.getTime() + i * DAY).getDay();
      if (d === 0 || d === 6) weekendDays += 1;
    }
    const surge = (perDay * weekendDays * (vehicle.dynamicPricing.weekendSurgePct || 0)) / 100;
    rentalAmount += surge;
  }
  rentalAmount = Math.round(rentalAmount * 100) / 100;

  const serviceFee = Math.round(rentalAmount * (settings.serviceFeePct / 100) * 100) / 100;
  const tax = Math.round((rentalAmount + serviceFee) * (settings.taxPct / 100) * 100) / 100;

  let discount = 0;
  if (promoDoc) {
    const err = promoDoc.isValidNow(rentalAmount, userId);
    if (err) throw ApiError.badRequest(err);
    discount = promoDoc.computeDiscount(rentalAmount);
  }

  const totalAmount =
    Math.round((rentalAmount + serviceFee + tax + (vehicle.securityDeposit || 0) - discount) * 100) / 100;

  return {
    totalDays: days,
    pricePerDay: Math.round(perDay * 100) / 100,
    rentalAmount,
    serviceFee,
    tax,
    securityDeposit: vehicle.securityDeposit || 0,
    discount,
    totalAmount,
    currency: settings.currency,
  };
}

// POST /api/bookings/quote  { vehicleId, pickupDate, returnDate, promoCode? }
export const quote = asyncHandler(async (req, res) => {
  const { vehicleId, pickupDate, returnDate, promoCode } = req.body;
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle || vehicle.status !== 'published') throw ApiError.notFound('Vehicle not available');
  if (new Date(pickupDate) >= new Date(returnDate))
    throw ApiError.badRequest('Return date must be after pickup date');

  let promoDoc = null;
  if (promoCode) promoDoc = await PromoCode.findOne({ code: promoCode.toUpperCase() });
  if (promoCode && !promoDoc) throw ApiError.badRequest('Invalid promo code');

  const q = await computeQuote(vehicle, pickupDate, returnDate, promoDoc, req.user?._id);
  return ok(res, { quote: q, promoApplied: Boolean(promoDoc) });
});

// POST /api/bookings  (customer creates a booking)
export const createBooking = asyncHandler(async (req, res) => {
  const { vehicleId, pickupDate, returnDate, pickupLocation, notes, promoCode } = req.body;

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle || vehicle.status !== 'published' || !vehicle.availability)
    throw ApiError.badRequest('Vehicle is not available for booking');
  if (vehicle.owner.toString() === req.user._id.toString())
    throw ApiError.badRequest('You cannot book your own vehicle');
  if (new Date(pickupDate) >= new Date(returnDate))
    throw ApiError.badRequest('Return date must be after pickup date');
  if (new Date(pickupDate) < new Date(Date.now() - DAY))
    throw ApiError.badRequest('Pickup date cannot be in the past');

  // Availability: reject if overlapping an active booking or blocked range
  const clashing = await Booking.findOne({
    vehicle: vehicle._id,
    status: { $in: ['pending', 'accepted', 'active'] },
    pickupDate: { $lt: new Date(returnDate) },
    returnDate: { $gt: new Date(pickupDate) },
  });
  if (clashing) throw ApiError.conflict('Vehicle is already booked for the selected dates');
  if (vehicle.blockedDates.some((b) => overlaps(pickupDate, returnDate, b.from, b.to)))
    throw ApiError.conflict('Selected dates are unavailable');

  let promoDoc = null;
  if (promoCode) {
    promoDoc = await PromoCode.findOne({ code: promoCode.toUpperCase() });
    if (!promoDoc) throw ApiError.badRequest('Invalid promo code');
  }

  const q = await computeQuote(vehicle, pickupDate, returnDate, promoDoc, req.user._id);

  const booking = await Booking.create({
    vehicle: vehicle._id,
    customer: req.user._id,
    owner: vehicle.owner,
    pickupDate,
    returnDate,
    pickupLocation,
    notes,
    promoCode: promoDoc?.code || null,
    ...q,
  });

  if (promoDoc) {
    promoDoc.usedCount += 1;
    promoDoc.usedBy.push(req.user._id);
    await promoDoc.save();
  }

  await notify({
    user: vehicle.owner,
    type: 'booking_created',
    title: 'New booking request',
    message: `${req.user.name} requested "${vehicle.name}" (${q.totalDays} day(s)).`,
    link: `/owner/bookings/${booking._id}`,
    meta: { bookingId: booking._id },
  });

  const populated = await booking.populate([
    { path: 'vehicle', select: 'name brand coverImage' },
    { path: 'owner', select: 'name whatsapp' },
  ]);
  return ok(res, { booking: populated }, 'Booking created', 201);
});

// GET /api/bookings/mine  (customer)
export const myBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { page, limit, skip } = paginate(req.query.page, req.query.limit);
  const filter = { customer: req.user._id };
  if (status) filter.status = status;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate([
        { path: 'vehicle', select: 'name brand coverImage slug' },
        { path: 'owner', select: 'name whatsapp avatar' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);
  return ok(res, { bookings }, 'My bookings', 200, pageMeta(total, page, limit));
});

// GET /api/bookings/owner  (owner sees requests for their vehicles)
export const ownerBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { page, limit, skip } = paginate(req.query.page, req.query.limit);
  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate([
        { path: 'vehicle', select: 'name brand coverImage' },
        { path: 'customer', select: 'name avatar phone whatsapp' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);
  return ok(res, { bookings }, 'Owner bookings', 200, pageMeta(total, page, limit));
});

// GET /api/bookings/:id
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate([
    { path: 'vehicle' },
    { path: 'customer', select: 'name avatar phone whatsapp email' },
    { path: 'owner', select: 'name avatar phone whatsapp email' },
  ]);
  if (!booking) throw ApiError.notFound('Booking not found');
  const uid = req.user._id.toString();
  if (
    req.user.role !== 'admin' &&
    booking.customer._id.toString() !== uid &&
    booking.owner._id.toString() !== uid
  )
    throw ApiError.forbidden('Not your booking');
  return ok(res, { booking });
});

async function transition(req, allowedRoles, run) {
  const booking = await Booking.findById(req.params.id).populate('vehicle', 'name');
  if (!booking) throw ApiError.notFound('Booking not found');
  const uid = req.user._id.toString();
  const isOwner = booking.owner.toString() === uid;
  const isCustomer = booking.customer.toString() === uid;
  const roleOk =
    req.user.role === 'admin' ||
    (allowedRoles.includes('owner') && isOwner) ||
    (allowedRoles.includes('customer') && isCustomer);
  if (!roleOk) throw ApiError.forbidden('Not allowed');
  await run(booking, { isOwner, isCustomer });
  await booking.save();
  return booking;
}

// PATCH /api/bookings/:id/accept  (owner)
export const acceptBooking = asyncHandler(async (req, res) => {
  const booking = await transition(req, ['owner'], (b) => {
    if (b.status !== 'pending') throw ApiError.badRequest(`Cannot accept a ${b.status} booking`);
    b.status = 'accepted';
  });
  await notify({
    user: booking.customer,
    type: 'booking_accepted',
    title: 'Booking accepted ✅',
    message: `Your booking for "${booking.vehicle.name}" was accepted.`,
    link: `/bookings/${booking._id}`,
  });
  return ok(res, { booking }, 'Booking accepted');
});

// PATCH /api/bookings/:id/reject  (owner) { reason }
export const rejectBooking = asyncHandler(async (req, res) => {
  const booking = await transition(req, ['owner'], (b) => {
    if (b.status !== 'pending') throw ApiError.badRequest(`Cannot reject a ${b.status} booking`);
    b.status = 'rejected';
    b.rejectionReason = req.body.reason || 'Owner unavailable';
  });
  await notify({
    user: booking.customer,
    type: 'booking_rejected',
    title: 'Booking rejected',
    message: `Your booking for "${booking.vehicle.name}" was rejected: ${booking.rejectionReason}`,
    link: `/bookings/${booking._id}`,
  });
  return ok(res, { booking }, 'Booking rejected');
});

// PATCH /api/bookings/:id/cancel  (customer or owner)
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await transition(req, ['owner', 'customer'], (b, { isOwner }) => {
    if (!['pending', 'accepted'].includes(b.status))
      throw ApiError.badRequest(`Cannot cancel a ${b.status} booking`);
    b.status = 'cancelled';
    b.cancelledBy = req.user.role === 'admin' ? 'admin' : isOwner ? 'owner' : 'customer';
  });
  const recipient = booking.cancelledBy === 'customer' ? booking.owner : booking.customer;
  await notify({
    user: recipient,
    type: 'booking_cancelled',
    title: 'Booking cancelled',
    message: `Booking ${booking.code} for "${booking.vehicle.name}" was cancelled.`,
    link: `/bookings/${booking._id}`,
  });
  return ok(res, { booking }, 'Booking cancelled');
});

// PATCH /api/bookings/:id/start  (owner marks active / handed over)
export const startBooking = asyncHandler(async (req, res) => {
  const booking = await transition(req, ['owner'], (b) => {
    if (b.status !== 'accepted') throw ApiError.badRequest('Booking must be accepted first');
    b.status = 'active';
  });
  return ok(res, { booking }, 'Booking marked active');
});

// PATCH /api/bookings/:id/complete  (owner completes -> records earnings + payment)
export const completeBooking = asyncHandler(async (req, res) => {
  const settings = await Settings.get();
  const booking = await transition(req, ['owner'], (b) => {
    if (!['accepted', 'active'].includes(b.status))
      throw ApiError.badRequest('Booking is not in a completable state');
    b.status = 'completed';
    b.paymentStatus = 'paid';
  });

  // Record payment + owner earnings (owner keeps rental minus platform service fee)
  const ownerShare = booking.rentalAmount;
  const platformShare = booking.serviceFee;
  const payment = await Payment.create({
    type: 'booking',
    user: booking.customer,
    booking: booking._id,
    vehicle: booking.vehicle._id,
    amount: booking.totalAmount,
    ownerShare,
    platformShare,
    status: 'succeeded',
    currency: settings.currency,
  });
  booking.payment = payment._id;
  await booking.save();

  await Promise.all([
    User.updateOne({ _id: booking.owner }, { $inc: { 'earnings.total': ownerShare } }),
    Vehicle.updateOne({ _id: booking.vehicle._id }, { $inc: { bookingsCount: 1 } }),
  ]);

  await notify({
    user: booking.customer,
    type: 'payment_success',
    title: 'Trip completed',
    message: `Your trip "${booking.vehicle.name}" is complete. Leave a review!`,
    link: `/bookings/${booking._id}`,
  });
  return ok(res, { booking, payment }, 'Booking completed');
});

// GET /api/admin/bookings  (admin sees all)
export const adminListBookings = asyncHandler(async (req, res) => {
  const { status, q } = req.query;
  const { page, limit, skip } = paginate(req.query.page, req.query.limit);
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.code = new RegExp(q, 'i');
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate([
        { path: 'vehicle', select: 'name brand' },
        { path: 'customer', select: 'name email' },
        { path: 'owner', select: 'name email' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);
  return ok(res, { bookings }, 'All bookings', 200, pageMeta(total, page, limit));
});
