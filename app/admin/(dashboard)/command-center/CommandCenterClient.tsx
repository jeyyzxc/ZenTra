'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  CircleAlert,
  Clock3,
  DatabaseZap,
  FileCheck2,
  LayoutDashboard,
  ListChecks,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import TaskTemplatesPanel from './TaskTemplatesPanel';
import PublicContentPanel from './PublicContentPanel';
import AssistantWorkspacePanel from './AssistantWorkspacePanel';

type Workspace = 'overview' | 'workflow' | 'assistant' | 'content' | 'jobs' | 'analytics';
type Overview = {
  jobs: { failed: number; queued: number };
  publishing: { scheduled: number; overdueExpirations: number };
  knowledge: { activeGeneration: { generation: number; modelIdentifier: string; embeddingDimension: number; activatedAt: string | null } | null; pendingSources: number };
  assistant: { unansweredQuestions: number; unableToVerifyLast30Days: number };
  taskTemplates: { generalFallbackReady: boolean; generalVersion: number | null; eventCategoryCoverage: number; activeEventTemplates: number; eventCategories: number };
  recentChanges: Array<{ id: string; timestamp: string; userName: string; action: string; description: string; status: string }>;
};
type Job = {
  id: string;
  type: string;
  resourceType: string;
  resourceId: string;
  status: string;
  scheduledAt: string;
  attemptCount: number;
  maxAttempts: number;
  safeError: string | null;
  updatedAt: string;
};

const WORKSPACES: Array<{ id: Workspace; label: string; icon: typeof LayoutDashboard; hint: string }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, hint: 'Health and readiness' },
  { id: 'workflow', label: 'Workflow Automation', icon: ListChecks, hint: 'General and event tasks' },
  { id: 'assistant', label: 'Assistant Knowledge', icon: BrainCircuit, hint: 'Sources, FAQ and tests' },
  { id: 'content', label: 'Public Content', icon: FileCheck2, hint: 'Gallery, facilities and policies' },
  { id: 'jobs', label: 'Publishing & Jobs', icon: Clock3, hint: 'Schedules, retries and recovery' },
  { id: 'analytics', label: 'Analytics & Audit', icon: BarChart3, hint: 'Quality and traceability' },
];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const payload = await response.json() as { success?: boolean; data?: T; error?: string };
  if (!response.ok || payload.success === false || payload.data === undefined) throw new Error(payload.error || 'Command Center request failed.');
  return payload.data;
}

