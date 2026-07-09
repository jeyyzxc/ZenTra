import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { getCurrentAdmin } from '@/lib/authorization';

export default async function ServicesAndPackagesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect('/admin');
  }

  if (currentAdmin.role !== Role.SUPERADMIN) {
    redirect('/admin/dashboard');
  }

  return children;
}
