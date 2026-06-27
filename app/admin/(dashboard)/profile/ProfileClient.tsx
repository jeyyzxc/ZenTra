'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  AtSign,
  CalendarDays,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
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
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${notice.type === 'success'
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

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatLocalNumber(digits: string) {
  if (!digits) {
    return '';
  }

  if (digits.startsWith('9')) {
    return [
      digits.slice(0, 3),
      digits.slice(3, 6),
      digits.slice(6, 10),
      digits.slice(10),
    ].filter(Boolean).join(' ');
  }

  if (digits.startsWith('2')) {
    return [
      digits.slice(0, 1),
      digits.slice(1, 5),
      digits.slice(5, 9),
      digits.slice(9),
    ].filter(Boolean).join(' ');
  }

  return [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 10),
    digits.slice(10),
  ].filter(Boolean).join(' ');
}

function parseContactNumber(full: string | null) {
  if (!full) {
    return '';
  }

  const digits = full.replace(/\D/g, '');
  const localDigits = digits.startsWith('63')
    ? digits.slice(2)
    : digits.startsWith('0') ? digits.slice(1) : digits;

  return formatLocalNumber(localDigits.slice(0, 12));
}

function composeContactNumber(local: string) {
  const digits = local.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  const localDigits = digits.startsWith('63')
    ? digits.slice(2)
    : digits.startsWith('0') ? digits.slice(1) : digits;

  return localDigits ? `+63${localDigits}` : '';
}

function validateLocalContactNumber(local: string) {
  if (!/^[0-9\s-]*$/.test(local)) {
    throw new Error('Contact number contains unsupported characters.');
  }

  const digits = local.replace(/\D/g, '');

  if (!digits) {
    return;
  }

  if (digits.length < 10) {
    throw new Error('Please enter a valid Philippine phone number.');
  }

  if (digits.length > 12) {
    throw new Error('Contact number is too long.');
  }
}

function formatInternationalContact(full: string | null) {
  const local = parseContactNumber(full);
  return local ? `+63 ${local}` : 'Not provided';
}

