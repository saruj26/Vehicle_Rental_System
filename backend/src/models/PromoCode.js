import mongoose from 'mongoose';

const promoSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: String,
    discountType: { type: String, enum: ['percent', 'flat'], default: 'percent' },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: 0 }, // cap for percent type (0 = no cap)
    minAmount: { type: Number, default: 0 }, // min booking amount to qualify
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startsAt: Date,
    expiresAt: Date,
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

promoSchema.methods.isValidNow = function isValidNow(amount, userId) {
  const now = new Date();
  if (!this.isActive) return 'Promo code is inactive';
  if (this.startsAt && now < this.startsAt) return 'Promo code not yet active';
  if (this.expiresAt && now > this.expiresAt) return 'Promo code expired';
  if (this.usageLimit && this.usedCount >= this.usageLimit) return 'Promo code usage limit reached';
  if (amount < this.minAmount) return `Minimum amount ${this.minAmount} required`;
  if (userId && this.perUserLimit) {
    const uses = this.usedBy.filter((u) => u.toString() === userId.toString()).length;
    if (uses >= this.perUserLimit) return 'You have already used this promo code';
  }
  return null; // valid
};

promoSchema.methods.computeDiscount = function computeDiscount(amount) {
  let d = this.discountType === 'percent' ? (amount * this.discountValue) / 100 : this.discountValue;
  if (this.discountType === 'percent' && this.maxDiscount > 0) d = Math.min(d, this.maxDiscount);
  return Math.min(Math.round(d * 100) / 100, amount);
};

export default mongoose.model('PromoCode', promoSchema);
