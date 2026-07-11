import PackageLayout from '@/components/booking/PackageLayout';

export default function WeddingsPage() {
  return (
    <PackageLayout
      title="Weddings"
      subtitle="Celebrate your love in a setting as beautiful as your story."
      heroImage="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop"
      contentBlocks={[
        {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
          imageSrc: "/zion/684222572_17948428422152473_4013856636383990076_n.jpg",
          imagePosition: 'right'
        },
        {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
          imageSrc: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'left'
        }
      ]}
      packageText="Crafting the beginning of your forever with curated experiences designed for your unique love story."
      galleryImages={[
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600",
        "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=600"
      ]}
    />
  );
}
