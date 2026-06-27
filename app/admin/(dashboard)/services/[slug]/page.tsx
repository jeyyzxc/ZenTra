'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Archive,
  ArrowLeft,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

type EventCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  status: 'active' | 'hidden' | 'archived';
  clientVisible: boolean;
  packageCount: number;
  activePackageCount: number;
};

type PackageInclusion = {
  id?: string;
  inclusionName: string;
  description: string | null;
  isFree: boolean;
  isOptional: boolean;
  displayOrder: number;
};

type PackageRecord = {
  id: string;
  eventCategoryId: string;
  eventCategoryName: string;
  eventCategorySlug: string;
  packageName: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  paxIncluded: number;
  excessPaxFee: number;
  reservationFee: number;
  downPaymentAmount: number;
  fullPaymentAmount: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  packageImageUrl: string | null;
  contractItemDescription: string | null;
  contractInclusionDescription: string | null;
  status: 'active' | 'inactive' | 'hidden' | 'archived';
  clientVisible: boolean;
  currentVersion: number;
  internalNotes: string | null;
  inclusionCount: number;
  inclusions: PackageInclusion[];
  versions: Array<{
    id: string;
    versionNumber: number;
    changeSummary: string | null;
    createdAt: string;
  }>;
  updatedAt: string;
};

type PackageForm = {
  packageName: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  paxIncluded: string;
  excessPaxFee: string;
  reservationFee: string;
  downPaymentAmount: string;
  fullPaymentAmount: string;
  checkInTime: string;
  checkOutTime: string;
  packageImageUrl: string;
  contractItemDescription: string;
  contractInclusionDescription: string;
  status: PackageRecord['status'];
  clientVisible: boolean;
  internalNotes: string;
  inclusions: PackageInclusion[];
};

type ConfirmTarget = {
  action: 'archive' | 'delete';
  packageRecord: PackageRecord;
} | null;

