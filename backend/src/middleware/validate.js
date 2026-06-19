import { ApiError } from '../utils/ApiError.js';

/**
 * Validate request parts against a Zod schema map: { body, query, params }.
 * Replaces req[part] with the parsed (coerced) value on success.
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    for (const part of ['body', 'query', 'params']) {
      if (schemas[part]) {
        const result = schemas[part].safeParse(req[part]);
        if (!result.success) {
          const details = result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          }));
          throw ApiError.badRequest('Validation failed', details);
        }
        // query/params getters can be read-only in Express 5; assign defensively
        if (part === 'body') req.body = result.data;
        else Object.defineProperty(req, part, { value: result.data, writable: true });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default validate;
