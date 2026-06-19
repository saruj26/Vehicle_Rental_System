import mongoose from 'mongoose';

export const BOOKING_STATUS = [
  'pending', // awaiting owner acceptance
  'accepted',
  'rejected',
  'cancelled',
  'active', // in progress (picked up)
  'completed',
];

const bookingSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // human-friendly ref e.g. BK-7F3A9
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    pickupDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    pickupLocation: String,
    notes: String,

    // Pricing breakdown (snapshot at booking time)
    totalDays: { type: Number, required: true, min: 1 },
    pricePerDay: { type: Number, required: true },
    rentalAmount: { type: Number, required: true }, // days * price (+ dynamic surge)
    serviceFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    promoCode: { type: String, default: null },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },

    status: { type: String, enum: BOOKING_STATUS, default: 'pending', index: true },
    rejectionReason: String,
    cancelledBy: { type: String, enum: ['customer', 'owner', 'admin'] },

    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'partial'],
      default: 'unpaid',
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

bookingSchema.index({ vehicle: 1, status: 1, pickupDate: 1, returnDate: 1 });

bookingSchema.pre('validate', function genCode(next) {
  if (!this.code) this.code = `BK-${this._id.toString().slice(-6).toUpperCase()}`;
  next();
});

export default mongoose.model('Booking', bookingSchema);
