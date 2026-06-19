/* eslint-disable no-console */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Feature from '../models/Feature.js';
import Fee from '../models/Fee.js';
import Vehicle from '../models/Vehicle.js';
import Settings from '../models/Settings.js';
import PromoCode from '../models/PromoCode.js';

const CATEGORIES = [
  { name: 'Car', icon: 'car', fee: 10 },
  { name: 'Bike', icon: 'bike', fee: 5 },
  { name: 'Van', icon: 'bus', fee: 12 },
  { name: 'Bus', icon: 'bus-front', fee: 20 },
  { name: 'SUV', icon: 'car-front', fee: 15 },
  { name: 'Jeep', icon: 'truck', fee: 14 },
  { name: 'Pickup', icon: 'truck', fee: 13 },
  { name: 'Lorry', icon: 'truck', fee: 18 },
  { name: 'Truck', icon: 'truck', fee: 22 },
  { name: 'Three Wheeler', icon: 'bike', fee: 4 },
  { name: 'Electric Vehicle', icon: 'zap', fee: 8 },
  { name: 'Luxury Car', icon: 'gem', fee: 25 },
  { name: 'Wedding Vehicle', icon: 'heart', fee: 30 },
  { name: 'Mini Bus', icon: 'bus', fee: 16 },
  { name: 'Camper Van', icon: 'caravan', fee: 17 },
];

const FEATURES = [
  'AC', 'GPS', 'Bluetooth', 'Reverse Camera', 'Sunroof',
  'Leather Seats', 'Child Seat', 'USB Charging', 'Music System', 'Cruise Control',
];

async function run() {
  await connectDB();
  console.log('🌱 Seeding...');

  await Settings.get();

  // Admin
  let admin = await User.findOne({ email: env.admin.email });
  if (!admin) {
    admin = await User.create({
      name: env.admin.name,
      email: env.admin.email,
      password: env.admin.password,
      role: 'admin',
      isVerified: true,
      verificationBadge: 'elite',
    });
    console.log(`👑 Admin created: ${admin.email} / ${env.admin.password}`);
  } else {
    console.log('👑 Admin already exists');
  }

  // Demo owner + customer
  const owner =
    (await User.findOne({ email: 'owner@rental.com' })) ||
    (await User.create({
      name: 'Demo Owner',
      email: 'owner@rental.com',
      password: 'Owner@12345',
      role: 'owner',
      isVerified: true,
      verificationBadge: 'pro',
      location: 'Colombo',
      phone: '+94770000001',
      whatsapp: '+94770000001',
    }));
  const customer =
    (await User.findOne({ email: 'customer@rental.com' })) ||
    (await User.create({
      name: 'Demo Customer',
      email: 'customer@rental.com',
      password: 'Customer@12345',
      role: 'customer',
      location: 'Kandy',
    }));

  // Categories + fees
  const catDocs = {};
  for (const c of CATEGORIES) {
    let cat = await Category.findOne({ name: c.name });
    if (!cat) cat = await Category.create({ name: c.name, icon: c.icon });
    catDocs[c.name] = cat;
    await Fee.findOneAndUpdate(
      { category: cat._id },
      { amount: c.fee, updatedBy: admin._id },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }
  console.log(`🚙 ${CATEGORIES.length} categories + fees ready`);

  // Features
  const featDocs = [];
  for (const f of FEATURES) {
    const feat = (await Feature.findOne({ name: f })) || (await Feature.create({ name: f }));
    featDocs.push(feat);
  }
  console.log(`✨ ${FEATURES.length} features ready`);

  // Promo
  await PromoCode.findOneAndUpdate(
    { code: 'WELCOME10' },
    {
      code: 'WELCOME10',
      description: '10% off your first booking',
      discountType: 'percent',
      discountValue: 10,
      maxDiscount: 50,
      isActive: true,
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  // Sample published vehicles
  const sample = [
    { name: 'Toyota Aqua Hybrid', brand: 'Toyota', model: 'Aqua', year: 2021, cat: 'Car', fuel: 'hybrid', trans: 'automatic', seats: 5, price: 35, img: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=900' },
    { name: 'Honda CB Hornet', brand: 'Honda', model: 'Hornet', year: 2022, cat: 'Bike', fuel: 'petrol', trans: 'manual', seats: 2, price: 12, img: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900' },
    { name: 'Toyota KDH Van', brand: 'Toyota', model: 'KDH', year: 2019, cat: 'Van', fuel: 'diesel', trans: 'manual', seats: 12, price: 60, img: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=900' },
    { name: 'BMW 5 Series', brand: 'BMW', model: '530i', year: 2023, cat: 'Luxury Car', fuel: 'petrol', trans: 'automatic', seats: 5, price: 120, img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900' },
    { name: 'Nissan X-Trail', brand: 'Nissan', model: 'X-Trail', year: 2020, cat: 'SUV', fuel: 'petrol', trans: 'automatic', seats: 7, price: 70, img: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=900' },
    { name: 'Tesla Model 3', brand: 'Tesla', model: 'Model 3', year: 2023, cat: 'Electric Vehicle', fuel: 'electric', trans: 'automatic', seats: 5, price: 95, img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=900' },
  ];

  for (const s of sample) {
    const exists = await Vehicle.findOne({ name: s.name, owner: owner._id });
    if (exists) continue;
    const cat = catDocs[s.cat];
    const fee = await Fee.findOne({ category: cat._id });
    await Vehicle.create({
      owner: owner._id,
      name: s.name,
      brand: s.brand,
      model: s.model,
      year: s.year,
      category: cat._id,
      fuelType: s.fuel,
      transmission: s.trans,
      seatCapacity: s.seats,
      condition: 'excellent',
      conditionScore: 92,
      location: owner.location,
      pricePerDay: s.price,
      pricePerWeek: s.price * 6,
      pricePerMonth: s.price * 24,
      securityDeposit: s.price * 2,
      fuelEfficiency: s.fuel === 'electric' ? '450 km/charge' : '16 km/l',
      description: `${s.brand} ${s.model} (${s.year}) in excellent condition. Well maintained, fully insured, ready for your next trip.`,
      features: featDocs.slice(0, 5).map((f) => f._id),
      images: [{ url: s.img, order: 0 }],
      coverImage: { url: s.img },
      status: 'published',
      feePaid: true,
      feeAmount: fee?.amount ?? 10,
      approvedBy: admin._id,
      approvedAt: new Date(),
      publishedAt: new Date(),
      isFeatured: s.cat === 'Luxury Car' || s.cat === 'Electric Vehicle',
      whatsapp: owner.whatsapp,
      ownerContact: owner.phone,
    });
  }
  console.log(`🚗 Sample vehicles ready (owner: ${owner.email} / Owner@12345)`);
  console.log(`🙋 Demo customer: ${customer.email} / Customer@12345`);

  await mongoose.disconnect();
  console.log('✅ Seed complete');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
