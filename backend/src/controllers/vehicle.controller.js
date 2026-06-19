import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import Category from '../models/Category.js';
import Fee from '../models/Fee.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, paginate, pageMeta } from '../utils/index.js';
import { notify } from '../utils/notify.js';

const POPULATE = [
  { path: 'category', select: 'name slug icon' },
  { path: 'owner', select: 'name avatar location isVerified verificationBadge ratingAvg' },
  { path: 'features', select: 'name icon' },
];

/** Build a Mongo filter from query params for the public catalog. */
function buildFilter(q) {
  const filter = { status: 'published', availability: true };

  if (q.q) filter.$text = { $search: q.q };
  if (q.category) filter.category = q.category;
  if (q.brand) filter.brand = new RegExp(`^${q.brand}$`, 'i');
  if (q.fuelType) filter.fuelType = q.fuelType;
  if (q.transmission) filter.transmission = q.transmission;
  if (q.condition) filter.condition = q.condition;
  if (q.location) filter.location = new RegExp(q.location, 'i');
  if (q.insuranceStatus) filter.insuranceStatus = q.insuranceStatus;

  // Seat capacity: support "20+" buckets
  if (q.seats) {
    if (String(q.seats).includes('+')) filter.seatCapacity = { $gte: parseInt(q.seats, 10) };
    else filter.seatCapacity = Number(q.seats);
  }
  if (q.minSeats) filter.seatCapacity = { ...filter.seatCapacity, $gte: Number(q.minSeats) };

  if (q.minPrice || q.maxPrice) {
    filter.pricePerDay = {};
    if (q.minPrice) filter.pricePerDay.$gte = Number(q.minPrice);
    if (q.maxPrice) filter.pricePerDay.$lte = Number(q.maxPrice);
  }
  if (q.year) filter.year = Number(q.year);
  if (q.minYear) filter.year = { ...filter.year, $gte: Number(q.minYear) };
  if (q.minRating) filter.ratingAvg = { $gte: Number(q.minRating) };
  if (q.featured === 'true') filter.isFeatured = true;
  if (q.owner) filter.owner = q.owner;

  return filter;
}

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { pricePerDay: 1 },
  price_desc: { pricePerDay: -1 },
  rating: { ratingAvg: -1, ratingCount: -1 },
  popular: { bookingsCount: -1, views: -1 },
  trending: { isTrending: -1, views: -1 },
};

// GET /api/vehicles  (public catalog with search + filters + sort + pagination)
export const listVehicles = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  const { page, limit, skip } = paginate(req.query.page, req.query.limit);
  const sort = SORTS[req.query.sort] || SORTS.newest;
  // Featured listings float to the top regardless of sort
  const finalSort = { isFeatured: -1, ...sort };

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter).populate(POPULATE).sort(finalSort).skip(skip).limit(limit),
    Vehicle.countDocuments(filter),
  ]);
  return ok(res, { vehicles }, 'Vehicles', 200, pageMeta(total, page, limit));
});

// GET /api/vehicles/home  (aggregated home-page sections in one call)
export const homeFeed = asyncHandler(async (_req, res) => {
  const base = { status: 'published', availability: true };
  const [trending, recent, topRated, featured] = await Promise.all([
    Vehicle.find(base).populate(POPULATE).sort({ views: -1, bookingsCount: -1 }).limit(8),
    Vehicle.find(base).populate(POPULATE).sort({ createdAt: -1 }).limit(8),
    Vehicle.find({ ...base, ratingCount: { $gt: 0 } }).populate(POPULATE).sort({ ratingAvg: -1 }).limit(8),
    Vehicle.find({ ...base, isFeatured: true }).populate(POPULATE).limit(8),
  ]);
  return ok(res, { trending, recent, topRated, featured });
});

// GET /api/vehicles/:idOrSlug  (public detail; increments views)
export const getVehicle = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? { _id: idOrSlug } : { slug: idOrSlug };
  const vehicle = await Vehicle.findOneAndUpdate(query, { $inc: { views: 1 } }, { new: true }).populate(
    POPULATE,
  );
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  return ok(res, { vehicle });
});

