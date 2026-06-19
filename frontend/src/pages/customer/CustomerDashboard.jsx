import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Calendar } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import DashboardShell from '@/components/layout/DashboardShell';
import VehicleCard from '@/components/vehicle/VehicleCard';
import { Card, PageLoader, EmptyState, Button } from '@/components/ui';
import { cn, formatCurrency, formatDate, STATUS_STYLES } from '@/lib/utils';

const FALLBACK = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

const TABS = [
  ['', 'All'],
  ['pending', 'Pending'],
  ['accepted', 'Accepted'],
  ['active', 'Active'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
];

function BookingCard({ booking: b }) {
  const v = b.vehicle || {};
  const img = v.coverImage?.url || FALLBACK;
  return (
    <Link
      to={`/bookings/${b._id}`}
      className="card flex gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-glass"
    >
      <img
        src={img}
        alt={v.name}
        onError={(e) => { e.currentTarget.src = FALLBACK; }}
        className="h-24 w-32 flex-shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{v.name}</p>
            <p className="text-xs text-slate-400">{b.code}</p>
          </div>
          <span className={cn('badge', STATUS_STYLES[b.status])}>{b.status}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
          <Calendar className="h-4 w-4" />
          {formatDate(b.pickupDate)} → {formatDate(b.returnDate)}
        </div>
        <p className="mt-2 font-semibold">{formatCurrency(b.totalAmount)}</p>
      </div>
    </Link>
  );
}

export default function CustomerDashboard() {
  const [status, setStatus] = useState('');

  const { data, loading } = useFetch('/bookings/mine', {
    params: status ? { status } : {},
    deps: [status],
  });
  const { data: recData } = useFetch('/vehicles/recommendations');

  const bookings = data?.bookings || [];
  const recommendations = (recData?.vehicles || []).slice(0, 4);

  return (
    <DashboardShell title="My Bookings" subtitle="Track and manage your rentals">
      {/* Status tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map(([value, label]) => (
          <button
            key={value || 'all'}
            onClick={() => setStatus(value)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition',
              status === value
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : bookings.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.map((b) => (
            <BookingCard key={b._id} booking={b} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No bookings yet"
          subtitle="When you book a vehicle it will appear here."
          action={
            <Link to="/vehicles">
              <Button variant="primary">Browse vehicles</Button>
            </Link>
          }
        />
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold">Recommended for you</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recommendations.map((v) => (
              <VehicleCard key={v._id} vehicle={v} />
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
