import mongoose from 'mongoose';

/** Customer favorites — one row per (user, vehicle). */
const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  },
  { timestamps: true },
);

wishlistSchema.index({ user: 1, vehicle: 1 }, { unique: true });

export default mongoose.model('Wishlist', wishlistSchema);
