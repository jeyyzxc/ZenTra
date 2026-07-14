import PackageLayout from '@/components/booking/PackageLayout';

export default function ChristeningsPage() {
  return (
    <PackageLayout
      heroKey="christening"
      contentBlocks={[
        {
          text: "Welcome your little one with a gathering that feels gentle, joyful, and centered on family. Zion offers a calm setting for sharing this meaningful first milestone.",
          imageSrc: "https://images.unsplash.com/photo-1473830394358-91588751b241?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'right'
        },
        {
          text: "Create a warm reception with thoughtful details, comfortable spaces, and beautiful surroundings where every generation can celebrate together.",
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
