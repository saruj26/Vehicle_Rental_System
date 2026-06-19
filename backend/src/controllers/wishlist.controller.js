import Wishlist from '../models/Wishlist.js';
import Vehicle from '../models/Vehicle.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/index.js';

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id })
    .populate({
      path: 'vehicle',
      select: 'name brand model pricePerDay coverImage seatCapacity ratingAvg ratingCount status slug',
      populate: { path: 'category', select: 'name icon' },
    })
    .sort({ createdAt: -1 });
  const vehicles = items.filter((i) => i.vehicle).map((i) => i.vehicle);
  return ok(res, { vehicles });
});

// GET /api/wishlist/ids  (lightweight — for toggling heart state on cards)
export const getWishlistIds = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id }).select('vehicle');
  return ok(res, { ids: items.map((i) => i.vehicle) });
});

// POST /api/wishlist/:vehicleId  (toggle)
export const toggleWishlist = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  const existing = await Wishlist.findOne({ user: req.user._id, vehicle: vehicleId });
  if (existing) {
    await existing.deleteOne();
    await Vehicle.updateOne({ _id: vehicleId }, { $inc: { favoritesCount: -1 } });
    return ok(res, { saved: false }, 'Removed from wishlist');
  }
  await Wishlist.create({ user: req.user._id, vehicle: vehicleId });
  await Vehicle.updateOne({ _id: vehicleId }, { $inc: { favoritesCount: 1 } });
  return ok(res, { saved: true }, 'Added to wishlist');
});

// DELETE /api/wishlist/:vehicleId
export const removeWishlist = asyncHandler(async (req, res) => {
  const removed = await Wishlist.findOneAndDelete({ user: req.user._id, vehicle: req.params.vehicleId });
  if (removed) await Vehicle.updateOne({ _id: req.params.vehicleId }, { $inc: { favoritesCount: -1 } });
  return ok(res, null, 'Removed from wishlist');
});
