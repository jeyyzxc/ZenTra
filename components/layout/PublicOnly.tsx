'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (
    pathname?.startsWith('/admin') || 
    pathname?.startsWith('/forgot-password') || 
    pathname?.startsWith('/setup-account') || 
    pathname?.startsWith('/reset-password') || 
    pathname?.startsWith('/change-password')
  ) {
    return null;
  }
  
  return <>{children}</>;
}
