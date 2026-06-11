import PackageLayout from '../../components/PackageLayout';

export default function BirthdaysPage() {
  return (
    <PackageLayout
      title="Birthdays"
      subtitle="Honoring your milestones with style, laughter, and a celebration that is uniquely you."
      heroImage="https://images.unsplash.com/photo-1530103862676-de8892bc952f?q=80&w=2070&auto=format&fit=crop"
      contentBlocks={[
        {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
          imageSrc: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'right'
        },
        {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
          imageSrc: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'left'
        }
      ]}
      packageText="Celebrate another trip around the sun in a space designed for laughter, joy, and unforgettable memories."
      galleryImages={[
        "https://images.unsplash.com/photo-1530103862676-de8892bc952f?w=600",
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600"
      ]}
    />
  );
}
