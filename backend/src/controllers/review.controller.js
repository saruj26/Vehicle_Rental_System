import Review from '../models/Review.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Settings from '../models/Settings.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, paginate, pageMeta } from '../utils/index.js';
import { notify } from '../utils/notify.js';

/** Recompute a vehicle's (and its owner's) rating aggregates. */
async function recomputeRatings(vehicleId) {
  const agg = await Review.aggregate([
    { $match: { vehicle: vehicleId, status: 'approved' } },
    { $group: { _id: '$vehicle', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
  const count = agg[0]?.count || 0;
  const vehicle = await Vehicle.findByIdAndUpdate(
    vehicleId,
    { ratingAvg: avg, ratingCount: count },
    { new: true },
  );

  if (vehicle) {
    const ownerAgg = await Vehicle.aggregate([
      { $match: { owner: vehicle.owner, ratingCount: { $gt: 0 } } },
      { $group: { _id: '$owner', avg: { $avg: '$ratingAvg' }, count: { $sum: '$ratingCount' } } },
    ]);
    await User.updateOne(
      { _id: vehicle.owner },
      {
        ratingAvg: ownerAgg[0] ? Math.round(ownerAgg[0].avg * 10) / 10 : 0,
        ratingCount: ownerAgg[0]?.count || 0,
      },
    );
  }
}

// GET /api/vehicles/:vehicleId/reviews
export const listReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query.page, req.query.limit);
  const filter = { vehicle: req.params.vehicleId, status: 'approved' };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);
  return ok(res, { reviews }, 'Reviews', 200, pageMeta(total, page, limit));
});

// POST /api/vehicles/:vehicleId/reviews  (customer who completed a booking)
export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const vehicleId = req.params.vehicleId;

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  const completed = await Booking.findOne({
    vehicle: vehicleId,
    customer: req.user._id,
    status: 'completed',
  });
  if (!completed) throw ApiError.forbidden('You can only review vehicles you have completed a trip with');

  const exists = await Review.findOne({ vehicle: vehicleId, customer: req.user._id });
  if (exists) throw ApiError.conflict('You already reviewed this vehicle');

  const settings = await Settings.get();
  const review = await Review.create({
    vehicle: vehicleId,
    customer: req.user._id,
    booking: completed._id,
    rating,
    comment,
    status: settings.autoApproveReviews ? 'approved' : 'pending',
  });
  completed.reviewed = true;
  await completed.save();
  await recomputeRatings(vehicle._id);

  await notify({
    user: vehicle.owner,
    type: 'review_received',
    title: 'New review ⭐',
    message: `${req.user.name} left a ${rating}-star review on "${vehicle.name}".`,
    link: `/vehicles/${vehicle.slug}`,
  });
  return ok(res, { review }, 'Review submitted', 201);
});

// POST /api/reviews/:id/reply  (owner replies)
export const replyToReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id).populate('vehicle', 'owner name');
  if (!review) throw ApiError.notFound('Review not found');
  if (review.vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
    throw ApiError.forbidden('Only the vehicle owner can reply');
  review.ownerReply = { text: req.body.text, repliedAt: new Date() };
  await review.save();
  return ok(res, { review }, 'Reply added');
});

// DELETE /api/reviews/:id  (author or admin)
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (review.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin')
    throw ApiError.forbidden('Not allowed');
  await review.deleteOne();
  await recomputeRatings(review.vehicle);
  return ok(res, null, 'Review deleted');
});

// ---- Admin moderation ----

// GET /api/admin/reviews
export const adminListReviews = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { page, limit, skip } = paginate(req.query.page, req.query.limit);
  const filter = {};
  if (status) filter.status = status;
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('customer', 'name')
      .populate('vehicle', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);
  return ok(res, { reviews }, 'Reviews', 200, pageMeta(total, page, limit));
});

// PATCH /api/admin/reviews/:id  { status }
export const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true },
  );
  if (!review) throw ApiError.notFound('Review not found');
  await recomputeRatings(review.vehicle);
  return ok(res, { review }, 'Review moderated');
});
