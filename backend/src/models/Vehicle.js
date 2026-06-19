import mongoose from 'mongoose';
import slugify from 'slugify';

export const VEHICLE_STATUS = [
  'draft',
  'pending', // pending approval
  'approved',
  'published',
  'rejected',
  'booked',
  'completed',
  'suspended',
];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

// GeoJSON point. Kept as an optional subdocument so vehicles without a
// location pin are simply omitted from the (sparse) 2dsphere index.
const geoSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false },
);

const vehicleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Core listing fields
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true },
    brand: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1950, max: 2100 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },

    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'],
      required: true,
      index: true,
    },
    transmission: { type: String, enum: ['manual', 'automatic'], required: true, index: true },
    color: { type: String, trim: true },
    seatCapacity: { type: Number, required: true, min: 1, max: 100, index: true },
    engineCapacity: { type: String, trim: true }, // e.g. "1500cc"
    mileage: { type: Number, min: 0 }, // km/l or km/charge
    fuelEfficiency: { type: String, trim: true }, // display string e.g. "18 km/l"
    condition: {
      type: String,
      enum: ['new', 'excellent', 'good', 'fair'],
      default: 'good',
      index: true,
    },
    conditionScore: { type: Number, min: 0, max: 100, default: 80 }, // e.g. 90/100

    location: { type: String, required: true, trim: true, index: true },
    geo: { type: geoSchema, default: undefined },

    description: { type: String, maxlength: 4000 },

    // Pricing
    pricePerDay: { type: Number, required: true, min: 0, index: true },
    pricePerWeek: { type: Number, min: 0 },
    pricePerMonth: { type: Number, min: 0 },
    securityDeposit: { type: Number, min: 0, default: 0 },

    // Dynamic pricing modifiers (weekend / peak season uplift in %)
    dynamicPricing: {
      enabled: { type: Boolean, default: false },
      weekendSurgePct: { type: Number, default: 0 },
      peakSurgePct: { type: Number, default: 0 },
    },

    availability: { type: Boolean, default: true, index: true },
    // Date ranges already blocked (booked or owner-blocked) for the calendar
    blockedDates: [{ from: Date, to: Date, reason: String }],

    // Contact
    ownerContact: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    insuranceStatus: {
      type: String,
      enum: ['insured', 'not_insured', 'expired'],
      default: 'insured',
    },

    features: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Feature' }],

    images: { type: [imageSchema], validate: [(v) => v.length <= 20, 'Max 20 images'] },
    coverImage: { url: String, publicId: String },

    // Workflow / moderation
    status: { type: String, enum: VEHICLE_STATUS, default: 'draft', index: true },
    rejectionReason: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    publishedAt: Date,

    // Posting fee payment gate
    feePaid: { type: Boolean, default: false },
    feeAmount: { type: Number, default: 0 },
    feePayment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    // Marketing / ranking
    isFeatured: { type: Boolean, default: false, index: true },
    featuredUntil: Date,
    isTrending: { type: Boolean, default: false },

    // Stats
    views: { type: Number, default: 0 },
    bookingsCount: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0, index: true },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

vehicleSchema.index({ name: 'text', brand: 'text', model: 'text', description: 'text', location: 'text' });
vehicleSchema.index({ geo: '2dsphere' }, { sparse: true });
vehicleSchema.index({ status: 1, availability: 1, category: 1 });

vehicleSchema.pre('validate', function setSlug(next) {
  if (this.isModified('name') || !this.slug) {
    const base = slugify(`${this.brand}-${this.name}-${this.year}`, { lower: true, strict: true });
    this.slug = `${base}-${this._id.toString().slice(-6)}`;
  }
  next();
});

/** Whether the listing is publicly bookable. */
vehicleSchema.virtual('isLive').get(function isLive() {
  return this.status === 'published' && this.availability && this.feePaid;
});

vehicleSchema.set('toJSON', { virtuals: true });
vehicleSchema.set('toObject', { virtuals: true });

export default mongoose.model('Vehicle', vehicleSchema);
