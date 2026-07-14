import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { SessionAccessScope } from '@prisma/client';
import AccountPasswordForm from '@/components/auth/AccountPasswordForm';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/admin');
  }

  if (
    session.user.accessScope !== SessionAccessScope.PASSWORD_CHANGE_ONLY &&
    !session.user.mustChangePassword
  ) {
    redirect('/admin/profile');
  }

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
              CREATE NEW PASSWORD
            </h1>
            <p className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.4em] text-gray-500 sm:text-xs">
              ACCOUNT SECURITY
            </p>
          </div>
        </div>

        <div className="mb-4 text-center">
          <p className="text-sm font-medium leading-5 text-gray-600">
            Please create a new password before accessing the system.
          </p>
        </div>

        <div className="mt-2 text-left">
          <AccountPasswordForm
            endpoint="/api/auth/change-password-required"
            submitLabel="UPDATE PASSWORD"
            loadingLabel="UPDATING..."
            successRedirect="/admin?passwordChanged=1"
            signOutAfterSuccess
          />
        </div>
      </div>
    </main>
  );
}
