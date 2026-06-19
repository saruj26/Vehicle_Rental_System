import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ImagePlus, DollarSign, Send, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  Button, Card, Input, Select, Textarea, Spinner,
} from '@/components/ui';
import { useFetch } from '@/hooks/useFetch';
import api, { apiError } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'];
const TRANSMISSIONS = ['manual', 'automatic'];
const CONDITIONS = ['new', 'excellent', 'good', 'fair'];
const INSURANCE = ['insured', 'not_insured', 'expired'];

const NUMBER_FIELDS = [
  'year', 'seatCapacity', 'mileage', 'conditionScore', 'pricePerDay',
  'pricePerWeek', 'pricePerMonth', 'securityDeposit',
];

function Section({ title, children }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

export default function VehicleForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  // step: 'form' -> 'media' (post-create: images + fee + submit)
  const [step, setStep] = useState('form');
  const [vehicleId, setVehicleId] = useState(id || null);
  const [images, setImages] = useState([]);
  const [feePaid, setFeePaid] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: catData } = useFetch('/categories');
  const { data: featData } = useFetch('/features');
  const categories = catData?.categories || [];
  const features = featData?.features || [];

  const { data: vehicleData, loading: loadingVehicle } = useFetch(
    editing ? `/vehicles/${id}` : null,
    { deps: [id] },
  );

  const {
    register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '', brand: '', model: '', year: '', category: '', fuelType: 'petrol',
      transmission: 'manual', seatCapacity: '', location: '', pricePerDay: '',
      color: '', engineCapacity: '', mileage: '', fuelEfficiency: '',
      condition: 'good', conditionScore: '', description: '', pricePerWeek: '',
      pricePerMonth: '', securityDeposit: '', availability: true, ownerContact: '',
      whatsapp: '', registrationNumber: '', insuranceStatus: 'insured', features: [],
    },
  });

  // Prefill on edit
  useEffect(() => {
    if (editing && vehicleData?.vehicle) {
      const v = vehicleData.vehicle;
      reset({
        name: v.name || '',
        brand: v.brand || '',
        model: v.model || '',
        year: v.year ?? '',
        category: v.category?._id || v.category || '',
        fuelType: v.fuelType || 'petrol',
        transmission: v.transmission || 'manual',
        seatCapacity: v.seatCapacity ?? '',
        location: v.location || '',
        pricePerDay: v.pricePerDay ?? '',
        color: v.color || '',
        engineCapacity: v.engineCapacity || '',
        mileage: v.mileage ?? '',
        fuelEfficiency: v.fuelEfficiency || '',
        condition: v.condition || 'good',
        conditionScore: v.conditionScore ?? '',
        description: v.description || '',
        pricePerWeek: v.pricePerWeek ?? '',
        pricePerMonth: v.pricePerMonth ?? '',
        securityDeposit: v.securityDeposit ?? '',
        availability: v.availability ?? true,
        ownerContact: v.ownerContact || '',
        whatsapp: v.whatsapp || '',
        registrationNumber: v.registrationNumber || '',
        insuranceStatus: v.insuranceStatus || 'insured',
        features: (v.features || []).map((f) => f._id || f),
      });
      setImages(v.images || []);
      setFeePaid(Boolean(v.feePaid));
    }
  }, [editing, vehicleData, reset]);

  const selectedFeatures = watch('features') || [];
  const selectedCategory = watch('category');
  const activeCategory = categories.find((c) => c._id === selectedCategory);

  const buildPayload = (form) => {
    const payload = { ...form };
    NUMBER_FIELDS.forEach((f) => {
      if (payload[f] === '' || payload[f] == null) {
        delete payload[f];
      } else {
        payload[f] = Number(payload[f]);
      }
    });
    return payload;
  };

  const onSubmit = async (form) => {
    const payload = buildPayload(form);
    try {
      if (editing) {
        await api.patch(`/vehicles/${id}`, payload);
        toast.success('Vehicle updated');
        navigate('/owner/vehicles');
      } else {
        const res = await api.post('/vehicles', payload);
        const created = res.data.data.vehicle;
        setVehicleId(created._id);
        setImages(created.images || []);
        setFeePaid(Boolean(created.feePaid));
        toast.success('Draft created. Add photos & submit.');
        setStep('media');
      }
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !vehicleId) return;
    const fd = new FormData();
    files.forEach((file) => fd.append('images', file));
    setUploading(true);
    try {
      const res = await api.post(`/vehicles/${vehicleId}/images`, fd);
      setImages(res.data.data.images || []);
      toast.success('Images uploaded');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (publicId) => {
    if (!vehicleId || !publicId) return;
    try {
      const res = await api.patch(`/vehicles/${vehicleId}/images`, {
        deletePublicIds: [publicId],
      });
      setImages(res.data.data.images || []);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const handlePayFee = async () => {
    if (!vehicleId) return;
    setPaying(true);
    try {
      await api.post(`/vehicles/${vehicleId}/pay-fee`, { provider: 'manual' });
      setFeePaid(true);
      toast.success('Posting fee paid');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setPaying(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!vehicleId) return;
    setSubmitting(true);
    try {
      await api.post(`/vehicles/${vehicleId}/submit`);
      toast.success('Submitted for approval');
      navigate('/owner/vehicles');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFeature = (fid) => {
    const next = selectedFeatures.includes(fid)
      ? selectedFeatures.filter((x) => x !== fid)
      : [...selectedFeatures, fid];
    setValue('features', next, { shouldDirty: true });
  };

  if (editing && loadingVehicle) {
    return (
      <DashboardShell title="Edit Vehicle">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={editing ? 'Edit Vehicle' : 'Add Vehicle'}
      subtitle={
        step === 'media' ? 'Add photos, pay the fee, then submit' : 'Fill in your vehicle details'
      }
    >
      {step === 'form' ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic info */}
          <Section title="Basic Info">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name *" {...register('name', { required: 'Required' })} error={errors.name?.message} />
              <Input label="Brand *" {...register('brand', { required: 'Required' })} error={errors.brand?.message} />
              <Input label="Model *" {...register('model', { required: 'Required' })} error={errors.model?.message} />
              <Input label="Year *" type="number" {...register('year', { required: 'Required' })} error={errors.year?.message} />
              <Select label="Category *" {...register('category', { required: 'Required' })} error={errors.category?.message}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.postingFee != null ? ` — fee ${formatCurrency(c.postingFee)}` : ''}
                  </option>
                ))}
              </Select>
              <Input label="Location *" {...register('location', { required: 'Required' })} error={errors.location?.message} />
              <Input label="Color" {...register('color')} />
              <Input label="Registration Number" {...register('registrationNumber')} />
            </div>
            {activeCategory?.postingFee != null && (
              <p className="mt-3 text-sm text-slate-500">
                Posting fee for this category:{' '}
                <span className="font-semibold text-brand-600">
                  {formatCurrency(activeCategory.postingFee)}
                </span>
              </p>
            )}
            <div className="mt-4">
              <Textarea label="Description" {...register('description')} />
            </div>
          </Section>

          {/* Specs */}
          <Section title="Specifications">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select label="Fuel Type *" {...register('fuelType', { required: true })}>
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
              <Select label="Transmission *" {...register('transmission', { required: true })}>
                {TRANSMISSIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <Input label="Seat Capacity *" type="number" {...register('seatCapacity', { required: 'Required' })} error={errors.seatCapacity?.message} />
              <Input label="Engine Capacity" {...register('engineCapacity')} />
              <Input label="Mileage" type="number" {...register('mileage')} />
              <Input label="Fuel Efficiency" {...register('fuelEfficiency')} />
              <Select label="Condition" {...register('condition')}>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Input label="Condition Score" type="number" {...register('conditionScore')} />
              <Select label="Insurance Status" {...register('insuranceStatus')}>
                {INSURANCE.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </Select>
            </div>
          </Section>

          {/* Pricing */}
          <Section title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="Price / Day *" type="number" {...register('pricePerDay', { required: 'Required' })} error={errors.pricePerDay?.message} />
              <Input label="Price / Week" type="number" {...register('pricePerWeek')} />
              <Input label="Price / Month" type="number" {...register('pricePerMonth')} />
              <Input label="Security Deposit" type="number" {...register('securityDeposit')} />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded" {...register('availability')} />
              Available for booking
            </label>
          </Section>

          {/* Contact */}
          <Section title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Owner Contact" {...register('ownerContact')} />
              <Input label="WhatsApp" {...register('whatsapp')} />
            </div>
          </Section>

          {/* Features */}
          <Section title="Features">
            {features.length === 0 ? (
              <p className="text-sm text-slate-500">No features available.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((f) => (
                  <label
                    key={f._id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded"
                      checked={selectedFeatures.includes(f._id)}
                      onChange={() => toggleFeature(f._id)}
                    />
                    {f.name}
                  </label>
                ))}
              </div>
            )}
          </Section>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/owner/vehicles')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {editing ? 'Save Changes' : 'Create Draft'}
            </Button>
          </div>
        </form>
      ) : (
        // Media / fee / submit step
        <div className="space-y-6">
          <Section title="Photos">
            <label
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center text-sm text-slate-500 transition hover:bg-slate-50 dark:hover:bg-slate-800',
                uploading && 'pointer-events-none opacity-60',
              )}
            >
              {uploading ? <Spinner /> : <ImagePlus className="h-8 w-8 text-slate-400" />}
              <span>{uploading ? 'Uploading…' : 'Click to upload images (multiple)'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>

            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img) => (
                  <div key={img.publicId || img.url} className="group relative overflow-hidden rounded-xl border">
                    <img src={img.url} alt="" className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.publicId)}
                      className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Posting Fee & Submission">
            <div className="flex flex-wrap items-center gap-3">
              {feePaid ? (
                <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" /> Posting fee paid
                </span>
              ) : (
                <Button variant="success" loading={paying} onClick={handlePayFee}>
                  <DollarSign className="h-4 w-4" /> Pay posting fee
                </Button>
              )}

              <Button
                variant="primary"
                loading={submitting}
                disabled={!feePaid || images.length === 0}
                onClick={handleSubmitForApproval}
              >
                <Send className="h-4 w-4" /> Submit for approval
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              You must pay the posting fee and upload at least one image before submitting.
            </p>
          </Section>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => navigate('/owner/vehicles')}>
              Finish later
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
