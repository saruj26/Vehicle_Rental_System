import { Link } from 'react-router-dom';
import {
  Car, CheckCircle2, Clock, DollarSign, PlusCircle, Eye, CalendarCheck, Star,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  Button, Card, StatCard, Spinner, EmptyState,
} from '@/components/ui';
import { useFetch } from '@/hooks/useFetch';
import { cn, formatCurrency, STATUS_STYLES, initials } from '@/lib/utils';

export default function OwnerDashboard() {
  const { data, loading, error } = useFetch('/owner/dashboard');

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const monthly = charts.monthlyEarnings || [];
  const topVehicles = data?.topVehicles || [];
  const recentBookings = data?.recentBookings || [];

  const actions = (
    <Link to="/owner/vehicles/new">
      <Button variant="primary">
        <PlusCircle className="h-4 w-4" /> Add Vehicle
      </Button>
    </Link>
  );

  return (
    <DashboardShell title="Owner Dashboard" subtitle="Your fleet at a glance" actions={actions}>
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <Card className="text-rose-500">{error}</Card>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Car} label="Total Vehicles" value={stats.totalVehicles || 0} accent="brand" />
            <StatCard icon={CheckCircle2} label="Published" value={stats.published || 0} accent="emerald" />
            <StatCard icon={Clock} label="Pending Requests" value={stats.pendingRequests || 0} accent="amber" />
            <StatCard icon={DollarSign} label="Earnings" value={formatCurrency(stats.earnings)} accent="emerald" />
          </div>

          {/* Earnings chart */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Monthly Earnings</h2>
            {monthly.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">No earnings data yet.</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top vehicles */}
            <Card>
              <h2 className="mb-4 text-lg font-semibold">Top Vehicles</h2>
              {topVehicles.length === 0 ? (
                <EmptyState icon={Car} title="No vehicles yet" subtitle="Add a vehicle to get started." />
              ) : (
                <ul className="space-y-3">
                  {topVehicles.map((v) => (
                    <li key={v._id} className="flex items-center gap-3">
                      <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                        {v.coverImage?.url && (
                          <img src={v.coverImage.url} alt={v.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{v.name}</p>
                        <p className="truncate text-xs text-slate-500">{v.brand}</p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {v.views || 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarCheck className="h-3.5 w-3.5" /> {v.bookingsCount || 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {Number(v.ratingAvg || 0).toFixed(1)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Recent bookings */}
            <Card>
              <h2 className="mb-4 text-lg font-semibold">Recent Bookings</h2>
              {recentBookings.length === 0 ? (
                <EmptyState icon={CalendarCheck} title="No bookings yet" subtitle="Bookings will appear here." />
              ) : (
                <ul className="divide-y dark:divide-slate-800">
                  {recentBookings.map((b) => (
                    <li key={b._id}>
                      <Link
                        to={`/bookings/${b._id}`}
                        className="flex items-center gap-3 py-3 transition hover:opacity-80"
                      >
                        <div className="grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10">
                          {b.customer?.avatar ? (
                            <img src={b.customer.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            initials(b.customer?.name)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{b.customer?.name || 'Customer'}</p>
                          <p className="truncate text-xs text-slate-500">
                            {b.code} · {b.vehicle?.name}
                          </p>
                        </div>
                        <span className={cn('badge flex-shrink-0', STATUS_STYLES[b.status])}>{b.status}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
