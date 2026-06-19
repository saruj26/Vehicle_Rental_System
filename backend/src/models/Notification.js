import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'booking_created',
  'booking_accepted',
  'booking_rejected',
  'booking_cancelled',
  'payment_success',
  'vehicle_approved',
  'vehicle_rejected',
  'review_received',
  'system',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String, // in-app deep link, e.g. /bookings/BK-123
    meta: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
