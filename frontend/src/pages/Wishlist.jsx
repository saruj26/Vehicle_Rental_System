import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import DashboardShell from '@/components/layout/DashboardShell';
import VehicleCard from '@/components/vehicle/VehicleCard';
import { SkeletonCard, EmptyState, Button } from '@/components/ui';

export default function Wishlist() {
  const { user } = useAuth();
  const { data, loading } = useFetch('/wishlist');

  const vehicles = data?.vehicles || [];

  const body = loading ? (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  ) : vehicles.length ? (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v) => (
        <VehicleCard key={v._id} vehicle={v} />
      ))}
    </div>
  ) : (
    <EmptyState
      icon={Heart}
      title="Your wishlist is empty"
      subtitle="Save vehicles you love and find them here later."
      action={
        <Link to="/vehicles">
          <Button variant="primary">Browse vehicles</Button>
        </Link>
      }
    />
  );

  if (user?.role === 'customer') {
    return (
      <DashboardShell title="My Wishlist" subtitle={`${vehicles.length} saved vehicle${vehicles.length === 1 ? '' : 's'}`}>
        {body}
      </DashboardShell>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">My Wishlist</h1>
      <p className="mt-1 text-sm text-slate-500">
        {vehicles.length} saved vehicle{vehicles.length === 1 ? '' : 's'}
      </p>
      <div className="mt-6">{body}</div>
    </div>
  );
}
