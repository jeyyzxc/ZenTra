'use client';

import React, { useState } from 'react';
import { Edit, Plus, Shield, ShieldAlert, Trash2, X } from 'lucide-react';
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

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setFormError('');
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
    <div className="mx-auto max-w-6xl p-4 font-sans sm:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Team Management</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Superadmin-only CRUD access for administrator accounts.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-[#1a1f18] px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-[#D6B53B] focus:outline-none"
        >
          <Plus className="h-5 w-5" />
          Add Admin
        </button>
      </div>

      {pageError && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {pageError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1C1D21]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Account</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Created</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    No administrator accounts found.
                  </td>
                </tr>
              ) : members.map((member) => {
                const isCurrentUser = member.id === currentUserId;

                return (
                  <tr key={member.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D6B53B]/30 bg-[#FDF5CC]/60 font-bold text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            @{member.username}
                            {isCurrentUser && (
                              <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                        member.role === 'SUPERADMIN'
                          ? 'border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400'
                          : 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400'
                      }`}>
                        {member.role === 'SUPERADMIN' ? <ShieldAlert className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                        {member.role === 'SUPERADMIN' ? 'Superadmin' : 'Admin'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(member)}
                        className="mr-3 p-1 text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                        title="Edit account"
                        aria-label={`Edit ${member.username}`}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(member)}
                        disabled={isCurrentUser}
                        className="p-1 text-gray-400 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:text-red-400"
                        title={isCurrentUser ? 'You cannot delete your active account' : 'Revoke access'}
                        aria-label={`Delete ${member.username}`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#1C1D21]">
            <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-white/10">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Administrator' : 'Add Administrator'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isEditing ? 'Update credentials and role.' : 'Create secure admin-panel credentials.'}
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 dark:hover:text-white" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="team-username" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                  <input
                    id="team-username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={32}
                    autoComplete="off"
                    value={form.username}
                    onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#D6B53B] dark:border-[#3C4043] dark:bg-[#28292A] dark:text-white"
                    placeholder="jane.admin"
                  />
                  <p className="mt-1 text-xs text-gray-400">3-32 characters; saved in lowercase.</p>
                </div>

                <div>
                  <label htmlFor="team-email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <input
                    id="team-email"
                    type="email"
                    required
                    autoComplete="off"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#D6B53B] dark:border-[#3C4043] dark:bg-[#28292A] dark:text-white"
                    placeholder="jane@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="team-password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password {isEditing && <span className="font-normal text-gray-400">(leave blank to keep current)</span>}
                  </label>
                  <input
                    id="team-password"
                    type="password"
                    required={!isEditing}
                    minLength={isEditing && !form.password ? undefined : 12}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#D6B53B] dark:border-[#3C4043] dark:bg-[#28292A] dark:text-white"
                    placeholder={isEditing ? 'Unchanged' : 'At least 12 characters'}
                  />
                  <p className="mt-1 text-xs text-gray-400">Requires uppercase, lowercase, number, and symbol.</p>
                </div>

                <div>
                  <label htmlFor="team-role" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <select
                    id="team-role"
                    value={form.role}
                    disabled={form.id === currentUserId}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AdminRole }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#D6B53B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#3C4043] dark:bg-[#28292A] dark:text-white"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SUPERADMIN">Superadmin</option>
                  </select>
                  {form.id === currentUserId && (
                    <p className="mt-1 text-xs text-gray-400">Your active superadmin role cannot be self-demoted.</p>
                  )}
                </div>

                {formError && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                    {formError}
                  </p>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-xl px-5 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#1a1f18] px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-[#D6B53B] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
