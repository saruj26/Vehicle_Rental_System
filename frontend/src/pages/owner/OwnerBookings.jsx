import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck, Car, Check, X, Play, Flag, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  Button, Card, EmptyState, SkeletonCard,
} from '@/components/ui';
import { useFetch } from '@/hooks/useFetch';
import api, { apiError } from '@/lib/api';
import { cn, formatCurrency, formatDate, STATUS_STYLES, initials } from '@/lib/utils';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

export default function OwnerBookings() {
  const [status, setStatus] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const params = status === 'all' ? undefined : { status };
  const { data, loading, error, refetch } = useFetch('/bookings/owner', {
    params,
    deps: [status],
  });

  const bookings = data?.bookings || [];

  const runAction = async (booking, action, body) => {
    setBusyId(booking._id + action);
    try {
      await api.patch(`/bookings/${booking._id}/${action}`, body);
      toast.success(`Booking ${action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : action + 'ed'}`);
      refetch();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = (booking) => {
    const reason = window.prompt('Reason for rejection?');
    if (reason == null) return;
    runAction(booking, 'reject', { reason });
  };

  return (
    <DashboardShell title="Booking Requests" subtitle="Manage incoming bookings">
      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border bg-white p-1 dark:bg-slate-900">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              'flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition',
              status === t.value
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <Card className="text-rose-500">{error}</Card>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings"
          subtitle="Booking requests for your vehicles will appear here."
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const acceptBusy = busyId === b._id + 'accept';
            const rejectBusy = busyId === b._id + 'reject';
            const startBusy = busyId === b._id + 'start';
            const completeBusy = busyId === b._id + 'complete';
            return (
              <Card key={b._id} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Vehicle */}
                <div className="flex items-center gap-3 sm:w-1/3">
                  <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    {b.vehicle?.coverImage?.url ? (
                      <img src={b.vehicle.coverImage.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-slate-300">
                        <Car className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.vehicle?.name}</p>
                    <p className="truncate text-xs text-slate-500">{b.code}</p>
                  </div>
                </div>

                {/* Customer + dates */}
                <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10">
                      {b.customer?.avatar ? (
                        <img src={b.customer.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(b.customer?.name)
                      )}
                    </div>
                    <span className="text-sm font-medium">{b.customer?.name || 'Customer'}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    <p>
                      {formatDate(b.pickupDate)} → {formatDate(b.returnDate)}
                    </p>
                    <p>
                      {b.totalDays} day{b.totalDays === 1 ? '' : 's'} ·{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {formatCurrency(b.totalAmount)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Status + actions */}
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className={cn('badge', STATUS_STYLES[b.status])}>{b.status}</span>
                  <div className="flex flex-wrap gap-2">
                    {b.status === 'pending' && (
                      <>
                        <Button
                          variant="success"
                          loading={acceptBusy}
                          onClick={() => runAction(b, 'accept')}
                        >
                          <Check className="h-4 w-4" /> Accept
                        </Button>
                        <Button variant="danger" loading={rejectBusy} onClick={() => handleReject(b)}>
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                    {b.status === 'accepted' && (
                      <Button variant="primary" loading={startBusy} onClick={() => runAction(b, 'start')}>
                        <Play className="h-4 w-4" /> Start
                      </Button>
                    )}
                    {b.status === 'active' && (
                      <Button variant="primary" loading={completeBusy} onClick={() => runAction(b, 'complete')}>
                        <Flag className="h-4 w-4" /> Complete
                      </Button>
                    )}
                    <Link to={`/bookings/${b._id}`}>
                      <Button variant="ghost">
                        Details <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
