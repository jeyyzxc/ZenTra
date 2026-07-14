import type { Metadata } from 'next';
import { ContentType } from '@prisma/client';
import PublicSubpageShell from '@/components/client/PublicSubpageShell';
import StructuredContentRenderer from '@/components/public-content/StructuredContentRenderer';
import { listPublishedContent } from '@/services/command-center/content.service';
import FacilitiesFallback from './FacilitiesFallback';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Facilities | Zion Events Place',
  description: 'Explore the indoor and outdoor event spaces available at Zion Events Place in San Pedro, Laguna.',
};

export default async function FacilitiesPage() {
  const items = await listPublishedContent(ContentType.FACILITY);
  if (!items.length) return <FacilitiesFallback />;

  return (
    <PublicSubpageShell heroKey="facilities">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 md:px-12 md:py-24">
        {items.map((item) => <StructuredContentRenderer key={item.id} type={item.type} payload={item.version?.payload} />)}
      </section>
    </PublicSubpageShell>
  );
}
