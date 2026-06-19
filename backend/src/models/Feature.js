import mongoose from 'mongoose';
import slugify from 'slugify';

/** Admin-managed vehicle features (AC, GPS, Bluetooth, ...). */
const featureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    icon: { type: String, default: 'check' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

featureSchema.pre('validate', function setSlug(next) {
  if (this.isModified('name')) this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

export default mongoose.model('Feature', featureSchema);
