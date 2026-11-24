'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  LogOut,
  PackageCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCart } from '@/lib/cart-api';
import type { UserProfile } from '@/types/store';

export interface NavbarProps {
  cartItemCount?: number;
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  activeRoute?: string;
  // Backward compatibility props
  isAuthenticated?: boolean;
  user?: UserProfile | null;
  onToggleAuth?: () => void;
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartItemCount,
  onOpenCart,
  searchQuery: controlledSearchQuery,
  onSearchChange,
  onSearchSubmit,
  activeRoute,
  isAuthenticated: propIsAuthenticated,
  user: propUser,
  onToggleAuth,
  onSearchClick,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, isLoggedIn: authIsLoggedIn, isAdmin, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [fetchedCartCount, setFetchedCartCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = propIsAuthenticated !== undefined ? propIsAuthenticated : authIsLoggedIn;
  const currentUser = propUser !== undefined ? propUser : authUser;

  // Sync cart count from backend if not provided as prop
  useEffect(() => {
    if (cartItemCount === undefined && isLoggedIn) {
      getCart()
        .then((cart) => setFetchedCartCount(cart.totalItems ?? 0))
        .catch(() => setFetchedCartCount(0));
    }
  }, [cartItemCount, isLoggedIn]);

  const effectiveCartCount = cartItemCount !== undefined ? cartItemCount : fetchedCartCount;
  const effectiveSearchQuery = controlledSearchQuery !== undefined ? controlledSearchQuery : localSearch;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/', id: 'home' },
    { label: 'Catalog', href: '/products', id: 'catalog' },
    { label: 'Categories', href: '/categories', id: 'categories' },
    { label: 'About Store', href: '/about', id: 'about' },
    { label: 'My Orders', href: '/orders', id: 'orders' },
  ];

  const isLinkActive = (href: string) => {
    if (activeRoute) {
      if (activeRoute === href) return true;
      if (activeRoute === '/products' && href === '/products') return true;
    }
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleSearchChange = (val: string) => {
    if (controlledSearchQuery === undefined) {
      setLocalSearch(val);
    }
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = effectiveSearchQuery.trim();
    if (onSearchSubmit) {
      onSearchSubmit(query);
    } else if (onSearchClick) {
      onSearchClick();
    } else {
      if (query) {
        router.push(`/products?search=${encodeURIComponent(query)}`);
      } else {
        router.push('/products');
      }
    }
  };

  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      router.push('/cart');
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    if (onToggleAuth) {
      onToggleAuth();
    } else {
      await logout();
      router.push('/');
    }
  };

  const displayName = currentUser?.name || 'Account';
  const firstName = displayName.split(' ')[0];

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-full bg-zinc-100 p-1 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0 border border-zinc-200/80">
            <img
              src="/ensteinlogo.png"
              alt="Logo Toko Enstein"
              width={36}
              height={36}
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-zinc-900 uppercase leading-none">
              ENSTEIN<span className="text-amber-500 font-bold">STORE</span>
            </span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-zinc-400 mt-1">
              KEBUMEN • JAWA TENGAH
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.id}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full text-sm transition-colors duration-200 ${
                  active
                    ? 'text-zinc-900 font-bold bg-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 font-medium'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pill Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <input
              type="text"
              placeholder="Cari produk..."
              value={effectiveSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-44 lg:w-56 pl-9 pr-4 py-2 text-xs bg-zinc-100 hover:bg-zinc-200/60 focus:bg-white border border-transparent focus:border-zinc-300 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:w-64 transition-all duration-300"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-2.5 pointer-events-none" />
          </form>

          {/* Cart Icon with Live Badge */}
          <button
            type="button"
            onClick={handleCartClick}
            aria-label="Keranjang Belanja"
            className="relative p-2.5 rounded-full text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors duration-200"
          >
            <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
            {effectiveCartCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-amber-500 rounded-full shadow-sm">
                {effectiveCartCount > 9 ? '9+' : effectiveCartCount}
              </span>
            )}
          </button>

          {/* Auth Button */}
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition-all shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{firstName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 z-50 text-zinc-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-zinc-100">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Akun Terdaftar</p>
                    <p className="text-sm font-bold text-zinc-900 truncate">{displayName}</p>
                    {currentUser?.email && (
                      <p className="text-xs text-zinc-500 truncate">{currentUser.email}</p>
                    )}
                  </div>
                  <div className="py-1 text-xs font-medium">
                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-50 text-zinc-700"
                    >
                      <User className="w-4 h-4 text-zinc-500" />
                      Profil Saya
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-50 text-zinc-700"
                    >
                      <PackageCheck className="w-4 h-4 text-amber-500" />
                      Pesanan Saya
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-50 text-zinc-700 font-semibold"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Admin Dashboard
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-zinc-100 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar (Logout)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative mb-2">
            <input
              type="text"
              placeholder="Cari produk..."
              value={effectiveSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-100 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5 pointer-events-none" />
          </form>

          {navLinks.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.id}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-xl text-sm font-medium ${
                  active
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-zinc-100 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleCartClick();
              }}
              className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-xl"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-zinc-500" />
                Keranjang Belanja
              </span>
              {effectiveCartCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {effectiveCartCount}
                </span>
              )}
            </button>

            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Profil Saya ({displayName})
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 rounded-xl text-sm font-semibold text-emerald-600 hover:bg-zinc-100"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  Keluar Akun
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
              >
                Masuk / Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
