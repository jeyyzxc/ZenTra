'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import BackgroundSlideshow from '@/components/shared/BackgroundSlideshow';

const LOGIN_MESSAGE_AUTO_HIDE_MS = 5000;

export default function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!error) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setError('');
    }, LOGIN_MESSAGE_AUTO_HIDE_MS);

    return () => window.clearTimeout(timeout);
  }, [error]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        rememberMe: String(rememberMe),
        redirect: false,
      });

      if (!result?.ok) {
        setError('Invalid email, password, or temporary code.');
        return;
      }

      const session = await getSession();
      const requiresPasswordChange =
        session?.user?.accessScope === 'PASSWORD_CHANGE_ONLY' ||
        session?.user?.mustChangePassword;

      router.replace(requiresPasswordChange ? '/change-password' : '/admin/dashboard');
      router.refresh();
    } catch {
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setError('');

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Please enter your admin email address first.');
      return;
    }

    setIsSendingReset(true);

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
        throw new Error(payload.error || 'Unable to send a temporary password code.');
      }

      const params = new URLSearchParams({
        email: normalizedEmail,
        sent: '1',
      });

      if (payload.deliveryWarning) {
        params.set('warning', '1');
      }

      router.push(`/forgot-password?${params.toString()}`);
    } catch (error) {
      setError(error instanceof Error
        ? error.message
        : 'Unable to send a temporary password code.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gray-900">
      <div className="absolute inset-0">
        <BackgroundSlideshow />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/80 bg-gradient-to-br from-white via-white/95 to-[#FDF5CC]/90 p-8 shadow-[0_30px_60px_-15px_rgba(214,181,59,0.25)] backdrop-blur-2xl animate-[fadeInUp_0.8s_ease-out] sm:p-10">
        <div className="mb-12 flex flex-col items-center">
          <div className="relative z-10 -mb-4 h-[140px] w-[140px] pointer-events-none">
            <Image
              src="/zion-logo.png"
              alt="Zion Events Place Logo"
              fill
              sizes="140px"
              className="object-contain opacity-80 brightness-0 drop-shadow-md"
              priority
            />
          </div>
          <div className="group flex cursor-default flex-col items-center">
            <h1 className="whitespace-nowrap font-sahitya text-[1.35rem] font-bold uppercase tracking-[0.2em] text-[#1a1f18] transition-all duration-300 group-hover:text-[#D6B53B] sm:text-2xl">
              Zion Events Place
            </h1>
            <h2 className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.4em] text-gray-500 sm:text-xs">
              Admin Portal
            </h2>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="group relative">
            <input
              type="email"
              id="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="peer w-full border-b-2 border-gray-300 bg-transparent px-0 py-2.5 font-sans text-sm text-[#1a1f18] placeholder-transparent transition-all duration-300 ease-out focus:border-[#D6B53B] focus:outline-none"
              placeholder="Email Address"
              required
            />
            <label
              htmlFor="email"
              className="absolute left-0 -top-4 cursor-text font-sans text-xs font-medium text-[#D6B53B] transition-all duration-300 ease-out peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-[#D6B53B]"
            >
              Email Address
            </label>
          </div>

          <div className="group relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="peer w-full border-b-2 border-gray-300 bg-transparent px-0 py-2.5 pr-10 font-sans text-sm text-[#1a1f18] placeholder-transparent transition-all duration-300 ease-out focus:border-[#D6B53B] focus:outline-none"
              placeholder="Password"
              required
            />
            <label
              htmlFor="password"
              className="absolute left-0 -top-4 cursor-text font-sans text-xs font-medium text-[#D6B53B] transition-all duration-300 ease-out peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-[#D6B53B]"
            >
              Password
            </label>

            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer p-2 text-gray-400 transition-colors hover:text-[#D6B53B]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                {showPassword ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </>
                )}
              </svg>
            </button>
          </div>

          <div className="-mt-2 flex items-center justify-between font-sans text-xs font-semibold text-gray-500">
            <label className="group flex cursor-pointer items-center gap-2.5">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="peer relative h-4 w-4 cursor-pointer appearance-none rounded-[5px] border border-gray-400 bg-transparent transition-all duration-300 hover:border-[#D6B53B] hover:shadow-[0_0_8px_rgba(214,181,59,0.3)] checked:border-[#D6B53B] checked:bg-[#D6B53B] checked:shadow-[0_0_8px_rgba(214,181,59,0.4)] focus:outline-none"
                />
                <svg
                  className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity duration-300 peer-checked:opacity-100"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="transition-colors duration-300 group-hover:text-gray-700">Remember Me</span>
            </label>
            <div className="flex items-center justify-end transition-all duration-300 text-[#BEA542]">
              {rememberMe ? (
                <span>Authorized personnel only</span>
              ) : (
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  disabled={isSubmitting || isSendingReset}
                  className="font-semibold text-gray-500 transition-colors hover:text-[#D6B53B]"
                >
                  {isSendingReset ? 'Sending Code...' : 'Forgot Password?'}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-xl py-3.5 shadow-[0_10px_20px_rgba(26,31,24,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_25px_rgba(214,181,59,0.25)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="absolute inset-0 bg-[#1a1f18] transition-transform duration-500 ease-in-out group-hover:translate-x-full" />
              <div className="absolute inset-0 -translate-x-full bg-[#D6B53B] transition-transform duration-500 ease-in-out group-hover:translate-x-0" />
              <span className="relative z-10 font-sans text-sm font-bold uppercase tracking-[0.2em] text-white">
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
