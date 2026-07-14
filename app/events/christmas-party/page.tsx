import PackageLayout from '@/components/booking/PackageLayout';

export default function ChristmasPartyPage() {
  return (
    <PackageLayout
      heroKey="christmasParty"
      contentBlocks={[
        {
          text: "Bring your team, family, or community together in a festive setting made for shared meals, year-end recognition, and genuine holiday connection.",
          imageSrc: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=2069&auto=format&fit=crop",
          imagePosition: 'right'
        },
        {
          text: "Create an easy flow from dinner and presentations to games and dancing, with flexible spaces that help the evening feel both polished and joyful.",
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
