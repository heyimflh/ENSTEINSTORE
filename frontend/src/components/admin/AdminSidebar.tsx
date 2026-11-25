'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getDashboard } from '../../lib/admin-api';
import { adminGetPayments } from '../../lib/orders-api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  Boxes,
  ArrowLeftRight,
  Store,
  BarChart3,
  UserCog,
  LogOut,
  ChevronLeft,
  PanelLeftClose,
  ExternalLink,
  X,
  LucideIcon,
} from 'lucide-react';

interface NavItemDef {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: (isActive: boolean) => React.ReactNode;
  alertDot?: boolean;
  exact?: boolean;
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  mounted: boolean;
}

/** Computes up to 2 uppercase initials from a display name (e.g. "Admin Toko Enstein" -> "AT"). */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'AT';
}

export default function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
}: AdminSidebarProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, logout } = useAuth();

  const [waitingVerificationCount, setWaitingVerificationCount] = useState<number>(0);
  const [criticalStockCount, setCriticalStockCount] = useState<number>(0);
  const [collapsedTooltip, setCollapsedTooltip] = useState<{
    label: string;
    badge?: React.ReactNode;
    top: number;
    tone?: 'default' | 'danger';
  } | null>(null);

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const [dashRes, paymentsRes] = await Promise.all([
        getDashboard().catch(() => null),
        adminGetPayments({ page: 0, size: 50 }).catch(() => null),
      ]);

      if (paymentsRes && paymentsRes.content) {
        const waiting = paymentsRes.content.filter(
          (p) => p.status === 'WAITING_VERIFICATION'
        ).length;
        setWaitingVerificationCount(waiting);
      }

      if (dashRes && dashRes.stock) {
        const critical =
          (dashRes.stock.lowStockProducts || 0) +
          (dashRes.stock.outOfStockProducts || 0);
        setCriticalStockCount(critical);
      }
    } catch {
      // Ignore badge polling errors silently
    }
  }, []);

  useEffect(() => {
    fetchBadgeCounts();
  }, [fetchBadgeCounts, pathname]);

  // Keyboard shortcut Ctrl + B / Cmd + B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCollapsed]);

  // Auto-close mobile drawer and clear tooltip on route or collapse change
  useEffect(() => {
    setMobileOpen(false);
    setCollapsedTooltip(null);
  }, [pathname, isCollapsed, setMobileOpen]);

  const showTooltip = useCallback(
    (
      e: React.MouseEvent<HTMLElement>,
      label: string,
      badge?: React.ReactNode,
      tone: 'default' | 'danger' = 'default'
    ) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setCollapsedTooltip({
        label,
        badge,
        top: rect.top + rect.height / 2,
        tone,
      });
    },
    []
  );

  const hideTooltip = useCallback(() => {
    setCollapsedTooltip(null);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch {
      router.push('/auth');
    }
  };

  const displayName = (
    (user as unknown as { fullName?: string })?.fullName ||
    user?.name ||
    'Admin Toko Enstein'
  ).trim();
  const displayEmail = user?.email || 'admin@ensteinstore.com';
  const initials = getInitials(displayName);

  const navGroup1: NavItemDef[] = useMemo(
    () => [
      {
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        exact: true,
      },
      { href: '/admin/products', icon: Package, label: 'Produk' },
      { href: '/admin/categories', icon: Layers, label: 'Kategori & Satuan' },
      { href: '/admin/orders', icon: ShoppingBag, label: 'Pesanan' },
      {
        href: '/admin/payments',
        icon: CreditCard,
        label: 'Pembayaran',
        alertDot: waitingVerificationCount > 0,
        badge: (active) =>
          waitingVerificationCount > 0 ? (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black border ${
                active
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              {waitingVerificationCount}
            </span>
          ) : null,
      },
    ],
    [waitingVerificationCount]
  );

  const navGroup2: NavItemDef[] = useMemo(
    () => [
      {
        href: '/admin/inventory',
        icon: Boxes,
        label: 'Inventaris Stok',
        exact: true,
        alertDot: criticalStockCount > 0,
        badge: (active) =>
          criticalStockCount > 0 ? (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black border ${
                active
                  ? 'bg-rose-100 text-rose-700 border-rose-300'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}
            >
              {criticalStockCount}
            </span>
          ) : null,
      },
      {
        href: '/admin/inventory/movements',
        icon: ArrowLeftRight,
        label: 'Pergerakan Stok',
      },
      {
        href: '/admin/offline-sales',
        icon: Store,
        label: 'Penjualan Offline',
        badge: (active) => (
          <span
            className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider ${
              active
                ? 'bg-zinc-900 text-white border-zinc-800'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700/60'
            }`}
          >
            POS
          </span>
        ),
      },
      { href: '/admin/reports', icon: BarChart3, label: 'Laporan & Analitik' },
      { href: '/admin/profile', icon: UserCog, label: 'Profil Admin' },
    ],
    [criticalStockCount]
  );

  const isItemActive = useCallback(
    (item: NavItemDef) => {
      if (item.exact) {
        return pathname === item.href;
      }
      if (item.href === '/admin/offline-sales') {
        return pathname === '/admin/offline-sales' || pathname === '/admin/offline';
      }
      return pathname === item.href || pathname.startsWith(item.href + '/');
    },
    [pathname]
  );

  const renderNavList = (items: NavItemDef[], collapsedView: boolean) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item);
        const badgeContent = item.badge ? item.badge(active) : null;

        return (
          <li key={item.href} className="relative">
            <Link
              href={item.href}
              onMouseEnter={
                collapsedView
                  ? (e) => showTooltip(e, item.label, item.badge ? item.badge(false) : null)
                  : undefined
              }
              onMouseLeave={collapsedView ? hideTooltip : undefined}
              className={`group relative flex items-center text-xs sm:text-sm transition-all duration-150 ${
                collapsedView
                  ? 'justify-center h-11 w-11 mx-auto rounded-xl'
                  : 'gap-3 px-3.5 py-2.5 w-full rounded-xl'
              } ${
                active
                  ? 'bg-white text-zinc-950 font-semibold shadow-[0_4px_20px_rgba(255,255,255,0.14)]'
                  : 'text-zinc-400 font-medium hover:text-white hover:bg-zinc-900/90'
              }`}
            >
              {/* Icon */}
              <div className="relative shrink-0">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    active
                      ? 'text-zinc-950'
                      : 'text-zinc-400 group-hover:text-white'
                  }`}
                />
                {collapsedView && item.alertDot && (
                  <span
                    className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ${
                      active ? 'ring-white' : 'ring-zinc-950'
                    }`}
                  />
                )}
              </div>

              {/* Label, Badge & Active Indicator when expanded */}
              {!collapsedView && (
                <>
                  <span
                    className={`flex-1 truncate ${
                      active
                        ? 'text-zinc-950 font-semibold'
                        : 'text-zinc-400 group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                  {badgeContent && <div className="shrink-0">{badgeContent}</div>}
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  )}
                </>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* ─── DESKTOP PERSISTENT FIXED SIDEBAR ─── */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 h-screen bg-zinc-950 border-r border-zinc-800/80 text-zinc-400 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] select-none ${
          isCollapsed ? 'w-[84px]' : 'w-[268px]'
        }`}
      >
        {/* Decorative Ambient Glows (confined inside inner overflow-hidden wrapper) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-none">
          <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-amber-500/[0.05] via-amber-500/[0.015] to-transparent" />
        </div>

        {/* Floating Collapse / Expand Toggle Button (100% unclipped above z-30 headers) */}
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={
            isCollapsed
              ? 'Perluas Sidebar (Ctrl+B)'
              : 'Ciutkan Sidebar (Ctrl+B)'
          }
          aria-label={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-200 hover:text-white shadow-xl absolute -right-3.5 top-6 z-50 transition-colors cursor-pointer"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-300 ${
              isCollapsed ? 'rotate-180 text-amber-400' : 'text-zinc-200'
            }`}
          />
        </button>

        {/* Brand Header */}
        <div
          className={`h-[72px] flex items-center border-b border-zinc-800/70 relative z-10 shrink-0 ${
            isCollapsed ? 'px-3 justify-center' : 'px-4 justify-between gap-2'
          }`}
        >
          {isCollapsed ? (
            <Link
              href="/admin/dashboard"
              className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white font-black flex items-center justify-center shadow-md shadow-red-950/60 hover:scale-105 transition-transform"
              title="ENSTEINSTORE Admin Panel"
            >
              E
            </Link>
          ) : (
            <>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2.5 min-w-0 group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white font-black flex items-center justify-center shadow-md shadow-red-950/60 group-hover:scale-105 transition-transform shrink-0">
                  E
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="flex items-center leading-none whitespace-nowrap">
                    <span className="text-white font-extrabold tracking-tight text-sm">
                      ENSTEIN
                    </span>
                    <span className="text-amber-400 font-extrabold tracking-tight text-sm">
                      STORE
                    </span>
                  </div>
                  <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md leading-none shrink-0">
                    ADMIN
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                title="Ciutkan Sidebar (Ctrl+B)"
                aria-label="Ciutkan Sidebar"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors shrink-0 cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Scrollable Middle Navigation */}
        <nav
          onScroll={hideTooltip}
          className="flex-1 overflow-y-auto overflow-x-visible px-3 py-4 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-10"
        >
          <div>
            {!isCollapsed ? (
              <p className="px-3.5 mb-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                Menu Utama
              </p>
            ) : (
              <div className="w-6 h-px bg-zinc-800 mx-auto my-2" />
            )}
            {renderNavList(navGroup1, isCollapsed)}
          </div>

          <div>
            {!isCollapsed ? (
              <p className="px-3.5 mb-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                Operasional & Akun
              </p>
            ) : (
              <div className="w-6 h-px bg-zinc-800 mx-auto my-2" />
            )}
            {renderNavList(navGroup2, isCollapsed)}
          </div>
        </nav>

        {/* Bottom Store Preview & Admin Profile Footer */}
        <div className="p-3 border-t border-zinc-800/70 space-y-2 shrink-0 relative z-10 bg-zinc-950/95">
          {/* Quick Link: Lihat Toko Publik */}
          {!isCollapsed ? (
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              <span className="truncate">Lihat Toko Publik</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </Link>
          ) : (
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={(e) => showTooltip(e, 'Lihat Toko Publik')}
              onMouseLeave={hideTooltip}
              aria-label="Lihat Toko Publik"
              className="group relative flex items-center justify-center h-11 w-11 mx-auto rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}

          {/* Admin Profile Card */}
          {!isCollapsed ? (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 flex items-center justify-between gap-2.5">
              <Link
                href="/admin/profile"
                className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-zinc-950 font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate leading-tight mt-0.5">
                    {displayEmail}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar dari Sesi Admin"
                aria-label="Keluar dari Sesi Admin"
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/admin/profile"
                onMouseEnter={(e) => showTooltip(e, displayName)}
                onMouseLeave={hideTooltip}
                aria-label={displayName}
                className="group relative w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-zinc-950 font-extrabold text-xs flex items-center justify-center shadow-sm hover:ring-2 hover:ring-amber-300 transition-all"
              >
                {initials}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                onMouseEnter={(e) => showTooltip(e, 'Keluar Sesi', null, 'danger')}
                onMouseLeave={hideTooltip}
                aria-label="Keluar dari Sesi Admin"
                className="group relative w-10 h-9 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Floating Glass Tooltip for Collapsed Mode */}
        {isCollapsed && collapsedTooltip && (
          <div
            style={{ top: collapsedTooltip.top }}
            className={`fixed left-[76px] -translate-y-1/2 px-3 py-1.5 rounded-xl bg-zinc-900/95 backdrop-blur-md text-xs font-semibold border border-zinc-700/90 shadow-2xl whitespace-nowrap z-[70] pointer-events-none flex items-center gap-2 ${
              collapsedTooltip.tone === 'danger' ? 'text-rose-300' : 'text-white'
            }`}
          >
            <span>{collapsedTooltip.label}</span>
            {collapsedTooltip.badge && <div>{collapsedTooltip.badge}</div>}
          </div>
        )}
      </aside>

      {/* ─── MOBILE SLIDE-OVER DRAWER (< lg) ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-zinc-950 border-r border-zinc-800/80 text-zinc-400 flex flex-col lg:hidden transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-[72px] px-5 border-b border-zinc-800/70 flex items-center justify-between shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black shadow-md shadow-red-950/60">
              E
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 leading-none">
                <span className="text-white font-extrabold tracking-tight text-sm">
                  ENSTEIN
                </span>
                <span className="text-amber-400 font-extrabold tracking-tight text-sm">
                  STORE
                </span>
              </div>
              <span className="mt-1 self-start bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md leading-none">
                ADMIN
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup Menu"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div>
            <p className="px-3.5 mb-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
              Menu Utama
            </p>
            {renderNavList(navGroup1, false)}
          </div>
          <div>
            <p className="px-3.5 mb-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
              Operasional & Akun
            </p>
            {renderNavList(navGroup2, false)}
          </div>
        </nav>

        <div className="p-3 border-t border-zinc-800/70 space-y-2 shrink-0 bg-zinc-950">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <span>Lihat Toko Publik</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </Link>
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 flex items-center justify-between gap-2.5">
            <Link
              href="/admin/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-zinc-950 font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[10px] text-zinc-400 truncate leading-tight mt-0.5">
                  {displayEmail}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar dari Sesi Admin"
              aria-label="Keluar dari Sesi Admin"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Dark Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
