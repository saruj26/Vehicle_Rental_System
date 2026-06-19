import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, Calendar, Heart, Car, Info } from 'lucide-react';
import api, { apiError } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageLoader, EmptyState, Button } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  booking: Calendar,
  wishlist: Heart,
  vehicle: Car,
};

function iconFor(type) {
  return TYPE_ICONS[type] || Info;
}

export default function Notifications() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, meta, loading, refetch, setData } = useFetch('/notifications', {
    params: { page },
    deps: [page],
  });

  const notifications = data?.notifications || [];
  const navigate = useNavigate();

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setData((d) => ({
        ...d,
        notifications: (d?.notifications || []).map((n) =>
          n._id === id ? { ...n, isRead: true } : n,
        ),
      }));
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      toast.success('All notifications marked as read');
      refetch();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const remove = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setData((d) => ({
        ...d,
        notifications: (d?.notifications || []).filter((n) => n._id !== id),
      }));
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const onRowClick = (n) => {
    if (!n.isRead) markRead(n._id);
    if (n.link) navigate(n.link);
  };

  const content = loading ? (
    <PageLoader />
  ) : notifications.length ? (
    <>
      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = iconFor(n.type);
          return (
            <div
              key={n._id}
              onClick={() => onRowClick(n)}
              className={cn(
                'group flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition hover:shadow-sm',
                n.isRead
                  ? 'bg-white dark:bg-slate-900'
                  : 'bg-brand-50 dark:bg-brand-500/10',
              )}
            >
              <div className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/20">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{n.title}</p>
                  {!n.isRead && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-600" />}
                </div>
                {n.message && (
                  <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
              </div>
              <button
                onClick={(e) => remove(e, n._id)}
                aria-label="Delete notification"
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {meta && meta.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <span className="text-sm text-slate-500">
            Page {meta.page} of {meta.pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  ) : (
    <EmptyState
      icon={Bell}
      title="No notifications"
      subtitle="You’re all caught up. New activity will show up here."
    />
  );

  const actions = (
    <Button variant="outline" onClick={markAllRead} disabled={!notifications.some((n) => !n.isRead)}>
      <CheckCheck className="h-4 w-4" /> Mark all read
    </Button>
  );

  if (user?.role === 'customer') {
    return (
      <DashboardShell title="Notifications" actions={actions}>
        {content}
      </DashboardShell>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Notifications</h1>
        {actions}
      </div>
      {content}
    </div>
  );
}
