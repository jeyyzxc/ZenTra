'use client';

import React, { useEffect, useState } from 'react';
import type { Role } from '@prisma/client';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

type AdminShellUser = {
  id: string;
  email: string;
  profileImage: string | null;
  role: Extract<Role, 'SUPERADMIN' | 'ADMIN'>;
  fullName: string | null;
};

export default function AdminShell({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: AdminShellUser;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="min-h-screen bg-[#F9F8F1] transition-colors duration-500 ease-in-out dark:bg-[#0C100B]">
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        onToggle={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        currentUserRole={currentUser.role}
      />
      <AdminTopbar
        isCollapsed={isSidebarCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        currentUser={currentUser}
      />

      <main
        className={`min-h-[calc(100dvh-80px)] min-w-0 p-[var(--layout-gutter)] transition-[margin] duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[280px]'
          }`}
      >
        {children}
      </main>
    </div>
  );
}
