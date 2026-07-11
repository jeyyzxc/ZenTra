'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

type AccountPasswordFormProps = {
  endpoint: '/api/auth/setup-account' | '/api/auth/reset-password' | '/api/auth/change-password-required';
  token?: string;
  submitLabel: string;
  loadingLabel?: string;
  successRedirect?: string;
  signOutAfterSuccess?: boolean;
  userFullName?: string | null;
  userEmail?: string | null;
  successHeading?: string;
  successMessage?: string;
  successSupportingText?: string;
  successButtonText?: string;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="group relative mt-6">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="new-password"
        required
        className="peer w-full border-b-2 border-gray-300 bg-transparent px-0 py-2.5 pr-10 font-sans text-sm text-[#1a1f18] placeholder-transparent transition-all duration-300 ease-out focus:border-[#D6B53B] focus:outline-none"
        placeholder={label}
      />
      <label
        htmlFor={id}
        className="absolute left-0 -top-4 cursor-text font-sans text-xs font-medium text-[#D6B53B] transition-all duration-300 ease-out peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-[#D6B53B]"
      >
        {label}
      </label>
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer p-2 text-gray-400 transition-colors hover:text-[#D6B53B]"
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2 text-[11px] font-medium sm:text-xs">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
      )}
      <span className={met ? 'text-gray-700' : 'text-gray-400'}>{text}</span>
    </li>
  );
}

export default function AccountPasswordForm({
  endpoint,
  token,
  submitLabel,
  loadingLabel = 'Saving...',
  successRedirect = '/admin',
  signOutAfterSuccess = false,
  userFullName,
  userEmail,
  successHeading = 'Setup Complete',
  successMessage = 'Your team account has been activated successfully.',
  successSupportingText = 'You may now sign in using your registered email address and new password.',
  successButtonText = 'GO TO LOGIN',
}: AccountPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password Requirements Logic
  const hasLength = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  
  const checkNoPersonal = () => {
    if (newPassword.length === 0) return false;
    const lowerPass = newPassword.toLowerCase();
    
    if (userFullName) {
      const names = userFullName.toLowerCase().split(' ').filter(n => n.length > 2);
      if (names.some(name => lowerPass.includes(name))) return false;
    }
    
    if (userEmail) {
      const emailLocal = userEmail.split('@')[0].toLowerCase();
      if (emailLocal.length > 2 && lowerPass.includes(emailLocal)) return false;
    }
    
    return true;
  };
  const noPersonal = checkNoPersonal();
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isAllValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial && noPersonal && passwordsMatch;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!isAllValid) {
      setNotice({ type: 'error', message: 'Please fulfill all password requirements.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });
      const payload = await response.json() as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to complete this action.');
      }

      setIsSuccess(true);
      
      if (signOutAfterSuccess) {
        await signOut({ redirect: false });
      }
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to complete this action.',
      });
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center py-6 text-center animate-[fadeInUp_0.5s_ease-out]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="mb-2 font-sahitya text-2xl font-bold text-gray-900">{successHeading}</h2>
        <p className={`text-sm font-medium leading-6 text-gray-600 ${successSupportingText ? 'mb-2' : 'mb-8'}`}>
          {successMessage}
        </p>
        {successSupportingText && (
          <p className="mb-8 text-xs font-medium leading-5 text-gray-500">
            {successSupportingText}
          </p>
        )}
        <Link
          href={successRedirect}
          className="group relative w-full overflow-hidden rounded-xl py-3.5 shadow-[0_10px_20px_rgba(26,31,24,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_25px_rgba(214,181,59,0.25)] active:translate-y-0 active:scale-[0.98] block"
        >
          <div className="absolute inset-0 bg-[#1a1f18] transition-transform duration-500 ease-in-out group-hover:translate-x-full" />
          <div className="absolute inset-0 -translate-x-full bg-[#D6B53B] transition-transform duration-500 ease-in-out group-hover:translate-x-0" />
          <span className="relative z-10 flex items-center justify-center gap-2 font-sans text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors duration-300 group-hover:text-[#1a1f18]">
            {successButtonText} <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-live="polite">
      {notice && (
        <div
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notice.message}
        </div>
      )}

      <PasswordField
        id="new-password"
        label="New Password"
        value={newPassword}
        onChange={setNewPassword}
      />
      <PasswordField
        id="confirm-password"
        label="Confirm Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
      />

      <div className="pt-2">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Password Requirements
        </p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <RequirementItem met={hasLength} text="At least 12 characters" />
          <RequirementItem met={hasUpper} text="One uppercase letter" />
          <RequirementItem met={hasLower} text="One lowercase letter" />
          <RequirementItem met={hasNumber} text="One number" />
          <RequirementItem met={hasSpecial} text="One special character" />
          <RequirementItem met={noPersonal} text="No personal information" />
        </ul>
        
        <div className="mt-3 border-t border-gray-100 pt-3">
           <RequirementItem met={passwordsMatch} text="Passwords match" />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !isAllValid}
          className="group relative w-full overflow-hidden rounded-xl py-3.5 shadow-[0_10px_20px_rgba(26,31,24,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_25px_rgba(214,181,59,0.25)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="absolute inset-0 bg-[#1a1f18] transition-transform duration-500 ease-in-out group-hover:translate-x-full" />
          <div className="absolute inset-0 -translate-x-full bg-[#D6B53B] transition-transform duration-500 ease-in-out group-hover:translate-x-0" />
          <span className="relative z-10 flex items-center justify-center gap-2 font-sans text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors duration-300 group-hover:text-[#1a1f18]">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? loadingLabel : submitLabel}
          </span>
        </button>
      </div>
    </form>
  );
}
