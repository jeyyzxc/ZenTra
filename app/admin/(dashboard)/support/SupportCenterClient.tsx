'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BarChart3,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  History,
  Loader2,
  MessageSquareWarning,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Tags,
  X,
} from 'lucide-react';

type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  tags: string[];
  relatedModule: string;
  status?: string;
  clientVisible?: boolean;
  assistantEnabled?: boolean;
  priority: number;
  viewCount?: number;
  lastUsedByAssistantAt?: string | null;
  internalNotes?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  versionCount?: number;
  versions?: Array<{
    id: string;
    oldQuestion: string | null;
    oldAnswer: string | null;
    newQuestion: string | null;
    newAnswer: string | null;
    changeSummary: string | null;
    changedBy: string | null;
    createdAt: string;
  }>;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  status: string;
  clientVisible: boolean;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
};

type FaqSummary = {
  total: number;
  published: number;
  drafts: number;
  hidden: number;
  archived: number;
  assistantEnabled: number;
  clientVisible: number;
  unanswered: number;
};

type FaqFilters = {
  search: string;
  categoryId: string;
  status: string;
  clientVisible: string;
  assistantEnabled: string;
  relatedModule: string;
  updatedBy: string;
};

type Pagination = {
  page: number;
  totalPages: number;
  totalRecords: number;
};

type UnansweredQuestion = {
  id: string;
  question: string;
  sourcePage: string | null;
  suggestedCategory: string | null;
  matchConfidence: number;
  status: string;
  convertedFaqId: string | null;
  convertedFaqQuestion: string | null;
  createdAt: string;
  updatedAt: string;
};

type AssistantTestResult = {
  answer: string;
  fallback: boolean;
  matchConfidence: number;
  source: {
    id: string;
    question: string;
    answer: string;
    categoryName: string | null;
    status: string;
    assistantEnabled: boolean;
  } | null;
};

type Analytics = {
  totalFaqEntries: number;
  publishedFaqs: number;
  draftFaqs: number;
  assistantEnabledEntries: number;
  unansweredQuestionsCount: number;
  mostViewedFaqs: Array<{ id: string; question: string; viewCount: number }>;
  mostSearchedKeywords: Array<{ keyword: string; count: number }>;
  categoriesWithMissingAnswers: string[];
  mostUsedAssistantAnswers: Array<{ id: string; question: string; count: number }>;
  frequentlyAskedTopics: Array<{ name: string; count: number }>;
};

const EMPTY_FILTERS: FaqFilters = {
  search: '',
  categoryId: '',
  status: '',
  clientVisible: '',
  assistantEnabled: '',
  relatedModule: '',
  updatedBy: '',
};

const EMPTY_SUMMARY: FaqSummary = {
  total: 0,
  published: 0,
  drafts: 0,
  hidden: 0,
  archived: 0,
  assistantEnabled: 0,
  clientVisible: 0,
  unanswered: 0,
};

const DEFAULT_FAQ_FORM = {
  question: '',
  answer: '',
  categoryId: '',
  tags: '',
  relatedModule: 'general',
  status: 'draft',
  clientVisible: true,
  assistantEnabled: false,
  priority: '0',
  internalNotes: '',
  changeSummary: '',
};

const DEFAULT_CATEGORY_FORM = {
  id: '',
  name: '',
  description: '',
  displayOrder: '0',
  status: 'active',
  clientVisible: true,
};

const DEFAULT_CONVERT_FORM = {
  unansweredId: '',
  question: '',
  answer: '',
  categoryId: '',
  tags: '',
  relatedModule: 'general',
  status: 'draft',
  clientVisible: true,
  assistantEnabled: false,
  priority: '0',
  internalNotes: '',
};

