import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { env } from './env.js';

if (env.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

/**
 * Cloudinary-backed storage when configured; otherwise an in-memory fallback so
 * the app still boots and uploads return mock URLs in local/dev without keys.
 */
function makeStorage(folder) {
  if (env.cloudinary.enabled) {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: `vehicle-rental/${folder}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }],
      },
    });
  }
  return multer.memoryStorage();
}

const fileFilter = (_req, file, cb) => {
  if (/^image\/(jpe?g|png|webp|avif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files (jpg, png, webp, avif) are allowed'), false);
};

export const uploadVehicleImages = multer({
  storage: makeStorage('vehicles'),
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 20 },
});

export const uploadAvatar = multer({
  storage: makeStorage('avatars'),
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
});

export { cloudinary };
export default cloudinary;
