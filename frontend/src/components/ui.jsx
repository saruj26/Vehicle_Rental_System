import { cn } from '@/lib/utils';
import { Loader2, Star } from 'lucide-react';

export function Button({ variant = 'primary', className, children, loading, ...props }) {
  const variants = {
    primary: 'btn-primary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn bg-rose-600 text-white hover:bg-rose-700',
    success: 'btn bg-emerald-600 text-white hover:bg-emerald-700',
  };
  return (
    <button className={cn(variants[variant], className)} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('card p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function Input({ label, error, className, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input className={cn('input', error && 'border-rose-500', className)} {...props} />
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className, children, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className={cn('input', error && 'border-rose-500', className)} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea className={cn('input min-h-[100px]', error && 'border-rose-500', className)} {...props} />
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

export function Badge({ className, children }) {
  return <span className={cn('badge', className)}>{children}</span>;
}

export function Spinner({ className }) {
  return <Loader2 className={cn('h-6 w-6 animate-spin text-brand-600', className)} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function Rating({ value = 0, count, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star className="fill-amber-400 text-amber-400" style={{ width: size, height: size }} />
      <span className="font-semibold">{Number(value).toFixed(1)}</span>
      {count != null && <span className="text-slate-400">({count})</span>}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
      {Icon && <Icon className="mb-3 h-10 w-10 text-slate-300" />}
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-slate-500">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, accent = 'brand' }) {
  const accents = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10',
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={cn('grid h-12 w-12 place-items-center rounded-xl', accents[accent])}>
        {Icon && <Icon className="h-6 w-6" />}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden p-0">
      <div className="skeleton h-44 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-8 w-full" />
      </div>
    </div>
  );
}
