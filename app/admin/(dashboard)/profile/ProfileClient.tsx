'use client';

import React, { useState } from 'react';
import {
  AtSign,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { changeOwnPassword, updateOwnProfile } from './actions';
import type { AdminProfile } from './types';

type Notice = {
  type: 'success' | 'error';
  message: string;
} | null;

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) {
    return null;
  }

  return (
    <div
      role={notice.type === 'error' ? 'alert' : 'status'}
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
        notice.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
      }`}
    >
      {notice.type === 'success' ? (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
      ) : (
        <ShieldCheck className="h-4 w-4 flex-shrink-0" />
      )}
      {notice.message}
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-[#A3B19B]">
        {label}
      </label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-11 text-sm text-gray-900 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 transition hover:text-[#D6B53B]"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ProfileClient({
  initialProfile,
}: {
  initialProfile: AdminProfile;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.fullName ?? '');
  const [contactNumber, setContactNumber] = useState(initialProfile.contactNumber ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const router = useRouter();

  const roleLabel = profile.role === 'SUPERADMIN' ? 'Superadmin' : 'Administrator';
  const displayName = profile.fullName || profile.username;
  const initial = displayName.charAt(0).toUpperCase();

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileNotice(null);
    setSavingProfile(true);

    try {
      const updatedProfile = await updateOwnProfile({
        fullName,
        contactNumber,
      });
      setProfile(updatedProfile);
      setFullName(updatedProfile.fullName ?? '');
      setContactNumber(updatedProfile.contactNumber ?? '');
      setProfileNotice({
        type: 'success',
        message: 'Your contact details were updated.',
      });
      router.refresh();
    } catch (error) {
      setProfileNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to update your profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordNotice(null);
    setSavingPassword(true);

    try {
      await changeOwnPassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordNotice({
        type: 'success',
        message: 'Your password was changed successfully.',
      });
    } catch (error) {
      setPasswordNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to change your password.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-2 sm:px-6">
      <div className="mb-7">
        <h1 className="font-sahitya text-2xl font-bold uppercase tracking-[0.1em] text-[#1a1f18] dark:text-[#F4F4F0]">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-[#A3B19B]">
          Live account information from the ZenTra database.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#141A13]">
          <div className="h-28 bg-gradient-to-br from-[#1a1f18] via-[#35402f] to-[#D6B53B]" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-[#FDF5CC] text-3xl font-bold text-[#8E7722] shadow-lg dark:border-[#141A13] dark:bg-[#D6B53B]/20 dark:text-[#D6B53B]">
              {initial}
            </div>

            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{displayName}</h2>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#D6B53B]/30 bg-[#FDF5CC]/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {roleLabel}
            </div>

            <dl className="mt-6 space-y-4 border-t border-gray-100 pt-5 text-sm dark:border-white/5">
              <div>
                <dt className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <AtSign className="h-3.5 w-3.5" /> Username
                </dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">@{profile.username}</dd>
              </div>
              <div>
                <dt className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <Mail className="h-3.5 w-3.5" /> Email
                </dt>
                <dd className="break-all font-medium text-gray-800 dark:text-gray-100">{profile.email}</dd>
              </div>
              <div>
                <dt className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <Phone className="h-3.5 w-3.5" /> Contact
                </dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {profile.contactNumber || 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <CalendarDays className="h-3.5 w-3.5" /> Account Created
                </dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#141A13]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF5CC] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Contact Details</h2>
                <p className="text-sm text-gray-500">Update your own database record.</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <NoticeBox notice={profileNotice} />

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-[#A3B19B]">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    maxLength={255}
                    autoComplete="name"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="contactNumber" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-[#A3B19B]">
                    Contact Number
                  </label>
                  <input
                    id="contactNumber"
                    type="tel"
                    value={contactNumber}
                    onChange={(event) => setContactNumber(event.target.value)}
                    maxLength={20}
                    autoComplete="tel"
                    placeholder="+63 912 345 6789"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D6B53B] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {savingProfile ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#141A13]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF5CC] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Change Password</h2>
                <p className="text-sm text-gray-500">Current password verification is required.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <NoticeBox notice={passwordNotice} />

              <PasswordInput
                id="currentPassword"
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <PasswordInput
                  id="newPassword"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  autoComplete="new-password"
                />
                <PasswordInput
                  id="confirmNewPassword"
                  label="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={setConfirmNewPassword}
                  autoComplete="new-password"
                />
              </div>

              <p className="text-xs text-gray-400">
                Minimum 12 characters with uppercase, lowercase, number, and symbol.
              </p>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[#D6B53B] px-5 py-2.5 text-sm font-semibold text-[#8E7722] transition hover:bg-[#D6B53B] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#D6B53B]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {savingPassword ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
