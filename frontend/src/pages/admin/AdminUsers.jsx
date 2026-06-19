import { useState } from 'react';
import { Users as UsersIcon, Search, ShieldCheck, ShieldOff, Trash2, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '@/components/layout/DashboardShell';
import { useFetch } from '@/hooks/useFetch';
import { Card, Input, Select, Button, Badge, PageLoader, EmptyState } from '@/components/ui';
import api, { apiError } from '@/lib/api';
import { cn, formatDate, initials } from '@/lib/utils';

const ROLES = ['customer', 'owner', 'admin'];
const BADGES = ['none', 'verified', 'pro', 'elite'];

export default function AdminUsers() {
  const [filters, setFilters] = useState({ role: '', status: '', q: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const params = { ...filters, page };
  const { data, meta, loading, error, refetch } = useFetch('/admin/users', {
    params,
    deps: [filters.role, filters.status, filters.q, page],
  });

  const users = data?.users || [];
  const totalPages = meta?.totalPages || 1;

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setFilters((f) => ({ ...f, q: search.trim() }));
  };

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
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

  const toggleBan = (u) =>
    mutate(
      u._id,
      () => api.patch(`/admin/users/${u._id}`, { status: u.status === 'banned' ? 'active' : 'banned' }),
      u.status === 'banned' ? 'User activated' : 'User banned',
    );

  const toggleVerify = (u) =>
    mutate(
      u._id,
      () =>
        api.patch(`/admin/users/${u._id}`, {
          isVerified: !u.isVerified,
          verificationBadge: u.isVerified ? 'none' : 'verified',
        }),
      u.isVerified ? 'Verification removed' : 'User verified',
    );

  const changeRole = (u, role) =>
    mutate(u._id, () => api.patch(`/admin/users/${u._id}`, { role }), 'Role updated');

  const changeBadge = (u, verificationBadge) =>
    mutate(
      u._id,
      () => api.patch(`/admin/users/${u._id}`, { verificationBadge, isVerified: verificationBadge !== 'none' }),
      'Badge updated',
    );

  const remove = (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    mutate(u._id, () => api.delete(`/admin/users/${u._id}`), 'User deleted');
  };

  return (
    <DashboardShell title="Users" subtitle="Manage platform members">
      <Card className="mb-6">
        <form onSubmit={onSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Role" value={filters.role} onChange={(e) => setFilter('role', e.target.value)}>
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
          <Select label="Status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">active</option>
            <option value="banned">banned</option>
          </Select>
          <Input
            label="Search"
            placeholder="Name or email"
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
        <EmptyState icon={UsersIcon} title="Could not load users" subtitle={error} />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" subtitle="Try adjusting your filters." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Badge</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t dark:border-slate-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10">
                          {initials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="truncate text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        disabled={busyId === u._id}
                        className="min-w-[110px]"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          u.status === 'banned'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
                        )}
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.verificationBadge || 'none'}
                        onChange={(e) => changeBadge(u, e.target.value)}
                        disabled={busyId === u._id}
                        className="min-w-[110px]"
                      >
                        {BADGES.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => toggleVerify(u)}
                          loading={busyId === u._id}
                          title={u.isVerified ? 'Unverify' : 'Verify'}
                        >
                          {u.isVerified ? <BadgeCheck className="h-4 w-4 text-emerald-500" /> : <BadgeCheck className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant={u.status === 'banned' ? 'success' : 'outline'}
                          onClick={() => toggleBan(u)}
                          loading={busyId === u._id}
                        >
                          {u.status === 'banned' ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                          {u.status === 'banned' ? 'Activate' : 'Ban'}
                        </Button>
                        <Button variant="danger" onClick={() => remove(u)} loading={busyId === u._id}>
                          <Trash2 className="h-4 w-4" />
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
