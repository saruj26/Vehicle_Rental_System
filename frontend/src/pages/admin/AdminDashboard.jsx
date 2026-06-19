import { Link } from 'react-router-dom';
import { Users, Car, CalendarCheck, DollarSign, Clock, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import DashboardShell from '@/components/layout/DashboardShell';
import { useFetch } from '@/hooks/useFetch';
import { StatCard, Card, PageLoader, EmptyState, Button, Badge } from '@/components/ui';
import { cn, formatCurrency, STATUS_STYLES } from '@/lib/utils';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#8b5cf6'];

export default function AdminDashboard() {
  const { data, loading, error } = useFetch('/admin/dashboard');

  if (loading) return <DashboardShell title="Admin Overview"><PageLoader /></DashboardShell>;
  if (error || !data)
    return (
      <DashboardShell title="Admin Overview">
        <EmptyState icon={TrendingUp} title="Could not load dashboard" subtitle={error || 'No data available'} />
      </DashboardShell>
    );

  const stats = data.stats || {};
  const charts = data.charts || {};
  const monthlyRevenue = charts.monthlyRevenue || [];
  const bookingsByStatus = (charts.bookingsByStatus || []).map((b) => ({ name: b._id, count: b.count }));
  const vehiclesByCategory = charts.vehiclesByCategory || [];
  const recentBookings = data.recentBookings || [];

  return (
    <DashboardShell title="Admin Overview" subtitle="Platform performance at a glance">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers ?? 0} />
        <StatCard icon={Car} label="Total Vehicles" value={stats.totalVehicles ?? 0} />
        <StatCard icon={CalendarCheck} label="Total Bookings" value={stats.totalBookings ?? 0} />
        <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(stats.revenue)} accent="emerald" />
        <StatCard icon={Clock} label="Pending Approvals" value={stats.pendingApprovals ?? 0} accent="amber" />
        <StatCard icon={TrendingUp} label="Platform Earnings" value={formatCurrency(stats.platformEarnings)} accent="emerald" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Monthly Revenue</h2>
          {monthlyRevenue.length ? (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="platform" name="Platform" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">No revenue data yet.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Bookings by Status</h2>
          {bookingsByStatus.length ? (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bookingsByStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {bookingsByStatus.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">No bookings yet.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Vehicles by Category</h2>
          {vehiclesByCategory.length ? (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehiclesByCategory} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" name="Vehicles" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">No category data yet.</p>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending Approvals</h2>
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              {stats.pendingApprovals ?? 0}
            </Badge>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            {stats.pendingApprovals
              ? `${stats.pendingApprovals} vehicle(s) waiting for moderation.`
              : 'No vehicles waiting for approval.'}
          </p>
          <Link to="/admin/vehicles?status=pending">
            <Button variant="primary">Review pending vehicles</Button>
          </Link>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Bookings</h2>
        {recentBookings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Vehicle</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b._id} className="border-t dark:border-slate-800">
                    <td className="px-3 py-2 font-mono">
                      <Link to={`/bookings/${b._id}`} className="text-brand-600 hover:underline">
                        {b.code}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{b.vehicle?.name || '—'}</td>
                    <td className="px-3 py-2">{b.customer?.name || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={cn('badge', STATUS_STYLES[b.status])}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No recent bookings.</p>
        )}
      </Card>
    </DashboardShell>
  );
}
