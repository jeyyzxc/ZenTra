import Image from 'next/image';
import ForgotPasswordCodeForm from './ForgotPasswordCodeForm';
export const dynamic = 'force-dynamic';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const email = typeof params.email === 'string' ? params.email : '';
  const sent = params.sent === '1';
  const warning = params.warning === '1';

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
          <div className="group flex cursor-default flex-col items-center">
            <h1 className="whitespace-nowrap font-sahitya text-[1.35rem] font-bold uppercase tracking-[0.15em] text-[#1a1f18] transition-all duration-300 group-hover:text-[#D6B53B] sm:text-2xl">
              PASSWORD RECOVERY
            </h1>
            <p className="mt-1 text-center font-sans text-[10px] font-semibold uppercase tracking-[0.4em] text-gray-500 sm:text-xs">
              VERIFY YOUR IDENTITY
            </p>
          </div>
        </div>

        <div className="mt-4">
          <ForgotPasswordCodeForm
            initialEmail={email}
            initialNotice={warning ? 'warning' : sent ? 'sent' : undefined}
          />
        </div>
      </div>
    </main>
  );
}
