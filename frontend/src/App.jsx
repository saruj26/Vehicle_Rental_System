import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

import Home from '@/pages/Home';
import Vehicles from '@/pages/Vehicles';
import VehicleDetail from '@/pages/VehicleDetail';
import Compare from '@/pages/Compare';
import Auth from '@/pages/Auth';
import Wishlist from '@/pages/Wishlist';
import Notifications from '@/pages/Notifications';
import Profile from '@/pages/Profile';
import BookingDetail from '@/pages/BookingDetail';
import NotFound from '@/pages/NotFound';

import CustomerDashboard from '@/pages/customer/CustomerDashboard';

import OwnerDashboard from '@/pages/owner/OwnerDashboard';
import OwnerVehicles from '@/pages/owner/OwnerVehicles';
import VehicleForm from '@/pages/owner/VehicleForm';
import OwnerBookings from '@/pages/owner/OwnerBookings';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminVehicles from '@/pages/admin/AdminVehicles';
import AdminBookings from '@/pages/admin/AdminBookings';
import AdminCatalog from '@/pages/admin/AdminCatalog';
import AdminSettings from '@/pages/admin/AdminSettings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vehicles/:idOrSlug" element={<VehicleDetail />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/auth" element={<Auth />} />

        {/* Authenticated (any role) */}
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />

        {/* Customer */}
        <Route path="/dashboard" element={<ProtectedRoute roles={['customer']}><CustomerDashboard /></ProtectedRoute>} />

        {/* Owner */}
        <Route path="/owner" element={<ProtectedRoute roles={['owner', 'admin']}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/vehicles" element={<ProtectedRoute roles={['owner', 'admin']}><OwnerVehicles /></ProtectedRoute>} />
        <Route path="/owner/vehicles/new" element={<ProtectedRoute roles={['owner', 'admin']}><VehicleForm /></ProtectedRoute>} />
        <Route path="/owner/vehicles/:id/edit" element={<ProtectedRoute roles={['owner', 'admin']}><VehicleForm /></ProtectedRoute>} />
        <Route path="/owner/bookings" element={<ProtectedRoute roles={['owner', 'admin']}><OwnerBookings /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/vehicles" element={<ProtectedRoute roles={['admin']}><AdminVehicles /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin']}><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/catalog" element={<ProtectedRoute roles={['admin']}><AdminCatalog /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
