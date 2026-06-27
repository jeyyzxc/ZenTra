import PackageLayout from '@/components/booking/PackageLayout';

export default function DebutsPage() {
  return (
    <PackageLayout
      title="Debuts"
      subtitle="Step into adulthood with grace in a venue designed to highlight your most important milestone."
      heroImage="https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?q=80&w=2072&auto=format&fit=crop"
      contentBlocks={[
        {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
          imageSrc: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'right'
        },
        {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
          imageSrc: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'left'
        }
      ]}
      packageText="Stepping into adulthood with grace and elegance in a venue designed for your most significant milestone."
      galleryImages={[
        "https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=600",
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600"
      ]}
    />
  );
}
