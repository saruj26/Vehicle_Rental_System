import mongoose from 'mongoose';

/**
 * Payment record — payment-ready structure (gateway-agnostic). Used for both
 * vehicle posting fees and booking payments. Plug Stripe/PayPal/Razorpay by
 * filling provider + providerRef and flipping status to 'succeeded'.
 */
const paymentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['posting_fee', 'booking'], required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    platformShare: { type: Number, default: 0 }, // service fee retained
    ownerShare: { type: Number, default: 0 },

    provider: { type: String, default: 'manual' }, // stripe | paypal | razorpay | manual
    providerRef: String,
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

export default mongoose.model('Payment', paymentSchema);
