import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const coerceNum = z.coerce.number();

export const registerSchema = {
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(6).max(72),
    role: z.enum(['owner', 'customer']).optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
  }),
};

export const loginSchema = {
  body: z.object({ email: z.string().email(), password: z.string().min(1) }),
};

export const changePasswordSchema = {
  body: z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6).max(72) }),
};

export const categorySchema = {
  body: z.object({
    name: z.string().min(2),
    icon: z.string().optional(),
    description: z.string().max(300).optional(),
    sortOrder: z.number().optional(),
    postingFee: z.number().min(0).optional(),
  }),
};

export const featureSchema = {
  body: z.object({ name: z.string().min(1), icon: z.string().optional() }),
};

export const feeSchema = {
  params: z.object({ categoryId: objectId }),
  body: z.object({
    amount: z.number().min(0),
    currency: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
};

export const vehicleSchema = {
  body: z.object({
    name: z.string().min(2),
    brand: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().min(1950).max(2100),
    category: objectId,
    fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg']),
    transmission: z.enum(['manual', 'automatic']),
    color: z.string().optional(),
    seatCapacity: z.number().int().min(1).max(100),
    engineCapacity: z.string().optional(),
    mileage: z.number().min(0).optional(),
    fuelEfficiency: z.string().optional(),
    condition: z.enum(['new', 'excellent', 'good', 'fair']).optional(),
    conditionScore: z.number().min(0).max(100).optional(),
    location: z.string().min(1),
    geo: z
      .object({ type: z.literal('Point').optional(), coordinates: z.array(z.number()).length(2) })
      .optional(),
    description: z.string().max(4000).optional(),
    pricePerDay: z.number().min(0),
    pricePerWeek: z.number().min(0).optional(),
    pricePerMonth: z.number().min(0).optional(),
    securityDeposit: z.number().min(0).optional(),
    dynamicPricing: z
      .object({
        enabled: z.boolean().optional(),
        weekendSurgePct: z.number().optional(),
        peakSurgePct: z.number().optional(),
      })
      .optional(),
    availability: z.boolean().optional(),
    ownerContact: z.string().optional(),
    whatsapp: z.string().optional(),
    registrationNumber: z.string().optional(),
    insuranceStatus: z.enum(['insured', 'not_insured', 'expired']).optional(),
    features: z.array(objectId).optional(),
  }),
};

// Partial for updates
export const vehicleUpdateSchema = { body: vehicleSchema.body.partial() };

export const quoteSchema = {
  body: z.object({
    vehicleId: objectId,
    pickupDate: z.coerce.date(),
    returnDate: z.coerce.date(),
    promoCode: z.string().optional(),
  }),
};

export const bookingSchema = {
  body: z.object({
    vehicleId: objectId,
    pickupDate: z.coerce.date(),
    returnDate: z.coerce.date(),
    pickupLocation: z.string().optional(),
    notes: z.string().max(1000).optional(),
    promoCode: z.string().optional(),
  }),
};

export const reviewSchema = {
  body: z.object({ rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() }),
};

export const promoSchema = {
  body: z.object({
    code: z.string().min(3),
    description: z.string().optional(),
    discountType: z.enum(['percent', 'flat']),
    discountValue: z.number().min(0),
    maxDiscount: z.number().min(0).optional(),
    minAmount: z.number().min(0).optional(),
    usageLimit: z.number().min(0).optional(),
    perUserLimit: z.number().min(0).optional(),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  }),
};

export const idParam = { params: z.object({ id: objectId }) };
export const listQuery = {
  query: z.object({ page: coerceNum.optional(), limit: coerceNum.optional() }).passthrough(),
};
