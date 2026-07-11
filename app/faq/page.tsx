import SubpageHero from '@/components/client/SubpageHero';
import ClientFeatureUnavailable from '@/components/client/ClientFeatureUnavailable';
import { getClientFeatureAvailability } from '@/lib/system-settings';
import FAQClient from './FAQClient';

export default async function FAQPage() {
  const faqAvailability = await getClientFeatureAvailability('faq');

  return (
    <main className="flex flex-col min-h-screen bg-transparent relative">
      <SubpageHero 
        title="Get Help" 
        subtitle="Your peace of mind is our priority. Find everything you need to know about our venue, from logistics to tiny details, all in one place." 
        imageSrc="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop" 
      />
      {faqAvailability.enabled ? (
        <FAQClient />
      ) : (
        <ClientFeatureUnavailable
          title="FAQ Is Paused"
          message={faqAvailability.message}
        />
      )}
    </main>
  );
}
