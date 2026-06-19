import PromoCode from '../models/PromoCode.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/index.js';

// POST /api/promos/validate  { code, amount }
export const validatePromo = asyncHandler(async (req, res) => {
  const { code, amount = 0 } = req.body;
  const promo = await PromoCode.findOne({ code: String(code).toUpperCase() });
  if (!promo) throw ApiError.notFound('Promo code not found');
  const err = promo.isValidNow(amount, req.user?._id);
  if (err) throw ApiError.badRequest(err);
  return ok(res, {
    code: promo.code,
    discount: promo.computeDiscount(amount),
    discountType: promo.discountType,
    discountValue: promo.discountValue,
  });
});

// ---- Admin ----

// GET /api/admin/promos
export const listPromos = asyncHandler(async (_req, res) => {
  const promos = await PromoCode.find().sort({ createdAt: -1 });
  return ok(res, { promos });
});

// POST /api/admin/promos
export const createPromo = asyncHandler(async (req, res) => {
  const promo = await PromoCode.create(req.body);
  return ok(res, { promo }, 'Promo created', 201);
});

// PATCH /api/admin/promos/:id
export const updatePromo = asyncHandler(async (req, res) => {
  const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!promo) throw ApiError.notFound('Promo not found');
  return ok(res, { promo }, 'Promo updated');
});

// DELETE /api/admin/promos/:id
export const deletePromo = asyncHandler(async (req, res) => {
  const promo = await PromoCode.findByIdAndDelete(req.params.id);
  if (!promo) throw ApiError.notFound('Promo not found');
  return ok(res, null, 'Promo deleted');
});
