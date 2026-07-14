'use client';

import { useState } from 'react';
import { BrainCircuit, MessagesSquare } from 'lucide-react';
import SupportCenterClient from '../support/SupportCenterClient';
import AssistantKnowledgePanel from './AssistantKnowledgePanel';

export default function AssistantWorkspacePanel({ currentUserRole }: { currentUserRole: 'SUPERADMIN' | 'ADMIN' }) {
  const [section, setSection] = useState<'sources' | 'faq'>('sources');
  return <div className="space-y-5"><div className="flex gap-2 border-b border-[#D6B53B]/20 pb-3"><button onClick={() => setSection('sources')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${section === 'sources' ? 'bg-[#1a1f18] text-[#FDF5CC]' : 'border bg-white dark:bg-white/5'}`}><BrainCircuit className="h-4 w-4" /> Verified sources</button><button onClick={() => setSection('faq')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${section === 'faq' ? 'bg-[#1a1f18] text-[#FDF5CC]' : 'border bg-white dark:bg-white/5'}`}><MessagesSquare className="h-4 w-4" /> FAQ, testing & analytics</button></div>{section === 'sources' ? <AssistantKnowledgePanel currentUserRole={currentUserRole} /> : <SupportCenterClient currentUserRole={currentUserRole} />}</div>;
}

