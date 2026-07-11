import type { Metadata } from 'next';
import SubpageHero from '@/components/client/SubpageHero';
import ClientFeatureUnavailable from '@/components/client/ClientFeatureUnavailable';
import { getClientFeatureAvailability } from '@/lib/system-settings';
import TestimoniesClient from './TestimoniesClient';

export const metadata: Metadata = {
  title: 'Client Testimonies | Zion Events Place',
  description: 'Read real experiences from clients who celebrated their special events with Zion Events Place.',
};

export default async function TestimoniesPage() {
  const testimonyAvailability = await getClientFeatureAvailability('publicTestimonies');
  const submissionAvailability = await getClientFeatureAvailability('testimonySubmissions');

  return (
    <main className="min-h-screen bg-transparent">
      <SubpageHero
        title="Client Testimonies"
        subtitle="Read real experiences from clients who celebrated their special events with Zion Events Place."
        imageSrc="https://images.unsplash.com/photo-1507504031003-b417219a0fde?q=80&w=2070&auto=format&fit=crop"
      />
      {testimonyAvailability.enabled ? (
        <TestimoniesClient allowSubmissions={submissionAvailability.enabled} disabledMessage={submissionAvailability.message} />
      ) : (
        <ClientFeatureUnavailable
          title="Testimonies Are Paused"
          message={testimonyAvailability.message}
        />
      )}
    </main>
  );
}
