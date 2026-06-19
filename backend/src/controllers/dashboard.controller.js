import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import Settings from '../models/Settings.js';
import { asyncHandler, ok } from '../utils/index.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Revenue grouped by month for the last `n` months. */
async function monthlyRevenue(match, n = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - (n - 1));
  since.setDate(1);
  const rows = await Payment.aggregate([
    { $match: { status: 'succeeded', createdAt: { $gte: since }, ...match } },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        total: { $sum: '$amount' },
        platform: { $sum: '$platformShare' },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);
  return rows.map((r) => ({ label: `${MONTHS[r._id.m - 1]}`, total: r.total, platform: r.platform }));
}

// GET /api/admin/dashboard
export const adminDashboard = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalOwners,
    totalCustomers,
    totalVehicles,
    pendingApprovals,
    totalBookings,
    activeBookings,
    revenueAgg,
    platformAgg,
    recentBookings,
    chart,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ role: 'customer' }),
    Vehicle.countDocuments(),
    Vehicle.countDocuments({ status: 'pending' }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: { $in: ['accepted', 'active'] } }),
    Payment.aggregate([{ $match: { status: 'succeeded' } }, { $group: { _id: null, t: { $sum: '$amount' } } }]),
    Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, t: { $sum: '$platformShare' } } },
    ]),
    Booking.find()
      .populate('vehicle', 'name')
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(8),
    monthlyRevenue({}, 6),
  ]);

  const bookingsByStatus = await Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const vehiclesByCategory = await Vehicle.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
    { $unwind: '$cat' },
    { $project: { name: '$cat.name', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);

  return ok(res, {
    stats: {
      totalUsers,
      totalOwners,
      totalCustomers,
      totalVehicles,
      pendingApprovals,
      totalBookings,
      activeBookings,
      revenue: revenueAgg[0]?.t || 0,
      platformEarnings: platformAgg[0]?.t || 0,
    },
    charts: { monthlyRevenue: chart, bookingsByStatus, vehiclesByCategory },
    recentBookings,
  });
});

// GET /api/admin/reports?type=revenue|bookings|vehicles
export const adminReports = asyncHandler(async (req, res) => {
  const type = req.query.type || 'revenue';
  const months = Number(req.query.months) || 12;
  let data;
  if (type === 'revenue') data = await monthlyRevenue({}, months);
  else if (type === 'bookings')
    data = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$totalAmount' } } },
    ]);
  else
    data = await Vehicle.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  return ok(res, { type, data });
});

// GET /api/admin/settings
export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await Settings.get();
  return ok(res, { settings });
});

// PATCH /api/admin/settings
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.get();
  const allowed = [
    'siteName',
    'currency',
    'serviceFeePct',
    'taxPct',
    'defaultPostingFee',
    'featuredAdPrice',
    'minImages',
    'maxImages',
    'autoApproveReviews',
    'maintenanceMode',
  ];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) settings[k] = req.body[k];
  });
  await settings.save();
  return ok(res, { settings }, 'Settings updated');
});

// GET /api/owner/dashboard
export const ownerDashboard = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const [vehicleStats, bookingsByStatus, revenueAgg, pending, recentBookings, topVehicles, chart] =
    await Promise.all([
      Vehicle.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'succeeded', ownerShare: { $gt: 0 } } },
        { $lookup: { from: 'bookings', localField: 'booking', foreignField: '_id', as: 'b' } },
        { $unwind: '$b' },
        { $match: { 'b.owner': ownerId } },
        { $group: { _id: null, total: { $sum: '$ownerShare' } } },
      ]),
      Booking.countDocuments({ owner: ownerId, status: 'pending' }),
      Booking.find({ owner: ownerId })
        .populate('vehicle', 'name')
        .populate('customer', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(6),
      Vehicle.find({ owner: ownerId })
        .sort({ bookingsCount: -1, views: -1 })
        .limit(5)
        .select('name brand views bookingsCount ratingAvg coverImage pricePerDay'),
      monthlyRevenue({ ownerShare: { $gt: 0 } }, 6),
    ]);

  const totalVehicles = vehicleStats.reduce((s, v) => s + v.count, 0);
  return ok(res, {
    stats: {
      totalVehicles,
      published: vehicleStats.find((v) => v._id === 'published')?.count || 0,
      pendingRequests: pending,
      totalBookings: bookingsByStatus.reduce((s, b) => s + b.count, 0),
      earnings: revenueAgg[0]?.total || req.user.earnings?.total || 0,
    },
    charts: { vehicleStats, bookingsByStatus, monthlyEarnings: chart },
    recentBookings,
    topVehicles,
  });
});
