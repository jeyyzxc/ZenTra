import PackageLayout from '../../components/PackageLayout';

export default function ChristmasPartyPage() {
  return (
    <PackageLayout
      title="Christmas Party"
      subtitle="End the year with a festive celebration like no other."
      heroImage="https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=2069&auto=format&fit=crop"
      contentBlocks={[
        {
          text: "Whether it's a corporate gathering or a family reunion, our spaces transform into a winter wonderland for the holidays.",
          imageSrc: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'left'
        }
      ]}
      packageText="Our festive packages include spectacular setups to make your holiday party truly magical."
      galleryImages={[
        "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=600",
        "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=600",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600"
      ]}
    />
  );
}
