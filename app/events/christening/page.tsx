import PackageLayout from '../../components/PackageLayout';

export default function ChristeningPage() {
  return (
    <PackageLayout
      title="Christening"
      subtitle="Welcome your little one in a serene and joyous atmosphere."
      heroImage="https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=2070&auto=format&fit=crop"
      contentBlocks={[
        {
          text: "A beautiful setting to celebrate life's most precious beginnings with your closest family and friends.",
          imageSrc: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'right'
        }
      ]}
      packageText="Explore our elegant christening packages that provide a peaceful environment for your celebration."
      galleryImages={[
        "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600",
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600"
      ]}
    />
  );
}
