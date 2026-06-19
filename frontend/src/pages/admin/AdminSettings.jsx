import { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '@/components/layout/DashboardShell';
import { useFetch } from '@/hooks/useFetch';
import { Card, Input, Button, PageLoader, EmptyState } from '@/components/ui';
import api, { apiError } from '@/lib/api';

const NUMERIC_FIELDS = [
  'serviceFeePct',
  'taxPct',
  'defaultPostingFee',
  'featuredAdPrice',
  'minImages',
  'maxImages',
];

export default function AdminSettings() {
  const { data, loading, error } = useFetch('/admin/settings');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      NUMERIC_FIELDS.forEach((k) => {
        payload[k] = Number(payload[k]) || 0;
      });
      payload.autoApproveReviews = Boolean(form.autoApproveReviews);
      payload.maintenanceMode = Boolean(form.maintenanceMode);
      await api.patch('/admin/settings', payload);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardShell title="Platform Settings"><PageLoader /></DashboardShell>;
  if (error || !form)
    return (
      <DashboardShell title="Platform Settings">
        <EmptyState icon={SettingsIcon} title="Could not load settings" subtitle={error || 'No settings found'} />
      </DashboardShell>
    );

  return (
    <DashboardShell title="Platform Settings" subtitle="Configure platform-wide options">
      <form onSubmit={save} className="space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">General</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Site name" value={form.siteName ?? ''} onChange={(e) => set('siteName', e.target.value)} />
            <Input label="Currency" value={form.currency ?? ''} onChange={(e) => set('currency', e.target.value)} />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Fees & pricing</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Service fee (%)"
              type="number"
              value={form.serviceFeePct ?? ''}
              onChange={(e) => set('serviceFeePct', e.target.value)}
            />
            <Input
              label="Tax (%)"
              type="number"
              value={form.taxPct ?? ''}
              onChange={(e) => set('taxPct', e.target.value)}
            />
            <Input
              label="Default posting fee"
              type="number"
              value={form.defaultPostingFee ?? ''}
              onChange={(e) => set('defaultPostingFee', e.target.value)}
            />
            <Input
              label="Featured ad price"
              type="number"
              value={form.featuredAdPrice ?? ''}
              onChange={(e) => set('featuredAdPrice', e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Listing images</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Min images"
              type="number"
              value={form.minImages ?? ''}
              onChange={(e) => set('minImages', e.target.value)}
            />
            <Input
              label="Max images"
              type="number"
              value={form.maxImages ?? ''}
              onChange={(e) => set('maxImages', e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Toggles</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.autoApproveReviews)}
                onChange={(e) => set('autoApproveReviews', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Auto-approve reviews
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.maintenanceMode)}
                onChange={(e) => set('maintenanceMode', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Maintenance mode
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving}>
            Save settings
          </Button>
        </div>
      </form>
    </DashboardShell>
  );
}
