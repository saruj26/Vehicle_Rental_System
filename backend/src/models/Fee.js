import mongoose from 'mongoose';

/**
 * Per-category vehicle posting fee. Admin sets/updates these dynamically; an
 * owner must pay the current fee for a category before the listing goes live.
 * One fee document per category (enforced by unique index).
 */
const feeSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      unique: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, default: 'USD' },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export default mongoose.model('Fee', feeSchema);