export default function ProfileClient({
  initialProfile,
}: {
  initialProfile: AdminProfile;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.fullName ?? '');
  const [localNumber, setLocalNumber] = useState(() => parseContactNumber(initialProfile.contactNumber));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchTimerRef = useRef<number | null>(null);
  const router = useRouter();

  const roleLabel = profile.role === 'SUPERADMIN' ? 'Super Admin' : 'Administrator';
  const displayName = profile.fullName || profile.username;
  const initial = displayName.charAt(0).toUpperCase();
  const avatarImage = avatarPreview || profile.profileImage;

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const clearAvatarTouchTimer = () => {
    if (touchTimerRef.current) {
      window.clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const handleContactChange = (value: string) => {
    if (!/^[0-9\s-]*$/.test(value)) {
      setProfileNotice({
        type: 'error',
        message: 'Contact number contains unsupported characters.',
      });
      return;
    }

    const digits = value.replace(/\D/g, '');
    const localDigits = digits.startsWith('0') ? digits.slice(1) : digits;
    setLocalNumber(formatLocalNumber(localDigits.slice(0, 12)));
  };

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setProfileNotice(null);

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type) || file.size <= 0 || file.size > MAX_AVATAR_BYTES) {
      setProfileNotice({
        type: 'error',
        message: 'File must be a JPEG, PNG, or WebP image under 2 MB.',
      });
      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const formData = new FormData();
    formData.set('file', file);

    setAvatarPreview(previewUrl);
    setAvatarUploading(true);

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json() as { profileImage?: string | null; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update your profile picture.');
      }

      setProfile((current) => ({
        ...current,
        profileImage: payload.profileImage ?? null,
      }));
      setAvatarPreview(null);
      setProfileNotice({
        type: 'success',
        message: 'Your profile picture was updated.',
      });
      router.refresh();
    } catch (error) {
      setAvatarPreview(null);
      setProfileNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to update your profile picture.',
      });
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile.profileImage || avatarUploading) {
      return;
    }

    const confirmed = window.confirm('Remove your profile picture?');

    if (!confirmed) {
      return;
    }

    setProfileNotice(null);
    setAvatarUploading(true);

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });
      const payload = await response.json() as { profileImage?: null; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to remove your profile picture.');
      }

      setAvatarPreview(null);
      setProfile((current) => ({
        ...current,
        profileImage: null,
      }));
      setProfileNotice({
        type: 'success',
        message: 'Your profile picture was removed.',
      });
      router.refresh();
    } catch (error) {
      setProfileNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to remove your profile picture.',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarTouchStart = () => {
    if (!profile.profileImage || avatarUploading) {
      return;
    }

    clearAvatarTouchTimer();
    touchTimerRef.current = window.setTimeout(() => {
      void handleRemoveAvatar();
    }, 700);
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileNotice(null);
    setSavingProfile(true);

    try {
      validateLocalContactNumber(localNumber);

      const updatedProfile = await updateOwnProfile({
        fullName,
        contactNumber: composeContactNumber(localNumber),
      });
      setProfile(updatedProfile);
      setFullName(updatedProfile.fullName ?? '');
      setLocalNumber(parseContactNumber(updatedProfile.contactNumber));
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
    <div className="w-full px-4 pb-8 pt-2 sm:px-6">
      {/* Back Button */}
      <div className="mb-5 flex -ml-3 sm:-ml-5">
        <button 
          onClick={() => router.back()} 
          className="group flex items-center gap-3 text-gray-500 hover:text-[#D6B53B] dark:text-[#A3B19B] dark:hover:text-[#D6B53B] transition-all duration-500 focus:outline-none"
          aria-label="Go back"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-[#141A13] border border-gray-200 dark:border-white/10 shadow-sm group-hover:shadow-[0_0_12px_rgba(214,181,59,0.4)] group-hover:border-[#D6B53B]/50 transition-all duration-500">
            <ArrowLeft className="w-4 h-4 transition-transform duration-500 group-hover:-translate-x-0.5" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out">
            Go Back
          </span>
        </button>
      </div>

      <div className="mb-7">
        <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em] text-[#1a1f18] dark:text-[#F4F4F0] leading-none m-0">
          My Profile
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
          Manage your personal contact details and update your security credentials.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#141A13]">
          <div className="relative h-32 overflow-hidden bg-gradient-to-br from-white via-[#F9F8F1] to-[#FDF5CC] border-b border-[#D6B53B]/30 dark:from-[#F9F8F1] dark:via-white dark:to-[#FDF5CC]">
            <div className="absolute inset-0 bg-[url('/zion-logo.png')] bg-[length:auto_135px] bg-center bg-no-repeat mix-blend-multiply opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
          </div>
          <div className="px-6 pb-6">
            <div className="relative -mt-12 h-24 w-24">
              <button
                type="button"
                onClick={() => {
                  if (!avatarUploading) {
                    fileInputRef.current?.click();
                  }
                }}
                onContextMenu={(event) => {
                  if (!profile.profileImage) {
                    return;
                  }

                  event.preventDefault();
                  void handleRemoveAvatar();
                }}
                onTouchCancel={clearAvatarTouchTimer}
                onTouchEnd={clearAvatarTouchTimer}
                onTouchStart={handleAvatarTouchStart}
                className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#FDF5CC] text-3xl font-bold text-[#8E7722] shadow-lg outline-none transition focus:ring-2 focus:ring-[#D6B53B]/40 dark:border-[#141A13] dark:bg-[#D6B53B]/20 dark:text-[#D6B53B]"
                title={profile.profileImage ? 'Change photo' : 'Upload photo'}
              >
                {avatarImage ? (
                  <span
                    aria-label={displayName}
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    role="img"
                    style={{ backgroundImage: `url("${avatarImage}")` }}
                  />
                ) : (
                  <span>{initial}</span>
                )}
                <span className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                  {avatarUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </span>
              </button>
              {profile.profileImage && !avatarUploading && (
                <button
                  type="button"
                  onClick={() => void handleRemoveAvatar()}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#1a1f18] text-white shadow-md transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 dark:border-[#141A13]"
                  title="Remove photo"
                  aria-label="Remove profile photo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleAvatarFileChange}
              />
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
                  {formatInternationalContact(profile.contactNumber)}
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
                  <div className="flex">
                    <div className="flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 px-3.5 text-sm font-semibold text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]">
                      +63
                    </div>
                    <input
                      id="contactNumber"
                      type="tel"
                      value={localNumber}
                      onChange={(event) => handleContactChange(event.target.value)}
                      maxLength={13}
                      autoComplete="tel-national"
                      placeholder="912 345 6789"
                      className="w-full rounded-r-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
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
