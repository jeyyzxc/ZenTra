import PackageLayout from '../../components/PackageLayout';

export default function GenderRevealPage() {
  return (
    <PackageLayout
      title="Gender Reveal"
      subtitle="Share the big news in a spectacular setting."
      heroImage="https://images.unsplash.com/photo-1621213076735-a7b63f57cd0c?q=80&w=2070&auto=format&fit=crop"
      contentBlocks={[
        {
          text: "Boy or Girl? Gather your loved ones and make the big reveal an unforgettable moment with our customized setups.",
          imageSrc: "https://images.unsplash.com/photo-1542456485-6495cb2e1e0a?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'left'
        }
      ]}
      packageText="Our dedicated packages help you orchestrate the perfect surprise for your family and friends."
      galleryImages={[
        "https://images.unsplash.com/photo-1621213076735-a7b63f57cd0c?w=600",
        "https://images.unsplash.com/photo-1542456485-6495cb2e1e0a?w=600",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600"
      ]}
    />
  );
}
