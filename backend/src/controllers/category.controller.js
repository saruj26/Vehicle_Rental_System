import Category from '../models/Category.js';
import Fee from '../models/Fee.js';
import Vehicle from '../models/Vehicle.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/index.js';

// GET /api/categories  (public) — with live vehicle counts + posting fee
export const listCategories = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  const fees = await Fee.find().lean();
  const feeMap = new Map(fees.map((f) => [f.category.toString(), f.amount]));
  const enriched = categories.map((c) => ({ ...c, postingFee: feeMap.get(c._id.toString()) ?? 0 }));
  return ok(res, { categories: enriched });
});

// GET /api/categories/:idOrSlug
export const getCategory = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? { _id: idOrSlug } : { slug: idOrSlug };
  const category = await Category.findOne(query);
  if (!category) throw ApiError.notFound('Category not found');
  const fee = await Fee.findOne({ category: category._id });
  return ok(res, { category, postingFee: fee?.amount ?? 0 });
});

// POST /api/admin/categories
export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, description, sortOrder, postingFee } = req.body;
  const category = await Category.create({ name, icon, description, sortOrder });
  // Create the fee row alongside (defaults to 0 or provided amount)
  await Fee.create({ category: category._id, amount: postingFee ?? 0, updatedBy: req.user._id });
  return ok(res, { category }, 'Category created', 201);
});

// PATCH /api/admin/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const allowed = ['name', 'icon', 'description', 'sortOrder', 'isActive'];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  Object.assign(category, updates);
  await category.save(); // triggers slug regeneration on name change
  return ok(res, { category }, 'Category updated');
});

// DELETE /api/admin/categories/:id
export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Vehicle.countDocuments({ category: req.params.id });
  if (inUse > 0)
    throw ApiError.conflict(`Cannot delete: ${inUse} vehicle(s) use this category. Deactivate it instead.`);
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  await Fee.deleteOne({ category: category._id });
  return ok(res, null, 'Category deleted');
});
