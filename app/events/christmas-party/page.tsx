import PackageLayout from '../../components/PackageLayout';

export default function ChristmasPartyPage() {
  return (
    <PackageLayout
      title="Christmas Parties"
      subtitle="Toasts, traditions, and holiday cheer. Create unforgettable seasonal memories with those who matter most."
      heroImage="https://images.unsplash.com/photo-1544252636-f0270b2ed65f?q=80&w=2070&auto=format&fit=crop"
      contentBlocks={[
        {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
          imageSrc: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=2069&auto=format&fit=crop",
          imagePosition: 'right'
        },
        {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
          imageSrc: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'left'
        }
      ]}
      packageText="Celebrate the most wonderful time of the year with festive packages designed for joy and connection."
      galleryImages={[
        "https://images.unsplash.com/photo-1544252636-f0270b2ed65f?w=600",
        "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=600",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600"
      ]}
    />
  );
}
