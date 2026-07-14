import Image from 'next/image';
import { AccountTokenType } from '@prisma/client';
import AccountPasswordForm from '@/components/auth/AccountPasswordForm';
import { getAccountTokenPreview } from '@/lib/team-access';
export const dynamic = 'force-dynamic';

import Link from 'next/link';

function maskEmail(email: string) {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  if (localPart.length <= 4) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart.substring(0, 4)}****@${domain}`;
}

function AccessMessage({ status }: { status: string }) {
  let message = 'This account setup link is invalid.';
  let showLoginButton = false;

  if (status === 'expired') {
    message = 'This account setup link has expired. Please request a new invitation from the administrator.';
  } else if (status === 'used') {
    message = 'This account has already been activated. You may now sign in.';
    showLoginButton = true;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F9F8F1] transition-colors duration-500 ease-in-out dark:bg-[#0C100B] px-4 py-10">
      <div className="fixed top-1/2 left-1/2 z-10 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/80 bg-gradient-to-br from-white via-white/95 to-[#FDF5CC]/90 p-5 shadow-[0_30px_60px_-15px_rgba(214,181,59,0.25)] backdrop-blur-2xl animate-[fadeInUp_0.8s_ease-out] sm:p-6 text-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="relative z-10 -mb-4 h-[120px] w-[120px] pointer-events-none">
            <Image
              src="/zion-logo.png"
              alt="Zion Events Place Logo"
              fill
              sizes="120px"
              className="object-contain opacity-80 brightness-0 drop-shadow-md"
              priority
            />
          </div>
          <div className="group flex cursor-default flex-col items-center">
            <h1 className="whitespace-nowrap font-sahitya text-[1.35rem] font-bold uppercase tracking-[0.15em] text-[#1a1f18] transition-all duration-300 group-hover:text-[#D6B53B] sm:text-2xl">
              SETUP UNAVAILABLE
            </h1>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium leading-6 text-gray-600">{message}</p>
        
        <div className="mt-8 flex justify-center">
          {showLoginButton ? (
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a1f18] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_10px_20px_rgba(26,31,24,0.15)] transition hover:-translate-y-0.5 hover:bg-[#D6B53B] hover:text-[#1a1f18]"
            >
              GO TO LOGIN
            </Link>
          ) : (
            <Link
              href="/admin"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 transition hover:text-[#D6B53B]"
            >
              RETURN TO LOGIN
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export default async function SetupAccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;
  const preview = await getAccountTokenPreview(token, AccountTokenType.INVITATION);

  if (preview.status !== 'valid' || !token) {
    return <AccessMessage status={preview.status} />;
  }

  const firstName = preview.user?.fullName.split(' ')[0] || 'Team Member';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F9F8F1] transition-colors duration-500 ease-in-out dark:bg-[#0C100B] px-4 py-10">
      <div className="fixed top-1/2 left-1/2 z-10 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/80 bg-gradient-to-br from-white via-white/95 to-[#FDF5CC]/90 p-5 shadow-[0_30px_60px_-15px_rgba(214,181,59,0.25)] backdrop-blur-2xl animate-[fadeInUp_0.8s_ease-out] sm:p-6">
        <div className="mb-6 flex flex-col items-center">
          <div className="relative z-10 -mb-4 h-[110px] w-[110px] pointer-events-none">
            <Image
              src="/zion-logo.png"
              alt="Zion Events Place Logo"
              fill
              sizes="110px"
              className="object-contain opacity-80 brightness-0 drop-shadow-md"
              priority
            />
          </div>
          <div className="group flex cursor-default flex-col items-center text-center">
            <h1 className="font-sahitya text-[1.35rem] font-bold uppercase tracking-[0.15em] text-[#1a1f18] transition-all duration-300 group-hover:text-[#D6B53B] sm:text-xl">
              TEAM ACCOUNT
            </h1>
            <p className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.4em] text-gray-500 sm:text-xs">
              SECURE SETUP
            </p>
          </div>
        </div>

        <p className="mb-4 text-center text-sm font-medium leading-5 text-gray-600">
          Welcome, <strong className="text-gray-900">{firstName}</strong>. Create a secure password to activate your team account.
        </p>

        <div className="mb-4 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-gray-200 bg-white/50 px-4 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 tracking-wider mr-2">EMAIL</span>
            <span className="text-sm font-bold text-[#8E7722]">{maskEmail(preview.user?.email || '')}</span>
          </div>
        </div>

        <div className="mt-2">
          <AccountPasswordForm
            endpoint="/api/auth/setup-account"
            token={token}
            submitLabel="ACTIVATE ACCOUNT"
            loadingLabel="ACTIVATING ACCOUNT..."
            successRedirect="/admin?setup=success"
            userFullName={preview.user?.fullName}
            userEmail={preview.user?.email}
          />
        </div>
      </div>
    </main>
  );
}
