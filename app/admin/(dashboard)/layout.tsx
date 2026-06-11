'use client';

import React, { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F8F1] dark:bg-[#0C100B] transition-colors duration-500 ease-in-out">
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <AdminTopbar isCollapsed={isSidebarCollapsed} />
      
      {/* Main Content Area */}
      <main 
        className={`p-8 min-h-[calc(100vh-80px)] overflow-x-hidden transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'ml-[80px]' : 'ml-[280px]'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
