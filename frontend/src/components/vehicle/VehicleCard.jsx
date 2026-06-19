import { Link } from 'react-router-dom';
import { Heart, MapPin, Users, Fuel, Cog, BadgeCheck, Zap } from 'lucide-react';
import { Rating } from '@/components/ui';
import { useWishlist } from '@/context/WishlistContext';
import { cn, formatCurrency } from '@/lib/utils';

const FALLBACK = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

export default function VehicleCard({ vehicle: v, compact }) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(v._id);
  const img = v.coverImage?.url || v.images?.[0]?.url || FALLBACK;

  return (
    <div className="group card overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-glass">
      <div className="relative">
        <Link to={`/vehicles/${v.slug || v._id}`}>
          <img
            src={img}
            alt={v.name}
            loading="lazy"
            onError={(e) => { e.currentTarget.src = FALLBACK; }}
            className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {v.isFeatured && (
            <span className="badge bg-amber-500 text-white"><Zap className="h-3 w-3" /> Featured</span>
          )}
          {v.category?.name && (
            <span className="badge glass text-slate-700 dark:text-slate-200">{v.category.name}</span>
          )}
        </div>
        <button
          onClick={() => toggle(v._id)}
          aria-label="Save"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow transition hover:scale-110 dark:bg-slate-900/90"
        >
          <Heart className={cn('h-4 w-4', saved && 'fill-rose-500 text-rose-500')} />
        </button>
        {v.conditionScore != null && (
          <span className="absolute bottom-3 right-3 badge bg-black/70 text-white">
            {v.conditionScore}/100 condition
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/vehicles/${v.slug || v._id}`} className="min-w-0">
            <h3 className="truncate font-semibold hover:text-brand-600">{v.name}</h3>
            <p className="truncate text-xs text-slate-500">{v.brand} · {v.model} · {v.year}</p>
          </Link>
          {v.ratingCount > 0 && <Rating value={v.ratingAvg} count={v.ratingCount} />}
        </div>

        {v.location && (
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5" /> {v.location}
            {v.owner?.isVerified && (
              <span className="ml-1 inline-flex items-center gap-0.5 text-emerald-600">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </p>
        )}

        {!compact && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {v.seatCapacity} seats</span>
            <span className="flex items-center gap-1 capitalize"><Fuel className="h-3.5 w-3.5" /> {v.fuelType}</span>
            <span className="flex items-center gap-1 capitalize"><Cog className="h-3.5 w-3.5" /> {v.transmission}</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <div>
            <span className="text-lg font-bold">{formatCurrency(v.pricePerDay)}</span>
            <span className="text-xs text-slate-500">/day</span>
          </div>
          <Link to={`/vehicles/${v.slug || v._id}`} className="btn-primary !px-3 !py-1.5 text-xs">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
