import mongoose from 'mongoose';

/** Singleton platform settings (one document). */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    siteName: { type: String, default: 'RentWheels' },
    currency: { type: String, default: 'USD' },
    serviceFeePct: { type: Number, default: 10 }, // % added to customer rental
    taxPct: { type: Number, default: 5 },
    defaultPostingFee: { type: Number, default: 10 }, // fallback when category fee missing
    featuredAdPrice: { type: Number, default: 15 },
    minImages: { type: Number, default: 1 },
    maxImages: { type: Number, default: 20 },
    autoApproveReviews: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

settingsSchema.statics.get = async function getSettings() {
  let doc = await this.findOne({ key: 'global' });
  if (!doc) doc = await this.create({ key: 'global' });
  return doc;
};

export default mongoose.model('Settings', settingsSchema);
