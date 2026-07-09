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
    <main className="flex min-h-screen items-center justify-center bg-[#F8F7F3] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-[#D6B53B]/30 bg-white p-8 shadow-xl">
        <Image src="/zion-logo.png" alt="Zion Events Place" width={92} height={92} className="mx-auto mb-5 object-contain" />
        <h1 className="font-sahitya text-3xl font-bold text-gray-950">Create New Password</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-gray-600">
          Please create a new password before accessing the system.
        </p>
        <div className="mt-6">
          <AccountPasswordForm
            endpoint="/api/auth/change-password-required"
            submitLabel="Save Password"
            successRedirect="/admin?passwordChanged=1"
            signOutAfterSuccess
          />
        </div>
      </section>
    </main>
  );
}
