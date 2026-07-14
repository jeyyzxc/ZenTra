import type { Metadata } from 'next';
import { connection } from 'next/server';
import PublicSubpageShell from '@/components/client/PublicSubpageShell';
import ClientFeatureUnavailable from '@/components/client/ClientFeatureUnavailable';
import { getClientFeatureAvailability } from '@/lib/system-settings';
import TestimoniesClient from './TestimoniesClient';

export const metadata: Metadata = {
  title: 'Client Testimonies | Zion Events Place',
  description: 'Read real experiences from clients who celebrated their special events with Zion Events Place.',
};

export default async function TestimoniesPage() {
  await connection();
  const testimonyAvailability = await getClientFeatureAvailability('publicTestimonies');
  const submissionAvailability = await getClientFeatureAvailability('testimonySubmissions');

  return (
    <PublicSubpageShell heroKey="testimonies">
      {testimonyAvailability.enabled ? (
        <TestimoniesClient allowSubmissions={submissionAvailability.enabled} disabledMessage={submissionAvailability.message} />
      ) : (
        <ClientFeatureUnavailable
          title="Testimonies Are Paused"
          message={testimonyAvailability.message}
        />
      )}
    </PublicSubpageShell>
  );
}
