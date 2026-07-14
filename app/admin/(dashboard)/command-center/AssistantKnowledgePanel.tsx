'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CircleAlert,
  CopyPlus,
  FileText,
  HeartPulse,
  Loader2,
  Plus,
  Save,
  Send,
  Upload,
} from 'lucide-react';

type KnowledgeVersion = {
  id: string;
  versionNumber: number;
  status: string;
  extractedText: string | null;
  sourceObjectPath: string | null;
  sourceChecksum: string | null;
  changeSummary: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};
type KnowledgeDocument = {
  id: string;
  title: string;
  slug: string;
  type: 'TEXT' | 'PDF' | 'DOCX';
  accessLevel: 'PUBLIC' | 'CLIENT' | 'ADMIN' | 'SUPERADMIN';
  versions: KnowledgeVersion[];
};
type ProviderHealth = {
  available: boolean;
  provider: string;
  checkedAt: string;
  models: string[];
  safeError?: string;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: init?.body && !(init.body instanceof FormData)
      ? { 'content-type': 'application/json', ...init.headers }
      : init?.headers,
  });
  const payload = await response.json() as { success?: boolean; data?: T; error?: string };
  if (!response.ok || payload.success === false || payload.data === undefined) throw new Error(payload.error || 'Knowledge request failed.');
  return payload.data;
}

const EDITABLE = new Set(['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED']);

