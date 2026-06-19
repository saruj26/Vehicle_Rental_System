import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware className combiner. */
export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    amount || 0,
  );

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const daysBetween = (a, b) =>
  Math.max(1, Math.ceil((new Date(b) - new Date(a)) / 86400000));

export const STATUS_STYLES = {
  // bookings
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  completed: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  // vehicles
  draft: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  suspended: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};

export const SEAT_FILTERS = [
  { label: '2 Seater', value: '2', icon: '👤' },
  { label: '4 Seater', value: '4', icon: '👥' },
  { label: '5 Seater', value: '5', icon: '👨‍👩‍👧' },
  { label: '7 Seater', value: '7', icon: '🚐' },
  { label: '12 Seater', value: '12', icon: '🚌' },
  { label: '20+ Seater', value: '20+', icon: '🚌' },
];

export const initials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
