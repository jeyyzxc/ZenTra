import { ContentType } from '@prisma/client';
import PublishedPolicyPage from '@/components/public-content/PublishedPolicyPage';

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  return (
    <PublishedPolicyPage type={ContentType.PRIVACY} title="Privacy Policy" subtitle="How we protect your data." />
  );
}
