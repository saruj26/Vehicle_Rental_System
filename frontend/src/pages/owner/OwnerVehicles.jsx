import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Pencil, Trash2, Eye, CalendarCheck, Car, DollarSign, Send, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  Button, Card, EmptyState, SkeletonCard,
} from '@/components/ui';
import { useFetch } from '@/hooks/useFetch';
import api, { apiError } from '@/lib/api';
import { cn, formatCurrency, STATUS_STYLES } from '@/lib/utils';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
];

export default function OwnerVehicles() {
  const [status, setStatus] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const params = status === 'all' ? undefined : { status };
  const { data, loading, error, refetch } = useFetch('/vehicles/owner/mine', {
    params,
    deps: [status],
  });

  const vehicles = data?.vehicles || [];

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete "${v.name}"? This cannot be undone.`)) return;
    setBusyId(v._id);
    try {
      await api.delete(`/vehicles/${v._id}`);
      toast.success('Vehicle deleted');
      refetch();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handlePayFee = async (v) => {
    setBusyId(v._id);
    try {
      await api.post(`/vehicles/${v._id}/pay-fee`, { provider: 'manual' });
      toast.success('Posting fee paid');
      refetch();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmit = async (v) => {
    setBusyId(v._id);
    try {
      await api.post(`/vehicles/${v._id}/submit`);
      toast.success('Submitted for approval');
      refetch();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const actions = (
    <Link to="/owner/vehicles/new">
      <Button variant="primary">
        <PlusCircle className="h-4 w-4" /> Add Vehicle
      </Button>
    </Link>
  );

  return (
    <DashboardShell title="My Vehicles" subtitle="Manage your fleet" actions={actions}>
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <Card className="text-rose-500">{error}</Card>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles found"
          subtitle="Add your first vehicle to start renting it out."
          action={
            <Link to="/owner/vehicles/new">
              <Button variant="primary">
                <PlusCircle className="h-4 w-4" /> Add Vehicle
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v) => {
            const busy = busyId === v._id;
            return (
              <Card key={v._id} className="flex flex-col gap-3 p-0">
                <div className="relative h-44 w-full overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-800">
                  {v.coverImage?.url ? (
                    <img src={v.coverImage.url} alt={v.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-300">
                      <Car className="h-10 w-10" />
                    </div>
                  )}
                  <span className={cn('badge absolute left-3 top-3', STATUS_STYLES[v.status])}>
                    {v.status}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
                  <div>
                    <h3 className="truncate font-semibold">{v.name}</h3>
                    <p className="truncate text-xs text-slate-500">
                      {v.brand} {v.model} · {v.category?.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="font-semibold text-brand-600">
                      {formatCurrency(v.pricePerDay)}/day
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {v.views || 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarCheck className="h-3.5 w-3.5" /> {v.bookingsCount || 0}
                    </span>
                  </div>

                  {v.status === 'rejected' && v.rejectionReason && (
                    <p className="flex items-start gap-1.5 rounded-lg bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-500/10">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      <span>{v.rejectionReason}</span>
                    </p>
                  )}

                  {/* Draft fee/submit flow */}
                  {v.status === 'draft' && (
                    <div className="flex flex-wrap gap-2">
                      {!v.feePaid ? (
                        <Button variant="success" loading={busy} onClick={() => handlePayFee(v)}>
                          <DollarSign className="h-4 w-4" /> Pay {formatCurrency(v.feeAmount)} fee
                        </Button>
                      ) : (
                        <Button variant="primary" loading={busy} onClick={() => handleSubmit(v)}>
                          <Send className="h-4 w-4" /> Submit for approval
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex gap-2 pt-1">
                    <Link to={`/owner/vehicles/${v._id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                    </Link>
                    <Button variant="danger" loading={busy} onClick={() => handleDelete(v)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
