import { SEAT_FILTERS } from '@/lib/utils';
import { cn } from '@/lib/utils';

/** Modern visual seat-capacity filter cards. */
export default function SeatFilter({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {SEAT_FILTERS.map((s) => {
        const active = value === s.value;
        return (
          <button
            key={s.value}
            onClick={() => onChange(active ? '' : s.value)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl border p-3 text-center text-xs font-medium transition',
              active
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                : 'hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800',
            )}
          >
            <span className="text-xl">{s.icon}</span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
