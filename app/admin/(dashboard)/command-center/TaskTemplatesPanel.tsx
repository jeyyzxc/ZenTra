'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CopyPlus,
  Loader2,
  GitCompareArrows,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';

type Category = {
  id: string;
  name: string;
  categoryKey: string;
  status: string;
};

type TemplateItem = {
  id: string;
  itemKey?: string;
  orderIndex: number;
  title: string;
  description: string | null;
  priority: string;
  assignedToRole: string;
  isRequired: boolean;
  dueOffsetDays: number | null;
  category: string | null;
};

type TaskTemplate = {
  id: string;
  templateKey: string;
  name: string;
  description: string | null;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isActive: boolean;
  isDefault: boolean;
  publishedAt: string | null;
  updatedAt: string;
  items: TemplateItem[];
};

type NewItem = Omit<TemplateItem, 'id' | 'orderIndex'>;

type MigrationPreview = {
  previewReference: string;
  expiresAt: string;
  summary: {
    bookingCount: number;
    updateCount: number;
    addCount: number;
    cancelCount: number;
    excludedCount: number;
  };
};

const emptyItem: NewItem = {
  title: '',
  description: '',
  priority: 'medium',
  assignedToRole: 'ADMIN',
  isRequired: true,
  dueOffsetDays: 7,
  category: 'operations',
};

const defaultTemplateCategory: Category = {
  id: '__default__',
  name: 'General fallback template',
  categoryKey: 'general_event',
  status: 'active',
};

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { 'content-type': 'application/json', ...init.headers } : init?.headers,
    cache: 'no-store',
  });
  const payload = await response.json() as { data?: T; error?: string };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error || 'Task template request failed.');
  }

  return payload.data;
}

function statusClass(template: TaskTemplate) {
  if (template.status === 'DRAFT') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (template.status === 'PUBLISHED' && template.isActive) return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return 'border-zinc-200 bg-zinc-100 text-zinc-600';
}

