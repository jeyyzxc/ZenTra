'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  MailPlus,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  Trash2,
  UserX,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ExportFormatMenu, { type ExportFormat } from '@/components/admin/ExportFormatMenu';
import { composeAdminAddress } from '@/lib/admin-address-options';
import {
  deleteTeamMember,
  disableTeamMember,
  inviteTeamMember,
  resendInvitation,
  sendPasswordResetLink,
  sendTemporaryAccessCode,
  updateTeamMember,
} from './actions';
import type { AdminRole, TeamMember, TeamMemberStatus } from './types';

type FormState = {
  id?: string;
  fullName: string;
  email: string;
  contactNumber: string;
  role: AdminRole;
  status: TeamMemberStatus;
};

type Notice = {
  tone: 'success' | 'error' | 'warning';
  message: string;
} | null;

type SecurityActionType = 'resend' | 'reset' | 'temp' | 'disable' | 'delete';

type SecurityActionState = {
  type: SecurityActionType;
  member: TeamMember;
} | null;

const EMPTY_FORM: FormState = {
  fullName: '',
  email: '',
  contactNumber: '',
  role: 'ADMIN',
  status: 'PENDING_SETUP',
};

const ROLE_OPTIONS: Array<{ value: AdminRole; label: string }> = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPERADMIN', label: 'Super Admin' },
];

