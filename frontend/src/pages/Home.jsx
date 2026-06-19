import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ShieldCheck, Zap, Star, TrendingUp, Clock, ArrowRight, Car, MapPin,
} from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import VehicleCard from '@/components/vehicle/VehicleCard';
import { SkeletonCard, Button } from '@/components/ui';
import * as Icons from 'lucide-react';

function Section({ title, subtitle, link, children }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {link && (
          <Link to={link} className="hidden items-center gap-1 text-sm font-semibold text-brand-600 sm:flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Grid({ loading, vehicles }) {
  if (loading)
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  if (!vehicles?.length) return <p className="text-sm text-slate-500">No vehicles yet.</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {vehicles.map((v) => <VehicleCard key={v._id} vehicle={v} />)}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data: home, loading } = useFetch('/vehicles/home');
  const { data: cats } = useFetch('/categories');

  const search = (e) => {
    e.preventDefault();
    navigate(`/vehicles?q=${encodeURIComponent(q)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900" />
        <div className="absolute inset-0 -z-10 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 0, transparent 40%)' }} />
        <div className="mx-auto max-w-7xl px-4 py-20 text-white sm:py-28">
          <div className="max-w-2xl animate-fade-in">
            <span className="badge mb-4 bg-white/15 text-white backdrop-blur">
              <Zap className="h-3 w-3" /> 1000+ vehicles from verified owners
            </span>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
              Rent the perfect ride, <span className="text-brand-200">anywhere</span>.
            </h1>
            <p className="mt-4 text-lg text-brand-100">
              Cars, bikes, vans, SUVs & luxury vehicles — book instantly from trusted local owners.
            </p>

            <form onSubmit={search} className="mt-8 flex max-w-xl gap-2 rounded-2xl bg-white p-2 shadow-glass">
              <div className="flex flex-1 items-center gap-2 px-3 text-slate-700">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by brand, model or location…"
                  className="w-full bg-transparent py-2 text-sm outline-none"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              <span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Verified owners</span>
              <span className="flex items-center gap-2"><Clock className="h-5 w-5" /> Instant booking</span>
              <span className="flex items-center gap-2"><Star className="h-5 w-5" /> Top rated</span>
            </div>
          </div>
        </div>
      </section>

      {/* Popular categories */}
      <Section title="Popular categories" subtitle="Find the right vehicle for every journey" link="/vehicles">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
          {(cats?.categories || []).slice(0, 16).map((c) => {
            const Icon = Icons[toPascal(c.icon)] || Car;
            return (
              <Link
                key={c._id}
                to={`/vehicles?category=${c._id}`}
                className="card flex flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-1 hover:border-brand-400"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section title="🔥 Trending now" subtitle="Most viewed & booked this week" link="/vehicles?sort=trending">
        <Grid loading={loading} vehicles={home?.trending} />
      </Section>

      <Section title="⭐ Top rated" subtitle="Highest rated by our community" link="/vehicles?sort=rating">
        <Grid loading={loading} vehicles={home?.topRated} />
      </Section>

      <Section title="🆕 Recently added" subtitle="Fresh listings from local owners" link="/vehicles?sort=newest">
        <Grid loading={loading} vehicles={home?.recent} />
      </Section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-700 p-8 text-center text-white sm:grid-cols-4">
          {[
            ['1,000+', 'Vehicles listed', Car],
            ['15+', 'Categories', TrendingUp],
            ['98%', 'Happy renters', Star],
            ['24/7', 'Support', ShieldCheck],
          ].map(([v, l, Icon]) => (
            <div key={l}>
              <Icon className="mx-auto mb-2 h-7 w-7 opacity-80" />
              <p className="text-3xl font-extrabold">{v}</p>
              <p className="text-sm text-brand-100">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="card flex flex-col items-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-center text-white">
          <MapPin className="h-8 w-8 text-brand-300" />
          <h2 className="text-2xl font-bold sm:text-3xl">Own a vehicle? Start earning today.</h2>
          <p className="max-w-lg text-slate-300">
            List your car, bike or van in minutes and reach thousands of renters near you.
          </p>
          <Link to="/auth" className="btn-primary">List your vehicle <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}

function toPascal(str = 'car') {
  return str.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}
