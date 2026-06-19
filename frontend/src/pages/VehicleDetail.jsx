import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users, Fuel, Cog, Gauge, MapPin, ShieldCheck, BadgeCheck, Heart, Calendar,
  MessageCircle, Star, Check, Phone, Palette, Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { apiError } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import VehicleCard from '@/components/vehicle/VehicleCard';
import { Button, Card, PageLoader, Rating, Badge, Textarea } from '@/components/ui';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const FALLBACK = 'https://placehold.co/800x600/e2e8f0/64748b?text=No+Image';

export default function VehicleDetail() {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSaved, toggle } = useWishlist();

  const { data, loading } = useFetch(`/vehicles/${idOrSlug}`, { deps: [idOrSlug] });
  const vehicle = data?.vehicle;
  const { data: similar } = useFetch(vehicle ? `/vehicles/${vehicle._id}/similar` : null, { deps: [vehicle?._id] });
  const { data: reviewsData, refetch: refetchReviews } = useFetch(
    vehicle ? `/vehicles/${vehicle._id}/reviews` : null, { deps: [vehicle?._id] },
  );

  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  // Track recently viewed (localStorage)
  useEffect(() => {
    if (!vehicle) return;
    const key = 'recentlyViewed';
    const list = JSON.parse(localStorage.getItem(key) || '[]').filter((id) => id !== vehicle._id);
    list.unshift(vehicle._id);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 12)));
  }, [vehicle]);

  if (loading) return <PageLoader />;
  if (!vehicle) return <div className="py-20 text-center">Vehicle not found.</div>;

  const images = vehicle.images?.length ? vehicle.images : [{ url: vehicle.coverImage?.url || FALLBACK }];
  const saved = isSaved(vehicle._id);
  const wa = (vehicle.whatsapp || '').replace(/[^\d]/g, '');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/vehicles" className="hover:text-brand-600">Vehicles</Link> / <span>{vehicle.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: gallery + details */}
        <div className="lg:col-span-2">
          {/* Gallery with zoom */}
          <div className="overflow-hidden rounded-2xl border">
            <div
              className="relative aspect-video cursor-zoom-in overflow-hidden bg-slate-100 dark:bg-slate-800"
              onClick={() => setZoom(true)}
            >
              <img src={images[active].url} alt={vehicle.name} className="h-full w-full object-cover transition duration-300 hover:scale-110" onError={(e) => { e.currentTarget.src = FALLBACK; }} />
              {vehicle.isFeatured && <Badge className="absolute left-3 top-3 bg-amber-500 text-white">Featured</Badge>}
            </div>
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActive(i)} className={cn('h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2', active === i ? 'border-brand-500' : 'border-transparent')}>
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Title */}
          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">{vehicle.name}</h1>
                {vehicle.category?.name && <Badge className="bg-brand-50 text-brand-700 dark:bg-brand-500/10">{vehicle.category.name}</Badge>}
              </div>
              <p className="mt-1 text-slate-500">{vehicle.brand} · {vehicle.model} · {vehicle.year}</p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                {vehicle.ratingCount > 0 && <Rating value={vehicle.ratingAvg} count={vehicle.ratingCount} />}
                <span className="flex items-center gap-1 text-slate-500"><MapPin className="h-4 w-4" /> {vehicle.location}</span>
              </div>
            </div>
            <button onClick={() => toggle(vehicle._id)} className="btn-outline !px-3">
              <Heart className={cn('h-5 w-5', saved && 'fill-rose-500 text-rose-500')} />
            </button>
          </div>

          {/* Spec grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Spec icon={Users} label="Seats" value={vehicle.seatCapacity} />
            <Spec icon={Fuel} label="Fuel" value={vehicle.fuelType} />
            <Spec icon={Cog} label="Transmission" value={vehicle.transmission} />
            <Spec icon={Gauge} label="Efficiency" value={vehicle.fuelEfficiency || `${vehicle.mileage || '—'} km/l`} />
            <Spec icon={Palette} label="Color" value={vehicle.color || '—'} />
            <Spec icon={Wrench} label="Condition" value={`${vehicle.conditionScore}/100`} />
            <Spec icon={ShieldCheck} label="Insurance" value={vehicle.insuranceStatus?.replace('_', ' ')} />
            <Spec icon={Calendar} label="Year" value={vehicle.year} />
          </div>

          {/* Description */}
          {vehicle.description && (
            <Card className="mt-6">
              <h3 className="mb-2 font-semibold">About this vehicle</h3>
              <p className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{vehicle.description}</p>
            </Card>
          )}

          {/* Features */}
          {vehicle.features?.length > 0 && (
            <Card className="mt-6">
              <h3 className="mb-3 font-semibold">Features</h3>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((f) => (
                  <span key={f._id} className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Check className="h-3 w-3 text-emerald-500" /> {f.name}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Owner */}
          <Card className="mt-6 flex items-center justify-between">
            <Link to={`/users/owners/${vehicle.owner?._id}`} className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-600 font-bold text-white">
                {vehicle.owner?.avatar?.url ? <img src={vehicle.owner.avatar.url} className="h-12 w-12 rounded-full object-cover" alt="" /> : vehicle.owner?.name?.[0]}
              </span>
              <div>
                <p className="flex items-center gap-1 font-semibold">
                  {vehicle.owner?.name}
                  {vehicle.owner?.isVerified && <BadgeCheck className="h-4 w-4 text-emerald-500" />}
                </p>
                <p className="text-xs text-slate-500">Vehicle owner</p>
              </div>
            </Link>
          </Card>

          {/* Reviews */}
          <ReviewsSection vehicle={vehicle} reviews={reviewsData?.reviews || []} onAdded={refetchReviews} />
        </div>

        {/* Right: booking widget */}
        <div>
          <BookingWidget vehicle={vehicle} user={user} navigate={navigate} wa={wa} />
        </div>
      </div>

      {/* Similar */}
      {similar?.vehicles?.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold">Similar vehicles</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.vehicles.slice(0, 4).map((v) => <VehicleCard key={v._id} vehicle={v} />)}
          </div>
        </section>
      )}

      {/* Zoom modal */}
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setZoom(false)}>
          <img src={images[active].url} alt="" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

function Spec({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border p-3">
      <Icon className="h-5 w-5 text-brand-600" />
      <p className="mt-2 text-xs text-slate-500">{label}</p>
      <p className="font-semibold capitalize">{value}</p>
    </div>
  );
}

function BookingWidget({ vehicle, user, navigate, wa }) {
  const [pickupDate, setPickup] = useState('');
  const [returnDate, setReturn] = useState('');
  const [promoCode, setPromo] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const getQuote = async () => {
    if (!pickupDate || !returnDate) return toast.error('Select pickup and return dates');
    setLoading(true);
    try {
      const { data } = await api.post('/bookings/quote', { vehicleId: vehicle._id, pickupDate, returnDate, promoCode: promoCode || undefined });
      setQuote(data.data.quote);
    } catch (err) {
      toast.error(apiError(err));
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  const book = async () => {
    if (!user) return navigate('/auth');
    if (user.role !== 'customer') return toast.error('Only customers can book');
    if (!quote) return toast.error('Get a price quote first');
    setBooking(true);
    try {
      const { data } = await api.post('/bookings', { vehicleId: vehicle._id, pickupDate, returnDate, promoCode: promoCode || undefined });
      toast.success('Booking requested!');
      navigate(`/bookings/${data.data.booking._id}`);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBooking(false);
    }
  };

  return (
    <Card className="sticky top-20">
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-extrabold">{formatCurrency(vehicle.pricePerDay)}</span>
        <span className="text-slate-500">/ day</span>
      </div>
      {vehicle.pricePerWeek > 0 && (
        <p className="mt-1 text-xs text-slate-500">{formatCurrency(vehicle.pricePerWeek)}/week · {formatCurrency(vehicle.pricePerMonth)}/month</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <label className="label">Pickup</label>
          <input type="date" min={today} value={pickupDate} onChange={(e) => { setPickup(e.target.value); setQuote(null); }} className="input" />
        </div>
        <div>
          <label className="label">Return</label>
          <input type="date" min={pickupDate || today} value={returnDate} onChange={(e) => { setReturn(e.target.value); setQuote(null); }} className="input" />
        </div>
      </div>
      <div className="mt-2">
        <label className="label">Promo code</label>
        <input value={promoCode} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="WELCOME10" className="input" />
      </div>

      <Button variant="outline" className="mt-3 w-full" onClick={getQuote} loading={loading}>Get price</Button>

      {quote && (
        <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/50">
          <Row label={`${formatCurrency(quote.pricePerDay)} × ${quote.totalDays} day(s)`} value={formatCurrency(quote.rentalAmount)} />
          <Row label="Service fee" value={formatCurrency(quote.serviceFee)} />
          <Row label="Tax" value={formatCurrency(quote.tax)} />
          {quote.securityDeposit > 0 && <Row label="Security deposit" value={formatCurrency(quote.securityDeposit)} />}
          {quote.discount > 0 && <Row label="Discount" value={`- ${formatCurrency(quote.discount)}`} green />}
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
            <span>Total</span><span>{formatCurrency(quote.totalAmount)}</span>
          </div>
        </div>
      )}

      <Button className="mt-4 w-full" onClick={book} loading={booking}>
        <Calendar className="h-4 w-4" /> Request to book
      </Button>

      {wa && (
        <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi, I'm interested in renting your ${vehicle.name}`)}`} target="_blank" rel="noreferrer" className="btn mt-2 w-full bg-emerald-500 text-white hover:bg-emerald-600">
          <MessageCircle className="h-4 w-4" /> Book via WhatsApp
        </a>
      )}
      {vehicle.ownerContact && (
        <a href={`tel:${vehicle.ownerContact}`} className="btn-ghost mt-2 w-full">
          <Phone className="h-4 w-4" /> {vehicle.ownerContact}
        </a>
      )}
    </Card>
  );
}

function Row({ label, value, green }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={green ? 'font-medium text-emerald-600' : ''}>{value}</span>
    </div>
  );
}

function ReviewsSection({ vehicle, reviews, onAdded }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/vehicles/${vehicle._id}/reviews`, { rating, comment });
      toast.success('Review submitted');
      setComment('');
      onAdded();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Reviews ({reviews.length})</h3>
        {vehicle.ratingCount > 0 && <Rating value={vehicle.ratingAvg} count={vehicle.ratingCount} size={18} />}
      </div>

      {user?.role === 'customer' && (
        <div className="mb-5 rounded-xl border p-4">
          <p className="mb-2 text-sm font-medium">Leave a review</p>
          <div className="mb-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star className={cn('h-6 w-6', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" />
          <Button className="mt-2" onClick={submit} loading={submitting}>Submit review</Button>
          <p className="mt-1 text-xs text-slate-400">You can review vehicles you've completed a trip with.</p>
        </div>
      )}

      <div className="space-y-4">
        {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r._id} className="border-b pb-4 last:border-0">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.customer?.name || 'Customer'}</span>
              <Rating value={r.rating} />
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
            <p className="mt-1 text-xs text-slate-400">{formatDate(r.createdAt)}</p>
            {r.ownerReply?.text && (
              <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                <span className="font-medium text-brand-600">Owner reply:</span> {r.ownerReply.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
