import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Search } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { useFetch } from '@/hooks/useFetch';
import { Card, Input, Select, Button, PageLoader, EmptyState } from '@/components/ui';
import { cn, formatCurrency, formatDate, STATUS_STYLES } from '@/lib/utils';

const STATUSES = ['pending', 'accepted', 'active', 'completed', 'rejected', 'cancelled'];

export default function AdminBookings() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = { status, q, page };
  const { data, meta, loading, error } = useFetch('/admin/bookings', {
    params,
    deps: [status, q, page],
  });

  const bookings = data?.bookings || [];
  const totalPages = meta?.totalPages || 1;

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQ(search.trim());
  };

  return (
    <DashboardShell title="All Bookings" subtitle="Every booking across the platform">
      <Card className="mb-6">
        <form onSubmit={onSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Input
            label="Search by code"
            placeholder="Booking code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-end">
            <Button type="submit" variant="primary" className="w-full">
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState icon={CalendarCheck} title="Could not load bookings" subtitle={error} />
      ) : bookings.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No bookings found" subtitle="Try a different filter." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id} className="border-t dark:border-slate-800">
                    <td className="px-4 py-3 font-mono">
                      <Link to={`/bookings/${b._id}`} className="text-brand-600 hover:underline">
                        {b.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.vehicle?.name || '—'}</p>
                      {b.vehicle?.brand && <p className="text-xs text-slate-500">{b.vehicle.brand}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.customer?.name || '—'}</p>
                      {b.customer?.email && <p className="text-xs text-slate-500">{b.customer.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.owner?.name || '—'}</p>
                      {b.owner?.email && <p className="text-xs text-slate-500">{b.owner.email}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {formatDate(b.pickupDate)} → {formatDate(b.returnDate)}
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(b.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', STATUS_STYLES[b.status])}>{b.status}</span>
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
