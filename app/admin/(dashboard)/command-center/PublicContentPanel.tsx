'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Check,
  Clock3,
  CopyPlus,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import StructuredContentRenderer from '@/components/public-content/StructuredContentRenderer';

type ContentType = 'GALLERY_ITEM' | 'FACILITY' | 'RULES' | 'PRIVACY' | 'TERMS';
type Version = {
  id: string;
  versionNumber: number;
  status: string;
  payload: Record<string, unknown>;
  changeSummary: string | null;
  publishAt: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};
type ContentItem = {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  displayOrder: number;
  currentPublishedVersion: Version | null;
  currentDraftVersion: Version | null;
  scheduledVersion: Version | null;
  versions: Version[];
};

const DOMAINS: Array<{ type: ContentType; label: string; description: string }> = [
  { type: 'GALLERY_ITEM', label: 'Gallery', description: 'Curated visual stories and featured images.' },
  { type: 'FACILITY', label: 'Facilities', description: 'Venue spaces, amenities, access, and calls to action.' },
  { type: 'RULES', label: 'Rules & Regulations', description: 'Public venue and event rules.' },
  { type: 'PRIVACY', label: 'Privacy Policy', description: 'Legally reviewed privacy information.' },
  { type: 'TERMS', label: 'Terms & Conditions', description: 'Legally reviewed public terms.' },
];

const defaultPayload = (type: ContentType): Record<string, unknown> => {
  if (type === 'GALLERY_ITEM') {
    return { title: '', caption: '', altText: '', imageUrl: '', featured: false, displayOrder: 0 };
  }
  if (type === 'FACILITY') {
    return {
      name: '', slug: '', summary: '', description: '', amenities: [], accessibilityGuidance: '',
      imageUrls: [], cta: null, displayOrder: 0, visible: true,
    };
  }
  return {
    title: '', summary: '', effectiveDate: '',
    blocks: [{ type: 'heading', level: 2, text: 'Overview' }, { type: 'paragraph', text: '' }],
  };
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: init?.body ? { 'content-type': 'application/json', ...init.headers } : init?.headers,
  });
  const payload = await response.json() as { success?: boolean; data?: T; error?: string };
  if (!response.ok || payload.success === false || payload.data === undefined) {
    throw new Error(payload.error || 'Public content request failed.');
  }
  return payload.data;
}

function manilaInputToUtc(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}:00+08:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error('Schedule date is invalid.');
  return parsed.toISOString();
}

function lineList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').join('\n') : '';
}

