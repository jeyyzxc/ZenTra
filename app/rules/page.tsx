import { ContentType } from '@prisma/client';
import PublicSubpageShell from '@/components/client/PublicSubpageShell';
import StructuredContentRenderer from '@/components/public-content/StructuredContentRenderer';
import { listPublishedContent } from '@/services/command-center/content.service';
import RulesFallback from './RulesFallback';

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
  const items = await listPublishedContent(ContentType.RULES);
  if (!items.length) return <RulesFallback />;

  return (
    <PublicSubpageShell heroKey="rules">
      <section className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
        {items.map((item) => <StructuredContentRenderer key={item.id} type={item.type} payload={item.version?.payload} />)}
      </section>
    </PublicSubpageShell>
  );
}
