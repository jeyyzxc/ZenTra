'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  X,
} from 'lucide-react';

type EventCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  displayOrder: number;
  status: 'active' | 'hidden' | 'archived';
  clientVisible: boolean;
  packageCount: number;
  activePackageCount: number;
  updatedAt: string;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  displayOrder: string;
  status: EventCategory['status'];
  clientVisible: boolean;
};

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  description: '',
  coverImageUrl: '',
  displayOrder: '0',
  status: 'active',
  clientVisible: true,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function statusBadge(status: EventCategory['status']) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'hidden') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-zinc-200 text-zinc-700 border-zinc-300';
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ServicesAndPackages() {
  const router = useRouter();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [archiveTarget, setArchiveTarget] = useState<EventCategory | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/event-categories', { cache: 'no-store' });
      const payload = await response.json() as { data?: EventCategory[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load event categories.');
      }

      setCategories(payload.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load event categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCategories();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadCategories]);

  const totals = useMemo(() => ({
    categories: categories.length,
    visible: categories.filter((category) => category.status === 'active' && category.clientVisible).length,
    packages: categories.reduce((sum, category) => sum + category.packageCount, 0),
    activePackages: categories.reduce((sum, category) => sum + category.activePackageCount, 0),
  }), [categories]);

  const openCreate = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setModalMode('create');
  };

  const openEdit = (category: EventCategory) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      coverImageUrl: category.coverImageUrl ?? '',
      displayOrder: String(category.displayOrder),
      status: category.status,
      clientVisible: category.clientVisible,
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingCategory(null);
    setForm(emptyForm);
    setSaving(false);
  };

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const endpoint = editingCategory
        ? `/api/admin/event-categories/${encodeURIComponent(editingCategory.id)}`
        : '/api/admin/event-categories';
      const response = await fetch(endpoint, {
        method: editingCategory ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || slugify(form.name),
          description: form.description,
          coverImageUrl: form.coverImageUrl,
          displayOrder: Number(form.displayOrder || 0),
          status: form.status,
          clientVisible: form.clientVisible,
        }),
      });
      const payload = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save event category.');
      }

      closeModal();
      await loadCategories();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save event category.');
      setSaving(false);
    }
  };

  const setVisibility = async (category: EventCategory, clientVisible: boolean) => {
    setError('');

    try {
      const response = await fetch(`/api/admin/event-categories/${encodeURIComponent(category.id)}/visibility`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clientVisible }),
      });
      const payload = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update visibility.');
      }

      await loadCategories();
    } catch (visibilityError) {
      setError(visibilityError instanceof Error ? visibilityError.message : 'Unable to update visibility.');
    }
  };

  const archiveCategory = async () => {
    if (!archiveTarget) return;
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/event-categories/${encodeURIComponent(archiveTarget.id)}/archive`, {
        method: 'PATCH',
      });
      const payload = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to archive event category.');
      }

      setArchiveTarget(null);
      setSaving(false);
      await loadCategories();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive event category.');
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 font-serif text-[#1a1f18] dark:text-[#F4F4F0]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em] text-[#1a1f18] dark:text-[#F4F4F0]">
            Services & Packages
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Manage event categories first, then open a category to create and edit its packages.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D6B53B]/30 bg-[#FDF5CC] px-6 py-2.5 text-sm font-bold text-[#1a1f18] shadow-sm transition-colors hover:bg-[#EADE81]"
        >
          <Plus className="h-5 w-5" />
          Add Event Category
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-[#D6B53B]/20 bg-white/80 p-4 shadow-sm dark:bg-white/5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8E7722]">Categories</p>
          <p className="mt-2 text-3xl font-bold">{totals.categories}</p>
        </div>
        <div className="rounded-xl border border-[#D6B53B]/20 bg-white/80 p-4 shadow-sm dark:bg-white/5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8E7722]">Client Visible</p>
          <p className="mt-2 text-3xl font-bold">{totals.visible}</p>
        </div>
        <div className="rounded-xl border border-[#D6B53B]/20 bg-white/80 p-4 shadow-sm dark:bg-white/5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8E7722]">Packages</p>
          <p className="mt-2 text-3xl font-bold">{totals.packages}</p>
        </div>
        <div className="rounded-xl border border-[#D6B53B]/20 bg-white/80 p-4 shadow-sm dark:bg-white/5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8E7722]">Active Offers</p>
          <p className="mt-2 text-3xl font-bold">{totals.activePackages}</p>
        </div>
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
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.id}
              onClick={() => router.push(`/admin/services/${category.slug}`)}
              className="group relative h-[320px] cursor-pointer overflow-hidden rounded-2xl border border-black/5 bg-[#2c3328] shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10"
            >
              {category.coverImageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url("${category.coverImageUrl}")` }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#D6B53B]/20 text-white">
                  <ImageIcon className="h-16 w-16 opacity-70" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusBadge(category.status)}`}>
                  {category.status}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${category.clientVisible ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-zinc-200 bg-zinc-100 text-zinc-700'}`}>
                  {category.clientVisible ? 'Client visible' : 'Client hidden'}
                </span>
              </div>

              <div className="absolute right-4 top-4 flex gap-2 opacity-100 transition-all lg:opacity-0 lg:group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void setVisibility(category, !category.clientVisible);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/40"
                  title={category.clientVisible ? 'Hide from Client Panel' : 'Show on Client Panel'}
                >
                  {category.clientVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEdit(category);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/40"
                  title="Edit event category"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setArchiveTarget(category);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-red-500/70"
                  title="Archive event category"
                >
                  <Archive className="h-5 w-5" />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 flex w-full flex-col gap-4 p-6">
                <div>
                  <h2 className="text-3xl font-serif italic tracking-wide text-white drop-shadow-md">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-6 text-white/80">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/85">
                  <span>{category.activePackageCount} active offers</span>
                  <span className="h-1 w-1 rounded-full bg-white/60" />
                  <span>{category.packageCount} total packages</span>
                  <span className="h-1 w-1 rounded-full bg-white/60" />
                  <span>Updated {formatDate(category.updatedAt)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#141A13]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1f18] dark:text-[#F4F4F0]">
                  {modalMode === 'create' ? 'Add Event Category' : 'Edit Event Category'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
                  Active and client-visible categories appear on the Client Panel.
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

            <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submitCategory}>
              <label className="flex flex-col gap-2 text-sm font-bold text-[#1a1f18] dark:text-[#F4F4F0]">
                Event category name
                <input
                  required
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((current) => ({
                      ...current,
                      name,
                      slug: current.slug && modalMode === 'edit' ? current.slug : slugify(name),
                    }));
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-bold text-[#1a1f18] dark:text-[#F4F4F0]">
                Slug
                <input
                  required
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>

              <label className="md:col-span-2 flex flex-col gap-2 text-sm font-bold text-[#1a1f18] dark:text-[#F4F4F0]">
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>

              <label className="md:col-span-2 flex flex-col gap-2 text-sm font-bold text-[#1a1f18] dark:text-[#F4F4F0]">
                Cover image URL
                <input
                  value={form.coverImageUrl}
                  onChange={(event) => setForm((current) => ({ ...current, coverImageUrl: event.target.value }))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-bold text-[#1a1f18] dark:text-[#F4F4F0]">
                Display order
                <input
                  type="number"
                  min="0"
                  value={form.displayOrder}
                  onChange={(event) => setForm((current) => ({ ...current, displayOrder: event.target.value }))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-bold text-[#1a1f18] dark:text-[#F4F4F0]">
                Status
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as EventCategory['status'] }))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#141A13]"
                >
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="md:col-span-2 flex items-center justify-between gap-4 rounded-lg border border-[#D6B53B]/20 bg-[#FDF5CC]/40 px-4 py-3 text-sm font-bold text-[#1a1f18]">
                Show on Client Panel
                <input
                  type="checkbox"
                  checked={form.clientVisible}
                  onChange={(event) => setForm((current) => ({ ...current, clientVisible: event.target.checked }))}
                  className="h-5 w-5 accent-[#8E7722]"
                />
              </label>

              <div className="md:col-span-2 mt-2 flex justify-end gap-3">
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
                  {modalMode === 'create' ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#141A13]">
            <h2 className="text-2xl font-bold text-[#1a1f18] dark:text-[#F4F4F0]">Archive Category</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-[#A3B19B]">
              Archive {archiveTarget.name}? This removes it from the Client Panel and prevents new bookings, while keeping history intact.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void archiveCategory()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
