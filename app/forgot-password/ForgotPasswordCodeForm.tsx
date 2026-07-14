'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, RotateCcw } from 'lucide-react';
import VerificationCodeInput from '@/components/auth/VerificationCodeInput';

type Notice = {
  type: 'error' | 'success' | 'warning';
  message: string;
} | null;

type ForgotPasswordCodeFormProps = {
  initialEmail: string;
  initialNotice?: 'sent' | 'warning';
};

const VERIFICATION_CODE_LENGTH = 8;
const AUTH_NOTICE_AUTO_HIDE_MS = 10_000;
const VERIFIED_REDIRECT_DELAY_MS = 500;

function noticeClass(type: NonNullable<Notice>['type']) {
  if (type === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (type === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  return 'border-red-200 bg-red-50 text-red-700';
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  if (localPart.length <= 4) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart.substring(0, 4)}****@${domain}`;
}

export default function ForgotPasswordCodeForm({
  initialEmail,
  initialNotice,
}: ForgotPasswordCodeFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [temporaryCode, setTemporaryCode] = useState('');
  
  const [stage, setStage] = useState<'request' | 'verify'>(
    initialNotice === 'sent' || initialNotice === 'warning' ? 'verify' : 'request'
  );

  const [notice, setNotice] = useState<Notice>(() => {
    if (initialNotice === 'warning') {
      return {
        type: 'warning',
        message: 'Your request was created, but email delivery may need attention.',
      };
    }
    if (initialNotice === 'sent') {
      return {
        type: 'success',
        message: 'A verification code has been sent to your registered email address.',
      };
    }
    return null;
  });

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => {
        setNotice(null);
      }, AUTH_NOTICE_AUTO_HIDE_MS);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(initialNotice === 'sent' ? 45 : 0);
  const router = useRouter();

  useEffect(() => {
    if (!isVerified) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.replace('/change-password');
      router.refresh();
    }, VERIFIED_REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isVerified, router]);

  // Timer logic
  useEffect(() => {
    if (resendTimer > 0) {
      const timerId = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [resendTimer]);

  const requestTemporaryCode = async (isResend = false) => {
    const normalizedEmail = email.trim().toLowerCase();
    setNotice(null);

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setNotice({ type: 'error', message: 'Please enter a valid email address.' });
      return false;
    }

    if (isResend) setIsResending(true);
    else setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const payload = await response.json() as {
        message?: string;
        error?: string;
        deliveryWarning?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send a verification code.');
      }

      setEmail(normalizedEmail);
      setNotice({
        type: payload.deliveryWarning ? 'warning' : 'success',
        message: isResend ? 'A new verification code has been sent.' : 'A verification code has been sent to your registered email address.',
      });
      setStage('verify');
      setResendTimer(45);
      setTemporaryCode('');
      return true;
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error
          ? error.message
          : 'Unable to send a verification code.',
      });
      return false;
    } finally {
      if (isResend) setIsResending(false);
      else setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (stage === 'request') {
      await requestTemporaryCode(false);
      return;
    }

    setNotice(null);

    const normalizedEmail = email.trim().toLowerCase();
    const code = temporaryCode.trim().replace(/[^a-z0-9]/gi, '').toUpperCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setNotice({ type: 'error', message: 'Please enter your registered email address.' });
      return;
    }

    if (!code || code.length < VERIFICATION_CODE_LENGTH) {
      setNotice({ type: 'error', message: 'Please enter the 8-character verification code.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn('credentials', {
        email: normalizedEmail,
        password: code,
        rememberMe: 'false',
        redirect: false,
      });

      if (!result?.ok) {
        // Specific error messages mapped
        if (result?.error?.includes('expired')) {
          setNotice({
            type: 'error',
            message: 'This verification code has expired. Request a new code to continue.',
          });
        } else if (result?.error?.includes('Too many attempts')) {
          setNotice({
            type: 'error',
            message: 'Too many unsuccessful attempts. Please wait before trying again or request a new code.',
          });
        } else {
          setNotice({
            type: 'error',
            message: 'The verification code is incorrect. Please check the code and try again.',
          });
        }
        return;
      }

      const session = await getSession();
      const canChangePassword =
        session?.user?.accessScope === 'PASSWORD_CHANGE_ONLY' ||
        session?.user?.mustChangePassword;

      if (!canChangePassword) {
        setNotice({
          type: 'error',
          message: 'This temporary password session could not be verified.',
        });
        return;
      }

      setIsVerified(true);
      setNotice({ type: 'success', message: 'Your identity has been verified.' });
      
    } catch {
      setNotice({
        type: 'error',
        message: 'Unable to verify this code right now.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div aria-live="polite">
        {notice && (
          <div
            role={notice.type === 'error' ? 'alert' : 'status'}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold leading-5 ${noticeClass(notice.type)}`}
          >
            {notice.message}
          </div>
        )}
      </div>

      {stage === 'request' && (
        <>
          <div className="group relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="peer w-full border-b-2 border-gray-300 bg-transparent px-0 py-2.5 font-sans text-sm text-[#1a1f18] placeholder-transparent transition-all duration-300 ease-out focus:border-[#D6B53B] focus:outline-none"
              placeholder="Registered Email"
            />
            <label
              htmlFor="email"
              className="absolute left-0 -top-4 cursor-text font-sans text-xs font-medium text-[#D6B53B] transition-all duration-300 ease-out peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-[#D6B53B]"
            >
              Registered Email
            </label>
          </div>

          <div className="grid gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-xl py-3.5 shadow-[0_10px_20px_rgba(26,31,24,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_25px_rgba(214,181,59,0.25)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="absolute inset-0 bg-[#1a1f18] transition-transform duration-500 ease-in-out group-hover:translate-x-full" />
              <div className="absolute inset-0 -translate-x-full bg-[#D6B53B] transition-transform duration-500 ease-in-out group-hover:translate-x-0" />
              <span className="relative z-10 flex items-center justify-center gap-2 font-sans text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors duration-300 group-hover:text-[#1a1f18]">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'SENDING...' : 'SEND VERIFICATION CODE'}
              </span>
            </button>
            
            <Link
              href="/admin"
              className="group inline-flex w-full items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 transition hover:text-[#D6B53B]"
            >
              BACK TO LOGIN
            </Link>
          </div>
        </>
      )}

      {stage === 'verify' && (
        <>
          <div className="text-center pb-2">
            <p className="text-sm font-medium text-gray-800">
              Code sent to: <span className="font-bold text-[#8E7722]">{maskEmail(email)}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Enter the code below to continue resetting your password.
            </p>
          </div>

          <div className="flex justify-center pt-2 pb-4">
            <VerificationCodeInput
              value={temporaryCode}
              onChange={setTemporaryCode}
              disabled={isSubmitting || isResending || isVerified}
              length={VERIFICATION_CODE_LENGTH}
            />
          </div>

          <div className="grid gap-4">
            <button
              type="submit"
              disabled={isSubmitting || isVerified || temporaryCode.length < VERIFICATION_CODE_LENGTH}
              className="group relative w-full overflow-hidden rounded-xl py-3.5 shadow-[0_10px_20px_rgba(26,31,24,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_25px_rgba(214,181,59,0.25)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="absolute inset-0 bg-[#1a1f18] transition-transform duration-500 ease-in-out group-hover:translate-x-full" />
              <div className="absolute inset-0 -translate-x-full bg-[#D6B53B] transition-transform duration-500 ease-in-out group-hover:translate-x-0" />
              <span className="relative z-10 flex items-center justify-center gap-2 font-sans text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors duration-300 group-hover:text-[#1a1f18]">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isVerified ? 'VERIFIED' : isSubmitting ? 'VERIFYING...' : 'VERIFY CODE'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => requestTemporaryCode(true)}
              disabled={isSubmitting || isResending || isVerified || resendTimer > 0}
              className="group relative w-full overflow-hidden rounded-xl py-3 border border-[#D6B53B]/30 bg-transparent transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D6B53B]/80 hover:shadow-[0_10px_20px_rgba(214,181,59,0.15)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#8E7722] transition-colors group-hover:text-[#D6B53B]">
                {isResending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : resendTimer === 0 ? (
                  <RotateCcw className="h-4 w-4" />
                ) : null}
                {isResending ? 'SENDING...' : resendTimer > 0 ? `Resend code in 00:${resendTimer.toString().padStart(2, '0')}` : 'RESEND CODE'}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-3 pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setStage('request');
                setNotice(null);
                setTemporaryCode('');
              }}
              disabled={isVerified}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 transition hover:text-[#D6B53B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              USE A DIFFERENT EMAIL
            </button>
            <Link
              href="/admin"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 transition hover:text-[#D6B53B]"
            >
              BACK TO LOGIN
            </Link>
          </div>
        </>
      )}
    </form>
  );
}
