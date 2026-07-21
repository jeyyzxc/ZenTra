import type { ContentType } from '@prisma/client';
import SubpageHero from '@/components/client/SubpageHero';
import StructuredContentRenderer from './StructuredContentRenderer';
import { listPublishedContent } from '@/services/command-center/content.service';

export default async function PublishedPolicyPage({
  type,
  title,
  subtitle,
}: {
  type: ContentType;
  title: string;
  subtitle: string;
}) {
  const items = await listPublishedContent(type);

  return (
    <main className="responsive-page relative flex flex-col bg-transparent">
      <SubpageHero
        title={title}
        subtitle={subtitle}
        imageSrc="/zion/475432722_17894220468152473_3402569861204614886_n.jpg"
      />
      <section className="relative z-10 w-full bg-[#FBF4C4] px-6 py-16 md:py-24">
        {items.length ? (
          <div className="mx-auto max-w-5xl space-y-14">
            {items.map((item) => (
              <StructuredContentRenderer key={item.id} type={item.type} payload={item.version?.payload} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl rounded-3xl border border-[#D6B53B]/30 bg-white/60 p-8 text-center shadow-sm md:p-12">
            <h1 className="font-sahitya text-3xl font-bold text-[#1a1f18]">Reviewed policy pending publication</h1>
            <p className="mt-4 font-serif text-lg leading-8 text-neutral-600">
              ZENTRA will publish the legally reviewed version here when it has completed approval. Please contact the venue team for current verified guidance.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
