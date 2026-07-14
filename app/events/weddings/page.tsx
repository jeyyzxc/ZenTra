import PackageLayout from '@/components/booking/PackageLayout';

export default function WeddingsPage() {
  return (
    <PackageLayout
      heroKey="weddings"
      contentBlocks={[
        {
          text: "Begin your celebration in a setting that can move naturally from a heartfelt ceremony to a polished reception. Zion's adaptable spaces give every part of your wedding room to feel intentional.",
          imageSrc: "/zion/684222572_17948428422152473_4013856636383990076_n.jpg",
          imagePosition: 'right'
        },
        {
          text: "Shape the day around your own story with thoughtful styling, meaningful traditions, and spaces where your guests can gather comfortably and celebrate alongside you.",
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