const tabs = [
  { id: 'faqs', label: 'FAQ Knowledge Base', icon: FileText },
  { id: 'assistant', label: 'Smart Assistant Training', icon: Bot },
  { id: 'unanswered', label: 'Unanswered Questions', icon: MessageSquareWarning },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const;

function normalizeLabel(value: string) {
  return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusClass(status = 'draft') {
  const classes: Record<string, string> = {
    published: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    draft: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]',
    hidden: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    archived: 'border-gray-300 bg-gray-200 text-gray-700 dark:border-white/10 dark:bg-black/30 dark:text-gray-300',
    needs_review: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
    new: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
    converted_to_faq: 'border-[#D6B53B]/40 bg-[#FDF5CC] text-[#6D5A18] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]',
    ignored: 'border-gray-200 bg-gray-50 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]',
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  };
  return classes[status] ?? classes.draft;
}

function Badge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${statusClass(value)}`}>
      {normalizeLabel(value)}
    </span>
  );
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : fallback);
  }
  return payload as T;
}

export default function SupportCenterClient({
  currentUserRole,
}: {
  currentUserRole: 'SUPERADMIN' | 'ADMIN';
}) {
  const canManage = currentUserRole === 'SUPERADMIN';
  const [activeTab, setActiveTab] = useState<typeof tabs[number]['id']>('faqs');
  const [filters, setFilters] = useState<FaqFilters>(EMPTY_FILTERS);
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [assistantEntries, setAssistantEntries] = useState<FaqEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<FaqSummary>(EMPTY_SUMMARY);
  const [filterOptions, setFilterOptions] = useState({
    statuses: [] as string[],
    relatedModules: [] as string[],
    updatedBy: [] as string[],
  });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, totalRecords: 0 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [selected, setSelected] = useState<FaqEntry | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [faqForm, setFaqForm] = useState(DEFAULT_FAQ_FORM);
  const [faqFormMode, setFaqFormMode] = useState<'create' | 'edit' | null>(null);
  const [categoryForm, setCategoryForm] = useState(DEFAULT_CATEGORY_FORM);
  const [unanswered, setUnanswered] = useState<UnansweredQuestion[]>([]);
  const [unansweredPagination, setUnansweredPagination] = useState<Pagination>({ page: 1, totalPages: 1, totalRecords: 0 });
  const [unansweredPage, setUnansweredPage] = useState(1);
  const [unansweredStatus, setUnansweredStatus] = useState('');
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantResult, setAssistantResult] = useState<AssistantTestResult | null>(null);
  const [convertForm, setConvertForm] = useState(DEFAULT_CONVERT_FORM);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters, page]);

  const flashSuccess = (message: string) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(''), 2200);
  };

  const loadFaqs = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    setError('');
    try {
      const payload = await readJson<{
        faqs: FaqEntry[];
        pagination: Pagination;
        summary: FaqSummary;
        filterOptions: {
          categories: Category[];
          statuses: string[];
          relatedModules: string[];
          updatedBy: string[];
        };
      }>(await fetch(`/api/admin/support/faqs?${query}`, { cache: 'no-store' }), 'Unable to load support entries.');
      setFaqs(payload.faqs);
      setPagination(payload.pagination);
      setSummary(payload.summary);
      setCategories(payload.filterOptions.categories);
      setFilterOptions({
        statuses: payload.filterOptions.statuses,
        relatedModules: payload.filterOptions.relatedModules,
        updatedBy: payload.filterOptions.updatedBy,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load support entries.');
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [query]);

  const loadAssistantEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        status: 'published',
        assistantEnabled: 'true',
      });
      const payload = await readJson<{ faqs: FaqEntry[] }>(
        await fetch(`/api/admin/support/faqs?${params.toString()}`, { cache: 'no-store' }),
        'Unable to load assistant knowledge.',
      );
      setAssistantEntries(payload.faqs);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load assistant knowledge.');
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const payload = await readJson<{ categories: Category[] }>(
        await fetch('/api/admin/support/categories', { cache: 'no-store' }),
        'Unable to load categories.',
      );
      setCategories(payload.categories);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load categories.');
    }
  }, []);

  const loadUnanswered = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(unansweredPage), limit: '10' });
      if (unansweredStatus) params.set('status', unansweredStatus);
      const payload = await readJson<{
        questions: UnansweredQuestion[];
        pagination: Pagination;
      }>(
        await fetch(`/api/admin/support/assistant/unanswered?${params.toString()}`, { cache: 'no-store' }),
        'Unable to load unanswered questions.',
      );
      setUnanswered(payload.questions);
      setUnansweredPagination(payload.pagination);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load unanswered questions.');
    }
  }, [unansweredPage, unansweredStatus]);

  const loadAnalytics = useCallback(async () => {
    try {
      const payload = await readJson<{ analytics: Analytics }>(
        await fetch('/api/admin/support/analytics', { cache: 'no-store' }),
        'Unable to load support analytics.',
      );
      setAnalytics(payload.analytics);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load support analytics.');
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setIsDetailLoading(true);
    setError('');
    try {
      const payload = await readJson<{ faq: FaqEntry }>(
        await fetch(`/api/admin/support/faqs/${encodeURIComponent(id)}`, { cache: 'no-store' }),
        'Unable to load FAQ details.',
      );
      setSelected(payload.faq);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load FAQ details.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadFaqs(), 150);
    return () => window.clearTimeout(timeout);
  }, [loadFaqs]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (activeTab === 'assistant') void loadAssistantEntries();
      if (activeTab === 'unanswered') void loadUnanswered();
      if (activeTab === 'categories') void loadCategories();
      if (activeTab === 'analytics') void loadAnalytics();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [activeTab, loadAnalytics, loadAssistantEntries, loadCategories, loadUnanswered]);

  const refreshAll = async () => {
    await loadFaqs(true);
    if (activeTab === 'assistant') await loadAssistantEntries();
    if (activeTab === 'unanswered') await loadUnanswered();
    if (activeTab === 'categories') await loadCategories();
    if (activeTab === 'analytics') await loadAnalytics();
    if (selected) await loadDetail(selected.id);
  };

  const changeFilter = (key: keyof FaqFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const openCreateFaq = () => {
    setFaqForm(DEFAULT_FAQ_FORM);
    setFaqFormMode('create');
  };

  const openEditFaq = (faq: FaqEntry) => {
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      categoryId: faq.categoryId ?? '',
      tags: faq.tags.join(', '),
      relatedModule: faq.relatedModule,
      status: faq.status ?? 'draft',
      clientVisible: Boolean(faq.clientVisible),
      assistantEnabled: Boolean(faq.assistantEnabled),
      priority: String(faq.priority),
      internalNotes: faq.internalNotes ?? '',
      changeSummary: '',
    });
    setFaqFormMode('edit');
    setSelected(faq);
  };

  const submitFaq = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) return;
    const endpoint = faqFormMode === 'edit' && selected
      ? `/api/admin/support/faqs/${encodeURIComponent(selected.id)}`
      : '/api/admin/support/faqs';
    setPendingAction(endpoint);
    setError('');
    try {
      const payload = await readJson<{ faq: FaqEntry }>(await fetch(endpoint, {
        method: faqFormMode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...faqForm,
          categoryId: faqForm.categoryId || null,
          tags: faqForm.tags,
          priority: Number(faqForm.priority) || 0,
        }),
      }), 'Unable to save FAQ entry.');
      setFaqFormMode(null);
      setSelected(payload.faq);
      await refreshAll();
      flashSuccess(faqFormMode === 'edit' ? 'FAQ entry updated.' : 'FAQ entry created.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to save FAQ entry.');
    } finally {
      setPendingAction('');
    }
  };

  const faqAction = async (faq: FaqEntry, endpoint: string, method = 'PATCH', body?: Record<string, unknown>) => {
    if (!canManage) return;
    const actionKey = `${faq.id}:${endpoint}`;
    setPendingAction(actionKey);
    setError('');
    try {
      const payload = await readJson<{ faq: FaqEntry }>(await fetch(endpoint, {
        method,
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }), 'Unable to update FAQ entry.');
      if (selected?.id === faq.id) setSelected(payload.faq);
      await refreshAll();
      flashSuccess('FAQ entry updated.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update FAQ entry.');
    } finally {
      setPendingAction('');
    }
  };

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) return;
    const endpoint = categoryForm.id
      ? `/api/admin/support/categories/${encodeURIComponent(categoryForm.id)}`
      : '/api/admin/support/categories';
    setPendingAction(endpoint);
    setError('');
    try {
      await readJson(await fetch(endpoint, {
        method: categoryForm.id ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description,
          displayOrder: Number(categoryForm.displayOrder) || 0,
          status: categoryForm.status,
          clientVisible: categoryForm.clientVisible,
        }),
      }), 'Unable to save category.');
      setCategoryForm(DEFAULT_CATEGORY_FORM);
      await refreshAll();
      flashSuccess('Category saved.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to save category.');
    } finally {
      setPendingAction('');
    }
  };

  const testAssistant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPendingAction('assistant-test');
    setError('');
    setAssistantResult(null);
    try {
      const payload = await readJson<{ result: AssistantTestResult }>(await fetch('/api/admin/support/assistant/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: assistantQuestion }),
      }), 'Unable to test Smart Assistant answer.');
      setAssistantResult(payload.result);
      flashSuccess('Assistant response tested.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to test Smart Assistant answer.');
    } finally {
      setPendingAction('');
    }
  };

  const ignoreUnanswered = async (question: UnansweredQuestion) => {
    setPendingAction(`ignore:${question.id}`);
    setError('');
    try {
      await readJson(await fetch(`/api/admin/support/assistant/unanswered/${encodeURIComponent(question.id)}/ignore`, {
        method: 'PATCH',
      }), 'Unable to ignore question.');
      await refreshAll();
      flashSuccess('Question ignored.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to ignore question.');
    } finally {
      setPendingAction('');
    }
  };

  const openConvert = (question: UnansweredQuestion) => {
    setConvertForm({
      ...DEFAULT_CONVERT_FORM,
      unansweredId: question.id,
      question: question.question,
    });
  };

  const submitConvert = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage || !convertForm.unansweredId) return;
    const endpoint = `/api/admin/support/assistant/unanswered/${encodeURIComponent(convertForm.unansweredId)}/convert-to-faq`;
    setPendingAction(endpoint);
    setError('');
    try {
      await readJson(await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answer: convertForm.answer,
          categoryId: convertForm.categoryId || null,
          tags: convertForm.tags,
          relatedModule: convertForm.relatedModule,
          status: convertForm.status,
          clientVisible: convertForm.clientVisible,
          assistantEnabled: convertForm.assistantEnabled,
          priority: Number(convertForm.priority) || 0,
          internalNotes: convertForm.internalNotes,
        }),
      }), 'Unable to convert unanswered question.');
      setConvertForm(DEFAULT_CONVERT_FORM);
      await refreshAll();
      flashSuccess('Question converted to FAQ.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to convert unanswered question.');
    } finally {
      setPendingAction('');
    }
  };

  const summaryCards = [
    ['Total Entries', summary.total, FileText],
    ['Published', summary.published, Check],
    ['Drafts', summary.drafts, Pencil],
    ['Client Visible', summary.clientVisible, Eye],
    ['Assistant Enabled', summary.assistantEnabled, Bot],
    ['Unanswered', summary.unanswered, MessageSquareWarning],
  ] as const;

  return (
    <div className="mx-auto flex w-full flex-col gap-6 font-sans text-[#1a1f18] dark:text-[#F4F4F0]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D6B53B]/30 bg-[#FDF5CC] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
            <Bot className="h-3.5 w-3.5" />
            Support Center
          </div>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em]">Support Center</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Manage FAQ content, Smart Assistant knowledge, client help answers, and support guidance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void refreshAll()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6B53B]/30 bg-white px-4 py-2.5 text-sm font-bold text-[#8E7722] shadow-sm hover:bg-[#FDF5CC] dark:bg-white/5 dark:text-[#D6B53B]">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button type="button" onClick={openCreateFaq} disabled={!canManage} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="h-4 w-4" />
            Add FAQ Entry
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[#D6B53B]/20 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                active
                  ? 'border-[#D6B53B] bg-[#FDF5CC] text-[#6D5A18] shadow-sm dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]'
                  : 'border-transparent bg-white/70 text-gray-500 hover:border-[#D6B53B]/30 dark:bg-white/5 dark:text-[#A3B19B]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">{success}</div>}

      {activeTab === 'faqs' && (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
            {summaryCards.map(([label, value, Icon]) => (
              <article key={label} className="rounded-2xl border border-[#D6B53B]/20 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8E7722] dark:text-[#D6B53B]">{label}</p>
                  <Icon className="h-4 w-4 text-[#D6B53B]" />
                </div>
                <p className="mt-2 font-sahitya text-3xl font-bold">{value}</p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-[#D6B53B]/20 bg-[#FDF5CC]/55 p-4 shadow-[0_18px_60px_rgba(142,119,34,0.08)] dark:border-white/10 dark:bg-[#141A13]">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="relative xl:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input value={filters.search} onChange={(event) => changeFilter('search', event.target.value)} placeholder="Search question or answer" className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]" />
              </label>
              <select value={filters.categoryId} onChange={(event) => changeFilter('categoryId', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]">
                <option value="">All categories</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <select value={filters.status} onChange={(event) => changeFilter('status', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]">
                <option value="">All statuses</option>
                {filterOptions.statuses.map((status) => <option key={status} value={status}>{normalizeLabel(status)}</option>)}
              </select>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <select value={filters.clientVisible} onChange={(event) => changeFilter('clientVisible', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]">
                <option value="">Client visibility</option>
                <option value="true">Client visible</option>
                <option value="false">Client hidden</option>
              </select>
              <select value={filters.assistantEnabled} onChange={(event) => changeFilter('assistantEnabled', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]">
                <option value="">Assistant visibility</option>
                <option value="true">Assistant enabled</option>
                <option value="false">Assistant disabled</option>
              </select>
              <select value={filters.relatedModule} onChange={(event) => changeFilter('relatedModule', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]">
                <option value="">All modules</option>
                {filterOptions.relatedModules.map((module) => <option key={module} value={module}>{normalizeLabel(module)}</option>)}
              </select>
              <select value={filters.updatedBy} onChange={(event) => changeFilter('updatedBy', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]">
                <option value="">Updated by</option>
                {filterOptions.updatedBy.map((admin) => <option key={admin} value={admin}>{admin}</option>)}
              </select>
            </div>
          </section>

          <FaqTable
            faqs={faqs}
            isLoading={isLoading}
            canManage={canManage}
            pendingAction={pendingAction}
            onView={(faq) => void loadDetail(faq.id)}
            onEdit={openEditFaq}
            onAction={faqAction}
          />

          <PaginationControls
            pagination={pagination}
            page={page}
            onPage={setPage}
            label="FAQ entries"
          />
        </>
      )}

      {activeTab === 'assistant' && (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
          <div className="overflow-hidden rounded-2xl border border-[#D6B53B]/20 bg-white shadow-sm dark:border-white/10 dark:bg-[#141A13]">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-white/10">
              <h2 className="font-sahitya text-2xl font-bold">Smart Assistant Knowledge</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3">Question</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Source Status</th>
                    <th className="px-4 py-3">Last Used</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {assistantEntries.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-500">No assistant-enabled entries found.</td></tr>
                  ) : assistantEntries.map((faq) => (
                    <tr key={faq.id} className="hover:bg-[#FDF5CC]/25 dark:hover:bg-white/[0.03]">
                      <td className="max-w-md px-4 py-4"><p className="font-bold">{faq.question}</p><p className="mt-1 line-clamp-2 text-xs text-gray-500">{faq.answer}</p></td>
                      <td className="px-4 py-4 text-xs font-semibold">{faq.categoryName ?? 'Uncategorized'}</td>
                      <td className="px-4 py-4"><Badge value={faq.status ?? 'draft'} /></td>
                      <td className="px-4 py-4 text-xs text-gray-500">{formatDate(faq.lastUsedByAssistantAt)}</td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => void loadDetail(faq.id)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#8E7722] dark:hover:bg-white/10" title="View source"><Eye className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={testAssistant} className="rounded-2xl border border-[#D6B53B]/20 bg-[#FDF5CC]/55 p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
            <h2 className="font-sahitya text-2xl font-bold">Test Assistant Response</h2>
            <textarea value={assistantQuestion} onChange={(event) => setAssistantQuestion(event.target.value)} required minLength={3} placeholder="Type a sample client question" className="mt-4 min-h-32 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]" />
            <button type="submit" disabled={pendingAction === 'assistant-test'} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:opacity-60">
              {pendingAction === 'assistant-test' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Test
            </button>
            {assistantResult && (
              <div className="mt-5 space-y-3 rounded-xl border border-white/70 bg-white p-4 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <Badge value={assistantResult.fallback ? 'needs_review' : 'published'} />
                  <span className="text-xs font-bold text-gray-500">{Math.round(assistantResult.matchConfidence * 100)}% match</span>
                </div>
                <p className="whitespace-pre-wrap leading-6 text-gray-700 dark:text-[#F4F4F0]">{assistantResult.answer}</p>
                {assistantResult.source && (
                  <button type="button" onClick={() => void loadDetail(assistantResult.source!.id)} className="text-left text-xs font-bold text-[#8E7722] hover:text-[#D6B53B]">
                    Source: {assistantResult.source.question}
                  </button>
                )}
              </div>
            )}
          </form>
        </section>
      )}

      {activeTab === 'unanswered' && (
        <>
          <section className="flex flex-col gap-3 rounded-2xl border border-[#D6B53B]/20 bg-[#FDF5CC]/55 p-4 shadow-sm dark:border-white/10 dark:bg-[#141A13] sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-sahitya text-2xl font-bold">Unanswered Questions</h2>
            <select value={unansweredStatus} onChange={(event) => { setUnansweredStatus(event.target.value); setUnansweredPage(1); }} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]">
              <option value="">All statuses</option>
              {['new', 'reviewed', 'answered', 'converted_to_faq', 'ignored', 'archived'].map((status) => <option key={status} value={status}>{normalizeLabel(status)}</option>)}
            </select>
          </section>
          <div className="overflow-hidden rounded-2xl border border-[#D6B53B]/20 bg-white shadow-sm dark:border-white/10 dark:bg-[#141A13]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3">Question</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date Asked</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {unanswered.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-20 text-center"><MessageSquareWarning className="mx-auto h-10 w-10 text-[#D6B53B]/60" /><p className="mt-4 font-sahitya text-xl font-bold">No unanswered questions yet.</p><p className="mt-1 text-sm text-gray-500">The Smart Assistant is currently finding approved answers successfully.</p></td></tr>
                  ) : unanswered.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FDF5CC]/25 dark:hover:bg-white/[0.03]">
                      <td className="max-w-md px-4 py-4 font-semibold">{item.question}</td>
                      <td className="px-4 py-4 text-xs text-gray-500">{item.sourcePage ?? 'smart_assistant'}</td>
                      <td className="px-4 py-4 text-xs font-bold">{Math.round(item.matchConfidence * 100)}%</td>
                      <td className="px-4 py-4"><Badge value={item.status} /></td>
                      <td className="px-4 py-4 text-xs text-gray-500">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => openConvert(item)} disabled={!canManage || item.status === 'converted_to_faq'} className="rounded-lg p-2 text-[#8E7722] hover:bg-[#FDF5CC] disabled:opacity-40" title="Create FAQ from question"><Plus className="h-4 w-4" /></button>
                          <button type="button" onClick={() => void ignoreUnanswered(item)} disabled={pendingAction === `ignore:${item.id}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-white/10" title="Ignore"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <PaginationControls pagination={unansweredPagination} page={unansweredPage} onPage={setUnansweredPage} label="unanswered questions" />
        </>
      )}

      {activeTab === 'categories' && (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
          <form onSubmit={submitCategory} className="rounded-2xl border border-[#D6B53B]/20 bg-[#FDF5CC]/55 p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
            <h2 className="font-sahitya text-2xl font-bold">{categoryForm.id ? 'Edit Category' : 'Add Category'}</h2>
            <input value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} required placeholder="Category name" className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]" />
            <textarea value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" className="mt-3 min-h-24 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <input type="number" value={categoryForm.displayOrder} onChange={(event) => setCategoryForm((current) => ({ ...current, displayOrder: event.target.value }))} placeholder="Order" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-[#1C1D21]" />
              <select value={categoryForm.status} onChange={(event) => setCategoryForm((current) => ({ ...current, status: event.target.value }))} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-[#1C1D21]">
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <label className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#1C1D21]">
              <input type="checkbox" checked={categoryForm.clientVisible} onChange={(event) => setCategoryForm((current) => ({ ...current, clientVisible: event.target.checked }))} />
              Client visible
            </label>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={!canManage || Boolean(pendingAction)} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:opacity-50">
                {pendingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </button>
              {categoryForm.id && <button type="button" onClick={() => setCategoryForm(DEFAULT_CATEGORY_FORM)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 dark:border-white/10">Cancel</button>}
            </div>
          </form>

          <div className="overflow-hidden rounded-2xl border border-[#D6B53B]/20 bg-white shadow-sm dark:border-white/10 dark:bg-[#141A13]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Entries</th>
                    <th className="px-4 py-3">Client Visible</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-[#FDF5CC]/25 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-4"><p className="font-bold">{category.name}</p><p className="mt-1 text-xs text-gray-400">{category.slug}</p></td>
                      <td className="px-4 py-4 text-xs font-bold">{category.displayOrder}</td>
                      <td className="px-4 py-4 text-xs font-bold">{category.entryCount}</td>
                      <td className="px-4 py-4">{category.clientVisible ? <Eye className="h-4 w-4 text-blue-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}</td>
                      <td className="px-4 py-4"><Badge value={category.status} /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setCategoryForm({ id: category.id, name: category.name, description: category.description ?? '', displayOrder: String(category.displayOrder), status: category.status, clientVisible: category.clientVisible })} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#8E7722] dark:hover:bg-white/10" title="Edit"><Pencil className="h-4 w-4" /></button>
                          <button type="button" disabled={!canManage || category.status === 'archived'} onClick={() => void fetch(`/api/admin/support/categories/${encodeURIComponent(category.id)}/archive`, { method: 'PATCH' }).then(() => refreshAll())} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-white/10" title="Archive"><Archive className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'analytics' && (
        analytics ? (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Total FAQ entries', analytics.totalFaqEntries],
                ['Published FAQs', analytics.publishedFaqs],
                ['Draft FAQs', analytics.draftFaqs],
                ['Assistant-enabled entries', analytics.assistantEnabledEntries],
                ['Unanswered questions', analytics.unansweredQuestionsCount],
              ].map(([label, value]) => (
                <article key={label} className="rounded-2xl border border-[#D6B53B]/20 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8E7722] dark:text-[#D6B53B]">{label}</p>
                  <p className="mt-2 font-sahitya text-3xl font-bold">{value}</p>
                </article>
              ))}
            </div>
            <AnalyticsList title="Most Viewed FAQs" items={analytics.mostViewedFaqs.map((item) => `${item.question} (${item.viewCount})`)} />
            <AnalyticsList title="Most Searched Keywords" items={analytics.mostSearchedKeywords.map((item) => `${item.keyword} (${item.count})`)} />
            <AnalyticsList title="Most Used Assistant Answers" items={analytics.mostUsedAssistantAnswers.map((item) => `${item.question} (${item.count})`)} />
            <AnalyticsList title="Frequently Asked Topics" items={analytics.frequentlyAskedTopics.map((item) => `${item.name} (${item.count})`)} />
            <AnalyticsList title="Categories With Missing Answers" items={analytics.categoriesWithMissingAnswers} />
          </section>
        ) : (
          <div className="rounded-2xl border border-[#D6B53B]/20 bg-white p-12 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-[#141A13]">Loading analytics...</div>
        )
      )}

      {(selected || isDetailLoading) && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/35 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <aside className="h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl dark:bg-[#141A13] md:p-8" onClick={(event) => event.stopPropagation()}>
            {isDetailLoading && !selected ? <div className="flex h-full items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-[#D6B53B]" /></div> : selected && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge value={selected.status ?? 'draft'} />
                      {selected.clientVisible && <Badge value="client visible" />}
                      {selected.assistantEnabled && <Badge value="assistant enabled" />}
                    </div>
                    <h2 className="mt-4 font-sahitya text-3xl font-bold">{selected.question}</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-[#A3B19B]">Updated {formatDate(selected.updatedAt)} by {selected.updatedBy ?? 'System'}</p>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 dark:bg-white/10"><X className="h-5 w-5" /></button>
                </div>
                <section className="mt-6 rounded-2xl border border-[#D6B53B]/20 bg-[#FDF5CC]/25 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8E7722]">Approved Answer</p>
                  <p className="mt-3 whitespace-pre-wrap font-serif text-lg leading-8 text-gray-700 dark:text-[#F4F4F0]">{selected.answer}</p>
                </section>
                <dl className="mt-5 grid grid-cols-1 gap-4 rounded-2xl bg-gray-50 p-5 text-sm dark:bg-white/5 sm:grid-cols-2">
                  {[
                    ['Category', selected.categoryName ?? 'Uncategorized'],
                    ['Related module', normalizeLabel(selected.relatedModule)],
                    ['Priority', String(selected.priority)],
                    ['Views', String(selected.viewCount ?? 0)],
                    ['Last assistant use', formatDate(selected.lastUsedByAssistantAt)],
                    ['Tags', selected.tags.join(', ') || 'No tags'],
                  ].map(([label, value]) => <div key={label}><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
                </dl>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => openEditFaq(selected)} disabled={!canManage} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:opacity-50"><Pencil className="h-4 w-4" />Edit</button>
                  <button type="button" onClick={() => void faqAction(selected, `/api/admin/support/faqs/${encodeURIComponent(selected.id)}/publish`)} disabled={!canManage} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"><Check className="h-4 w-4" />Publish</button>
                  <button type="button" onClick={() => void faqAction(selected, `/api/admin/support/faqs/${encodeURIComponent(selected.id)}/hide`)} disabled={!canManage} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"><EyeOff className="h-4 w-4" />Hide</button>
                  <button type="button" onClick={() => void faqAction(selected, `/api/admin/support/faqs/${encodeURIComponent(selected.id)}/archive`)} disabled={!canManage} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"><Archive className="h-4 w-4" />Archive</button>
                </div>
                <section className="mt-7">
                  <h3 className="flex items-center gap-2 font-sahitya text-xl font-bold"><History className="h-5 w-5 text-[#D6B53B]" />Version History</h3>
                  <div className="mt-4 space-y-3">
                    {selected.versions?.length ? selected.versions.map((version) => (
                      <article key={version.id} className="rounded-xl border border-gray-100 p-4 dark:border-white/10">
                        <p className="text-sm font-bold">{version.changeSummary ?? 'Updated support knowledge'}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{version.changedBy ?? 'System'} - {formatDate(version.createdAt)}</p>
                        <p className="mt-3 line-clamp-2 text-xs text-gray-500">Previous: {version.oldQuestion}</p>
                      </article>
                    )) : <p className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400 dark:border-white/10">No version history yet.</p>}
                  </div>
                </section>
              </>
            )}
          </aside>
        </div>
      )}

      {faqFormMode && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitFaq} className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#141A13] md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E7722]">Support Knowledge</p><h2 className="mt-1 font-sahitya text-2xl font-bold">{faqFormMode === 'edit' ? 'Edit FAQ Entry' : 'Add FAQ Entry'}</h2></div>
              <button type="button" onClick={() => setFaqFormMode(null)} className="rounded-full bg-gray-100 p-2 text-gray-500"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 sm:col-span-2">Question
                <input value={faqForm.question} onChange={(event) => setFaqForm((current) => ({ ...current, question: event.target.value }))} required className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5" />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 sm:col-span-2">Approved answer
                <textarea value={faqForm.answer} onChange={(event) => setFaqForm((current) => ({ ...current, answer: event.target.value }))} required className="mt-1.5 min-h-36 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5" />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Category
                <select value={faqForm.categoryId} onChange={(event) => setFaqForm((current) => ({ ...current, categoryId: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5">
                  <option value="">Uncategorized</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Related module
                <select value={faqForm.relatedModule} onChange={(event) => setFaqForm((current) => ({ ...current, relatedModule: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5">
                  {(filterOptions.relatedModules.length ? filterOptions.relatedModules : ['booking', 'packages', 'payments', 'contracts', 'calendar', 'venue', 'inquiries', 'testimonies', 'general']).map((module) => <option key={module} value={module}>{normalizeLabel(module)}</option>)}
                </select>
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Status
                <select value={faqForm.status} onChange={(event) => setFaqForm((current) => ({ ...current, status: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5">
                  {(filterOptions.statuses.length ? filterOptions.statuses : ['draft', 'published', 'hidden', 'archived', 'needs_review']).map((status) => <option key={status} value={status}>{normalizeLabel(status)}</option>)}
                </select>
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Priority
                <input type="number" value={faqForm.priority} onChange={(event) => setFaqForm((current) => ({ ...current, priority: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5" />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 sm:col-span-2">Tags
                <input value={faqForm.tags} onChange={(event) => setFaqForm((current) => ({ ...current, tags: event.target.value }))} placeholder="booking, payment, venue" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5" />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold dark:border-white/10">
                <input type="checkbox" checked={faqForm.clientVisible} onChange={(event) => setFaqForm((current) => ({ ...current, clientVisible: event.target.checked }))} />
                Client visible
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold dark:border-white/10">
                <input type="checkbox" checked={faqForm.assistantEnabled} onChange={(event) => setFaqForm((current) => ({ ...current, assistantEnabled: event.target.checked }))} />
                Assistant enabled
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 sm:col-span-2">Internal notes
                <textarea value={faqForm.internalNotes} onChange={(event) => setFaqForm((current) => ({ ...current, internalNotes: event.target.value }))} className="mt-1.5 min-h-20 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5" />
              </label>
              {faqFormMode === 'edit' && (
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 sm:col-span-2">Change summary
                  <input value={faqForm.changeSummary} onChange={(event) => setFaqForm((current) => ({ ...current, changeSummary: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5" />
                </label>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setFaqFormMode(null)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 dark:border-white/10">Cancel</button>
              <button type="submit" disabled={Boolean(pendingAction)} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:opacity-60">{pendingAction && <Loader2 className="h-4 w-4 animate-spin" />}Save FAQ</button>
            </div>
          </form>
        </div>
      )}

      {convertForm.unansweredId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitConvert} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#141A13] md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E7722]">Convert to FAQ</p><h2 className="mt-1 font-sahitya text-2xl font-bold">{convertForm.question}</h2></div>
              <button type="button" onClick={() => setConvertForm(DEFAULT_CONVERT_FORM)} className="rounded-full bg-gray-100 p-2 text-gray-500"><X className="h-5 w-5" /></button>
            </div>
            <label className="mt-6 block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Approved answer
              <textarea value={convertForm.answer} onChange={(event) => setConvertForm((current) => ({ ...current, answer: event.target.value }))} required className="mt-1.5 min-h-36 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5" />
            </label>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <select value={convertForm.categoryId} onChange={(event) => setConvertForm((current) => ({ ...current, categoryId: event.target.value }))} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5">
                <option value="">Uncategorized</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <select value={convertForm.status} onChange={(event) => setConvertForm((current) => ({ ...current, status: event.target.value }))} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <input value={convertForm.tags} onChange={(event) => setConvertForm((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5" />
              <input type="number" value={convertForm.priority} onChange={(event) => setConvertForm((current) => ({ ...current, priority: event.target.value }))} placeholder="Priority" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5" />
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold dark:border-white/10"><input type="checkbox" checked={convertForm.clientVisible} onChange={(event) => setConvertForm((current) => ({ ...current, clientVisible: event.target.checked }))} />Client visible</label>
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold dark:border-white/10"><input type="checkbox" checked={convertForm.assistantEnabled} onChange={(event) => setConvertForm((current) => ({ ...current, assistantEnabled: event.target.checked }))} />Assistant enabled</label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConvertForm(DEFAULT_CONVERT_FORM)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 dark:border-white/10">Cancel</button>
              <button type="submit" disabled={Boolean(pendingAction)} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:opacity-60">{pendingAction && <Loader2 className="h-4 w-4 animate-spin" />}Create FAQ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function FaqTable({
  faqs,
  isLoading,
  canManage,
  pendingAction,
  onView,
  onEdit,
  onAction,
}: {
  faqs: FaqEntry[];
  isLoading: boolean;
  canManage: boolean;
  pendingAction: string;
  onView: (faq: FaqEntry) => void;
  onEdit: (faq: FaqEntry) => void;
  onAction: (faq: FaqEntry, endpoint: string, method?: string, body?: Record<string, unknown>) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#D6B53B]/20 bg-white shadow-sm dark:border-white/10 dark:bg-[#141A13]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:bg-white/5">
            <tr>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Related Module</th>
              <th className="px-4 py-3">Client Visible</th>
              <th className="px-4 py-3">Assistant Enabled</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated By</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/10">
            {isLoading ? (
              <tr><td colSpan={9} className="px-6 py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D6B53B]" /></td></tr>
            ) : faqs.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-20 text-center"><FileText className="mx-auto h-10 w-10 text-[#D6B53B]/60" /><p className="mt-4 font-sahitya text-xl font-bold">No FAQ entries yet.</p><p className="mt-1 text-sm text-gray-500">Create your first support answer to help clients and train the Smart Assistant.</p></td></tr>
            ) : faqs.map((faq) => (
              <tr key={faq.id} className="hover:bg-[#FDF5CC]/25 dark:hover:bg-white/[0.03]">
                <td className="max-w-md px-4 py-4"><button type="button" onClick={() => onView(faq)} className="text-left font-bold hover:text-[#8E7722]">{faq.question}</button><p className="mt-1 line-clamp-2 text-xs text-gray-500">{faq.answer}</p></td>
                <td className="px-4 py-4 text-xs font-semibold">{faq.categoryName ?? 'Uncategorized'}</td>
                <td className="px-4 py-4 text-xs font-semibold">{normalizeLabel(faq.relatedModule)}</td>
                <td className="px-4 py-4">{faq.clientVisible ? <Eye className="h-4 w-4 text-blue-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}</td>
                <td className="px-4 py-4">{faq.assistantEnabled ? <Bot className="h-4 w-4 text-violet-600" /> : <Bot className="h-4 w-4 text-gray-300" />}</td>
                <td className="px-4 py-4"><Badge value={faq.status ?? 'draft'} /></td>
                <td className="px-4 py-4 text-xs font-semibold">{faq.updatedBy ?? 'System'}</td>
                <td className="px-4 py-4 text-xs text-gray-500">{formatDate(faq.updatedAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => onView(faq)} title="View" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#8E7722] dark:hover:bg-white/10"><Eye className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onEdit(faq)} disabled={!canManage} title="Edit" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#8E7722] disabled:opacity-40 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onAction(faq, `/api/admin/support/faqs/${encodeURIComponent(faq.id)}/publish`)} disabled={!canManage || pendingAction.includes(faq.id)} title="Publish" className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"><Check className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onAction(faq, `/api/admin/support/faqs/${encodeURIComponent(faq.id)}/hide`)} disabled={!canManage || pendingAction.includes(faq.id)} title="Hide" className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 disabled:opacity-40"><EyeOff className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onAction(faq, `/api/admin/support/faqs/${encodeURIComponent(faq.id)}/assistant-toggle`, 'PATCH', { assistantEnabled: !faq.assistantEnabled })} disabled={!canManage || pendingAction.includes(faq.id)} title="Toggle assistant" className="rounded-lg p-2 text-violet-600 hover:bg-violet-50 disabled:opacity-40"><Bot className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onAction(faq, `/api/admin/support/faqs/${encodeURIComponent(faq.id)}/client-visibility`, 'PATCH', { clientVisible: !faq.clientVisible })} disabled={!canManage || pendingAction.includes(faq.id)} title="Toggle client visibility" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-40"><Eye className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onAction(faq, `/api/admin/support/faqs/${encodeURIComponent(faq.id)}/archive`)} disabled={!canManage || pendingAction.includes(faq.id)} title="Archive" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-white/10"><Archive className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaginationControls({
  pagination,
  page,
  onPage,
  label,
}: {
  pagination: Pagination;
  page: number;
  onPage: (page: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#D6B53B]/20 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#141A13] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-gray-500">{pagination.totalRecords} {label} found</p>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))} className="rounded-lg border border-gray-200 p-2 disabled:opacity-40 dark:border-white/10"><ChevronLeft className="h-4 w-4" /></button>
        <span className="px-2 text-xs font-bold">Page {pagination.page} of {pagination.totalPages}</span>
        <button type="button" disabled={page >= pagination.totalPages} onClick={() => onPage(page + 1)} className="rounded-lg border border-gray-200 p-2 disabled:opacity-40 dark:border-white/10"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function AnalyticsList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-2xl border border-[#D6B53B]/20 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
      <h3 className="font-sahitya text-xl font-bold">{title}</h3>
      <div className="mt-4 space-y-2">
        {items.length ? items.map((item) => (
          <p key={item} className="rounded-xl border border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-white/10 dark:text-[#F4F4F0]">{item}</p>
        )) : <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-white/10">No data yet.</p>}
      </div>
    </article>
  );
}
