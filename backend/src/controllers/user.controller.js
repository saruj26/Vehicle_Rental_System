import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, paginate, pageMeta } from '../utils/index.js';

// ---- Self profile ----

// GET /api/users/me/profile
export const getProfile = asyncHandler(async (req, res) => ok(res, { user: req.user }));

// PATCH /api/users/me/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'whatsapp', 'location', 'bio'];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  if (req.file) updates.avatar = { url: req.file.path || req.file.url, publicId: req.file.filename };

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  return ok(res, { user }, 'Profile updated');
});

// PATCH /api/users/me/password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword)))
    throw ApiError.badRequest('Current password is incorrect');
  user.password = newPassword;
  await user.save();
  return ok(res, null, 'Password updated');
});

// GET /api/users/owners/:id  (public owner profile)
export const getPublicOwner = asyncHandler(async (req, res) => {
  const owner = await User.findOne({ _id: req.params.id, role: 'owner' }).select(
    'name avatar location bio isVerified verificationBadge ratingAvg ratingCount createdAt',
  );
  if (!owner) throw ApiError.notFound('Owner not found');
  const vehicles = await Vehicle.find({ owner: owner._id, status: 'published' })
    .select('name brand model pricePerDay coverImage ratingAvg ratingCount seatCapacity')
    .limit(12);
  return ok(res, { owner, vehicles });
});

// GET /api/users/owners/featured
export const getFeaturedOwners = asyncHandler(async (_req, res) => {
  const owners = await User.find({ role: 'owner', isVerified: true })
    .sort({ ratingAvg: -1, ratingCount: -1 })
    .limit(8)
    .select('name avatar location verificationBadge ratingAvg ratingCount');
  return ok(res, { owners });
});

// ---- Admin user management ----

// GET /api/admin/users
export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, q } = req.query;
  const { page, limit, skip } = paginate(req.query.page, req.query.limit);
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return ok(res, { users }, 'Users', 200, pageMeta(total, page, limit));
});

// PATCH /api/admin/users/:id  (status / role / verification)
export const adminUpdateUser = asyncHandler(async (req, res) => {
  const allowed = ['status', 'role', 'isVerified', 'verificationBadge'];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  if (updates.isVerified && !updates.verificationBadge) updates.verificationBadge = 'verified';

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  return ok(res, { user }, 'User updated');
});

// DELETE /api/admin/users/:id
export const adminDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'admin') throw ApiError.forbidden('Cannot delete an admin');
  await user.deleteOne();
  return ok(res, null, 'User deleted');
});
