import HeroSection from './components/HeroSection';
import SpacesSection from './components/SpacesSection';
import FeaturesSection from './components/FeaturesSection';
import ReservationSection from './components/ReservationSection';
import TestimonialSection from './components/TestimonialSection';
import PartnersSection from './components/PartnersSection';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-transparent relative">
      {/* Hero section stays transparent and behind the scrolling content */}
      <HeroSection />
      
      {/* Container holding all lower sections. Has a solid background and sits above the hero background. */}
      <div className="relative z-10 bg-zentra-bg w-full">
        <SpacesSection />
        <FeaturesSection />
        <ReservationSection />
        <TestimonialSection />
        <PartnersSection />
      </div>
    </main>
  );
}

