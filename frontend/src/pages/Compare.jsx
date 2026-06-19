import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, Scale, Check, Minus } from 'lucide-react';
import api, { apiError } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { Button, Card, EmptyState, Spinner } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

const FALLBACK = 'https://placehold.co/400x300/e2e8f0/64748b?text=Vehicle';
const KEY = 'compareList';

const ROWS = [
  ['Price / day', (v) => formatCurrency(v.pricePerDay)],
  ['Price / week', (v) => (v.pricePerWeek ? formatCurrency(v.pricePerWeek) : '—')],
  ['Category', (v) => v.category?.name || '—'],
  ['Brand', (v) => v.brand],
  ['Model', (v) => v.model],
  ['Year', (v) => v.year],
  ['Seats', (v) => v.seatCapacity],
  ['Fuel', (v) => v.fuelType],
  ['Transmission', (v) => v.transmission],
  ['Efficiency', (v) => v.fuelEfficiency || (v.mileage ? `${v.mileage} km/l` : '—')],
  ['Condition score', (v) => `${v.conditionScore}/100`],
  ['Insurance', (v) => (v.insuranceStatus || '').replace('_', ' ')],
  ['Rating', (v) => (v.ratingCount ? `${v.ratingAvg} (${v.ratingCount})` : 'No reviews')],
  ['Security deposit', (v) => formatCurrency(v.securityDeposit)],
];

export default function Compare() {
  const [ids, setIds] = useState(() => JSON.parse(localStorage.getItem(KEY) || '[]'));
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: pool } = useFetch('/vehicles', { params: { limit: 8 } });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(ids));
    if (ids.length < 2) {
      setVehicles(ids.length ? vehicles.filter((v) => ids.includes(v._id)) : []);
      return;
    }
    setLoading(true);
    api
      .post('/vehicles/compare', { ids })
      .then(({ data }) => setVehicles(data.data.vehicles))
      .catch((err) => apiError(err))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const add = (id) => setIds((p) => (p.includes(id) || p.length >= 4 ? p : [...p, id]));
  const remove = (id) => setIds((p) => p.filter((x) => x !== id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
          <Scale className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Compare vehicles</h1>
          <p className="text-sm text-slate-500">Add 2–4 vehicles to compare side by side.</p>
        </div>
      </div>

      {/* Picker */}
      <Card className="mb-6">
        <p className="mb-3 text-sm font-semibold">Add from available vehicles</p>
        <div className="flex flex-wrap gap-2">
          {(pool?.vehicles || []).map((v) => {
            const selected = ids.includes(v._id);
            return (
              <button
                key={v._id}
                onClick={() => (selected ? remove(v._id) : add(v._id))}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${selected ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {selected ? <Check className="h-4 w-4 text-brand-600" /> : <Plus className="h-4 w-4" />}
                {v.brand} {v.model}
              </button>
            );
          })}
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>
      ) : vehicles.length < 2 ? (
        <EmptyState icon={Scale} title="Pick at least 2 vehicles" subtitle="Select vehicles above to see a detailed comparison." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-40 bg-slate-50 p-3 text-left text-sm dark:bg-slate-900" />
                {vehicles.map((v) => (
                  <th key={v._id} className="p-3 align-top">
                    <div className="relative">
                      <button onClick={() => remove(v._id)} className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <img src={v.coverImage?.url || v.images?.[0]?.url || FALLBACK} alt="" className="mb-2 h-28 w-full rounded-xl object-cover" />
                      <Link to={`/vehicles/${v.slug || v._id}`} className="text-sm font-semibold hover:text-brand-600">{v.name}</Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, fn], i) => (
                <tr key={label} className={i % 2 ? 'bg-slate-50/60 dark:bg-slate-900/40' : ''}>
                  <td className="sticky left-0 z-10 bg-inherit p-3 text-sm font-medium text-slate-500">{label}</td>
                  {vehicles.map((v) => (
                    <td key={v._id} className="p-3 text-center text-sm capitalize">{fn(v) ?? <Minus className="mx-auto h-4 w-4 text-slate-300" />}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
