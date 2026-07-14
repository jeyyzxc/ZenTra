import PackageLayout from '@/components/booking/PackageLayout';

export default function BirthdaysPage() {
  return (
    <PackageLayout
      heroKey="birthdays"
      contentBlocks={[
        {
          text: "Build a birthday celebration around the person at its center, from a playful themed gathering to an elegant milestone dinner with everyone who matters.",
          imageSrc: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'right'
        },
        {
          text: "Zion's flexible spaces make room for dining, entertainment, portraits, and unhurried time together, all within one memorable setting.",
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
