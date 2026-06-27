'use client';

import React, { useState } from 'react';
import { Edit, Eye, EyeOff, Plus, Shield, ShieldAlert, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createAdminUser, deleteTeamMember, updateAdminUser } from './actions';
import type { AdminRole, TeamMember } from './types';

type FormState = {
  id?: string;
  username: string;
  email: string;
  password: string;
  role: AdminRole;
};

const EMPTY_FORM: FormState = {
  username: '',
  email: '',
  password: '',
  role: 'ADMIN',
};

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
  const [pageError, setPageError] = useState('');
  const router = useRouter();
  const isEditing = Boolean(form.id);
  const [showPassword, setShowPassword] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setHasSubmitted(false);
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setForm({
      id: member.id,
      username: member.username,
      email: member.email,
      password: '',
      role: member.role,
    });
    setFormError('');
    setHasSubmitted(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setFormError('');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);
    
    if (!form.username || !form.email || (!form.id && !form.password)) {
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      if (form.id) {
        const updated = await updateAdminUser({
          id: form.id,
          username: form.username,
          email: form.email,
          password: form.password || undefined,
          role: form.role,
        });
        setMembers((current) => current.map((member) => (
          member.id === updated.id ? updated : member
        )));
      } else {
        const created = await createAdminUser({
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        setMembers((current) => [created, ...current]);
      }

      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save this team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (member: TeamMember) => {
    if (!window.confirm(`Revoke all admin access for @${member.username}?`)) {
      return;
    }

    setPageError('');

    try {
      await deleteTeamMember(member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      router.refresh();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to delete this team member.');
    }
  };

  return (
    <div className="w-full p-4 sm:p-8">
      {/* Page Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em] text-[#1a1f18] dark:text-[#F4F4F0]">
            Team Management
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Manage your team&apos;s access and administrative roles within the system.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 font-medium shadow-[0_10px_20px_rgba(26,31,24,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_25px_rgba(214,181,59,0.25)] active:translate-y-0 active:scale-[0.98] focus:outline-none"
        >
          <div className="absolute inset-0 bg-[#1a1f18] transition-transform duration-500 ease-in-out group-hover:translate-x-full dark:bg-[#D6B53B]" />
          <div className="absolute inset-0 -translate-x-full bg-[#D6B53B] transition-transform duration-500 ease-in-out group-hover:translate-x-0 dark:bg-[#1a1f18]" />
          <div className="relative z-10 flex items-center gap-2 font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-white dark:text-[#1a1f18] group-hover:text-white">
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            <span>Add Admin</span>
          </div>
        </button>
      </div>

      {pageError && (
        <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-4 text-sm font-medium text-red-700 shadow-sm backdrop-blur-sm dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-red-500" />
          {pageError}
        </div>
      )}

      {/* The Table Card */}
      <div className="overflow-hidden rounded-3xl border border-[#D6B53B]/20 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-[#141A13]/80 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#D6B53B]/20 bg-gradient-to-r from-[#FDF5CC]/40 to-transparent dark:border-white/10 dark:from-[#D6B53B]/10">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-[#A3B19B]">Account</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-[#A3B19B]">Role</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-[#A3B19B]">Created</th>
                <th className="px-8 py-5 text-right text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-[#A3B19B]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6B53B]/10 dark:divide-white/5">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-[#A3B19B]">
                      <Shield className="mb-3 h-12 w-12 opacity-20" />
                      <p className="text-lg">No administrator accounts found.</p>
                    </div>
                  </td>
                </tr>
              ) : members.map((member) => {
                const isCurrentUser = member.id === currentUserId;

                return (
                  <tr key={member.id} className="group transition-all duration-300 hover:bg-[#FDF5CC]/20 dark:hover:bg-white/5">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#D6B53B]/30 bg-gradient-to-br from-[#FDF5CC] to-white shadow-inner dark:from-[#2A3029] dark:to-[#141A13]">
                          <span className="font-sahitya text-xl font-bold text-[#8E7722] dark:text-[#D6B53B]">
                            {member.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                            <span className="truncate text-base transition-colors group-hover:text-[#D6B53B]">
                              @{member.username}
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
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-8 py-5">
                      <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${
                        member.role === 'SUPERADMIN'
                          ? 'border-[#D6B53B]/40 bg-gradient-to-r from-[#D6B53B]/10 to-[#FDF5CC]/30 text-[#8E7722] dark:from-[#D6B53B]/20 dark:to-transparent dark:text-[#D6B53B]'
                          : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-[#141A13] dark:text-[#A3B19B]'
                      }`}>
                        {member.role === 'SUPERADMIN' ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4 opacity-70" />}
                        {member.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-8 py-5 text-sm font-medium text-gray-500 dark:text-[#A3B19B]">
                      {new Date(member.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="whitespace-nowrap px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-60 transition-opacity duration-300 group-hover:opacity-100">
                        <button
                          onClick={() => openEditModal(member)}
                          className="rounded-xl p-2.5 text-gray-500 transition-all hover:bg-white hover:text-blue-600 hover:shadow-sm hover:ring-1 hover:ring-gray-200 dark:text-[#A3B19B] dark:hover:bg-[#2A3029] dark:hover:text-[#D6B53B] dark:hover:ring-white/10"
                          title="Edit account"
                          aria-label={`Edit ${member.username}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member)}
                          disabled={isCurrentUser}
                          className="rounded-xl p-2.5 text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 hover:shadow-sm hover:ring-1 hover:ring-red-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#A3B19B] dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:ring-red-500/20"
                          title={isCurrentUser ? 'You cannot delete your active account' : 'Revoke access'}
                          aria-label={`Delete ${member.username}`}
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

      {/* The Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all duration-300"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div 
            className="w-full max-w-3xl transform overflow-hidden rounded-[2rem] border border-[#D6B53B]/30 bg-white/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-300 dark:bg-[#141A13]/95 dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
            style={{ animation: 'fadeInUp 0.3s ease-out' }}
          >
            <div className="relative border-b border-[#D6B53B]/20 bg-gradient-to-r from-[#FDF5CC]/50 to-transparent p-6 dark:from-[#D6B53B]/10">
              <div className="pr-8">
                <h2 className="font-sahitya text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                  {isEditing ? 'Edit Administrator' : 'Add Administrator'}
                </h2>
                <p className="mt-2 text-[15px] font-medium text-gray-600 dark:text-[#A3B19B]">
                  {isEditing ? 'Update secure credentials and role access.' : 'Create secure admin-panel credentials for a new team member.'}
                </p>
              </div>
              <button 
                onClick={closeModal} 
                className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-gray-500 shadow-sm transition-all hover:scale-105 hover:bg-red-500 hover:text-white hover:shadow-md dark:bg-black/20 dark:text-gray-400 dark:hover:bg-red-500 dark:hover:text-white" 
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mt-2">
                <div className="group relative mt-6">
                  <input
                    id="team-username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={32}
                    autoComplete="off"
                    value={form.username}
                    onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                    placeholder=" "
                    className={`peer w-full rounded-2xl border bg-[#F9F8F1] px-5 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all focus:bg-white focus:ring-4 dark:bg-[#1C1D21] dark:text-white dark:focus:bg-[#141A13] ${hasSubmitted && !form.username ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20 dark:border-red-500/50 dark:focus:ring-red-500/20' : 'border-gray-200 focus:border-[#D6B53B] focus:ring-[#D6B53B]/20 dark:border-white/10'}`}
                  />
                  <label
                    htmlFor="team-username"
                    className="pointer-events-none absolute left-0 -top-6 text-xs font-bold tracking-[0.1em] text-gray-500 transition-all duration-300 peer-placeholder-shown:top-[11px] peer-placeholder-shown:left-5 peer-placeholder-shown:text-[13px] peer-placeholder-shown:text-gray-400 peer-focus:-top-6 peer-focus:left-0 peer-focus:text-xs peer-focus:text-[#D6B53B] dark:text-[#A3B19B]"
                  >
                    USERNAME
                  </label>
                  {hasSubmitted && !form.username && (
                    <p className="absolute -bottom-6 left-1 text-[11px] font-medium text-red-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <ShieldAlert className="h-3 w-3" /> Please fill out this field.
                    </p>
                  )}
                </div>

                <div className="group relative mt-6">
                  <input
                    id="team-email"
                    type="email"
                    required
                    autoComplete="off"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder=" "
                    className={`peer w-full rounded-2xl border bg-[#F9F8F1] px-5 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all focus:bg-white focus:ring-4 dark:bg-[#1C1D21] dark:text-white dark:focus:bg-[#141A13] ${hasSubmitted && !form.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20 dark:border-red-500/50 dark:focus:ring-red-500/20' : 'border-gray-200 focus:border-[#D6B53B] focus:ring-[#D6B53B]/20 dark:border-white/10'}`}
                  />
                  <label
                    htmlFor="team-email"
                    className="pointer-events-none absolute left-0 -top-6 text-xs font-bold tracking-[0.1em] text-gray-500 transition-all duration-300 peer-placeholder-shown:top-[11px] peer-placeholder-shown:left-5 peer-placeholder-shown:text-[13px] peer-placeholder-shown:text-gray-400 peer-focus:-top-6 peer-focus:left-0 peer-focus:text-xs peer-focus:text-[#D6B53B] dark:text-[#A3B19B]"
                  >
                    EMAIL ADDRESS
                  </label>
                  {hasSubmitted && !form.email && (
                    <p className="absolute -bottom-6 left-1 text-[11px] font-medium text-red-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <ShieldAlert className="h-3 w-3" /> Please fill out this field.
                    </p>
                  )}
                </div>

                <div className="group relative mt-6">
                  <div className="relative">
                    <input
                      id="team-password"
                      type={showPassword ? 'text' : 'password'}
                      required={!isEditing}
                      minLength={isEditing && !form.password ? undefined : 12}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder=" "
                      className={`peer w-full rounded-2xl border bg-[#F9F8F1] pl-5 pr-12 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all focus:bg-white focus:ring-4 dark:bg-[#1C1D21] dark:text-white dark:focus:bg-[#141A13] ${hasSubmitted && !isEditing && !form.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20 dark:border-red-500/50 dark:focus:ring-red-500/20' : 'border-gray-200 focus:border-[#D6B53B] focus:ring-[#D6B53B]/20 dark:border-white/10'}`}
                    />
                    <label
                      htmlFor="team-password"
                      className="pointer-events-none absolute left-0 -top-6 flex w-full justify-between pr-2 text-xs font-bold tracking-[0.1em] text-gray-500 transition-all duration-300 peer-placeholder-shown:top-[11px] peer-placeholder-shown:left-5 peer-placeholder-shown:text-[13px] peer-placeholder-shown:text-gray-400 peer-focus:-top-6 peer-focus:left-0 peer-focus:text-xs peer-focus:text-[#D6B53B] dark:text-[#A3B19B]"
                    >
                      <span>PASSWORD</span>
                      {isEditing && (
                        <span className={`font-medium tracking-normal text-[#D6B53B]/80 lowercase italic transition-opacity duration-300 ${!form.password ? 'opacity-0 group-focus-within:opacity-100' : 'opacity-100'}`}>
                          (leave blank to keep current)
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {hasSubmitted && !isEditing && !form.password && (
                    <p className="absolute -bottom-6 left-1 text-[11px] font-medium text-red-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <ShieldAlert className="h-3 w-3" /> Please fill out this field.
                    </p>
                  )}
                </div>

                <div className="group relative mt-6">
                  <label htmlFor="team-role" className="pointer-events-none absolute left-0 -top-6 text-xs font-bold tracking-[0.1em] text-gray-500 transition-all duration-300 dark:text-[#A3B19B]">
                    ACCESS ROLE
                  </label>
                  <div className="relative">
                    <select
                      id="team-role"
                      value={form.role}
                      disabled={form.id === currentUserId}
                      onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AdminRole }))}
                      className="w-full appearance-none rounded-2xl border border-gray-200 bg-[#F9F8F1] px-5 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all focus:border-[#D6B53B] focus:bg-white focus:ring-4 focus:ring-[#D6B53B]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#1C1D21] dark:text-white dark:focus:bg-[#141A13]"
                    >
                      <option value="ADMIN">Administrator</option>
                      <option value="SUPERADMIN">Super Admin</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-[#D6B53B]">
                      <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  {form.id === currentUserId && (
                    <p className="absolute -bottom-6 left-1 text-[11px] font-medium text-[#D6B53B]">Your active superadmin role cannot be self-demoted.</p>
                  )}
                </div>
              </div>

              {formError && (
                <div role="alert" className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div className="mt-10 flex flex-col-reverse justify-end gap-4 sm:flex-row border-t border-gray-100 dark:border-white/5 pt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl px-4 py-2 text-[12px] font-bold tracking-widest text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white sm:w-auto"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full overflow-hidden rounded-xl py-2 shadow-[0_10px_20px_rgba(26,31,24,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_25px_rgba(214,181,59,0.25)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5"
                >
                  <div className="absolute inset-0 bg-[#1a1f18] transition-transform duration-500 ease-in-out group-hover:translate-x-full dark:bg-[#D6B53B]" />
                  <div className="absolute inset-0 -translate-x-full bg-[#D6B53B] transition-transform duration-500 ease-in-out group-hover:translate-x-0 dark:bg-[#1a1f18]" />
                  <span className="relative z-10 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white dark:text-[#1a1f18] group-hover:text-white">
                    {isSubmitting ? 'SAVING...' : isEditing ? 'SAVE CHANGES' : 'CREATE ADMIN'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
