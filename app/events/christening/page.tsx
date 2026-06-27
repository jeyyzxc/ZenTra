import PackageLayout from '@/components/booking/PackageLayout';

export default function ChristeningsPage() {
  return (
    <PackageLayout
      title="Christenings"
      subtitle="Welcoming a new blessing with grace and elegance. A timeless space for your family's first major milestone."
      heroImage="https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=2070&auto=format&fit=crop"
      contentBlocks={[
        {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
          imageSrc: "https://images.unsplash.com/photo-1473830394358-91588751b241?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'right'
        },
        {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
          imageSrc: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'left'
        }
      ]}
      packageText="Welcoming a new blessing with grace. A serene and timeless space for your family's first major milestone."
      galleryImages={[
        "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600",
        "https://images.unsplash.com/photo-1473830394358-91588751b241?w=600",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600"
      ]}
    />
  );
}