const emptyPackageForm: PackageForm = {
  packageName: '',
  slug: '',
  description: '',
  price: '0',
  currency: 'PHP',
  paxIncluded: '0',
  excessPaxFee: '0',
  reservationFee: '0',
  downPaymentAmount: '0',
  fullPaymentAmount: '0',
  checkInTime: '',
  checkOutTime: '',
  packageImageUrl: '',
  contractItemDescription: '',
  contractInclusionDescription: '',
  status: 'active',
  clientVisible: true,
  internalNotes: '',
  inclusions: [],
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function money(value: number, currency = 'PHP') {
  return `${currency} ${value.toLocaleString('en-PH', {
    maximumFractionDigits: 0,
  })}`;
}

function statusBadge(status: PackageRecord['status']) {
  if (status === 'active') return 'border-emerald-200 bg-emerald-100 text-emerald-800';
  if (status === 'inactive') return 'border-sky-200 bg-sky-100 text-sky-800';
  if (status === 'hidden') return 'border-amber-200 bg-amber-100 text-amber-800';
  return 'border-zinc-300 bg-zinc-200 text-zinc-700';
}

function packageToForm(packageRecord: PackageRecord): PackageForm {
  return {
    packageName: packageRecord.packageName,
    slug: packageRecord.slug,
    description: packageRecord.description ?? '',
    price: String(packageRecord.price),
    currency: packageRecord.currency,
    paxIncluded: String(packageRecord.paxIncluded),
    excessPaxFee: String(packageRecord.excessPaxFee),
    reservationFee: String(packageRecord.reservationFee),
    downPaymentAmount: String(packageRecord.downPaymentAmount),
    fullPaymentAmount: String(packageRecord.fullPaymentAmount),
    checkInTime: packageRecord.checkInTime ?? '',
    checkOutTime: packageRecord.checkOutTime ?? '',
    packageImageUrl: packageRecord.packageImageUrl ?? '',
    contractItemDescription: packageRecord.contractItemDescription ?? '',
    contractInclusionDescription: packageRecord.contractInclusionDescription ?? '',
    status: packageRecord.status,
    clientVisible: packageRecord.clientVisible,
    internalNotes: packageRecord.internalNotes ?? '',
    inclusions: packageRecord.inclusions.map((inclusion, index) => ({
      id: inclusion.id,
      inclusionName: inclusion.inclusionName,
      description: inclusion.description ?? '',
      isFree: inclusion.isFree,
      isOptional: inclusion.isOptional,
      displayOrder: inclusion.displayOrder || (index + 1) * 10,
    })),
  };
}

export default function EventCategoryPackagesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : params.slug?.[0] ?? '';
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PackageRecord['status']>('all');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingPackage, setEditingPackage] = useState<PackageRecord | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyPackageForm);
  const [previewPackage, setPreviewPackage] = useState<PackageRecord | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);

  const loadPackages = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/event-categories/${encodeURIComponent(slug)}/packages`, {
        cache: 'no-store',
      });
      const payload = await response.json() as {
        data?: { category: EventCategory; packages: PackageRecord[] };
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || 'Unable to load packages.');
      }

      setCategory(payload.data.category);
      setPackages(payload.data.packages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load packages.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPackages();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadPackages]);

  const filteredPackages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return packages.filter((packageRecord) => {
      const matchesStatus = statusFilter === 'all' || packageRecord.status === statusFilter;
      const matchesQuery = !normalizedQuery ||
        packageRecord.packageName.toLowerCase().includes(normalizedQuery) ||
        packageRecord.description?.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [packages, query, statusFilter]);

  const summary = useMemo(() => ({
    total: packages.length,
    active: packages.filter((packageRecord) => packageRecord.status === 'active').length,
    visible: packages.filter((packageRecord) => packageRecord.status === 'active' && packageRecord.clientVisible).length,
    archived: packages.filter((packageRecord) => packageRecord.status === 'archived').length,
  }), [packages]);

  const openCreate = () => {
    setEditingPackage(null);
    setForm({
      ...emptyPackageForm,
      inclusions: [
        { inclusionName: 'Venue use', description: '', isFree: true, isOptional: false, displayOrder: 10 },
        { inclusionName: 'Tables and chairs', description: '', isFree: true, isOptional: false, displayOrder: 20 },
      ],
    });
    setModalMode('create');
  };

  const openEdit = (packageRecord: PackageRecord) => {
    setEditingPackage(packageRecord);
    setForm(packageToForm(packageRecord));
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingPackage(null);
    setForm(emptyPackageForm);
    setSaving(false);
  };

  const addInclusion = () => {
    setForm((current) => ({
      ...current,
      inclusions: [
        ...current.inclusions,
        {
          inclusionName: '',
          description: '',
          isFree: true,
          isOptional: false,
          displayOrder: (current.inclusions.length + 1) * 10,
        },
      ],
    }));
  };

  const updateInclusion = (index: number, updates: Partial<PackageInclusion>) => {
    setForm((current) => ({
      ...current,
      inclusions: current.inclusions.map((inclusion, currentIndex) => (
        currentIndex === index ? { ...inclusion, ...updates } : inclusion
      )),
    }));
  };

  const removeInclusion = (index: number) => {
    setForm((current) => ({
      ...current,
      inclusions: current.inclusions
        .filter((_, currentIndex) => currentIndex !== index)
        .map((inclusion, nextIndex) => ({ ...inclusion, displayOrder: (nextIndex + 1) * 10 })),
    }));
  };

  const moveInclusion = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      const next = [...current.inclusions];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return current;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return {
        ...current,
        inclusions: next.map((inclusion, currentIndex) => ({
          ...inclusion,
          displayOrder: (currentIndex + 1) * 10,
        })),
      };
    });
  };

  const submitPackage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const endpoint = editingPackage
        ? `/api/admin/packages/${encodeURIComponent(editingPackage.id)}`
        : `/api/admin/event-categories/${encodeURIComponent(slug)}/packages`;
      const response = await fetch(endpoint, {
        method: editingPackage ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          packageName: form.packageName,
          slug: form.slug || slugify(form.packageName),
          description: form.description,
          price: Number(form.price || 0),
          currency: form.currency || 'PHP',
          paxIncluded: Number(form.paxIncluded || 0),
          excessPaxFee: Number(form.excessPaxFee || 0),
          reservationFee: Number(form.reservationFee || 0),
          downPaymentAmount: Number(form.downPaymentAmount || 0),
          fullPaymentAmount: Number(form.fullPaymentAmount || form.price || 0),
          checkInTime: form.checkInTime,
          checkOutTime: form.checkOutTime,
          packageImageUrl: form.packageImageUrl,
          contractItemDescription: form.contractItemDescription,
          contractInclusionDescription: form.contractInclusionDescription,
          status: form.status,
          clientVisible: form.clientVisible,
          internalNotes: form.internalNotes,
          inclusions: form.inclusions.map((inclusion, index) => ({
            inclusionName: inclusion.inclusionName,
            description: inclusion.description,
            isFree: inclusion.isFree,
            isOptional: inclusion.isOptional,
            displayOrder: (index + 1) * 10,
          })),
        }),
      });
      const payload = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save package.');
      }

      closeModal();
      await loadPackages();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save package.');
      setSaving(false);
    }
  };

  const setPackageVisibility = async (packageRecord: PackageRecord, clientVisible: boolean) => {
    setError('');

    try {
      const response = await fetch(`/api/admin/packages/${encodeURIComponent(packageRecord.id)}/visibility`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clientVisible }),
      });
      const payload = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update package visibility.');
      }

      await loadPackages();
    } catch (visibilityError) {
      setError(visibilityError instanceof Error ? visibilityError.message : 'Unable to update package visibility.');
    }
  };

  const runConfirmedAction = async () => {
    if (!confirmTarget) return;
    setSaving(true);
    setError('');

    try {
      const endpoint = confirmTarget.action === 'archive'
        ? `/api/admin/packages/${encodeURIComponent(confirmTarget.packageRecord.id)}/archive`
        : `/api/admin/packages/${encodeURIComponent(confirmTarget.packageRecord.id)}`;
      const response = await fetch(endpoint, {
        method: confirmTarget.action === 'archive' ? 'PATCH' : 'DELETE',
      });
      const payload = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update package.');
      }

      setConfirmTarget(null);
      setSaving(false);
      await loadPackages();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update package.');
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 font-serif text-[#1a1f18] dark:text-[#F4F4F0]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push('/admin/services')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#8E7722] hover:text-[#1a1f18] dark:hover:text-[#F4F4F0]"
          >
            <ArrowLeft className="h-4 w-4" />
            Services & Packages
          </button>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em] text-[#1a1f18] dark:text-[#F4F4F0]">
            {category ? `${category.name} Packages` : 'Event Packages'}
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Create and manage package offers, inclusions, pricing, availability, and client-facing content for {category?.name ?? 'this event'} events.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={!category || category.status === 'archived'}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D6B53B]/30 bg-[#FDF5CC] px-6 py-2.5 text-sm font-bold text-[#1a1f18] shadow-sm transition-colors hover:bg-[#EADE81] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          Add New Package
        </button>
      </div>

      {category && (
        <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-[#2c3328] p-6 text-white shadow-sm">
          {category.coverImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-35"
              style={{ backgroundImage: `url("${category.coverImageUrl}")` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/10" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-serif italic">{category.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                {category.description || 'No event category description yet.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-white/70">Total</p>
                <p className="mt-1 text-2xl font-bold">{summary.total}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-white/70">Active</p>
                <p className="mt-1 text-2xl font-bold">{summary.active}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-white/70">Visible</p>
                <p className="mt-1 text-2xl font-bold">{summary.visible}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-white/70">Archived</p>
                <p className="mt-1 text-2xl font-bold">{summary.archived}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-[#D6B53B]/20 bg-white/80 p-4 shadow-sm dark:bg-white/5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search packages"
            className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm font-bold outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#141A13]"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="hidden">Hidden</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-[#D6B53B]/30 bg-white/50 dark:bg-white/5">
          <Loader2 className="h-8 w-8 animate-spin text-[#8E7722]" />
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D6B53B]/30 bg-white/60 p-8 text-center dark:bg-white/5">
          <ImageIcon className="h-12 w-12 text-[#8E7722]" />
          <h2 className="mt-4 text-2xl font-bold">No packages found</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Add a package under this event category or adjust the search and filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filteredPackages.map((packageRecord) => (
            <article
              key={packageRecord.id}
              className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5"
            >
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
                <div className="relative min-h-[220px] bg-[#2c3328]">
                  {packageRecord.packageImageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url("${packageRecord.packageImageUrl}")` }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/70">
                      <ImageIcon className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusBadge(packageRecord.status)}`}>
                      {packageRecord.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-[#1a1f18] dark:text-[#F4F4F0]">{packageRecord.packageName}</h2>
                      <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-[#A3B19B] line-clamp-2">
                        {packageRecord.description || 'No package description yet.'}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#FDF5CC] px-3 py-1 text-xs font-bold text-[#8E7722]">
                      v{packageRecord.currentVersion}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-[#F9F8F1] p-3 dark:bg-black/20">
                      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Price</p>
                      <p className="mt-1 font-bold">{money(packageRecord.price, packageRecord.currency)}</p>
                    </div>
                    <div className="rounded-lg bg-[#F9F8F1] p-3 dark:bg-black/20">
                      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Pax</p>
                      <p className="mt-1 font-bold">{packageRecord.paxIncluded} included</p>
                    </div>
                    <div className="rounded-lg bg-[#F9F8F1] p-3 dark:bg-black/20">
                      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Reservation</p>
                      <p className="mt-1 font-bold">{money(packageRecord.reservationFee, packageRecord.currency)}</p>
                    </div>
                    <div className="rounded-lg bg-[#F9F8F1] p-3 dark:bg-black/20">
                      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Inclusions</p>
                      <p className="mt-1 font-bold">{packageRecord.inclusionCount}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewPackage(packageRecord)}
                      className="rounded-lg border border-[#D6B53B]/30 px-4 py-2 text-sm font-bold text-[#8E7722] hover:bg-[#FDF5CC]"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(packageRecord)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1a1f18] px-4 py-2 text-sm font-bold text-[#FDF5CC] hover:bg-[#2c3328]"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void setPackageVisibility(packageRecord, !packageRecord.clientVisible)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                    >
                      {packageRecord.clientVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {packageRecord.clientVisible ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmTarget({ action: 'archive', packageRecord })}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmTarget({ action: 'delete', packageRecord })}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#141A13]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1f18] dark:text-[#F4F4F0]">
                  {modalMode === 'create' ? 'Add New Package' : 'Edit Package'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
                  Versioned fields create a new package version to protect existing bookings and contracts.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="grid grid-cols-1 gap-4 lg:grid-cols-4" onSubmit={submitPackage}>
              <label className="lg:col-span-2 flex flex-col gap-2 text-sm font-bold">
                Package name
                <input
                  required
                  value={form.packageName}
                  onChange={(event) => {
                    const packageName = event.target.value;
                    setForm((current) => ({
                      ...current,
                      packageName,
                      slug: current.slug && modalMode === 'edit' ? current.slug : slugify(packageName),
                    }));
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>
              <label className="lg:col-span-2 flex flex-col gap-2 text-sm font-bold">
                Slug
                <input
                  required
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>
              <label className="lg:col-span-4 flex flex-col gap-2 text-sm font-bold">
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>
              {[
                ['price', 'Package price'],
                ['paxIncluded', 'Pax included'],
                ['excessPaxFee', 'Excess pax fee'],
                ['reservationFee', 'Reservation fee'],
                ['downPaymentAmount', 'Down payment'],
                ['fullPaymentAmount', 'Full payment amount'],
              ].map(([key, label]) => (
                <label key={key} className="flex flex-col gap-2 text-sm font-bold">
                  {label}
                  <input
                    type="number"
                    min="0"
                    value={form[key as keyof PackageForm] as string}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                  />
                </label>
              ))}
              <label className="flex flex-col gap-2 text-sm font-bold">
                Currency
                <input
                  value={form.currency}
                  onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold">
                Check-in time
                <input
                  type="time"
                  value={form.checkInTime}
                  onChange={(event) => setForm((current) => ({ ...current, checkInTime: event.target.value }))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold">
                Check-out time
                <input
                  type="time"
                  value={form.checkOutTime}
                  onChange={(event) => setForm((current) => ({ ...current, checkOutTime: event.target.value }))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>
              <label className="lg:col-span-4 flex flex-col gap-2 text-sm font-bold">
                Package image URL
                <input
                  value={form.packageImageUrl}
                  onChange={(event) => setForm((current) => ({ ...current, packageImageUrl: event.target.value }))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>
              <label className="lg:col-span-2 flex flex-col gap-2 text-sm font-bold">
                Contract item description
                <textarea
                  rows={3}
                  value={form.contractItemDescription}
                  onChange={(event) => setForm((current) => ({ ...current, contractItemDescription: event.target.value }))}
                  className="resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>
              <label className="lg:col-span-2 flex flex-col gap-2 text-sm font-bold">
                Contract inclusion description
                <textarea
                  rows={3}
                  value={form.contractInclusionDescription}
                  onChange={(event) => setForm((current) => ({ ...current, contractInclusionDescription: event.target.value }))}
                  className="resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold">
                Status
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PackageRecord['status'] }))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#141A13]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="hidden">Hidden</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-4 rounded-lg border border-[#D6B53B]/20 bg-[#FDF5CC]/40 px-4 py-3 text-sm font-bold text-[#1a1f18]">
                Client visible
                <input
                  type="checkbox"
                  checked={form.clientVisible}
                  onChange={(event) => setForm((current) => ({ ...current, clientVisible: event.target.checked }))}
                  className="h-5 w-5 accent-[#8E7722]"
                />
              </label>
              <label className="lg:col-span-2 flex flex-col gap-2 text-sm font-bold">
                Internal notes
                <input
                  value={form.internalNotes}
                  onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>

              <div className="lg:col-span-4 rounded-2xl border border-[#D6B53B]/20 bg-[#F9F8F1] p-4 dark:bg-white/5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">Package Inclusions</h3>
                    <p className="text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
                      Add, edit, remove, reorder, and mark inclusions as free or optional add-ons.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addInclusion}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#D6B53B]/30 bg-white px-4 py-2 text-sm font-bold text-[#8E7722] hover:bg-[#FDF5CC]"
                  >
                    <Plus className="h-4 w-4" />
                    Inclusion
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {form.inclusions.map((inclusion, index) => (
                    <div key={`${inclusion.id ?? 'new'}-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border border-black/5 bg-white p-3 dark:bg-black/20 lg:grid-cols-[1fr_1fr_auto]">
                      <input
                        value={inclusion.inclusionName}
                        onChange={(event) => updateInclusion(index, { inclusionName: event.target.value })}
                        placeholder="Inclusion name"
                        className="rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                      />
                      <input
                        value={inclusion.description ?? ''}
                        onChange={(event) => updateInclusion(index, { description: event.target.value })}
                        placeholder="Description"
                        className="rounded-lg border border-gray-200 px-3 py-2 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-600">
                          <input
                            type="checkbox"
                            checked={inclusion.isFree}
                            onChange={(event) => updateInclusion(index, { isFree: event.target.checked })}
                            className="accent-[#8E7722]"
                          />
                          Free
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-600">
                          <input
                            type="checkbox"
                            checked={inclusion.isOptional}
                            onChange={(event) => updateInclusion(index, { isOptional: event.target.checked })}
                            className="accent-[#8E7722]"
                          />
                          Add-on
                        </label>
                        <button type="button" onClick={() => moveInclusion(index, -1)} className="rounded-lg border px-2 py-1 text-xs font-bold" disabled={index === 0}>
                          Up
                        </button>
                        <button type="button" onClick={() => moveInclusion(index, 1)} className="rounded-lg border px-2 py-1 text-xs font-bold" disabled={index === form.inclusions.length - 1}>
                          Down
                        </button>
                        <button type="button" onClick={() => removeInclusion(index)} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-600">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1a1f18] px-5 py-2.5 text-sm font-bold text-[#FDF5CC] hover:bg-[#2c3328] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modalMode === 'create' ? 'Create Package' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewPackage && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#141A13]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold">{previewPackage.packageName}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-[#A3B19B]">
                  Client-facing package preview
                </p>
              </div>
              <button type="button" onClick={() => setPreviewPackage(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-black/5">
              <div className="relative h-72 bg-[#2c3328]">
                {previewPackage.packageImageUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url("${previewPackage.packageImageUrl}")` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <div className="absolute bottom-5 left-5 text-white">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#FDF5CC]">
                    {previewPackage.eventCategoryName}
                  </p>
                  <h3 className="mt-1 text-4xl font-serif italic">{previewPackage.packageName}</h3>
                </div>
              </div>
              <div className="grid gap-4 bg-[#FDFCEE] p-5 text-[#1a1f18] md:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7722]">Price</p>
                  <p className="mt-1 text-xl font-bold">{money(previewPackage.price, previewPackage.currency)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7722]">Pax included</p>
                  <p className="mt-1 text-xl font-bold">{previewPackage.paxIncluded}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7722]">Reservation</p>
                  <p className="mt-1 text-xl font-bold">{money(previewPackage.reservationFee, previewPackage.currency)}</p>
                </div>
              </div>
              <div className="space-y-5 p-5">
                <p className="text-sm leading-7 text-gray-600 dark:text-[#A3B19B]">
                  {previewPackage.description || 'No description yet.'}
                </p>
                <div>
                  <h4 className="font-bold uppercase tracking-[0.16em] text-[#8E7722]">Inclusions</h4>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {previewPackage.inclusions.map((inclusion) => (
                      <li key={inclusion.id ?? inclusion.inclusionName} className="rounded-lg border border-[#D6B53B]/20 bg-[#FDF5CC]/35 px-4 py-3 text-sm font-semibold">
                        {inclusion.inclusionName}
                        {inclusion.isOptional && <span className="ml-2 text-xs text-[#8E7722]">(Add-on)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#141A13]">
            <h2 className="text-2xl font-bold">
              {confirmTarget.action === 'archive' ? 'Archive Package' : 'Remove Package'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-[#A3B19B]">
              {confirmTarget.action === 'archive'
                ? `Archive ${confirmTarget.packageRecord.packageName}? It will be removed from the Client Panel but booking history remains intact.`
                : `Remove ${confirmTarget.packageRecord.packageName}? This only succeeds when the package has no booking history; otherwise archive it.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void runConfirmedAction()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirmTarget.action === 'archive' ? 'Archive' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
