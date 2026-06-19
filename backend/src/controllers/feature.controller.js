import Feature from '../models/Feature.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/index.js';

// GET /api/features
export const listFeatures = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const features = await Feature.find(filter).sort({ name: 1 });
  return ok(res, { features });
});

// POST /api/admin/features
export const createFeature = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  const feature = await Feature.create({ name, icon });
  return ok(res, { feature }, 'Feature created', 201);
});

// PATCH /api/admin/features/:id
export const updateFeature = asyncHandler(async (req, res) => {
  const allowed = ['name', 'icon', 'isActive'];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  const feature = await Feature.findById(req.params.id);
  if (!feature) throw ApiError.notFound('Feature not found');
  Object.assign(feature, updates);
  await feature.save();
  return ok(res, { feature }, 'Feature updated');
});

// DELETE /api/admin/features/:id
export const deleteFeature = asyncHandler(async (req, res) => {
  const feature = await Feature.findByIdAndDelete(req.params.id);
  if (!feature) throw ApiError.notFound('Feature not found');
  return ok(res, null, 'Feature deleted');
});
