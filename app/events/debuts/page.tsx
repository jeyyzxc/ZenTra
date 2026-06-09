import PackageLayout from '../../components/PackageLayout';

export default function DebutsPage() {
  return (
    <PackageLayout
      title="Debuts"
      subtitle="Step into your new chapter with grace and elegance."
      heroImage="https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?q=80&w=2072&auto=format&fit=crop"
      contentBlocks={[
        {
          text: "A coming of age celebration deserves a venue that matches the magic of the moment. We provide the perfect backdrop for your most memorable night.",
          imageSrc: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'right'
        }
      ]}
      packageText="We craft enchanting debut packages that highlight the beauty of your transition into young adulthood."
      galleryImages={[
        "https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=600",
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600"
      ]}
    />
  );
}
