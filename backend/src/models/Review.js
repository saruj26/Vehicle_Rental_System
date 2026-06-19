import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },

    ownerReply: { text: String, repliedAt: Date },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved', // auto-approve; admin can moderate
      index: true,
    },
  },
  { timestamps: true },
);

// One review per customer per vehicle
reviewSchema.index({ vehicle: 1, customer: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
