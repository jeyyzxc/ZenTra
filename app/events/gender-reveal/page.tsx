import PackageLayout from '@/components/booking/PackageLayout';

export default function GenderRevealPage() {
  return (
    <PackageLayout
      title="Gender Reveals"
      subtitle="A magical moment for a growing family. Celebrate the joy of anticipation in an elegant setting."
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
      packageText="The biggest secret is about to be shared. Let us provide the perfect backdrop for your family's newest chapter."
      galleryImages={[
        "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600",
        "https://images.unsplash.com/photo-1473830394358-91588751b241?w=600",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600"
      ]}
    />
  );
}