const STATUS_OPTIONS: Array<{ value: TeamMemberStatus; label: string }> = [
  { value: 'PENDING_SETUP', label: 'Pending Setup' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DISABLED', label: 'Disabled' },
  { value: 'LOCKED', label: 'Locked' },
];

const STATUS_LABELS: Record<TeamMemberStatus, string> = {
  PENDING_SETUP: 'Pending Setup',
  ACTIVE: 'Active',
  TEMP_ACCESS: 'Temporary Access',
  PASSWORD_RESET_REQUIRED: 'Password Reset Required',
  DISABLED: 'Disabled',
  LOCKED: 'Locked',
  INVITATION_EXPIRED: 'Invitation Expired',
  RESET_EXPIRED: 'Reset Expired',
};

function memberName(member: TeamMember) {
  return member.fullName?.trim() || member.email;
}

function statusLabel(status: TeamMemberStatus) {
  return STATUS_LABELS[status] ?? status;
}

function roleLabel(role: AdminRole) {
  return role === 'SUPERADMIN' ? 'Super Admin' : 'Admin';
}

function avatarStyle(profileImage: string | null): React.CSSProperties | undefined {
  return profileImage ? { backgroundImage: `url("${profileImage}")` } : undefined;
}

function formatContactNumber(contactNumber: string | null) {
  if (!contactNumber) {
    return 'Not provided';
  }

  const digits = contactNumber.replace(/\D/g, '');
  const localDigits = digits.startsWith('63')
    ? digits.slice(2)
    : digits.startsWith('0') ? digits.slice(1) : digits;

  if (localDigits.length >= 10) {
    return `+63 ${[
      localDigits.slice(0, 3),
      localDigits.slice(3, 6),
      localDigits.slice(6, 10),
      localDigits.slice(10),
    ].filter(Boolean).join(' ')}`;
  }

  return contactNumber;
}

function formatMemberAddress(member: TeamMember) {
  return composeAdminAddress(member) || 'Not provided';
}

function formatProfileDate(value: Date | string | null) {
  if (!value) {
    return 'Not available';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function NoticeToast({ notice }: { notice: Notice }) {
  if (!notice || typeof document === 'undefined') {
    return null;
  }

  const isSuccess = notice.tone === 'success';
  const isWarning = notice.tone === 'warning';
  const Icon = isSuccess ? CheckCircle2 : ShieldAlert;
  const title = isSuccess ? 'Action Complete' : isWarning ? 'Needs Attention' : 'Action Failed';
  const shellClass = isSuccess
    ? 'border-emerald-200 bg-white text-emerald-900 dark:border-emerald-400/25 dark:bg-[#141A13] dark:text-emerald-100'
    : isWarning
      ? 'border-amber-200 bg-white text-amber-900 dark:border-amber-400/25 dark:bg-[#141A13] dark:text-amber-100'
      : 'border-red-200 bg-white text-red-900 dark:border-red-400/25 dark:bg-[#141A13] dark:text-red-100';
  const iconClass = isSuccess
    ? 'bg-emerald-100 text-emerald-700'
    : isWarning
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700';
  const barClass = isSuccess ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500';

  return createPortal(
    <div className="pointer-events-none fixed right-3 top-24 z-[1200] w-[calc(100vw-1.5rem)] max-w-md sm:right-6 lg:right-8">
      <div
        role={isSuccess ? 'status' : 'alert'}
        className={`relative overflow-hidden rounded-2xl border px-4 py-4 shadow-[0_24px_70px_rgba(12,16,11,0.22)] backdrop-blur-2xl ${shellClass}`}
      >
        <div className={`absolute inset-x-0 top-0 h-1 ${barClass}`} />
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-sahitya text-lg font-bold leading-tight">
              {title}
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug opacity-80">{notice.message}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  disabled = false,
  direction = 'down',
  fallbackLabel,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  disabled?: boolean;
  direction?: 'up' | 'down';
  fallbackLabel?: string;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(opt => opt.value === value) || {
    value,
    label: fallbackLabel ?? 'Select...',
  };

  return (
    <div className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">
        {label}
      </span>
      <div className={`relative group/input ${open ? 'z-[100]' : 'z-0'}`} ref={ref}>
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
          className={`flex h-10 w-full items-center justify-between rounded-xl border ${open ? 'border-[#D6B53B] bg-white ring-2 ring-[#D6B53B]/20 dark:bg-[#1a1f18] dark:border-[#D6B53B]' : 'border-[#D6B53B]/30 bg-white dark:border-white/10 dark:bg-white/5'} px-3 font-sans text-sm shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all duration-300 ${!disabled ? 'hover:border-[#D6B53B]/50 hover:bg-[#FFF2DB]/30 dark:hover:bg-white/10 hover:shadow-sm cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
        >
          <span className={`block min-w-0 truncate pr-7 text-left ${value ? 'text-gray-900 font-medium dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            {selected?.label || 'Select...'}
          </span>
          <div className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${open ? 'text-[#D6B53B] rotate-180' : 'text-gray-400 group-hover/input:text-[#D6B53B]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </button>

        {open && !disabled && (
          <div className={`absolute left-0 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(47,62,50,0.15)] z-[100] py-1.5 dark:border-white/10 dark:bg-[#1a1f18]/95 events-scrollbar ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
            {options.map(opt => (
              <button
                key={opt.value as string}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center px-3 py-2.5 text-left text-sm transition-colors ${value === opt.value ? 'bg-[#FFF2DB] text-[#8E7722] font-semibold dark:bg-[#D6B53B]/20 dark:text-[#D6B53B]' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TeamMemberStatus }) {
  const isActive = status === 'ACTIVE';
  const isPending = status === 'PENDING_SETUP' || status === 'TEMP_ACCESS' || status === 'PASSWORD_RESET_REQUIRED';
  const isExpired = status === 'INVITATION_EXPIRED' || status === 'RESET_EXPIRED';
  const tone = isActive
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300'
    : isPending
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300'
      : isExpired
        ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300'
        : 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300';
  const Icon = isActive ? CheckCircle2 : isPending || isExpired ? Clock3 : LockKeyhole;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {statusLabel(status)}
    </span>
  );
}

function AdminInfoTile({
  icon: Icon,
  label,
  value,
  truncate = true,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  truncate?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="group/tile relative flex h-full flex-col justify-center rounded-2xl border border-[#D6B53B]/15 bg-white/70 px-4 py-3 shadow-sm transition-all focus-within:border-[#D6B53B]/50 focus-within:ring-1 focus-within:ring-[#D6B53B]/20 hover:border-[#D6B53B]/30 dark:border-white/10 dark:bg-white/[0.03] dark:focus-within:border-[#D6B53B] dark:hover:border-white/20">
      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-[#A3B19B]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {children !== undefined ? (
        children
      ) : (
        <p className={`text-sm font-semibold text-gray-900 dark:text-white ${truncate ? 'min-w-0 truncate' : 'break-words'}`}>{value}</p>
      )}
    </div>
  );
}

function SecurityActionDialog({
  action,
  reason,
  isSubmitting,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  action: SecurityActionState;
  reason: string;
  isSubmitting: boolean;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!action) {
    return null;
  }

  const requiresReason = action.type === 'reset' || action.type === 'temp';
  const copy = {
    resend: {
      title: 'Resend invitation?',
      body: `A new setup link will be sent to ${memberName(action.member)}.`,
      confirm: 'Send Invitation',
      icon: RotateCcw,
    },
    reset: {
      title: 'Send password reset link?',
      body: `A secure reset link will be sent to ${memberName(action.member)}.`,
      confirm: 'Send Reset Link',
      icon: KeyRound,
    },
    temp: {
      title: 'Send temporary access code?',
      body: `A temporary code will be sent to ${memberName(action.member)} and will expire after 15 minutes.`,
      confirm: 'Send Code',
      icon: LockKeyhole,
    },
    disable: {
      title: 'Disable account?',
      body: `${memberName(action.member)} will no longer be able to access the admin panel.`,
      confirm: 'Disable Account',
      icon: UserX,
    },
    delete: {
      title: 'Delete permanently?',
      body: `${memberName(action.member)} will be removed from Team Management, authentication, active sessions, account tokens, and direct team-access delivery records. This cannot be undone.`,
      confirm: 'Delete Permanently',
      icon: Trash2,
    },
  }[action.type];
  const Icon = copy.icon;
  const isDestructive = action.type === 'delete';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-[#D6B53B]/25 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] dark:border-white/10 dark:bg-[#141A13]">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FDF5CC] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-sahitya text-2xl font-bold text-gray-950 dark:text-white">{copy.title}</h3>
            <p className="mt-1 text-sm font-medium leading-6 text-gray-600 dark:text-[#A3B19B]">{copy.body}</p>
          </div>
        </div>

        {requiresReason && (
          <label className="mt-5 block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">
              Reason
            </span>
            <span className="group/reason relative block">
              <textarea
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                rows={4}
                maxLength={500}
                className="peer team-reason-textarea min-h-24 w-full resize-none rounded-xl border border-[#D6B53B]/30 bg-white px-3 py-3 pr-10 text-sm font-medium text-gray-900 shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-300 hover:border-[#D6B53B]/50 hover:bg-[#FFF2DB]/30 focus:border-[#D6B53B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus:border-[#D6B53B] dark:focus:bg-[#1a1f18]"
                required
              />
              <div className="pointer-events-none absolute bottom-3 right-2 z-10 text-[#B99A2E]/50 transition-colors duration-300 group-hover/reason:text-[#D6B53B]/70 peer-focus:text-[#D6B53B] dark:text-[#D6B53B]/50">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </span>
          </label>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-[#A3B19B] dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${isDestructive
              ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:text-white dark:hover:bg-red-400'
              : 'bg-[#1a1f18] hover:bg-[#D6B53B] dark:bg-[#D6B53B] dark:text-[#1a1f18] dark:hover:bg-white'
              }`}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamManagementClient({
  initialMembers,
  currentUserId,
}: {
  initialMembers: TeamMember[];
  currentUserId: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [securityAction, setSecurityAction] = useState<SecurityActionState>(null);
  const [reason, setReason] = useState('');
  const [isSecurityActionSubmitting, setIsSecurityActionSubmitting] = useState(false);
  const [isRefreshPending, startRefreshTransition] = useTransition();
  const noticeTimerRef = useRef<number | null>(null);
  const router = useRouter();
  const isEditing = Boolean(form.id);
  const editingMember = isEditing
    ? members.find((member) => member.id === form.id) ?? null
    : null;

  useEffect(() => {
    if (!notice) {
      return;
    }

    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, notice.tone === 'success' ? 3000 : notice.tone === 'warning' ? 8000 : 5000);

    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, [notice]);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setForm({
      id: member.id,
      fullName: member.fullName ?? '',
      email: member.email,
      contactNumber: member.contactNumber ?? '',
      role: member.role,
      status: member.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setFormError('');
    }
  };

  const showSuccess = (message: string) => setNotice({ tone: 'success', message });
  const showError = (message: string) => setNotice({ tone: 'error', message });
  const showWarning = (message: string) => setNotice({ tone: 'warning', message });

  const refreshTeamMembers = () => {
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const exportTeamMembers = (format: ExportFormat) => {
    if (format === 'print') {
      window.print();
      return;
    }

    const params = new URLSearchParams({
      format,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    window.location.href = `/api/team-members/export?${params.toString()}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if ((!isEditing && !form.fullName.trim()) || !form.email.trim()) {
      setFormError('Full name and email address are required.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      if (form.id) {
        const updated = await updateTeamMember({
          id: form.id,
          fullName: form.fullName,
          email: form.email,
          contactNumber: form.contactNumber,
          role: form.role,
          status: form.status,
        });
        setMembers((current) => current.map((member) => (
          member.id === updated.id ? updated : member
        )));
        showSuccess(`${memberName(updated)} was updated successfully.`);
      } else {
        const result = await inviteTeamMember({
          fullName: form.fullName,
          email: form.email,
          contactNumber: form.contactNumber,
          role: form.role,
        });
        const created = result.member;
        setMembers((current) => [created, ...current]);
        if (result.deliveryWarning) {
          showWarning(result.deliveryWarning);
        } else {
          showSuccess(`Invitation sent to ${memberName(created)}.`);
        }
      }

      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save this team member.';
      setFormError(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSecurityAction = (type: SecurityActionType, member: TeamMember) => {
    setReason('');
    setSecurityAction({ type, member });
  };

  const executeSecurityAction = async () => {
    if (!securityAction) {
      return;
    }

    if ((securityAction.type === 'reset' || securityAction.type === 'temp') && reason.trim().length < 5) {
      showError('A reason of at least 5 characters is required.');
      return;
    }

    setIsSecurityActionSubmitting(true);

    try {
      if (securityAction.type === 'resend') {
        const result = await resendInvitation(securityAction.member.id);
        if (result.deliveryWarning) {
          showWarning(result.deliveryWarning);
        } else {
          showSuccess(`Invitation sent to ${memberName(securityAction.member)}.`);
        }
      } else if (securityAction.type === 'reset') {
        const result = await sendPasswordResetLink(securityAction.member.id, reason);
        if (result.deliveryWarning) {
          showWarning(result.deliveryWarning);
        } else {
          showSuccess(`Password reset link sent to ${memberName(securityAction.member)}.`);
        }
      } else if (securityAction.type === 'temp') {
        const result = await sendTemporaryAccessCode(securityAction.member.id, reason);
        if (result.deliveryWarning) {
          showWarning(result.deliveryWarning);
        } else {
          showSuccess(`Temporary access code sent to ${memberName(securityAction.member)}.`);
        }
      } else if (securityAction.type === 'disable') {
        const updated = await disableTeamMember(securityAction.member.id);
        setMembers((current) => current.map((member) => (
          member.id === updated.id ? updated : member
        )));
        showSuccess(`${memberName(updated)} was disabled.`);
      } else {
        const result = await deleteTeamMember(securityAction.member.id);
        setMembers((current) => current.filter((member) => member.id !== result.deletedId));
        showSuccess(`${memberName(securityAction.member)} was deleted permanently.`);
      }

      setSecurityAction(null);
      setReason('');
      router.refresh();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unable to complete this action.');
    } finally {
      setIsSecurityActionSubmitting(false);
    }
  };

  return (
    <div className="w-full p-4 sm:p-8">
      <div className="mb-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em] text-[#1a1f18] dark:text-[#F4F4F0]">
            Team Management
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Manage invitations, account recovery, and administrative access.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={refreshTeamMembers}
            disabled={isRefreshPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6B53B]/30 bg-white/80 px-4 py-2.5 font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-[#8E7722] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D6B53B] hover:bg-[#FDF5CC] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-[#D6B53B] dark:hover:bg-[#D6B53B]/10"
          >
            {isRefreshPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 font-medium shadow-[0_10px_20px_rgba(26,31,24,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_25px_rgba(214,181,59,0.25)] active:translate-y-0 active:scale-[0.98] focus:outline-none"
          >
            <div className="absolute inset-0 bg-[#1a1f18] transition-transform duration-500 ease-in-out group-hover:translate-x-full dark:bg-[#D6B53B]" />
            <div className="absolute inset-0 -translate-x-full bg-[#D6B53B] transition-transform duration-500 ease-in-out group-hover:translate-x-0 dark:bg-[#1a1f18]" />
            <span className="relative z-10 flex items-center gap-2 font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-white dark:text-[#1a1f18] group-hover:text-white">
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              Add Team Member
            </span>
          </button>
          <ExportFormatMenu onExport={exportTeamMembers} />
        </div>
      </div>

      <NoticeToast notice={notice} />

      <div className="overflow-hidden rounded-3xl border border-[#D6B53B]/20 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-[#141A13]/80 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#D6B53B]/20 bg-gradient-to-r from-[#FDF5CC]/40 to-transparent dark:border-white/10 dark:from-[#D6B53B]/10">
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-[#A3B19B]">Account</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-[#A3B19B]">Role</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-[#A3B19B]">Status</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-[#A3B19B]">Created</th>
                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-[#A3B19B]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6B53B]/10 dark:divide-white/5">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-[#A3B19B]">
                      <Shield className="mb-3 h-12 w-12 opacity-20" />
                      <p className="text-lg">No administrator accounts found.</p>
                    </div>
                  </td>
                </tr>
              ) : members.map((member) => {
                const isCurrentUser = member.id === currentUserId;
                const isPending = member.status === 'PENDING_SETUP';
                const canRecover = !isCurrentUser && !isPending && member.status !== 'DISABLED' && member.status !== 'LOCKED';

                return (
                  <tr
                    key={member.id}
                    onClick={() => openEditModal(member)}
                    className="group cursor-pointer transition-all duration-300 hover:bg-[#FDF5CC]/20 dark:hover:bg-white/5"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#D6B53B]/30 bg-gradient-to-br from-[#FDF5CC] to-white bg-cover bg-center shadow-inner dark:from-[#2A3029] dark:to-[#141A13]"
                          style={avatarStyle(member.profileImage)}
                          role={member.profileImage ? 'img' : undefined}
                          aria-label={`${memberName(member)} profile picture`}
                        >
                          {!member.profileImage && (
                            <span className="font-sahitya text-lg font-bold text-[#8E7722] dark:text-[#D6B53B]">
                              {memberName(member).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                            <span className="truncate text-base transition-colors group-hover:text-[#D6B53B]">
                              {memberName(member)}
                            </span>
                            {isCurrentUser && (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-sm text-gray-500 transition-colors group-hover:text-gray-600 dark:text-[#A3B19B] dark:group-hover:text-gray-300">
                            {member.email}
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-gray-400">
                            {formatContactNumber(member.contactNumber)}
                          </div>
                          <div className="mt-1 flex max-w-[340px] items-center gap-1.5 text-xs font-semibold text-gray-400 transition-colors group-hover:text-[#8E7722] dark:group-hover:text-[#D6B53B]">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{formatMemberAddress(member)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${member.role === 'SUPERADMIN'
                        ? 'border-[#D6B53B]/40 bg-gradient-to-r from-[#D6B53B]/10 to-[#FDF5CC]/30 text-[#8E7722] dark:from-[#D6B53B]/20 dark:to-transparent dark:text-[#D6B53B]'
                        : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-[#141A13] dark:text-[#A3B19B]'
                        }`}>
                        {member.role === 'SUPERADMIN' ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4 opacity-70" />}
                        {roleLabel(member.role)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-500 dark:text-[#A3B19B]">
                      {new Date(member.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => openSecurityAction('resend', member)}
                            className="rounded-xl p-2.5 text-gray-500 transition-all hover:bg-white hover:text-[#8E7722] hover:shadow-sm hover:ring-1 hover:ring-[#D6B53B]/30 dark:text-[#A3B19B] dark:hover:bg-[#2A3029] dark:hover:text-[#D6B53B] dark:hover:ring-white/10"
                            title="Resend invitation"
                            aria-label={`Resend invitation to ${memberName(member)}`}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openSecurityAction('reset', member)}
                          disabled={!canRecover}
                          className="rounded-xl p-2.5 text-gray-500 transition-all hover:bg-white hover:text-[#8E7722] hover:shadow-sm hover:ring-1 hover:ring-[#D6B53B]/30 disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#A3B19B] dark:hover:bg-[#2A3029] dark:hover:text-[#D6B53B] dark:hover:ring-white/10"
                          title="Send password reset link"
                          aria-label={`Send password reset link to ${memberName(member)}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openSecurityAction('temp', member)}
                          disabled={!canRecover}
                          className="rounded-xl p-2.5 text-gray-500 transition-all hover:bg-white hover:text-[#8E7722] hover:shadow-sm hover:ring-1 hover:ring-[#D6B53B]/30 disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#A3B19B] dark:hover:bg-[#2A3029] dark:hover:text-[#D6B53B] dark:hover:ring-white/10"
                          title="Send temporary access code"
                          aria-label={`Send temporary access code to ${memberName(member)}`}
                        >
                          <LockKeyhole className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openSecurityAction('disable', member)}
                          disabled={isCurrentUser || member.status === 'DISABLED'}
                          className="rounded-xl p-2.5 text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 hover:shadow-sm hover:ring-1 hover:ring-red-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#A3B19B] dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:ring-red-500/20"
                          title={isCurrentUser ? 'You cannot disable your active account' : 'Disable account'}
                          aria-label={`Disable ${memberName(member)}`}
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openSecurityAction('delete', member)}
                          disabled={isCurrentUser}
                          className="rounded-xl p-2.5 text-gray-500 transition-all hover:bg-red-50 hover:text-red-700 hover:shadow-sm hover:ring-1 hover:ring-red-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#A3B19B] dark:hover:bg-red-500/10 dark:hover:text-red-300 dark:hover:ring-red-500/20"
                          title={isCurrentUser ? 'You cannot delete your own account' : 'Delete account permanently'}
                          aria-label={`Delete ${memberName(member)} permanently`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all duration-300"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-3xl rounded-[2rem] border border-[#D6B53B]/30 bg-white/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl dark:bg-[#141A13]/95 dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
            <div className="relative rounded-t-[2rem] border-b border-[#D6B53B]/20 bg-gradient-to-r from-[#FDF5CC]/50 to-transparent py-4 px-6 dark:from-[#D6B53B]/10">
              <div className="pr-8">
                <h2 className="font-sahitya text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                  {isEditing ? 'Edit Team Member' : 'Add Team Member'}
                </h2>
                <p className="mt-0 text-[15px] font-medium text-gray-600 dark:text-[#A3B19B]">
                  {isEditing ? 'Review profile information, then update email, role, and account status.' : 'Send a setup invitation to a team member.'}
                </p>
              </div>

            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 pb-5 pt-4">
              {editingMember && (
                <section className="rounded-3xl border border-[#D6B53B]/20 bg-gradient-to-br from-[#FDF5CC]/40 via-white to-white p-4 shadow-sm dark:border-white/10 dark:from-[#D6B53B]/10 dark:via-white/[0.03] dark:to-transparent">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div
                      className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#D6B53B]/30 bg-gradient-to-br from-[#FDF5CC] to-white bg-cover bg-center shadow-inner dark:from-[#2A3029] dark:to-[#141A13]"
                      style={avatarStyle(editingMember.profileImage)}
                      role={editingMember.profileImage ? 'img' : undefined}
                      aria-label={`${memberName(editingMember)} profile picture`}
                    >
                      {!editingMember.profileImage && (
                        <span className="font-sahitya text-2xl font-bold text-[#8E7722] dark:text-[#D6B53B]">
                          {memberName(editingMember).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E7722] dark:text-[#D6B53B]">
                        Admin Information
                      </p>
                      <h3 className="mt-1 truncate font-sahitya text-2xl font-bold text-gray-950 dark:text-white">
                        {form.fullName.trim() || memberName(editingMember)}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${form.role === 'SUPERADMIN'
                          ? 'border-[#D6B53B]/40 bg-[#FDF5CC]/70 text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]'
                          : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-[#A3B19B]'
                          }`}>
                          {form.role === 'SUPERADMIN' ? <ShieldAlert className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5 opacity-70" />}
                          {roleLabel(form.role)}
                        </div>
                        <StatusBadge status={form.status} />
                      </div>
                    </div>
                    <div className="w-full shrink-0 sm:ml-auto sm:w-auto sm:max-w-[320px]">
                      <AdminInfoTile icon={MapPin} label="Address" value={formatMemberAddress(editingMember)} truncate={false} />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <AdminInfoTile icon={Mail} label="Email Address">
                        <Edit className="absolute right-4 top-4 h-3.5 w-3.5 text-gray-400 opacity-50 transition-all group-focus-within/tile:text-[#D6B53B] group-focus-within/tile:opacity-100 group-hover/tile:opacity-100 dark:text-[#A3B19B]" />
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                          className="w-full bg-transparent text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-500"
                          placeholder="Enter email address"
                        />
                      </AdminInfoTile>
                    </div>
                    <AdminInfoTile icon={Phone} label="Phone" value={formatContactNumber(form.contactNumber || null)} />
                    <AdminInfoTile icon={CalendarDays} label="Joined" value={formatProfileDate(editingMember.createdAt)} />
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {!isEditing && (
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">
                      Full Name
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={255}
                      value={form.fullName}
                      onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                      className="h-10 w-full rounded-xl border border-[#D6B53B]/30 bg-white px-3 font-sans text-sm text-gray-900 shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all duration-300 hover:border-[#D6B53B]/50 hover:bg-[#FFF2DB]/30 hover:shadow-sm focus:border-[#D6B53B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus:border-[#D6B53B] dark:focus:bg-[#1a1f18]"
                    />
                  </label>
                )}
                {!isEditing && (
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">
                      Email Address
                    </span>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      className="h-10 w-full rounded-xl border border-[#D6B53B]/30 bg-white px-3 font-sans text-sm text-gray-900 shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all duration-300 hover:border-[#D6B53B]/50 hover:bg-[#FFF2DB]/30 hover:shadow-sm focus:border-[#D6B53B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus:border-[#D6B53B] dark:focus:bg-[#1a1f18]"
                    />
                  </label>
                )}

                <SelectField
                  id="team-role"
                  label="Role"
                  value={form.role}
                  disabled={form.id === currentUserId}
                  options={ROLE_OPTIONS}
                  direction="up"
                  onChange={(role) => setForm((current) => ({ ...current, role }))}
                />

                {isEditing && (
                  <SelectField
                    id="team-status"
                    label="Account Status"
                    value={form.status}
                    options={STATUS_OPTIONS}
                    disabled={form.id === currentUserId}
                    direction="up"
                    fallbackLabel={statusLabel(form.status)}
                    onChange={(status) => setForm((current) => ({ ...current, status }))}
                  />
                )}
              </div>

              {form.id === currentUserId && (
                <p className="text-xs font-semibold text-[#8E7722] dark:text-[#D6B53B]">
                  Your active super admin role and status cannot be changed here.
                </p>
              )}

              {formError && (
                <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex flex-col-reverse justify-end gap-4 border-t border-gray-100 pt-3 sm:flex-row dark:border-white/5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl px-4 py-2 text-[12px] font-bold tracking-widest text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1f18] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_10px_20px_rgba(26,31,24,0.15)] transition hover:-translate-y-0.5 hover:bg-[#D6B53B] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-[#D6B53B] dark:text-[#1a1f18] dark:hover:bg-white"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? <Send className="h-4 w-4" /> : <MailPlus className="h-4 w-4" />}
                  {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SecurityActionDialog
        action={securityAction}
        reason={reason}
        isSubmitting={isSecurityActionSubmitting}
        onReasonChange={setReason}
        onCancel={() => {
          if (!isSecurityActionSubmitting) {
            setSecurityAction(null);
            setReason('');
          }
        }}
        onConfirm={executeSecurityAction}
      />
    </div>
  );
}
