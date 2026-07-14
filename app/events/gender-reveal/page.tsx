import PackageLayout from '@/components/booking/PackageLayout';

export default function GenderRevealPage() {
  return (
    <PackageLayout
      heroKey="genderReveal"
      contentBlocks={[
        {
          text: "Share one of your family's happiest surprises in a space that gives the reveal moment a beautiful backdrop and every guest a clear view of the joy.",
          imageSrc: "https://images.unsplash.com/photo-1473830394358-91588751b241?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'right'
        },
        {
          text: "Choose details that reflect your growing family and enjoy a relaxed celebration designed for photos, laughter, and the people already waiting to welcome your little one.",
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
