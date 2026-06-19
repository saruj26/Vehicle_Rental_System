import Fee from '../models/Fee.js';
import Category from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/index.js';

// GET /api/fees  (public-ish: owners need to see fee before listing)
export const listFees = asyncHandler(async (_req, res) => {
  const fees = await Fee.find().populate('category', 'name slug icon').sort({ createdAt: 1 });
  return ok(res, { fees });
});

// GET /api/fees/category/:categoryId
export const getFeeForCategory = asyncHandler(async (req, res) => {
  const fee = await Fee.findOne({ category: req.params.categoryId }).populate('category', 'name');
  return ok(res, { fee: fee || null, amount: fee?.amount ?? 0 });
});

// PUT /api/admin/fees/:categoryId  (set/update dynamically — upsert)
export const upsertFee = asyncHandler(async (req, res) => {
  const { amount, currency, isActive } = req.body;
  const category = await Category.findById(req.params.categoryId);
  if (!category) throw ApiError.notFound('Category not found');

  const fee = await Fee.findOneAndUpdate(
    { category: category._id },
    { amount, currency, isActive, updatedBy: req.user._id },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).populate('category', 'name');
  return ok(res, { fee }, 'Posting fee updated');
});
