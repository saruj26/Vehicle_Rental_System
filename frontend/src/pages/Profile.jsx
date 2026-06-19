import { useState } from 'react';
import api, { apiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DashboardShell from '@/components/layout/DashboardShell';
import { Card, Input, Textarea, Button } from '@/components/ui';
import { initials } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    location: user?.location || '',
    bio: user?.bio || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  const onField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const onPwField = (key) => (e) => setPw((p) => ({ ...p, [key]: e.target.value }));

  const submitProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch('/users/me/profile', form);
      updateUser(res.data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (!pw.currentPassword || !pw.newPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    setSavingPw(true);
    try {
      await api.patch('/users/me/password', pw);
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <DashboardShell title="Profile" subtitle="Manage your account details">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile form */}
        <Card>
          <div className="mb-5 flex items-center gap-4">
            {user?.avatar?.url ? (
              <img
                src={user.avatar.url}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
                {initials(user?.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{user?.name}</p>
              <p className="truncate text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={submitProfile} className="space-y-4">
            <Input label="Name" value={form.name} onChange={onField('name')} placeholder="Your name" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Phone" value={form.phone} onChange={onField('phone')} placeholder="Phone number" />
              <Input label="WhatsApp" value={form.whatsapp} onChange={onField('whatsapp')} placeholder="WhatsApp number" />
            </div>
            <Input label="Location" value={form.location} onChange={onField('location')} placeholder="City, Country" />
            <Textarea label="Bio" value={form.bio} onChange={onField('bio')} placeholder="Tell us about yourself" />
            <Button type="submit" variant="primary" loading={savingProfile}>
              Save changes
            </Button>
          </form>
        </Card>

        {/* Change password */}
        <Card>
          <h2 className="mb-1 text-lg font-semibold">Change password</h2>
          <p className="mb-5 text-sm text-slate-500">Update your account password.</p>
          <form onSubmit={submitPassword} className="space-y-4">
            <Input
              label="Current password"
              type="password"
              value={pw.currentPassword}
              onChange={onPwField('currentPassword')}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <Input
              label="New password"
              type="password"
              value={pw.newPassword}
              onChange={onPwField('newPassword')}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <Button type="submit" variant="primary" loading={savingPw}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
}
