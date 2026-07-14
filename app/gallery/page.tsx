import { ContentType } from '@prisma/client';
import PublicSubpageShell from '@/components/client/PublicSubpageShell';
import PublishedGallery from '@/components/public-content/PublishedGallery';
import { listPublishedContent } from '@/services/command-center/content.service';
import GalleryFallback from './GalleryFallback';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const items = await listPublishedContent(ContentType.GALLERY_ITEM);
  if (!items.length) return <GalleryFallback />;

  return (
    <PublicSubpageShell heroKey="gallery">
      <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-12 md:py-24">
        <PublishedGallery items={items} />
      </section>
    </PublicSubpageShell>
  );
}
