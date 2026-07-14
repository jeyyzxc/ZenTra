import PackageLayout from '@/components/booking/PackageLayout';

export default function DebutsPage() {
  return (
    <PackageLayout
      heroKey="debuts"
      contentBlocks={[
        {
          text: "Make your entrance in a venue that gives the program, portraits, and traditions of your debut the attention they deserve. Every space can be styled around your chosen theme.",
          imageSrc: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'right'
        },
        {
          text: "Bring family and friends together for an evening that balances elegance with genuine fun, leaving room for the people and moments that define this milestone.",
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
