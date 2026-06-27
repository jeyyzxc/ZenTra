import type { Metadata } from 'next';
import SubpageHero from '@/components/client/SubpageHero';
import TestimoniesClient from './TestimoniesClient';

export const metadata: Metadata = {
  title: 'Client Testimonies | Zion Events Place',
  description: 'Read real experiences from clients who celebrated their special events with Zion Events Place.',
};

export default function TestimoniesPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <SubpageHero
        title="Client Testimonies"
        subtitle="Read real experiences from clients who celebrated their special events with Zion Events Place."
        imageSrc="https://images.unsplash.com/photo-1507504031003-b417219a0fde?q=80&w=2070&auto=format&fit=crop"
      />
      <TestimoniesClient />
    </main>
  );
}