// GET /api/vehicles/:id/availability  (booked/blocked ranges for calendar)
export const getAvailability = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id).select('blockedDates availability');
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  const bookings = await Booking.find({
    vehicle: req.params.id,
    status: { $in: ['pending', 'accepted', 'active'] },
    returnDate: { $gte: new Date() },
  }).select('pickupDate returnDate status');
  const booked = bookings.map((b) => ({ from: b.pickupDate, to: b.returnDate, reason: b.status }));
  return ok(res, { available: vehicle.availability, blocked: [...vehicle.blockedDates, ...booked] });
});

// GET /api/vehicles/:id/similar
export const getSimilar = asyncHandler(async (req, res) => {
  const v = await Vehicle.findById(req.params.id).select('category seatCapacity pricePerDay');
  if (!v) throw ApiError.notFound('Vehicle not found');
  const similar = await Vehicle.find({
    _id: { $ne: v._id },
    status: 'published',
    availability: true,
    category: v.category,
  })
    .populate(POPULATE)
    .sort({ ratingAvg: -1 })
    .limit(6);
  return ok(res, { vehicles: similar });
});

// GET /api/vehicles/nearby?lat=&lng=&radius=km
export const getNearby = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 25 } = req.query;
  if (!lat || !lng) throw ApiError.badRequest('lat and lng are required');
  const vehicles = await Vehicle.find({
    status: 'published',
    availability: true,
    geo: {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radius) * 1000,
      },
    },
  })
    .populate(POPULATE)
    .limit(20);
  return ok(res, { vehicles });
});

// POST /api/vehicles/compare  { ids: [] }
export const compareVehicles = asyncHandler(async (req, res) => {
  const ids = (req.body.ids || []).filter((id) => mongoose.isValidObjectId(id)).slice(0, 4);
  if (ids.length < 2) throw ApiError.badRequest('Provide 2-4 vehicle ids to compare');
  const vehicles = await Vehicle.find({ _id: { $in: ids } }).populate(POPULATE);
  return ok(res, { vehicles });
});

// POST /api/vehicles/recently-viewed  { ids: [] } — resolve client-stored ids
export const recentlyViewed = asyncHandler(async (req, res) => {
  const ids = (req.body.ids || []).filter((id) => mongoose.isValidObjectId(id)).slice(0, 12);
  const vehicles = await Vehicle.find({ _id: { $in: ids }, status: 'published' }).populate(POPULATE);
  // preserve incoming order
  const order = new Map(ids.map((id, i) => [id, i]));
  vehicles.sort((a, b) => order.get(a.id) - order.get(b.id));
  return ok(res, { vehicles });
});

// GET /api/vehicles/recommendations  (simple heuristic: top categories the user booked/wishlisted)
export const recommendations = asyncHandler(async (req, res) => {
  let categories = [];
  if (req.user) {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('vehicle', 'category')
      .limit(20);
    categories = [...new Set(bookings.map((b) => b.vehicle?.category?.toString()).filter(Boolean))];
  }
  const filter = { status: 'published', availability: true };
  if (categories.length) filter.category = { $in: categories };
  const vehicles = await Vehicle.find(filter)
    .populate(POPULATE)
    .sort({ ratingAvg: -1, bookingsCount: -1 })
    .limit(8);
  return ok(res, { vehicles, basedOn: categories.length ? 'history' : 'popular' });
});

// ---------------- Owner CRUD ----------------

// GET /api/vehicles/owner/mine
export const myVehicles = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { page, limit, skip } = paginate(req.query.page, req.query.limit);
  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Vehicle.countDocuments(filter),
  ]);
  return ok(res, { vehicles }, 'My vehicles', 200, pageMeta(total, page, limit));
});

// POST /api/vehicles  (owner creates a draft + computes required posting fee)
export const createVehicle = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category || !category.isActive) throw ApiError.badRequest('Invalid category');

  const fee = await Fee.findOne({ category: category._id });
  const settings = await Settings.get();
  const feeAmount = fee?.amount ?? settings.defaultPostingFee;

  const vehicle = await Vehicle.create({
    ...req.body,
    owner: req.user._id,
    status: 'draft',
    feeAmount,
    feePaid: false,
  });
  await Category.updateOne({ _id: category._id }, { $inc: { vehicleCount: 1 } });

  const populated = await vehicle.populate(POPULATE);
  return ok(res, { vehicle: populated, postingFee: feeAmount }, 'Vehicle draft created', 201);
});

async function loadOwnedVehicle(id, user) {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (user.role !== 'admin' && vehicle.owner.toString() !== user._id.toString())
    throw ApiError.forbidden('Not your vehicle');
  return vehicle;
}

