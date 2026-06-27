import HeroSection from '@/components/client/HeroSection';
import SpacesSection from '@/components/client/SpacesSection';
import FeaturesSection from '@/components/client/FeaturesSection';
import ReservationSection from '@/components/client/ReservationSection';
import TestimonialSection from '@/components/client/TestimonialSection';
import PartnersSection from '@/components/client/PartnersSection';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-transparent relative">
      {/* Hero section stays transparent and behind the scrolling content */}
      <HeroSection />
      
      {/* Container holding all lower sections. Has a solid background and sits above the hero background. */}
      <div className="relative z-10 bg-transparent w-full">
        <SpacesSection />
        <FeaturesSection />
        <ReservationSection />
        <TestimonialSection />
        <PartnersSection />
      </div>
    </main>
  );
}

