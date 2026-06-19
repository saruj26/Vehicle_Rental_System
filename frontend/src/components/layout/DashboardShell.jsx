import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Car, CalendarCheck, Users, Layers, Settings, Star, Tag,
  PlusCircle, Heart, Bell, ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const MENUS = {
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/vehicles', label: 'Vehicles', icon: Car },
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/catalog', label: 'Catalog & Fees', icon: Layers },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  owner: [
    { to: '/owner', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/owner/vehicles', label: 'My Vehicles', icon: Car },
    { to: '/owner/vehicles/new', label: 'Add Vehicle', icon: PlusCircle },
    { to: '/owner/bookings', label: 'Bookings', icon: CalendarCheck },
  ],
  customer: [
    { to: '/dashboard', label: 'My Bookings', icon: ClipboardList, end: true },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile', icon: Settings },
  ],
};

export default function DashboardShell({ title, subtitle, actions, children }) {
  const { user } = useAuth();
  const menu = MENUS[user?.role] || MENUS.customer;

  return (
    <div className="mx-auto max-w-7xl gap-6 px-4 py-6 lg:flex">
      {/* Sidebar */}
      <aside className="lg:w-60 lg:flex-shrink-0">
        <nav className="sticky top-20 flex gap-1 overflow-x-auto rounded-xl border bg-white p-2 dark:bg-slate-900 lg:flex-col lg:overflow-visible">
          {menu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )
              }
            >
              <m.icon className="h-4 w-4" /> {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="mt-4 min-w-0 flex-1 lg:mt-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </div>
  );
}