// PATCH /api/vehicles/:id
export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await loadOwnedVehicle(req.params.id, req.user);
  const immutable = ['owner', 'status', 'feePaid', 'feeAmount', 'approvedBy', 'ratingAvg', 'ratingCount'];
  immutable.forEach((k) => delete req.body[k]);

  // Editing a live listing sends it back to pending re-approval
  Object.assign(vehicle, req.body);
  if (['published', 'approved'].includes(vehicle.status)) vehicle.status = 'pending';
  await vehicle.save();
  const populated = await vehicle.populate(POPULATE);
  return ok(res, { vehicle: populated }, 'Vehicle updated');
});

// DELETE /api/vehicles/:id
export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await loadOwnedVehicle(req.params.id, req.user);
  const activeBookings = await Booking.countDocuments({
    vehicle: vehicle._id,
    status: { $in: ['pending', 'accepted', 'active'] },
  });
  if (activeBookings > 0) throw ApiError.conflict('Cannot delete: vehicle has active bookings');
  await vehicle.deleteOne();
  await Category.updateOne({ _id: vehicle.category }, { $inc: { vehicleCount: -1 } });
  return ok(res, null, 'Vehicle deleted');
});

// POST /api/vehicles/:id/images  (multipart: images[]) — append uploaded images
export const uploadImages = asyncHandler(async (req, res) => {
  const vehicle = await loadOwnedVehicle(req.params.id, req.user);
  const files = req.files || [];
  if (!files.length) throw ApiError.badRequest('No images uploaded');
  const startOrder = vehicle.images.length;
  const newImages = files.map((f, i) => ({
    url: f.path || f.url || `https://placehold.co/800x600?text=${encodeURIComponent(vehicle.brand)}`,
    publicId: f.filename || f.public_id,
    order: startOrder + i,
  }));
  if (vehicle.images.length + newImages.length > 20)
    throw ApiError.badRequest('Maximum 20 images allowed');
  vehicle.images.push(...newImages);
  if (!vehicle.coverImage?.url) vehicle.coverImage = { url: newImages[0].url, publicId: newImages[0].publicId };
  await vehicle.save();
  return ok(res, { images: vehicle.images, coverImage: vehicle.coverImage }, 'Images uploaded');
});

// PATCH /api/vehicles/:id/images  (reorder / set cover / delete) { images:[{publicId,order}], coverPublicId, deletePublicIds:[] }
export const manageImages = asyncHandler(async (req, res) => {
  const vehicle = await loadOwnedVehicle(req.params.id, req.user);
  const { order = [], coverPublicId, deletePublicIds = [] } = req.body;

  if (deletePublicIds.length)
    vehicle.images = vehicle.images.filter((img) => !deletePublicIds.includes(img.publicId));

  if (order.length) {
    const orderMap = new Map(order.map((o) => [o.publicId, o.order]));
    vehicle.images.forEach((img) => {
      if (orderMap.has(img.publicId)) img.order = orderMap.get(img.publicId);
    });
    vehicle.images.sort((a, b) => a.order - b.order);
  }

  if (coverPublicId) {
    const cover = vehicle.images.find((i) => i.publicId === coverPublicId);
    if (cover) vehicle.coverImage = { url: cover.url, publicId: cover.publicId };
  }
  if (vehicle.images.length < 1) throw ApiError.badRequest('At least 1 image is required');
  await vehicle.save();
  return ok(res, { images: vehicle.images, coverImage: vehicle.coverImage }, 'Images updated');
});

// POST /api/vehicles/:id/pay-fee  (mock payment that unlocks submission)
export const payPostingFee = asyncHandler(async (req, res) => {
  const vehicle = await loadOwnedVehicle(req.params.id, req.user);
  if (vehicle.feePaid) throw ApiError.badRequest('Fee already paid');

  const payment = await Payment.create({
    type: 'posting_fee',
    user: req.user._id,
    vehicle: vehicle._id,
    amount: vehicle.feeAmount,
    provider: req.body.provider || 'manual',
    providerRef: req.body.providerRef,
    platformShare: vehicle.feeAmount,
    status: 'succeeded', // gateway integration flips this on webhook
  });

  vehicle.feePaid = true;
  vehicle.feePayment = payment._id;
  await vehicle.save();

  await notify({
    user: req.user._id,
    type: 'payment_success',
    title: 'Posting fee paid',
    message: `Your payment of $${vehicle.feeAmount} for "${vehicle.name}" was successful.`,
    link: `/owner/vehicles/${vehicle._id}`,
  });
  return ok(res, { vehicle, payment }, 'Posting fee paid');
});

