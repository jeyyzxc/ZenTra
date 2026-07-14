import { connection } from 'next/server';
import PublicSubpageShell from '@/components/client/PublicSubpageShell';
import ClientFeatureUnavailable from '@/components/client/ClientFeatureUnavailable';
import { getClientFeatureAvailability } from '@/lib/system-settings';
import FAQClient from './FAQClient';

export default async function FAQPage() {
  await connection();
  const faqAvailability = await getClientFeatureAvailability('faq');

  return (
    <PublicSubpageShell heroKey="faq">
      {faqAvailability.enabled ? (
        <FAQClient />
      ) : (
        <ClientFeatureUnavailable
          title="FAQ Is Paused"
          message={faqAvailability.message}
        />
      )}
    </PublicSubpageShell>
  );
}
