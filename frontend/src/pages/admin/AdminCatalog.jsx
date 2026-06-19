import { useState } from 'react';
import { Layers, Tag, Star, MessageSquare, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '@/components/layout/DashboardShell';
import { useFetch } from '@/hooks/useFetch';
import { Card, Input, Select, Textarea, Button, Badge, PageLoader, EmptyState, Rating } from '@/components/ui';
import api, { apiError } from '@/lib/api';
import { cn, formatCurrency, formatDate, STATUS_STYLES } from '@/lib/utils';

const TABS = [
  { value: 'categories', label: 'Categories', icon: Layers },
  { value: 'features', label: 'Features', icon: Star },
  { value: 'promos', label: 'Promos', icon: Tag },
  { value: 'reviews', label: 'Reviews', icon: MessageSquare },
];

export default function AdminCatalog() {
  const [tab, setTab] = useState('categories');

  return (
    <DashboardShell title="Catalog & Fees" subtitle="Manage categories, features, promos and reviews">
      <Card className="mb-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition',
                tab === t.value
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </Card>

      {tab === 'categories' && <CategoriesTab />}
      {tab === 'features' && <FeaturesTab />}
      {tab === 'promos' && <PromosTab />}
      {tab === 'reviews' && <ReviewsTab />}
    </DashboardShell>
  );
}

/* -------------------------------------------------- Categories */
function CategoriesTab() {
  const { data, loading, error, refetch } = useFetch('/categories', { params: { all: true } });
  const categories = data?.categories || [];

  const [form, setForm] = useState({ name: '', icon: '', description: '', postingFee: '', sortOrder: '' });
  const [fees, setFees] = useState({});
  const [busy, setBusy] = useState(false);

  const run = async (fn, msg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      await refetch();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const add = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    run(
      () =>
        api.post('/admin/categories', {
          name: form.name.trim(),
          icon: form.icon.trim(),
          description: form.description.trim(),
          sortOrder: Number(form.sortOrder) || 0,
          postingFee: Number(form.postingFee) || 0,
        }),
      'Category created',
    ).then(() => setForm({ name: '', icon: '', description: '', postingFee: '', sortOrder: '' }));
  };

  const saveFee = (c) => {
    const amount = Number(fees[c._id] ?? c.postingFee);
    run(() => api.put(`/admin/fees/${c._id}`, { amount, currency: 'USD', isActive: true }), 'Fee updated');
  };

  const toggleActive = (c) =>
    run(() => api.patch(`/admin/categories/${c._id}`, { isActive: !c.isActive }), 'Category updated');

  const remove = (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    run(() => api.delete(`/admin/categories/${c._id}`), 'Category deleted');
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState icon={Layers} title="Could not load categories" subtitle={error} />
        ) : categories.length === 0 ? (
          <EmptyState icon={Layers} title="No categories yet" subtitle="Add your first category." />
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Vehicles</th>
                    <th className="px-4 py-3 font-medium">Posting fee</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c._id} className="border-t dark:border-slate-800">
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.icon} {c.name}</p>
                        <p className="text-xs text-slate-500">{c.slug}</p>
                      </td>
                      <td className="px-4 py-3">{c.vehicleCount ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={fees[c._id] ?? c.postingFee ?? 0}
                            onChange={(e) => setFees((f) => ({ ...f, [c._id]: e.target.value }))}
                            className="w-24"
                          />
                          <Button variant="outline" onClick={() => saveFee(c)} loading={busy}>
                            Save
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            c.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
                          )}
                        >
                          {c.isActive ? 'active' : 'inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" onClick={() => toggleActive(c)} loading={busy}>
                            {c.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="danger" onClick={() => remove(c)} loading={busy}>
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
      </div>

      <Card>
        <h3 className="mb-4 text-lg font-semibold">Add category</h3>
        <form onSubmit={add} className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Posting fee"
            type="number"
            value={form.postingFee}
            onChange={(e) => setForm({ ...form, postingFee: e.target.value })}
          />
          <Input
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
          <Button type="submit" variant="primary" loading={busy} className="w-full">
            <Plus className="h-4 w-4" /> Add category
          </Button>
        </form>
      </Card>
    </div>
  );
}

