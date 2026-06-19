/** Wrap async route handlers so thrown errors reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Standard success envelope. */
export const ok = (res, data = null, message = 'Success', status = 200, meta = undefined) =>
  res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });

/** Build a paginated mongoose query result envelope. */
export const paginate = (page = 1, limit = 12) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 12));
  return { page: p, limit: l, skip: (p - 1) * l };
};

export const pageMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit) || 1,
});
