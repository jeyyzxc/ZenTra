import React from 'react';

import ClientFeatureUnavailable from '@/components/client/ClientFeatureUnavailable';
import { getClientFeatureAvailability } from '@/lib/system-settings';
import BookFlow from './components/BookFlow';

export default async function BookPage() {
  const bookingAvailability = await getClientFeatureAvailability('bookingRequests');

  return (
    <main className="flex flex-col min-h-screen bg-transparent relative font-sans">
      {bookingAvailability.enabled ? (
        <BookFlow />
      ) : (
        <ClientFeatureUnavailable
          title="Online Booking Is Paused"
          message={bookingAvailability.message}
        />
      )}
    </main>
  );
}
