import { getOwnProfile } from './actions';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const profile = await getOwnProfile();

  return <ProfileClient initialProfile={profile} />;
}
