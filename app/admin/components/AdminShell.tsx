'use client';

import React, { useState } from 'react';
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

  return (
    <div className="min-h-screen bg-[#F9F8F1] transition-colors duration-500 ease-in-out dark:bg-[#0C100B]">
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        currentUserRole={currentUser.role}
      />
      <AdminTopbar
        isCollapsed={isSidebarCollapsed}
        currentUser={currentUser}
      />

      <main
        className={`min-h-[calc(100vh-80px)] p-4 transition-all duration-300 ease-in-out md:p-8 ${isSidebarCollapsed ? 'ml-[80px]' : 'ml-[80px] md:ml-[280px]'
          }`}
      >
        {children}
      </main>
    </div>
  );
}