/* -------------------------------------------------- Features */
function FeaturesTab() {
  const { data, loading, error, refetch } = useFetch('/features', { params: { all: true } });
  const features = data?.features || [];

  const [form, setForm] = useState({ name: '', icon: '' });
  const [busy, setBusy] = useState(false);

  const run = async (fn, msg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      await refetch();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const add = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    run(() => api.post('/admin/features', { name: form.name.trim(), icon: form.icon.trim() }), 'Feature created').then(
      () => setForm({ name: '', icon: '' }),
    );
  };

  const toggle = (f) =>
    run(() => api.patch(`/admin/features/${f._id}`, { isActive: !f.isActive }), 'Feature updated');

  const remove = (f) => {
    if (!window.confirm(`Delete feature "${f.name}"?`)) return;
    run(() => api.delete(`/admin/features/${f._id}`), 'Feature deleted');
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState icon={Star} title="Could not load features" subtitle={error} />
        ) : features.length === 0 ? (
          <EmptyState icon={Star} title="No features yet" subtitle="Add your first feature." />
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-4 py-3 font-medium">Feature</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((f) => (
                    <tr key={f._id} className="border-t dark:border-slate-800">
                      <td className="px-4 py-3 font-medium">{f.icon} {f.name}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            f.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
                          )}
                        >
                          {f.isActive ? 'active' : 'inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" onClick={() => toggle(f)} loading={busy}>
                            {f.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="danger" onClick={() => remove(f)} loading={busy}>
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
      </div>

      <Card>
        <h3 className="mb-4 text-lg font-semibold">Add feature</h3>
        <form onSubmit={add} className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <Button type="submit" variant="primary" loading={busy} className="w-full">
            <Plus className="h-4 w-4" /> Add feature
          </Button>
        </form>
      </Card>
    </div>
  );
}

/* -------------------------------------------------- Promos */
function PromosTab() {
  const { data, loading, error, refetch } = useFetch('/admin/promos');
  const promos = data?.promos || [];

  const [form, setForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: '',
    maxDiscount: '',
    expiresAt: '',
  });
  const [busy, setBusy] = useState(false);

  const run = async (fn, msg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      await refetch();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const add = (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error('Code is required');
    run(
      () =>
        api.post('/admin/promos', {
          code: form.code.trim().toUpperCase(),
          discountType: form.discountType,
          discountValue: Number(form.discountValue) || 0,
          maxDiscount: Number(form.maxDiscount) || 0,
          expiresAt: form.expiresAt || null,
          isActive: true,
        }),
      'Promo created',
    ).then(() =>
      setForm({ code: '', discountType: 'percent', discountValue: '', maxDiscount: '', expiresAt: '' }),
    );
  };

  const remove = (p) => {
    if (!window.confirm(`Delete promo "${p.code}"?`)) return;
    run(() => api.delete(`/admin/promos/${p._id}`), 'Promo deleted');
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState icon={Tag} title="Could not load promos" subtitle={error} />
        ) : promos.length === 0 ? (
          <EmptyState icon={Tag} title="No promos yet" subtitle="Create your first promo code." />
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Discount</th>
                    <th className="px-4 py-3 font-medium">Used</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((p) => (
                    <tr key={p._id} className="border-t dark:border-slate-800">
                      <td className="px-4 py-3 font-mono font-medium">{p.code}</td>
                      <td className="px-4 py-3">
                        {p.discountType === 'percent' ? `${p.discountValue}%` : formatCurrency(p.discountValue)}
                      </td>
                      <td className="px-4 py-3">{p.usedCount ?? 0}</td>
                      <td className="px-4 py-3 text-slate-500">{p.expiresAt ? formatDate(p.expiresAt) : '—'}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
                          )}
                        >
                          {p.isActive ? 'active' : 'inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button variant="danger" onClick={() => remove(p)} loading={busy}>
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
      </div>

      <Card>
        <h3 className="mb-4 text-lg font-semibold">Add promo</h3>
        <form onSubmit={add} className="space-y-3">
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Select
            label="Discount type"
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
          >
            <option value="percent">Percent</option>
            <option value="flat">Flat</option>
          </Select>
          <Input
            label="Discount value"
            type="number"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
          />
          <Input
            label="Max discount"
            type="number"
            value={form.maxDiscount}
            onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
          />
          <Input
            label="Expires at"
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
          <Button type="submit" variant="primary" loading={busy} className="w-full">
            <Plus className="h-4 w-4" /> Add promo
          </Button>
        </form>
      </Card>
    </div>
  );
}

/* -------------------------------------------------- Reviews */
function ReviewsTab() {
  const [status, setStatus] = useState('pending');
  const { data, loading, error, refetch } = useFetch('/admin/reviews', {
    params: { status },
    deps: [status],
  });
  const reviews = data?.reviews || [];
  const [busy, setBusy] = useState(false);

  const moderate = async (r, newStatus) => {
    setBusy(true);
    try {
      await api.patch(`/admin/reviews/${r._id}`, { status: newStatus });
      toast.success(`Review ${newStatus}`);
      await refetch();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 max-w-xs">
        <Select label="Filter" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState icon={MessageSquare} title="Could not load reviews" subtitle={error} />
      ) : reviews.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No reviews" subtitle="Nothing to moderate here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {reviews.map((r) => (
            <Card key={r._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{r.customer?.name || 'Anonymous'}</p>
                  <p className="text-xs text-slate-500">{r.vehicle?.name || '—'}</p>
                </div>
                {r.status && <span className={cn('badge', STATUS_STYLES[r.status])}>{r.status}</span>}
              </div>
              <div className="mt-2">
                <Rating value={r.rating || 0} />
              </div>
              {r.comment && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>}
              <div className="mt-4 flex gap-2">
                <Button variant="success" onClick={() => moderate(r, 'approved')} loading={busy}>
                  Approve
                </Button>
                <Button variant="danger" onClick={() => moderate(r, 'rejected')} loading={busy}>
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
