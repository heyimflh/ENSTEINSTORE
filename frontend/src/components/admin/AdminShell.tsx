'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutContextType {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMobile: () => void;
}

const AdminLayoutContext = createContext<AdminLayoutContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
  toggleMobile: () => {},
});

export function useAdminLayout() {
  return useContext(AdminLayoutContext);
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('ensteinstore_admin_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSetCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsed((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem('ensteinstore_admin_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleCollapsed = () => handleSetCollapsed((prev) => !prev);
  const toggleMobile = () => setMobileOpen((prev) => !prev);

  return (
    <AdminLayoutContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed: handleSetCollapsed,
        toggleCollapsed,
        mobileOpen,
        setMobileOpen,
        toggleMobile,
      }}
    >
      <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans antialiased relative selection:bg-amber-400 selection:text-zinc-950">
        {/* Persistent Shared Admin Sidebar */}
        <AdminSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={handleSetCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          mounted={mounted}
        />

        {/* Main Content Area — Offset for fixed sidebar */}
        <div
          className={`min-h-screen bg-zinc-100 flex flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isCollapsed ? 'lg:pl-[84px]' : 'lg:pl-[268px]'
          }`}
        >
          {children}
        </div>
      </div>
    </AdminLayoutContext.Provider>
  );
}