// POST /api/vehicles/:id/submit  (draft -> pending approval; requires fee + images)
export const submitForApproval = asyncHandler(async (req, res) => {
  const vehicle = await loadOwnedVehicle(req.params.id, req.user);
  if (!vehicle.feePaid) throw ApiError.badRequest('Pay the posting fee before submitting');
  if (vehicle.images.length < 1) throw ApiError.badRequest('Upload at least 1 image');
  if (!['draft', 'rejected'].includes(vehicle.status))
    throw ApiError.badRequest(`Cannot submit from status "${vehicle.status}"`);
  vehicle.status = 'pending';
  vehicle.rejectionReason = undefined;
  await vehicle.save();
  return ok(res, { vehicle }, 'Submitted for approval');
});

// ---------------- Admin moderation ----------------

// GET /api/admin/vehicles  (all, with status filter)
export const adminListVehicles = asyncHandler(async (req, res) => {
  const { status, q } = req.query;
  const { page, limit, skip } = paginate(req.query.page, req.query.limit);
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.$text = { $search: q };
  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Vehicle.countDocuments(filter),
  ]);
  return ok(res, { vehicles }, 'Vehicles', 200, pageMeta(total, page, limit));
});

// POST /api/admin/vehicles/:id/approve
export const approveVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  vehicle.status = 'published';
  vehicle.approvedBy = req.user._id;
  vehicle.approvedAt = new Date();
  vehicle.publishedAt = new Date();
  vehicle.rejectionReason = undefined;
  await vehicle.save();
  await notify({
    user: vehicle.owner,
    type: 'vehicle_approved',
    title: 'Vehicle approved 🎉',
    message: `"${vehicle.name}" is now live on the marketplace.`,
    link: `/owner/vehicles/${vehicle._id}`,
  });
  return ok(res, { vehicle }, 'Vehicle approved & published');
});

// POST /api/admin/vehicles/:id/reject  { reason }
export const rejectVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  vehicle.status = 'rejected';
  vehicle.rejectionReason = req.body.reason || 'Did not meet listing guidelines';
  await vehicle.save();
  await notify({
    user: vehicle.owner,
    type: 'vehicle_rejected',
    title: 'Vehicle rejected',
    message: `"${vehicle.name}" was rejected: ${vehicle.rejectionReason}`,
    link: `/owner/vehicles/${vehicle._id}`,
  });
  return ok(res, { vehicle }, 'Vehicle rejected');
});

// PATCH /api/admin/vehicles/:id/feature  { isFeatured, days }
export const featureVehicle = asyncHandler(async (req, res) => {
  const { isFeatured = true, days = 30 } = req.body;
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  vehicle.isFeatured = isFeatured;
  vehicle.featuredUntil = isFeatured ? new Date(Date.now() + days * 86400000) : undefined;
  await vehicle.save();
  return ok(res, { vehicle }, isFeatured ? 'Vehicle featured' : 'Feature removed');
});

// GET /api/vehicles/:id/analytics  (owner/admin)
export const vehicleAnalytics = asyncHandler(async (req, res) => {
  const vehicle = await loadOwnedVehicle(req.params.id, req.user);
  const bookings = await Booking.find({ vehicle: vehicle._id });
  const revenue = bookings
    .filter((b) => ['accepted', 'active', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + b.rentalAmount, 0);
  const byStatus = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});
  return ok(res, {
    analytics: {
      views: vehicle.views,
      favorites: vehicle.favoritesCount,
      bookings: bookings.length,
      revenue,
      ratingAvg: vehicle.ratingAvg,
      ratingCount: vehicle.ratingCount,
      conversionRate: vehicle.views ? Number(((bookings.length / vehicle.views) * 100).toFixed(2)) : 0,
      byStatus,
    },
  });
});

// GET /api/vehicles/meta/brands  — distinct brands for filter UI
export const distinctBrands = asyncHandler(async (_req, res) => {
  const brands = await Vehicle.distinct('brand', { status: 'published' });
  return ok(res, { brands: brands.sort() });
});