function MetricCard({ label, value, detail, icon: Icon, tone = 'gold' }: { label: string; value: string | number; detail: string; icon: typeof Activity; tone?: 'gold' | 'green' | 'red' | 'blue' }) {
  const colors = tone === 'red' ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : tone === 'green' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : tone === 'blue' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' : 'bg-[#FDF5CC]/70 text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]';
  return <article className="rounded-2xl border border-[#D6B53B]/20 bg-white/90 p-5 shadow-sm dark:bg-white/5"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors}`}><Icon className="h-5 w-5" /></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p><p className="mt-1 font-sahitya text-3xl font-bold">{value}</p><p className="mt-1 text-xs leading-5 text-gray-500 dark:text-[#A3B19B]">{detail}</p></article>;
}

function OverviewPanel({ data, loading, refresh }: { data: Overview | null; loading: boolean; refresh: () => void }) {
  if (loading && !data) return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#8E7722]" /></div>;
  if (!data) return <div className="rounded-2xl border border-dashed p-10 text-center text-gray-500">Overview is unavailable until the Command Center database migration is applied.</div>;
  const coverage = Math.round(data.taskTemplates.eventCategoryCoverage * 100);
  return <div className="space-y-6">
    <div className="flex justify-end"><button onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border border-[#D6B53B]/30 px-4 py-2 text-sm font-bold text-[#8E7722]"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh health</button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Failed jobs" value={data.jobs.failed} detail={`${data.jobs.queued} queued or retrying`} icon={CircleAlert} tone={data.jobs.failed ? 'red' : 'green'} />
      <MetricCard label="Upcoming publications" value={data.publishing.scheduled} detail={`${data.publishing.overdueExpirations} read-time expiry safeguards active`} icon={Clock3} tone="blue" />
      <MetricCard label="Knowledge index" value={data.knowledge.activeGeneration ? `Gen ${data.knowledge.activeGeneration.generation}` : 'Not active'} detail={data.knowledge.activeGeneration ? `${data.knowledge.activeGeneration.modelIdentifier} · ${data.knowledge.activeGeneration.embeddingDimension}d` : `${data.knowledge.pendingSources} sources waiting`} icon={DatabaseZap} tone={data.knowledge.activeGeneration ? 'green' : 'gold'} />
      <MetricCard label="Task coverage" value={`${coverage}%`} detail={`General v${data.taskTemplates.generalVersion ?? '—'} · ${data.taskTemplates.activeEventTemplates}/${data.taskTemplates.eventCategories} categories`} icon={ListChecks} tone={data.taskTemplates.generalFallbackReady ? 'green' : 'red'} />
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <section className="rounded-2xl border border-[#D6B53B]/20 bg-white/90 p-5 dark:bg-white/5"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-[#8E7722]" /><h2 className="font-sahitya text-2xl font-bold">Recent Super Admin changes</h2></div><div className="mt-4 space-y-2">{data.recentChanges.length ? data.recentChanges.map((change) => <div key={change.id} className="rounded-xl border border-gray-200 px-4 py-3 dark:border-white/10"><div className="flex items-center justify-between gap-3"><b className="text-sm">{change.userName}</b><span className="text-[10px] font-bold uppercase text-[#8E7722]">{change.action}</span></div><p className="mt-1 text-sm text-gray-600 dark:text-[#A3B19B]">{change.description}</p><p className="mt-1 text-[11px] text-gray-400">{new Date(change.timestamp).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p></div>) : <p className="py-8 text-center text-sm text-gray-500">No Command Center audit activity yet.</p>}</div></section>
      <section className="space-y-4 rounded-2xl border border-[#D6B53B]/20 bg-[linear-gradient(145deg,rgba(253,245,204,.65),rgba(255,255,255,.8))] p-5 dark:bg-[#141A13]"><div className="flex items-center gap-2"><Bot className="h-5 w-5 text-[#8E7722]" /><h2 className="font-sahitya text-2xl font-bold">Assistant signals</h2></div><div className="rounded-xl bg-white/70 p-4 dark:bg-white/5"><p className="text-xs font-bold uppercase tracking-wider text-gray-500">Unanswered questions</p><p className="mt-1 text-3xl font-bold">{data.assistant.unansweredQuestions}</p></div><div className="rounded-xl bg-white/70 p-4 dark:bg-white/5"><p className="text-xs font-bold uppercase tracking-wider text-gray-500">Unable to verify · 30 days</p><p className="mt-1 text-3xl font-bold">{data.assistant.unableToVerifyLast30Days}</p></div><p className="text-xs leading-5 text-gray-600 dark:text-[#A3B19B]">Unverified answers are refused and surfaced here for a Super Admin to add or improve a canonical source.</p></section>
    </div>
  </div>;
}

function JobsPanel({ canManage }: { canManage: boolean }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => api<Job[]>('/api/admin/command-center/jobs').then(setJobs).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load jobs.')).finally(() => setLoading(false)), []);
  useEffect(() => { void load(); }, [load]);
  const action = async (job: Job, name: 'retry' | 'cancel') => { try { setLoading(true); await api(`/api/admin/command-center/jobs/${job.id}/${name}`, { method: 'POST' }); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Job action failed.'); setLoading(false); } };
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><h2 className="font-sahitya text-2xl font-bold">Transactional outbox and worker queue</h2><p className="text-sm text-gray-500">n8n claims only job metadata and calls protected execution endpoints. It never receives document bodies or provider credentials.</p></div><button onClick={() => void load()} className="rounded-xl border p-2" aria-label="Refresh jobs"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div>{error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}<div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-white/5"><tr><th className="px-4 py-3">Job</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Scheduled · Asia/Manila</th><th className="px-4 py-3">Attempts</th><th className="px-4 py-3">Recovery</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id} className="border-t border-gray-100 dark:border-white/5"><td className="px-4 py-3"><b>{job.type}</b><span className="block font-mono text-[10px] text-gray-400">{job.resourceType} · {job.resourceId.slice(0, 12)}…</span>{job.safeError && <span className="mt-1 block max-w-lg text-xs text-red-600">{job.safeError}</span>}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${job.status === 'FAILED' ? 'bg-red-100 text-red-700' : job.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{job.status}</span></td><td className="px-4 py-3 text-xs">{new Date(job.scheduledAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</td><td className="px-4 py-3">{job.attemptCount}/{job.maxAttempts}</td><td className="px-4 py-3">{canManage && job.status === 'FAILED' && <button onClick={() => void action(job, 'retry')} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold"><RotateCcw className="h-3.5 w-3.5" /> Retry</button>}{canManage && ['QUEUED', 'RETRYING'].includes(job.status) && <button onClick={() => void action(job, 'cancel')} className="ml-2 rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700">Cancel</button>}</td></tr>)}</tbody></table>{!jobs.length && !loading && <p className="p-10 text-center text-sm text-gray-500">No Command Center jobs yet.</p>}</div></div>;
}

export default function CommandCenterClient({ currentUserRole, initialWorkspace }: { currentUserRole: 'SUPERADMIN' | 'ADMIN'; initialWorkspace: Workspace }) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const canManage = currentUserRole === 'SUPERADMIN';
  const loadOverview = useCallback(() => { void api<Overview>('/api/admin/command-center/overview').then(setOverview).catch(() => setOverview(null)).finally(() => setOverviewLoading(false)); }, []);
  useEffect(loadOverview, [loadOverview]);

  return <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 p-4 font-sans text-[#1a1f18] dark:text-[#F4F4F0] sm:p-6 lg:p-8">
    <header className="rounded-3xl border border-[#D6B53B]/25 bg-[radial-gradient(circle_at_top_right,rgba(253,245,204,.85),transparent_45%),white] p-6 shadow-sm dark:bg-[#141A13] lg:p-8"><div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#D6B53B]/30 bg-white/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8E7722] dark:bg-white/5"><ShieldCheck className="h-3.5 w-3.5" /> Central operations governance</div><h1 className="mt-3 font-sahitya text-4xl font-bold uppercase tracking-[0.07em]">ZENTRA Command Center</h1><p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600 dark:text-[#A3B19B]">One governed workspace for automation templates, assistant knowledge, public content, scheduling, recovery, and audit. {canManage ? 'You have Super Admin publication control.' : 'Your Admin access is read, preview, test, analytics, and assistant feedback only.'}</p></div><div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${canManage ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>{canManage ? 'Super Admin · Full governance' : 'Admin · Read and test'}</div></div></header>
    <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{WORKSPACES.map((item) => { const Icon = item.icon; const active = workspace === item.id; return <button key={item.id} onClick={() => setWorkspace(item.id)} className={`rounded-2xl border p-4 text-left transition ${active ? 'border-[#D6B53B] bg-[#FDF5CC]/65 shadow-sm dark:bg-[#D6B53B]/10' : 'border-gray-200 bg-white/80 hover:border-[#D6B53B]/50 dark:border-white/10 dark:bg-white/5'}`}><Icon className={`h-5 w-5 ${active ? 'text-[#8E7722]' : 'text-gray-400'}`} /><span className="mt-3 block text-sm font-bold">{item.label}</span><span className="mt-1 block text-[11px] text-gray-500">{item.hint}</span></button>; })}</nav>
    <main className="min-w-0 rounded-3xl border border-[#D6B53B]/15 bg-white/45 p-4 dark:bg-transparent sm:p-6">
      {workspace === 'overview' && <OverviewPanel data={overview} loading={overviewLoading} refresh={loadOverview} />}
      {workspace === 'workflow' && <TaskTemplatesPanel currentUserRole={currentUserRole} />}
      {workspace === 'assistant' && <AssistantWorkspacePanel currentUserRole={currentUserRole} />}
      {workspace === 'content' && <PublicContentPanel currentUserRole={currentUserRole} />}
      {workspace === 'jobs' && <JobsPanel canManage={canManage} />}
      {workspace === 'analytics' && <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-[#D6B53B]/20 bg-white p-6 dark:bg-white/5"><BrainCircuit className="h-7 w-7 text-[#8E7722]" /><h2 className="mt-4 font-sahitya text-2xl font-bold">Assistant quality</h2><p className="mt-2 text-sm leading-6 text-gray-500">Review unanswered questions, retrieval coverage, deterministic fallback use, and source effectiveness from Assistant Knowledge.</p><button onClick={() => setWorkspace('assistant')} className="mt-5 rounded-xl bg-[#1a1f18] px-4 py-2 font-bold text-[#FDF5CC]">Open assistant analytics</button></section><section className="rounded-2xl border border-[#D6B53B]/20 bg-white p-6 dark:bg-white/5"><ShieldCheck className="h-7 w-7 text-[#8E7722]" /><h2 className="mt-4 font-sahitya text-2xl font-bold">System audit trail</h2><p className="mt-2 text-sm leading-6 text-gray-500">Every content mutation, publication, migration, indexing action, worker failure, and sensitive retrieval is recorded in the existing system audit log.</p><div className="mt-5 flex gap-2"><Link href="/admin/audit" className="rounded-xl bg-[#1a1f18] px-4 py-2 font-bold text-[#FDF5CC]">Open system logs</Link><Link href="/admin/reports" className="rounded-xl border px-4 py-2 font-bold">Reports</Link></div></section></div>}
    </main>
  </div>;
}
