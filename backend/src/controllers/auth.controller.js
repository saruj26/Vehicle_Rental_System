import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/index.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} from '../utils/token.js';

const issueTokens = (user) => ({
  accessToken: signAccessToken({ id: user._id, role: user.role }),
  refreshToken: signRefreshToken({ id: user._id }),
});

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, whatsapp } = req.body;

  // Public registration is limited to owner/customer; admins are seeded/promoted.
  const safeRole = role === 'owner' ? 'owner' : 'customer';

  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('Email is already registered');

  const user = await User.create({ name, email, password, role: safeRole, phone, whatsapp });
  const { accessToken, refreshToken } = issueTokens(user);

  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  return ok(res, { user, accessToken }, 'Registration successful', 201);
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    throw ApiError.unauthorized('Invalid email or password');
  if (user.status === 'banned') throw ApiError.forbidden('Your account has been banned');

  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken, refreshToken } = issueTokens(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  return ok(res, { user, accessToken }, 'Login successful');
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('User not found');

  const { accessToken, refreshToken } = issueTokens(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  return ok(res, { accessToken, user }, 'Token refreshed');
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: 0 });
  return ok(res, null, 'Logged out');
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => ok(res, { user: req.user }, 'Current user'));
