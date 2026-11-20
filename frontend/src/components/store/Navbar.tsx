'use client';

import React, { useState } from 'react';
import { Search, ShoppingCart, User, Menu, X, Check, ShieldCheck, ChevronDown, PackageCheck, LogOut } from 'lucide-react';
import { UserProfile } from '../../types/store';

interface NavbarProps {
  cartItemCount: number;
  isAuthenticated: boolean;
  user: UserProfile | null;
  onToggleAuth: () => void;
  onOpenCart: () => void;
  onSearchClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartItemCount,
  isAuthenticated,
  user,
  onToggleAuth,
  onOpenCart,
  onSearchClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '#', active: true },
    { label: 'Products', href: '#products-section', active: false },
    { label: 'About Us', href: '#about-section', active: false },
    { label: 'My Orders', href: '#orders-section', active: false },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FDFBF7]/95 backdrop-blur-md border-b border-stone-200/80 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-stone-200 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 tracking-wide">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span>Toko Enstein: Melayani eceran per meter &amp; partai besar untuk konveksi jas hujan seluruh Indonesia.</span>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-stone-200 group-hover:scale-105 transition-transform duration-200">
              <img src="/ensteinlogo.png" alt="Logo Toko Enstein" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 font-serif leading-none">
                ENSTEIN<span className="text-amber-600">STORE</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">
                Toko Enstein • Kebumen
              </span>
            </div>
          </a>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                link.active
                  ? 'text-slate-900 font-semibold bg-stone-200/60'
                  : 'text-stone-600 hover:text-slate-900 hover:bg-stone-100'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger Icon */}
          <button
            onClick={onSearchClick}
            aria-label="Cari Produk"
            className="p-2.5 rounded-full text-stone-600 hover:text-slate-900 hover:bg-stone-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Cart Icon with Notification Badge */}
          <button
            onClick={onOpenCart}
            aria-label="Keranjang Belanja"
            className="relative p-2.5 rounded-full text-stone-700 hover:text-slate-900 hover:bg-stone-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 group"
          >
            <ShoppingCart className="w-5 h-5 group-hover:scale-105 transition-transform" />
            {cartItemCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold text-slate-950 bg-amber-400 border-2 border-[#FDFBF7] rounded-full shadow-sm">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Authentication State: Login Button or User Avatar */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-stone-100 hover:bg-stone-200/80 transition-colors border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <img
                  src={user.avatarUrl || '/ensteinlogo.png'}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-amber-500"
                />
                <span className="text-xs font-semibold text-slate-900 hidden lg:inline-block max-w-[120px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-stone-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-stone-100">
                    <p className="text-xs text-stone-400 font-medium">Masuk Sebagai</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-stone-500 truncate">{user.email}</p>
                  </div>
                  <div className="py-1 text-xs font-medium">
                    <a href="#orders-section" className="flex items-center gap-2.5 px-4 py-2 hover:bg-stone-50 text-stone-700">
                      <PackageCheck className="w-4 h-4 text-amber-600" />
                      Pesanan Saya (My Orders)
                    </a>
                    <a href="#about-section" className="flex items-center gap-2.5 px-4 py-2 hover:bg-stone-50 text-stone-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Status Pelanggan Terverifikasi
                    </a>
                  </div>
                  <div className="border-t border-stone-100 pt-1">
                    <button
                      onClick={() => {
                        onToggleAuth();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout (Simulasi Guest)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onToggleAuth}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-slate-900 text-stone-100 hover:bg-slate-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/40"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#FDFBF7] px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-medium ${
                link.active
                  ? 'bg-slate-900 text-stone-100 font-semibold'
                  : 'text-stone-700 hover:bg-stone-200/50'
              }`}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-stone-200">
            <button
              onClick={() => {
                onToggleAuth();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center bg-stone-200 text-slate-900"
            >
              {isAuthenticated ? 'Keluar Akun' : 'Masuk / Login (Simulasi)'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