export default function AssistantKnowledgePanel({ currentUserRole }: { currentUserRole: 'SUPERADMIN' | 'ADMIN' }) {
  const canManage = currentUserRole === 'SUPERADMIN';
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [health, setHealth] = useState<ProviderHealth | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [text, setText] = useState('');
  const [accessLevel, setAccessLevel] = useState<KnowledgeDocument['accessLevel']>('PUBLIC');
  const [changeSummary, setChangeSummary] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selected = useMemo(() => documents.find((document) => document.id === selectedId) ?? documents[0] ?? null, [documents, selectedId]);
  const editable = selected?.versions.find((version) => EDITABLE.has(version.status)) ?? null;
  const published = selected?.versions.find((version) => version.status === 'PUBLISHED') ?? null;

  const load = useCallback(async (preferredId?: string) => {
    const data = await api<KnowledgeDocument[]>('/api/admin/command-center/assistant/knowledge');
    setDocuments(data);
    setSelectedId((current) => preferredId && data.some((item) => item.id === preferredId) ? preferredId : data.some((item) => item.id === current) ? current : data[0]?.id ?? '');
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- editor state is intentionally reset when the selected immutable version changes. */
  useEffect(() => {
    void Promise.all([
      load(),
      api<ProviderHealth>('/api/admin/command-center/assistant/health').then(setHealth),
    ]).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load knowledge.')).finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const version = editable ?? published;
    setTitle(selected?.title ?? '');
    setSlug(selected?.slug ?? '');
    setAccessLevel(selected?.accessLevel ?? 'PUBLIC');
    setText(version?.extractedText ?? '');
    setChangeSummary(version?.changeSummary ?? '');
  }, [editable, published, selected]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const run = async (operation: () => Promise<unknown>, message: string, preferredId?: string) => {
    try {
      setWorking(true); setError(''); setNotice('');
      await operation(); await load(preferredId ?? selected?.id); setNotice(message);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Knowledge action failed.'); }
    finally { setWorking(false); }
  };

  const createManual = async (event: FormEvent) => {
    event.preventDefault();
    await run(async () => {
      const created = await api<KnowledgeDocument>('/api/admin/command-center/assistant/knowledge', {
        method: 'POST', body: JSON.stringify({ title, slug, type: 'TEXT', accessLevel, text, changeSummary }),
      });
      setSelectedId(created.id);
    }, 'Manual knowledge draft created.');
  };

  const upload = async () => {
    if (!file) return;
    await run(async () => {
      const metadata = {
        fileName: file.name,
        mimeType: file.type,
        byteSize: file.size,
      };
      const prepared = await api<{ uploadUrl: string; objectPath: string }>(
        '/api/admin/command-center/assistant/knowledge/upload',
        { method: 'POST', body: JSON.stringify({ action: 'prepare', ...metadata }) },
      );
      const uploadBody = new FormData();
      uploadBody.append('cacheControl', '3600');
      uploadBody.append('', file);
      const uploaded = await fetch(prepared.uploadUrl, {
        method: 'PUT',
        headers: { 'x-upsert': 'false' },
        body: uploadBody,
      });
      if (!uploaded.ok) throw new Error('Unable to upload the document to private storage.');
      return api('/api/admin/command-center/assistant/knowledge/upload', {
        method: 'POST',
        body: JSON.stringify({
          action: 'finalize',
          ...metadata,
          objectPath: prepared.objectPath,
          title: title || file.name.replace(/\.[^.]+$/, ''),
          slug,
          accessLevel,
          changeSummary,
        }),
      });
    }, 'Document extracted into a reviewable private draft.');
    setFile(null);
  };

  const review = (action: 'submit' | 'approve' | 'reject') => run(
    () => api(`/api/admin/command-center/assistant/knowledge/${selected!.id}/approve`, {
      method: 'POST', body: JSON.stringify({ versionId: editable!.id, action }),
    }),
    `Knowledge ${action} action completed.`,
  );

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#8E7722]" /></div>;

  return <div className="space-y-5">
    <div className="grid gap-4 lg:grid-cols-[1fr_auto]"><div><h2 className="font-sahitya text-3xl font-bold">Assistant Knowledge Sources</h2><p className="mt-1 max-w-4xl text-sm leading-6 text-gray-500">Verified manual answers and extracted PDF/DOCX documents. Publication rebuilds a complete index generation and keeps the last valid generation active until cutover.</p></div><div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${health?.available ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><HeartPulse className="h-5 w-5" />{health?.available ? `Gemini healthy · ${health.models.length} models` : health?.safeError || 'Provider unavailable — deterministic fallback active'}</div></div>
    {!canManage && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-900">Published sources only. Ordinary Admins can test the assistant and submit feedback but cannot view private drafts or source files.</div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
    {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{notice}</div>}
    <div className="grid gap-5 xl:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-[#D6B53B]/20 bg-white/80 p-4 dark:bg-white/5"><p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#8E7722]">Canonical sources</p><div className="space-y-2">{documents.map((document) => <button key={document.id} onClick={() => setSelectedId(document.id)} className={`w-full rounded-xl border p-3 text-left ${selected?.id === document.id ? 'border-[#D6B53B] bg-[#FDF5CC]/50' : 'border-gray-200 dark:border-white/10'}`}><span className="flex items-center gap-2 font-bold"><FileText className="h-4 w-4" />{document.title}</span><span className="mt-1 block text-[11px] text-gray-500">{document.type} · {editable?.status ?? published?.status ?? 'UNPUBLISHED'} · {document.accessLevel}</span></button>)}</div>{canManage && <button onClick={() => { setSelectedId(''); setTitle(''); setSlug(''); setText(''); setChangeSummary(''); }} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D6B53B] px-3 py-2 text-sm font-bold text-[#8E7722]"><Plus className="h-4 w-4" /> New source</button>}</aside>
      <div className="min-w-0 space-y-5">
        {!selected ? canManage && <div className="grid gap-5 lg:grid-cols-2"><form onSubmit={createManual} className="space-y-3 rounded-2xl border border-[#D6B53B]/20 bg-white p-5 dark:bg-white/5"><h3 className="font-sahitya text-2xl font-bold">Manual canonical answer</h3><input required placeholder="Source title" className="w-full rounded-xl border px-3 py-2 dark:bg-white/5" value={title} onChange={(e) => setTitle(e.target.value)} /><input placeholder="source-slug" className="w-full rounded-xl border px-3 py-2 dark:bg-white/5" value={slug} onChange={(e) => setSlug(e.target.value)} /><select className="w-full rounded-xl border px-3 py-2 dark:bg-[#141A13]" value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as KnowledgeDocument['accessLevel'])}><option value="PUBLIC">Public</option><option value="CLIENT">Verified clients</option><option value="ADMIN">Admins</option><option value="SUPERADMIN">Super Admin only</option></select><textarea required rows={12} placeholder="Verified business information…" className="w-full rounded-xl border px-3 py-2 dark:bg-white/5" value={text} onChange={(e) => setText(e.target.value)} /><input placeholder="Change summary" className="w-full rounded-xl border px-3 py-2 dark:bg-white/5" value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} /><button className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2 font-bold text-[#FDF5CC]"><Plus className="h-4 w-4" /> Create draft</button></form><section className="space-y-3 rounded-2xl border border-[#D6B53B]/20 bg-white p-5 dark:bg-white/5"><h3 className="font-sahitya text-2xl font-bold">Extract PDF or DOCX</h3><p className="text-sm leading-6 text-gray-500">Files remain private. Text is sanitized and shown for review before it can be approved or indexed.</p><input placeholder="Source title" className="w-full rounded-xl border px-3 py-2 dark:bg-white/5" value={title} onChange={(e) => setTitle(e.target.value)} /><input placeholder="source-slug" className="w-full rounded-xl border px-3 py-2 dark:bg-white/5" value={slug} onChange={(e) => setSlug(e.target.value)} /><input type="file" accept="application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full rounded-xl border border-dashed p-4" /><button disabled={!file || working} onClick={() => void upload()} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2 font-bold text-[#FDF5CC] disabled:opacity-40"><Upload className="h-4 w-4" /> Upload and extract</button></section></div> : selected && <>
          <section className="space-y-4 rounded-2xl border border-[#D6B53B]/20 bg-white p-5 dark:bg-white/5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-sahitya text-2xl font-bold">{selected.title}</h3><p className="text-xs text-gray-500">{selected.type} · {selected.accessLevel} · {editable ? `Draft v${editable.versionNumber} ${editable.status}` : published ? `Published v${published.versionNumber}` : 'Unpublished'}</p></div>{canManage && <div className="flex flex-wrap gap-2">{!editable && published && <button onClick={() => void run(() => api(`/api/admin/command-center/assistant/knowledge/${selected.id}/versions`, { method: 'POST' }), 'New knowledge draft created.')} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold"><CopyPlus className="h-4 w-4" /> New draft</button>}{editable?.status === 'DRAFT' && <><button onClick={() => void run(() => api(`/api/admin/command-center/assistant/knowledge/${selected.id}/versions/${editable.id}`, { method: 'PATCH', body: JSON.stringify({ title, accessLevel, text, changeSummary }) }), 'Knowledge draft saved.')} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold"><Save className="h-4 w-4" /> Save</button><button onClick={() => void review('submit')} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-sm font-bold text-white"><Send className="h-4 w-4" /> Submit</button></>}{editable?.status === 'IN_REVIEW' && <button onClick={() => void review('approve')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white"><Check className="h-4 w-4" /> Approve</button>}{editable?.status === 'APPROVED' && <button onClick={() => void run(() => api(`/api/admin/command-center/assistant/knowledge/${selected.id}/publish`, { method: 'POST', body: JSON.stringify({ versionId: editable.id }) }), 'Knowledge published; a complete index generation is queued.')} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-3 py-2 text-sm font-bold text-[#FDF5CC]"><Check className="h-4 w-4" /> Publish & index</button>}</div>}</div><textarea disabled={!canManage || !editable || !['DRAFT', 'REJECTED'].includes(editable.status)} rows={18} className="w-full rounded-xl border px-4 py-3 font-mono text-sm leading-6 disabled:bg-gray-50 dark:bg-white/5" value={text} onChange={(e) => setText(e.target.value)} /><label className="block text-xs font-bold">Change summary<input disabled={!canManage} className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-white/5" value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} /></label></section>
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5"><h3 className="font-bold">Source versions and index eligibility</h3><div className="mt-3 space-y-2">{selected.versions.map((version) => <div key={version.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-white/10"><span><b>Version {version.versionNumber}</b> · {version.status}</span><span className="font-mono text-[10px] text-gray-400">{version.sourceChecksum?.slice(0, 12) || 'no checksum'}…</span></div>)}</div></section>
        </>}
      </div>
    </div>
    {working && <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#1a1f18] px-4 py-2 text-sm font-bold text-white shadow-xl"><Loader2 className="h-4 w-4 animate-spin" /> Working</div>}
    {!health?.available && <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>Provider or embedding configuration is unavailable. Published FAQ matching and deterministic live-data formatting remain available; index cutover will fail safely without removing the last valid index.</p></div>}
  </div>;
}
