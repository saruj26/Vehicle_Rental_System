import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Phone, MessageCircle, ArrowLeft, Calendar } from 'lucide-react';
import api, { apiError } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, PageLoader, EmptyState } from '@/components/ui';
import { cn, formatCurrency, formatDate, initials, STATUS_STYLES } from '@/lib/utils';
import toast from 'react-hot-toast';

const FALLBACK = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

const digits = (s = '') => String(s).replace(/\D/g, '');

function Row({ label, value, strong, accent }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span
        className={cn(
          strong && 'text-base font-bold',
          accent === 'rose' && 'text-rose-600',
          accent === 'emerald' && 'text-emerald-600',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export default function BookingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch(`/bookings/${id}`);
  const [busy, setBusy] = useState(false);

  const booking = data?.booking;

  const act = async (action, body) => {
    setBusy(true);
    try {
      await api.patch(`/bookings/${id}/${action}`, body);
      toast.success('Booking updated');
      refetch();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const reject = () => {
    const reason = window.prompt('Reason for rejection (optional):') ?? '';
    act('reject', { reason });
  };

  if (loading) return <PageLoader />;

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          icon={Calendar}
          title="Booking not found"
          subtitle={error || 'This booking does not exist or you don’t have access.'}
          action={
            <Link to="/dashboard">
              <Button variant="primary">Back to bookings</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isOwner = user?.role === 'owner';
  const status = booking.status;
  const vehicle = booking.vehicle || {};
  const img = vehicle.coverImage?.url || vehicle.images?.[0]?.url || FALLBACK;
  const other = isOwner ? booking.customer : booking.owner;

  // Build action buttons based on role + status
  const actions = [];
  if (isOwner) {
    if (status === 'pending') {
      actions.push(
        <Button key="accept" variant="success" loading={busy} onClick={() => act('accept')}>
          Accept
        </Button>,
        <Button key="reject" variant="danger" loading={busy} onClick={reject}>
          Reject
        </Button>,
      );
    }
    if (status === 'accepted') {
      actions.push(
        <Button key="start" variant="primary" loading={busy} onClick={() => act('start')}>
          Start rental
        </Button>,
      );
    }
    if (status === 'active') {
      actions.push(
        <Button key="complete" variant="success" loading={busy} onClick={() => act('complete')}>
          Complete
        </Button>,
      );
    }
    if (status === 'pending' || status === 'accepted') {
      actions.push(
        <Button key="cancel" variant="outline" loading={busy} onClick={() => act('cancel')}>
          Cancel
        </Button>,
      );
    }
  } else if (status === 'pending' || status === 'accepted') {
    actions.push(
      <Button key="cancel" variant="danger" loading={busy} onClick={() => act('cancel')}>
        Cancel booking
      </Button>,
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Booking {booking.code}</h1>
          <p className="mt-1 text-sm text-slate-500">Placed {formatDate(booking.createdAt)}</p>
        </div>
        <span className={cn('badge', STATUS_STYLES[status])}>{status}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Vehicle summary */}
          <Card className="flex gap-4 p-4">
            <img
              src={img}
              alt={vehicle.name}
              onError={(e) => { e.currentTarget.src = FALLBACK; }}
              className="h-28 w-40 flex-shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm text-slate-500">{vehicle.brand}</p>
              <Link
                to={`/vehicles/${vehicle.slug || vehicle._id}`}
                className="text-lg font-semibold hover:text-brand-600"
              >
                {vehicle.name}
              </Link>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Calendar className="h-4 w-4 text-slate-400" />
                {formatDate(booking.pickupDate)} → {formatDate(booking.returnDate)}
                <span className="text-slate-400">({booking.totalDays} day{booking.totalDays === 1 ? '' : 's'})</span>
              </div>
            </div>
          </Card>

          {/* Price breakdown */}
          <Card>
            <h2 className="mb-2 text-lg font-semibold">Price breakdown</h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <Row
                label={`Rental (${formatCurrency(booking.pricePerDay)} × ${booking.totalDays})`}
                value={formatCurrency(booking.rentalAmount)}
              />
              <Row label="Service fee" value={formatCurrency(booking.serviceFee)} />
              <Row label="Tax" value={formatCurrency(booking.tax)} />
              <Row label="Security deposit" value={formatCurrency(booking.securityDeposit)} />
              {booking.discount > 0 && (
                <Row
                  label={booking.promoCode ? `Discount (${booking.promoCode})` : 'Discount'}
                  value={`- ${formatCurrency(booking.discount)}`}
                  accent="emerald"
                />
              )}
              <Row label="Total" value={formatCurrency(booking.totalAmount)} strong />
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-slate-500">Payment:</span>
              <span className="font-medium capitalize">{booking.paymentStatus || 'pending'}</span>
            </div>
            {booking.rejectionReason && (
              <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                Rejection reason: {booking.rejectionReason}
              </p>
            )}
          </Card>

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-3">{actions}</div>
          )}
        </div>

        {/* Contact card */}
        <div>
          <Card>
            <h2 className="mb-4 text-lg font-semibold">
              {isOwner ? 'Customer' : 'Owner'}
            </h2>
            <div className="mb-4 flex items-center gap-3">
              {other?.avatar?.url ? (
                <img src={other.avatar.url} alt={other.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-600 font-bold text-white">
                  {initials(other?.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{other?.name}</p>
                {other?.email && <p className="truncate text-sm text-slate-500">{other.email}</p>}
              </div>
            </div>
            <div className="space-y-2">
              {other?.whatsapp && (
                <a
                  href={`https://wa.me/${digits(other.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full justify-center"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              {other?.phone && (
                <a href={`tel:${other.phone}`} className="btn-outline w-full justify-center">
                  <Phone className="h-4 w-4" /> Call
                </a>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
