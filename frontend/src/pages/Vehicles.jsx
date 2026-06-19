import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import VehicleCard from '@/components/vehicle/VehicleCard';
import SeatFilter from '@/components/vehicle/SeatFilter';
import { SkeletonCard, Button, Select, EmptyState } from '@/components/ui';
import { Car } from 'lucide-react';

const SORTS = [
  ['newest', 'Newest'],
  ['price_asc', 'Price: Low → High'],
  ['price_desc', 'Price: High → Low'],
  ['rating', 'Top rated'],
  ['popular', 'Most popular'],
  ['trending', 'Trending'],
];

export default function Vehicles() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState(params.get('q') || '');

  const { data: cats } = useFetch('/categories');
  const { data: brandsData } = useFetch('/vehicles/meta/brands');

  // Build query object from URL params
  const query = Object.fromEntries(params.entries());
  const { data, meta, loading } = useFetch('/vehicles', {
    params: { ...query, limit: 12 },
    deps: [params.toString()],
  });

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  const applySearch = (e) => {
    e.preventDefault();
    setParam('q', q);
  };

  const clearAll = () => {
    setQ('');
    setParams(new URLSearchParams());
  };

  const activeFilters = [...params.keys()].filter((k) => !['page', 'sort'].includes(k));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Browse vehicles</h1>
      <p className="mt-1 text-sm text-slate-500">{meta?.total ?? '—'} vehicles available</p>

      {/* Search + sort bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={applySearch} className="flex flex-1 items-center gap-2 rounded-xl border bg-white px-3 dark:bg-slate-900">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand, model, location…" className="w-full bg-transparent py-2.5 text-sm outline-none" />
        </form>
        <div className="flex gap-2">
          <Select value={params.get('sort') || 'newest'} onChange={(e) => setParam('sort', e.target.value)} className="!w-44">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Button variant="outline" onClick={() => setShowFilters((s) => !s)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      {/* Seat capacity quick filter */}
      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold">Seat capacity</p>
        <SeatFilter value={params.get('seats') || ''} onChange={(v) => setParam('seats', v)} />
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="mt-4 grid gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Category" value={params.get('category') || ''} onChange={(e) => setParam('category', e.target.value)}>
            <option value="">All categories</option>
            {(cats?.categories || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Select label="Brand" value={params.get('brand') || ''} onChange={(e) => setParam('brand', e.target.value)}>
            <option value="">All brands</option>
            {(brandsData?.brands || []).map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Select label="Fuel type" value={params.get('fuelType') || ''} onChange={(e) => setParam('fuelType', e.target.value)}>
            <option value="">Any fuel</option>
            {['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'].map((f) => <option key={f} value={f} className="capitalize">{f}</option>)}
          </Select>
          <Select label="Transmission" value={params.get('transmission') || ''} onChange={(e) => setParam('transmission', e.target.value)}>
            <option value="">Any</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </Select>
          <Select label="Condition" value={params.get('condition') || ''} onChange={(e) => setParam('condition', e.target.value)}>
            <option value="">Any condition</option>
            {['new', 'excellent', 'good', 'fair'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </Select>
          <div>
            <label className="label">Min price / day</label>
            <input type="number" className="input" defaultValue={params.get('minPrice') || ''} onBlur={(e) => setParam('minPrice', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="label">Max price / day</label>
            <input type="number" className="input" defaultValue={params.get('maxPrice') || ''} onBlur={(e) => setParam('maxPrice', e.target.value)} placeholder="500" />
          </div>
          <Select label="Min rating" value={params.get('minRating') || ''} onChange={(e) => setParam('minRating', e.target.value)}>
            <option value="">Any rating</option>
            {[4, 3, 2].map((r) => <option key={r} value={r}>{r}★ & up</option>)}
          </Select>
        </div>
      )}

      {activeFilters.length > 0 && (
        <button onClick={clearAll} className="mt-4 inline-flex items-center gap-1 text-sm text-rose-600">
          <X className="h-4 w-4" /> Clear all filters
        </button>
      )}

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : data?.vehicles?.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.vehicles.map((v) => <VehicleCard key={v._id} vehicle={v} />)}
            </div>
            {meta && meta.pages > 1 && (
              <Pagination meta={meta} onPage={(p) => setParam('page', p)} />
            )}
          </>
        ) : (
          <EmptyState icon={Car} title="No vehicles found" subtitle="Try adjusting your filters or search terms." action={<Button onClick={clearAll}>Reset filters</Button>} />
        )}
      </div>
    </div>
  );
}

function Pagination({ meta, onPage }) {
  const pages = Array.from({ length: meta.pages }, (_, i) => i + 1).slice(
    Math.max(0, meta.page - 3),
    Math.max(5, meta.page + 2),
  );
  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <Button variant="outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Prev</Button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`h-9 w-9 rounded-lg text-sm font-medium ${p === meta.page ? 'bg-brand-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          {p}
        </button>
      ))}
      <Button variant="outline" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next</Button>
    </div>
  );
}
