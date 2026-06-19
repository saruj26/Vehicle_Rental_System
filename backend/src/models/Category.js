import mongoose from 'mongoose';
import slugify from 'slugify';

/** Admin-managed vehicle categories — fully dynamic, no code changes for new ones. */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    icon: { type: String, default: 'car' }, // lucide icon name
    image: { url: String, publicId: String },
    description: { type: String, maxlength: 300 },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    vehicleCount: { type: Number, default: 0 }, // denormalised
  },
  { timestamps: true },
);

categorySchema.pre('validate', function setSlug(next) {
  if (this.isModified('name')) this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

export default mongoose.model('Category', categorySchema);