export default function TaskTemplatesPanel({
  currentUserRole,
}: {
  currentUserRole: 'SUPERADMIN' | 'ADMIN';
}) {
  const canManage = currentUserRole === 'SUPERADMIN';
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newItem, setNewItem] = useState<NewItem>(emptyItem);
  const [migrationPreview, setMigrationPreview] = useState<MigrationPreview | null>(null);
  const [cancelRemovedTasks, setCancelRemovedTasks] = useState(false);

  const selected = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? templates[0] ?? null,
    [selectedId, templates],
  );

  const loadCategories = useCallback(async () => {
    const data = await apiRequest<Category[]>('/api/admin/event-categories');
    const activeCategories = data.filter((category) => category.status !== 'archived');
    setCategories([defaultTemplateCategory, ...activeCategories]);
  }, []);

  const loadTemplates = useCallback(async (id: string, preferredId?: string) => {
    if (!id) {
      setTemplates([]);
      setSelectedId('');
      return;
    }

    const endpoint = id === defaultTemplateCategory.id
      ? '/api/admin/command-center/task-templates'
      : `/api/admin/event-categories/${encodeURIComponent(id)}/task-templates`;
    const data = await apiRequest<TaskTemplate[]>(endpoint);
    setTemplates(data);
    setSelectedId((current) => {
      if (preferredId && data.some((template) => template.id === preferredId)) return preferredId;
      if (data.some((template) => template.id === current)) return current;
      return data.find((template) => template.status === 'DRAFT')?.id || data[0]?.id || '';
    });
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        await loadCategories();
        setCategoryId(defaultTemplateCategory.id);
        await loadTemplates(defaultTemplateCategory.id);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load task templates.');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadCategories, loadTemplates]);

  const selectCategory = (id: string) => {
    setCategoryId(id);
    setMigrationPreview(null);
    setError('');
    void loadTemplates(id).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load task templates.');
    });
  };

  const run = async (action: () => Promise<TaskTemplate>, message: string) => {
    try {
      setWorking(true);
      setError('');
      setNotice('');
      const result = await action();
      await loadTemplates(categoryId, result.id);
      setNotice(message);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update task template.');
    } finally {
      setWorking(false);
    }
  };

  const updateItem = (itemId: string, changes: Partial<TemplateItem>) => {
    setTemplates((current) => current.map((template) => template.id !== selected?.id
      ? template
      : {
          ...template,
          items: template.items.map((item) => item.id === itemId ? { ...item, ...changes } : item),
        }));
  };

  const saveTemplate = async () => {
    if (!selected) return;
    await run(
      () => apiRequest<TaskTemplate>(`/api/admin/command-center/task-templates/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: selected.name, description: selected.description }),
      }),
      'Draft details saved.',
    );
  };

  const saveItem = async (item: TemplateItem) => {
    await run(
      () => apiRequest<TaskTemplate>(`/api/admin/command-center/task-templates/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify(item),
      }),
      `Saved task ${item.orderIndex}.`,
    );
  };

  const reorder = async (itemId: string, direction: -1 | 1) => {
    if (!selected) return;
    const currentIndex = selected.items.findIndex((item) => item.id === itemId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= selected.items.length) return;
    const ids = selected.items.map((item) => item.id);
    [ids[currentIndex], ids[targetIndex]] = [ids[targetIndex], ids[currentIndex]];
    await run(
      () => apiRequest<TaskTemplate>(`/api/admin/command-center/task-templates/${selected.id}/reorder`, {
        method: 'POST',
        body: JSON.stringify({ orderedItemIds: ids }),
      }),
      'Task order updated.',
    );
  };

  const addItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    await run(
      () => apiRequest<TaskTemplate>(`/api/admin/command-center/task-templates/${selected.id}/items`, {
        method: 'POST',
        body: JSON.stringify(newItem),
      }),
      'Task added to the draft.',
    );
    setNewItem(emptyItem);
  };

  const previewMigration = async () => {
    if (!selected) return;
    try {
      setWorking(true); setError(''); setNotice('');
      const preview = await apiRequest<MigrationPreview>('/api/admin/command-center/task-migrations/preview', {
        method: 'POST',
        body: JSON.stringify({ targetTemplateId: selected.id }),
      });
      setMigrationPreview(preview);
      setNotice('Impact preview generated. Review the counts before applying.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to preview the migration.');
    } finally { setWorking(false); }
  };

  const applyMigration = async () => {
    if (!migrationPreview) return;
    try {
      setWorking(true); setError(''); setNotice('');
      const result = await apiRequest<{ updated: number; added: number; cancelled: number; skipped: number }>('/api/admin/command-center/task-migrations/apply', {
        method: 'POST',
        body: JSON.stringify({
          previewReference: migrationPreview.previewReference,
          idempotencyKey: crypto.randomUUID(),
          fields: ['title', 'description', 'priority', 'assignedToRole', 'category', 'dueDate'],
          addNewTasks: true,
          cancelRemovedTasks,
        }),
      });
      setMigrationPreview(null);
      setNotice(`Migration applied: ${result.updated} updated, ${result.added} added, ${result.cancelled} cancelled, ${result.skipped} skipped.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to apply the migration.');
    } finally { setWorking(false); }
  };

  if (loading) {
    return <div className="flex min-h-[500px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#8E7722]" /></div>;
  }

  return (
    <div className="flex flex-col gap-6 text-[#1a1f18] dark:text-[#F4F4F0]">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em]">Task Templates</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Review automatically generated drafts, publish immutable versions, and preserve booking-specific task snapshots.
          </p>
        </div>
        <label className="flex min-w-72 flex-col gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8E7722]">
          Event category
          <select value={categoryId} onChange={(event) => selectCategory(event.target.value)} className="rounded-xl border border-[#D6B53B]/30 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#1a1f18] dark:bg-[#141A13] dark:text-white">
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name} · {category.categoryKey}</option>)}
          </select>
        </label>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}
      {!canManage && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">Read-only access: only a Super Admin can create, edit, publish, archive, or migrate task templates.</div>}

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#D6B53B]/20 bg-white/80 p-4 shadow-sm dark:bg-white/5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8E7722]">Version history</p>
          <div className="space-y-2">
            {templates.map((template) => (
              <button key={template.id} type="button" onClick={() => setSelectedId(template.id)} className={`w-full rounded-xl border p-3 text-left transition ${template.id === selected?.id ? 'border-[#D6B53B] bg-[#FDF5CC]/50' : 'border-gray-200 hover:border-[#D6B53B]/50 dark:border-white/10'}`}>
                <div className="flex items-center justify-between gap-2"><span className="font-bold">Version {template.version}</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClass(template)}`}>{template.isActive ? 'ACTIVE ' : ''}{template.status}</span></div>
                <p className="mt-1 truncate font-mono text-[11px] text-gray-500">{template.templateKey}</p>
              </button>
            ))}
          </div>
        </aside>

        {!selected ? (
          <div className="rounded-2xl border border-dashed border-[#D6B53B]/30 p-12 text-center text-gray-500">No task template is available for this category.</div>
        ) : (
          <fieldset disabled={!canManage} className="min-w-0 space-y-5 disabled:opacity-95">
            <section className="rounded-2xl border border-[#D6B53B]/20 bg-white/90 p-5 shadow-sm dark:bg-white/5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-3">
                  <input aria-label="Task template name" disabled={selected.status !== 'DRAFT'} value={selected.name} onChange={(event) => setTemplates((current) => current.map((template) => template.id === selected.id ? { ...template, name: event.target.value } : template))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-xl font-bold disabled:bg-gray-50 dark:border-white/10 dark:bg-white/5" />
                  <textarea aria-label="Task template description" disabled={selected.status !== 'DRAFT'} value={selected.description ?? ''} onChange={(event) => setTemplates((current) => current.map((template) => template.id === selected.id ? { ...template, description: event.target.value } : template))} rows={2} className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm disabled:bg-gray-50 dark:border-white/10 dark:bg-white/5" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'DRAFT' ? <>
                    <button disabled={working} onClick={() => void saveTemplate()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold"><Save className="h-4 w-4" /> Save details</button>
                    <button disabled={working} onClick={() => void run(() => apiRequest<TaskTemplate>(`/api/admin/command-center/task-templates/${selected.id}/publish`, { method: 'POST' }), 'Template published for future bookings.')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"><CheckCircle2 className="h-4 w-4" /> Publish</button>
                  </> : selected.status === 'PUBLISHED' ? <button disabled={working} onClick={() => void run(() => apiRequest<TaskTemplate>(`/api/admin/command-center/task-templates/${selected.id}/clone-version`, { method: 'POST' }), 'New editable draft version created.')} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2 text-sm font-bold text-[#FDF5CC]"><CopyPlus className="h-4 w-4" /> Edit as new version</button> : null}
                  {!selected.isDefault && selected.status !== 'ARCHIVED' && <button disabled={working} onClick={() => void run(() => apiRequest<TaskTemplate>(`/api/admin/command-center/task-templates/${selected.id}/archive`, { method: 'POST' }), 'Template archived.')} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700"><Archive className="h-4 w-4" /> Archive</button>}
                </div>
              </div>
            </section>

            {selected.status === 'PUBLISHED' && selected.isActive && (
              <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 text-blue-950">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 font-bold"><GitCompareArrows className="h-5 w-5" /> Reviewed existing-task migration</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-blue-800">Future bookings already use this version. Existing booking tasks change only through a short-lived impact preview; completed, cancelled, customized, or unverifiable tasks are excluded.</p>
                  </div>
                  <button type="button" disabled={working} onClick={() => void previewMigration()} className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-bold">Generate impact preview</button>
                </div>
                {migrationPreview && <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {[['Bookings', migrationPreview.summary.bookingCount], ['Updates', migrationPreview.summary.updateCount], ['New tasks', migrationPreview.summary.addCount], ['Removed', migrationPreview.summary.cancelCount], ['Excluded', migrationPreview.summary.excludedCount], ['Expires', new Date(migrationPreview.expiresAt).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' })]].map(([label, value]) => <div key={String(label)}><span className="block text-[10px] font-bold uppercase tracking-wider text-blue-500">{label}</span><b className="text-lg">{value}</b></div>)}
                  </div>
                  <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={cancelRemovedTasks} onChange={(event) => setCancelRemovedTasks(event.target.checked)} className="mt-1" /><span>Cancel eligible tasks removed from the new template. They will never be deleted.</span></label>
                  <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setMigrationPreview(null)} className="rounded-xl border px-4 py-2 text-sm font-bold">Discard preview</button><button type="button" disabled={working} onClick={() => void applyMigration()} className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-bold text-white">Apply reviewed migration</button></div>
                </div>}
              </section>
            )}

            <section className="space-y-3">
              {selected.items.map((item, index) => (
                <article key={item.id} className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="grid gap-3 lg:grid-cols-[48px_minmax(0,1fr)_150px_160px_auto] lg:items-start">
                    <div className="flex flex-row items-center gap-1 lg:flex-col"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FDF5CC] font-mono text-sm font-bold text-[#8E7722]">{item.orderIndex}</span>{selected.status === 'DRAFT' && <div className="flex lg:flex-col"><button disabled={index === 0 || working} onClick={() => void reorder(item.id, -1)} aria-label="Move task up"><ArrowUp className="h-4 w-4" /></button><button disabled={index === selected.items.length - 1 || working} onClick={() => void reorder(item.id, 1)} aria-label="Move task down"><ArrowDown className="h-4 w-4" /></button></div>}</div>
                    <div className="space-y-2"><input aria-label={`Task ${item.orderIndex} title`} disabled={selected.status !== 'DRAFT'} value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 font-bold disabled:bg-gray-50 dark:border-white/10 dark:bg-white/5" /><textarea aria-label={`Task ${item.orderIndex} description`} disabled={selected.status !== 'DRAFT'} value={item.description ?? ''} onChange={(event) => updateItem(item.id, { description: event.target.value })} rows={2} className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 dark:border-white/10 dark:bg-white/5" /></div>
                    <div className="space-y-2"><select aria-label={`Task ${item.orderIndex} priority`} disabled={selected.status !== 'DRAFT'} value={item.priority} onChange={(event) => updateItem(item.id, { priority: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:bg-[#141A13]"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select><input aria-label={`Task ${item.orderIndex} category`} disabled={selected.status !== 'DRAFT'} value={item.category ?? ''} onChange={(event) => updateItem(item.id, { category: event.target.value })} placeholder="Category" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:bg-white/5" /></div>
                    <div className="space-y-2"><select aria-label={`Task ${item.orderIndex} assigned role`} disabled={selected.status !== 'DRAFT'} value={item.assignedToRole} onChange={(event) => updateItem(item.id, { assignedToRole: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:bg-[#141A13]"><option value="ADMIN">Admin</option><option value="SUPERADMIN">Super Admin</option></select><label className="flex items-center gap-2 text-xs font-semibold">Due days before event <input disabled={selected.status !== 'DRAFT'} type="number" min="0" value={item.dueOffsetDays ?? ''} onChange={(event) => updateItem(item.id, { dueOffsetDays: event.target.value === '' ? null : Number(event.target.value) })} className="w-16 rounded border px-2 py-1 dark:bg-white/5" /></label></div>
                    {selected.status === 'DRAFT' && <div className="flex gap-2"><button disabled={working} onClick={() => void saveItem(item)} className="rounded-lg border border-gray-200 p-2" aria-label="Save task"><Save className="h-4 w-4" /></button><button disabled={working} onClick={() => void run(() => apiRequest<TaskTemplate>(`/api/admin/command-center/task-templates/items/${item.id}`, { method: 'DELETE' }), 'Task removed from draft.')} className="rounded-lg border border-red-200 p-2 text-red-700" aria-label="Delete task"><Trash2 className="h-4 w-4" /></button></div>}
                  </div>
                </article>
              ))}
            </section>

            {selected.status === 'DRAFT' && <form onSubmit={addItem} className="rounded-2xl border border-dashed border-[#D6B53B]/50 bg-[#FDF5CC]/20 p-5"><h2 className="font-bold">Add task</h2><div className="mt-3 grid gap-3 md:grid-cols-2"><input aria-label="New task title" required placeholder="Task title" value={newItem.title} onChange={(event) => setNewItem((current) => ({ ...current, title: event.target.value }))} className="rounded-lg border px-3 py-2 dark:bg-white/5" /><input aria-label="New task category" placeholder="Task category" value={newItem.category ?? ''} onChange={(event) => setNewItem((current) => ({ ...current, category: event.target.value }))} className="rounded-lg border px-3 py-2 dark:bg-white/5" /><textarea aria-label="New task description" placeholder="Description" value={newItem.description ?? ''} onChange={(event) => setNewItem((current) => ({ ...current, description: event.target.value }))} className="rounded-lg border px-3 py-2 md:col-span-2 dark:bg-white/5" /><button disabled={working} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2 font-bold text-[#FDF5CC] md:col-span-2"><Plus className="h-4 w-4" /> Add task</button></div></form>}
          </fieldset>
        )}
      </div>
      {working && <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-[#1a1f18] px-4 py-2 text-sm font-bold text-white shadow-xl"><Loader2 className="h-4 w-4 animate-spin" /> Saving</div>}
    </div>
  );
}
