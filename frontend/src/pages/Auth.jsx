import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Car, User, Store, Mail, Lock, UserCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { apiError } from '@/lib/api';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function Auth() {
  const [mode, setMode] = useState('login'); // login | register
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const { login, register: signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const redirect = (user) => {
    const from = location.state?.from?.pathname;
    if (from) return navigate(from, { replace: true });
    navigate(user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/owner' : '/');
  };

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const user = mode === 'login'
        ? await login(values.email, values.password)
        : await signup({ ...values, role });
      toast.success(mode === 'login' ? `Welcome back, ${user.name}!` : 'Account created!');
      redirect(user);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); reset(); };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 to-indigo-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-xl font-extrabold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20"><Car className="h-6 w-6" /></span>
          RentWheels
        </div>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">Your journey starts here.</h2>
          <p className="mt-4 max-w-md text-brand-100">
            Join thousands of renters and owners on the modern vehicle marketplace. Book in seconds, earn with ease.
          </p>
        </div>
        <p className="text-sm text-brand-200">Demo: admin@rental.com / Admin@12345</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <h1 className="text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'login' ? 'Sign in to continue' : 'Join as a customer or list your vehicles'}
          </p>

          {/* Tabs */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {['login', 'register'].map((m) => (
              <button key={m} onClick={() => switchMode(m)} className={cn('rounded-lg py-2 text-sm font-semibold capitalize transition', mode === m ? 'bg-white shadow dark:bg-slate-900' : 'text-slate-500')}>
                {m === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {mode === 'register' && (
              <>
                {/* Role selector */}
                <div>
                  <label className="label">I want to…</label>
                  <div className="grid grid-cols-2 gap-2">
                    <RoleCard active={role === 'customer'} onClick={() => setRole('customer')} icon={User} title="Rent vehicles" subtitle="As a customer" />
                    <RoleCard active={role === 'owner'} onClick={() => setRole('owner')} icon={Store} title="List vehicles" subtitle="As an owner" />
                  </div>
                </div>
                <Field icon={UserCircle}>
                  <Input label="Full name" placeholder="John Doe" {...register('name', { required: 'Name is required' })} error={errors.name?.message} />
                </Field>
              </>
            )}
            <Field icon={Mail}>
              <Input label="Email" type="email" placeholder="you@example.com" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
            </Field>
            <Field icon={Lock}>
              <Input label="Password" type="password" placeholder="••••••••" {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} error={errors.password?.message} />
            </Field>
            {mode === 'register' && (
              <Field icon={Phone}>
                <Input label="Phone (optional)" placeholder="+1 555 000 0000" {...register('phone')} />
              </Field>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, icon: Icon, title, subtitle }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex items-center gap-3 rounded-xl border p-3 text-left transition', active ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800')}>
      <Icon className={cn('h-6 w-6', active ? 'text-brand-600' : 'text-slate-400')} />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </button>
  );
}

// Field is a passthrough wrapper (icon reserved for future inline-icon styling)
function Field({ children }) {
  return <div>{children}</div>;
}
