import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Car, Search, Check, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '@/components/layout/DashboardShell';
import { useFetch } from '@/hooks/useFetch';
import { Card, Input, Button, PageLoader, EmptyState } from '@/components/ui';
import api, { apiError } from '@/lib/api';
import { cn, formatCurrency, STATUS_STYLES } from '@/lib/utils';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'draft', label: 'Draft' },
];

export default function AdminVehicles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [status, setStatus] = useState(initialStatus);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const statusParam = status === 'all' ? '' : status;
  const params = { status: statusParam, q, page };
  const { data, meta, loading, error, refetch } = useFetch('/admin/vehicles', {
    params,
    deps: [status, q, page],
  });

  const vehicles = data?.vehicles || [];
  const totalPages = meta?.totalPages || 1;

  const selectTab = (value) => {
    setStatus(value);
    setPage(1);
    if (value === 'all') searchParams.delete('status');
    else searchParams.set('status', value);
    setSearchParams(searchParams, { replace: true });
  };

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQ(search.trim());
  };

  const mutate = async (id, fn, successMsg) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(successMsg);
      await refetch();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const approve = (v) =>
    mutate(v._id, () => api.post(`/admin/vehicles/${v._id}/approve`), 'Vehicle approved');

  const reject = (v) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    mutate(v._id, () => api.post(`/admin/vehicles/${v._id}/reject`, { reason }), 'Vehicle rejected');
  };

  const toggleFeature = (v) =>
    mutate(
      v._id,
      () => api.patch(`/admin/vehicles/${v._id}/feature`, { isFeatured: !v.isFeatured, days: 30 }),
      v.isFeatured ? 'Removed from featured' : 'Vehicle featured',
    );

  return (
    <DashboardShell title="Vehicle Moderation" subtitle="Approve, reject and feature listings">
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => selectTab(t.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                status === t.value
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <form onSubmit={onSearch} className="mt-4 flex gap-2">
          <Input
            placeholder="Search by name or brand"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="primary">
            <Search className="h-4 w-4" /> Search
          </Button>
        </form>
      </Card>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState icon={Car} title="Could not load vehicles" subtitle={error} />
      ) : vehicles.length === 0 ? (
        <EmptyState icon={Car} title="No vehicles found" subtitle="Try a different filter." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price/day</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id} className="border-t dark:border-slate-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {v.coverImage?.url ? (
                            <img src={v.coverImage.url} alt={v.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center">
                              <Car className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/vehicles/${v._id}`} className="block truncate font-medium text-brand-600 hover:underline">
                            {v.name}
                          </Link>
                          <p className="truncate text-xs text-slate-500">{v.brand}{v.model ? ` ${v.model}` : ''}</p>
                          {v.status === 'rejected' && v.rejectionReason && (
                            <p className="truncate text-xs text-rose-500" title={v.rejectionReason}>
                              {v.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{v.owner?.name || '—'}</td>
                    <td className="px-4 py-3">{v.category?.name || '—'}</td>
                    <td className="px-4 py-3">{formatCurrency(v.pricePerDay)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', STATUS_STYLES[v.status])}>{v.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {v.status === 'pending' && (
                          <>
                            <Button variant="success" onClick={() => approve(v)} loading={busyId === v._id}>
                              <Check className="h-4 w-4" /> Approve
                            </Button>
                            <Button variant="danger" onClick={() => reject(v)} loading={busyId === v._id}>
                              <X className="h-4 w-4" /> Reject
                            </Button>
                          </>
                        )}
                        <Button
                          variant={v.isFeatured ? 'primary' : 'outline'}
                          onClick={() => toggleFeature(v)}
                          loading={busyId === v._id}
                          title={v.isFeatured ? 'Unfeature' : 'Feature'}
                        >
                          <Star className={cn('h-4 w-4', v.isFeatured && 'fill-current')} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </DashboardShell>
  );
}