function PayloadEditor({
  type,
  value,
  onChange,
  disabled,
}: {
  type: ContentType;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  disabled: boolean;
}) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:bg-gray-50 dark:border-white/10 dark:bg-white/5';

  if (type === 'GALLERY_ITEM') {
    return <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-bold">Title<input disabled={disabled} className={inputClass} value={String(value.title ?? '')} onChange={(e) => set('title', e.target.value)} /></label>
      <label className="text-xs font-bold">Alt text<input disabled={disabled} className={inputClass} value={String(value.altText ?? '')} onChange={(e) => set('altText', e.target.value)} /></label>
      <label className="text-xs font-bold sm:col-span-2">Caption<textarea disabled={disabled} rows={3} className={inputClass} value={String(value.caption ?? '')} onChange={(e) => set('caption', e.target.value)} /></label>
      <label className="text-xs font-bold sm:col-span-2">Image URL<input disabled={disabled} className={inputClass} placeholder="Approved public URL or promoted media URL" value={String(value.imageUrl ?? '')} onChange={(e) => set('imageUrl', e.target.value)} /></label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input disabled={disabled} type="checkbox" checked={Boolean(value.featured)} onChange={(e) => set('featured', e.target.checked)} /> Featured</label>
      <label className="text-xs font-bold">Display order<input disabled={disabled} type="number" className={inputClass} value={Number(value.displayOrder ?? 0)} onChange={(e) => set('displayOrder', Number(e.target.value))} /></label>
    </div>;
  }

  if (type === 'FACILITY') {
    const cta = value.cta && typeof value.cta === 'object' ? value.cta as Record<string, unknown> : {};
    return <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-bold">Name<input disabled={disabled} className={inputClass} value={String(value.name ?? '')} onChange={(e) => set('name', e.target.value)} /></label>
      <label className="text-xs font-bold">Slug<input disabled={disabled} className={inputClass} value={String(value.slug ?? '')} onChange={(e) => set('slug', e.target.value)} /></label>
      <label className="text-xs font-bold sm:col-span-2">Summary<textarea disabled={disabled} rows={2} className={inputClass} value={String(value.summary ?? '')} onChange={(e) => set('summary', e.target.value)} /></label>
      <label className="text-xs font-bold sm:col-span-2">Description<textarea disabled={disabled} rows={5} className={inputClass} value={String(value.description ?? '')} onChange={(e) => set('description', e.target.value)} /></label>
      <label className="text-xs font-bold">Amenities — one per line<textarea disabled={disabled} rows={5} className={inputClass} value={lineList(value.amenities)} onChange={(e) => set('amenities', e.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} /></label>
      <label className="text-xs font-bold">Image URLs — one per line<textarea disabled={disabled} rows={5} className={inputClass} value={lineList(value.imageUrls)} onChange={(e) => set('imageUrls', e.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} /></label>
      <label className="text-xs font-bold sm:col-span-2">Accessibility guidance<textarea disabled={disabled} rows={3} className={inputClass} value={String(value.accessibilityGuidance ?? '')} onChange={(e) => set('accessibilityGuidance', e.target.value)} /></label>
      <label className="text-xs font-bold">CTA label<input disabled={disabled} className={inputClass} value={String(cta.label ?? '')} onChange={(e) => set('cta', { ...cta, label: e.target.value })} /></label>
      <label className="text-xs font-bold">CTA link<input disabled={disabled} className={inputClass} value={String(cta.href ?? '')} onChange={(e) => set('cta', { ...cta, href: e.target.value })} /></label>
    </div>;
  }

  const blocks = Array.isArray(value.blocks) ? value.blocks as Array<Record<string, unknown>> : [];
  const updateBlock = (index: number, next: Record<string, unknown>) => set('blocks', blocks.map((block, blockIndex) => blockIndex === index ? next : block));
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-bold">Document title<input disabled={disabled} className={inputClass} value={String(value.title ?? '')} onChange={(e) => set('title', e.target.value)} /></label>
      <label className="text-xs font-bold">Effective date<input disabled={disabled} className={inputClass} value={String(value.effectiveDate ?? '')} onChange={(e) => set('effectiveDate', e.target.value)} placeholder="August 1, 2026" /></label>
      <label className="text-xs font-bold sm:col-span-2">Summary<textarea disabled={disabled} rows={2} className={inputClass} value={String(value.summary ?? '')} onChange={(e) => set('summary', e.target.value)} /></label>
    </div>
    {blocks.map((block, index) => <div key={index} className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
      <div className="flex items-center gap-2">
        <select disabled={disabled} className={inputClass} value={String(block.type ?? 'paragraph')} onChange={(e) => updateBlock(index, { type: e.target.value, ...(e.target.value === 'heading' ? { level: 2 } : {}) })}>
          <option value="heading">Heading</option><option value="paragraph">Paragraph</option><option value="list">List</option><option value="callout">Callout</option><option value="link">Safe link</option>
        </select>
        {!disabled && <button type="button" aria-label="Remove block" className="rounded-lg border border-red-200 p-2 text-red-700" onClick={() => set('blocks', blocks.filter((_, blockIndex) => blockIndex !== index))}><Trash2 className="h-4 w-4" /></button>}
      </div>
      {block.type === 'list' ? <textarea disabled={disabled} rows={4} className={`${inputClass} mt-2`} value={lineList(block.items)} onChange={(e) => updateBlock(index, { ...block, items: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} placeholder="One item per line" /> : block.type === 'link' ? <div className="mt-2 grid gap-2 sm:grid-cols-2"><input disabled={disabled} className={inputClass} value={String(block.label ?? '')} onChange={(e) => updateBlock(index, { ...block, label: e.target.value })} placeholder="Link label" /><input disabled={disabled} className={inputClass} value={String(block.href ?? '')} onChange={(e) => updateBlock(index, { ...block, href: e.target.value })} placeholder="https://… or /page" /></div> : <textarea disabled={disabled} rows={block.type === 'paragraph' ? 5 : 2} className={`${inputClass} mt-2`} value={String(block.text ?? '')} onChange={(e) => updateBlock(index, { ...block, text: e.target.value })} />}
    </div>)}
    {!disabled && <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#D6B53B] px-4 py-2 text-sm font-bold text-[#8E7722]" onClick={() => set('blocks', [...blocks, { type: 'paragraph', text: '' }])}><Plus className="h-4 w-4" /> Add structured block</button>}
  </div>;
}

export default function PublicContentPanel({ currentUserRole }: { currentUserRole: 'SUPERADMIN' | 'ADMIN' }) {
  const canManage = currentUserRole === 'SUPERADMIN';
  const [type, setType] = useState<ContentType>('GALLERY_ITEM');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [payload, setPayload] = useState<Record<string, unknown>>(defaultPayload(type));
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [publishAt, setPublishAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0] ?? null, [items, selectedId]);
  const editable = selected?.currentDraftVersion ?? selected?.scheduledVersion ?? null;
  const preview = editable ?? selected?.currentPublishedVersion ?? null;

  const load = useCallback(async (nextType: ContentType, preferredId?: string) => {
    const data = await request<ContentItem[]>(`/api/admin/command-center/content?type=${nextType}`);
    setItems(data);
    setSelectedId((current) => preferredId && data.some((item) => item.id === preferredId) ? preferredId : data.some((item) => item.id === current) ? current : data[0]?.id ?? '');
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- loading and editor state intentionally follow the selected content version. */
  useEffect(() => {
    void load(type).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load content.')).finally(() => setLoading(false));
  }, [load, type]);

  useEffect(() => {
    const version = selected?.currentDraftVersion ?? selected?.scheduledVersion ?? selected?.currentPublishedVersion;
    setPayload(version?.payload ?? defaultPayload(type));
    setTitle(selected?.title ?? '');
    setSlug(selected?.slug ?? '');
    setChangeSummary(version?.changeSummary ?? '');
  }, [selected, type]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const run = async (operation: () => Promise<unknown>, message: string) => {
    try {
      setWorking(true); setError(''); setNotice('');
      await operation();
      await load(type, selected?.id);
      setNotice(message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Content action failed.');
    } finally { setWorking(false); }
  };

  const create = async (event: FormEvent) => {
    event.preventDefault();
    await run(async () => {
      const created = await request<ContentItem>('/api/admin/command-center/content', {
        method: 'POST',
        body: JSON.stringify({ type, title, slug, payload, changeSummary }),
      });
      setSelectedId(created.id);
      await load(type, created.id);
    }, 'Draft created.');
  };

  const lifecycle = (action: string, body: Record<string, unknown>) => run(
    () => request(`/api/admin/command-center/content/${selected!.id}/${action}`, { method: 'POST', body: JSON.stringify(body) }),
    `Content ${action} action completed.`,
  );

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#8E7722]" /></div>;

  return <div className="space-y-5">
    <div className="flex gap-2 overflow-x-auto pb-1">{DOMAINS.map((domain) => <button key={domain.type} onClick={() => { setType(domain.type); setSelectedId(''); setLoading(true); }} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${type === domain.type ? 'bg-[#1a1f18] text-[#FDF5CC]' : 'border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5'}`}>{domain.label}</button>)}</div>
    <p className="text-sm text-gray-500 dark:text-[#A3B19B]">{DOMAINS.find((domain) => domain.type === type)?.description} Draft previews use the same renderer as public pages.</p>
    {!canManage && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">Published preview only. Super Admin approval is required for every mutation.</div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}
    <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-3 rounded-2xl border border-[#D6B53B]/20 bg-white/80 p-4 dark:bg-white/5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8E7722]">Content items</p>
        {items.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl border p-3 text-left ${selected?.id === item.id ? 'border-[#D6B53B] bg-[#FDF5CC]/50' : 'border-gray-200 dark:border-white/10'}`}><span className="block truncate font-bold">{item.title}</span><span className="mt-1 block text-[11px] text-gray-500">{item.currentDraftVersion?.status ?? item.scheduledVersion?.status ?? item.currentPublishedVersion?.status ?? 'UNPUBLISHED'} · {item.slug}</span></button>)}
        {canManage && <button onClick={() => { setSelectedId(''); setTitle(''); setSlug(''); setPayload(defaultPayload(type)); }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D6B53B] px-3 py-2 text-sm font-bold text-[#8E7722]"><Plus className="h-4 w-4" /> New item</button>}
      </aside>
      <div className="min-w-0 space-y-5">
        {!selected ? canManage ? <form onSubmit={create} className="space-y-4 rounded-2xl border border-[#D6B53B]/20 bg-white/90 p-5 dark:bg-white/5">
          <h2 className="font-sahitya text-2xl font-bold">Create {DOMAINS.find((domain) => domain.type === type)?.label} draft</h2>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Internal title<input required className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-white/5" value={title} onChange={(e) => setTitle(e.target.value)} /></label><label className="text-xs font-bold">Slug<input required className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-white/5" value={slug} onChange={(e) => setSlug(e.target.value)} /></label></div>
          <PayloadEditor type={type} value={payload} onChange={setPayload} disabled={false} />
          <label className="block text-xs font-bold">Change summary<input className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-white/5" value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} /></label>
          <button disabled={working} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-5 py-3 font-bold text-[#FDF5CC]"><Plus className="h-4 w-4" /> Create draft</button>
        </form> : <div className="rounded-2xl border border-dashed p-12 text-center text-gray-500">No published item is available.</div> : <>
          <section className="space-y-4 rounded-2xl border border-[#D6B53B]/20 bg-white/90 p-5 dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-sahitya text-2xl font-bold">{selected.title}</h2><p className="text-xs text-gray-500">{preview ? `Version ${preview.versionNumber} · ${preview.status}` : 'No version'}</p></div><div className="flex flex-wrap gap-2">
              {canManage && !editable && selected.currentPublishedVersion && <button onClick={() => void run(() => request(`/api/admin/command-center/content/${selected.id}/versions`, { method: 'POST', body: JSON.stringify({ changeSummary: 'New draft from the published version.' }) }), 'New draft version created.')} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold"><CopyPlus className="h-4 w-4" /> New draft</button>}
              {canManage && editable?.status === 'DRAFT' && <><button onClick={() => void run(() => request(`/api/admin/command-center/content/${selected.id}/versions/${editable.id}`, { method: 'PATCH', body: JSON.stringify({ title, payload, changeSummary }) }), 'Draft saved.')} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold"><Save className="h-4 w-4" /> Save</button><button onClick={() => void lifecycle('approve', { versionId: editable.id, action: 'submit', changeSummary })} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-sm font-bold text-white"><Send className="h-4 w-4" /> Submit review</button></>}
              {canManage && editable?.status === 'IN_REVIEW' && <button onClick={() => void lifecycle('approve', { versionId: editable.id })} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white"><Check className="h-4 w-4" /> Approve</button>}
              {canManage && editable?.status === 'APPROVED' && <button onClick={() => void lifecycle('publish', { versionId: editable.id, expiresAt: manilaInputToUtc(expiresAt) })} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-3 py-2 text-sm font-bold text-[#FDF5CC]"><Eye className="h-4 w-4" /> Publish now</button>}
              {canManage && <button onClick={() => void lifecycle('archive', {})} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-700"><Archive className="h-4 w-4" /> Archive</button>}
            </div></div>
            <PayloadEditor type={type} value={payload} onChange={setPayload} disabled={!canManage || !editable || !['DRAFT', 'REJECTED'].includes(editable.status)} />
            {canManage && editable?.status === 'APPROVED' && <div className="grid gap-3 rounded-xl border border-[#D6B53B]/25 bg-[#FDF5CC]/25 p-4 sm:grid-cols-2"><label className="text-xs font-bold">Publish in Asia/Manila<input type="datetime-local" className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-[#141A13]" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} /></label><label className="text-xs font-bold">Optional expiry in Asia/Manila<input type="datetime-local" className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-[#141A13]" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></label><button disabled={!publishAt} onClick={() => void lifecycle('schedule', { versionId: editable.id, publishAt: manilaInputToUtc(publishAt), expiresAt: manilaInputToUtc(expiresAt), changeSummary })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6B53B] px-4 py-2 font-bold text-[#8E7722] sm:col-span-2 disabled:opacity-40"><Clock3 className="h-4 w-4" /> Schedule publication</button></div>}
          </section>
          {preview && <section className="rounded-2xl border border-[#D6B53B]/20 bg-[linear-gradient(135deg,rgba(253,245,204,.35),transparent)] p-5"><div className="mb-5 flex items-center justify-between"><h3 className="font-bold">Exact public renderer preview</h3><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8E7722]">{preview.status}</span></div><StructuredContentRenderer type={type} payload={payload} /></section>}
          <section className="rounded-2xl border border-gray-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5"><h3 className="font-bold">Version history</h3><div className="mt-3 space-y-2">{selected.versions.map((version) => <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-white/10"><div><b>Version {version.versionNumber}</b><span className="ml-2 text-xs text-gray-500">{version.status} · {new Date(version.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</span></div>{canManage && !['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED'].includes(version.status) && <button onClick={() => void lifecycle('rollback', { versionId: version.id })} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold"><RotateCcw className="h-3.5 w-3.5" /> Copy as rollback draft</button>}</div>)}</div></section>
        </>}
      </div>
    </div>
    {working && <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#1a1f18] px-4 py-2 text-sm font-bold text-white shadow-xl"><Loader2 className="h-4 w-4 animate-spin" /> Working</div>}
  </div>;
}
