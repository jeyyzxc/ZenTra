import PackageLayout from '../../components/PackageLayout';

export default function BirthdaysPage() {
  return (
    <PackageLayout
      title="Birthdays"
      subtitle="Another year older, another reason to celebrate."
      heroImage="https://images.unsplash.com/photo-1530103862676-de8892bc952f?q=80&w=2070&auto=format&fit=crop"
      contentBlocks={[
        {
          text: "From intimate gatherings to grand milestone celebrations, our venue adapts to your birthday vision.",
          imageSrc: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=2070&auto=format&fit=crop",
          imagePosition: 'right'
        }
      ]}
      packageText="Discover birthday packages that cater to all ages and styles, ensuring a stress-free and joyous occasion."
      galleryImages={[
        "https://images.unsplash.com/photo-1530103862676-de8892bc952f?w=600",
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600"
      ]}
    />
  );
}
