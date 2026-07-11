import Link from 'next/link';

export default function ClientFeatureUnavailable({
  title = 'Temporarily Unavailable',
  message,
  actionLabel = 'Contact Zion',
  actionHref = '/contact',
}: {
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <section className="relative z-10 flex min-h-[420px] w-full items-center justify-center bg-[#FBF4C4] px-4 py-20">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#D4AF37]/25 bg-white/75 px-6 py-10 text-center shadow-[0_20px_60px_rgba(58,75,60,0.08)] backdrop-blur-md md:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8E7722]">Zion Events Place</p>
        <h2 className="mt-3 font-sahitya text-4xl font-bold text-[#1a1f18]">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl font-serif text-lg leading-8 text-neutral-700">{message}</p>
        <Link
          href={actionHref}
          className="mt-8 inline-flex rounded-full bg-[#1a1f18] px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#D6B53B] hover:text-[#1a1f18]"
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}
