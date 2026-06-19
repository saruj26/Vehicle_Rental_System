import { verifyAccessToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';
import User from '../models/User.js';

/** Require a valid access token. Attaches req.user (lean document). */
export async function protect(req, _res, next) {
  try {
    let token;
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) token = header.split(' ')[1];
    else if (req.cookies?.accessToken) token = req.cookies.accessToken;

    if (!token) throw ApiError.unauthorized('Authentication required');

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (user.status === 'banned') throw ApiError.forbidden('Account is banned');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(ApiError.unauthorized('Token expired'));
    if (err.name === 'JsonWebTokenError') return next(ApiError.unauthorized('Invalid token'));
    next(err);
  }
}

/** Restrict a route to specific roles. Usage: authorize('admin', 'owner') */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role))
      return next(ApiError.forbidden('You do not have permission for this action'));
    next();
  };

/** Optional auth — attaches req.user if a valid token is present, else continues. */
export async function optionalAuth(req, _res, next) {
  try {
    let token;
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) token = header.split(' ')[1];
    else if (req.cookies?.accessToken) token = req.cookies.accessToken;
    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch {
    /* ignore — anonymous request */
  }
  next();
}
