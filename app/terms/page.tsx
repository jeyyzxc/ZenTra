import { ContentType } from '@prisma/client';
import PublishedPolicyPage from '@/components/public-content/PublishedPolicyPage';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <PublishedPolicyPage type={ContentType.TERMS} title="Terms and Conditions" subtitle="Please read these terms carefully." />
  );
}
