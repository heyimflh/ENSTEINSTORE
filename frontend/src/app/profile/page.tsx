'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShoppingBag,
  ShoppingCart,
  Search,
  Menu,
  Clock,
  LogOut,
  Info,
  Lock,
  Mail,
  Phone,
  MapPin,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  X,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchNavQuery, setSearchNavQuery] = useState('');

  // Form states populated with initial dummy data as specified
  const [name, setName] = useState('Bu Rina');
  const [phone, setPhone] = useState('08123456789');
  const [email, setEmail] = useState('rina@example.com');
  const [defaultAddress, setDefaultAddress] = useState(
    'Jl. Penjahit No. 123, RT 02 / RW 04, Kelurahan Panjer, Kecamatan Kebumen, Kabupaten Kebumen, Jawa Tengah 54311'
  );

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing profile from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ensteinstore_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.address) setDefaultAddress(parsed.address);
      }
    } catch (e) {
      console.error('Failed reading user from storage', e);
    }
  }, []);

  // Save handler for profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic required validation
    if (!name.trim()) {
      setErrorMessage('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Nomor telepon tidak boleh kosong.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Format email tidak valid.');
      return;
    }

    // Password validation (if attempting to change password)
    if (newPassword || confirmNewPassword || currentPassword) {
      if (!currentPassword) {
        setErrorMessage('Silakan masukkan password saat ini untuk keamanan.');
        return;
      }
      if (newPassword.length < 8) {
        setErrorMessage('Password baru harus memiliki minimal 8 karakter.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setErrorMessage('Konfirmasi password baru tidak cocok.');
        return;
      }
    }

    setIsSaving(true);

    // Simulate asynchronous persistence
    setTimeout(() => {
      setIsSaving(false);

      // Save to localStorage
      try {
        const updatedProfile = {
          name,
          email,
          phone,
          address: defaultAddress,
          role: 'CUSTOMER',
        };
        localStorage.setItem('ensteinstore_auth_user', JSON.stringify(updatedProfile));
      } catch (err) {
        console.error('Storage error:', err);
      }

      // Clear password inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      // Display sleek toast notification
      setToastMessage('Perubahan profil dan alamat default berhasil disimpan!');
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    }, 850);
  };

  // Logout handler
  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari akun ENSTEINSTORE?')) {
      try {
        localStorage.removeItem('ensteinstore_auth_user');
      } catch (e) {
        console.error(e);
      }
      router.push('/auth');
    }
  };

  // Get user initials for avatar
  const userInitials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || 'U';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* =================================================================== */}
      {/* 1. STANDARDIZED GLOBAL NAVBAR (Consistent with All Pages)           */}
      {/* =================================================================== */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-zinc-200 transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-zinc-100 p-1 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0">
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
                  <span className="text-lg font-bold tracking-tight text-zinc-900 uppercase">
                    ENSTEIN<span className="text-amber-500 font-black">STORE</span>
                  </span>
                  <span className="text-[10px] tracking-widest uppercase font-medium text-zinc-400">
                    Kebumen • Jawa Tengah
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center space-x-10">
              <Link
                href="/"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                href="/products"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                Catalog
              </Link>
              <Link
                href="/#categories"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                Categories
              </Link>
              <Link
                href="/#about"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                About Store
              </Link>
              <Link
                href="/orders"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                My Orders
              </Link>
            </div>

            {/* Right: Actions (Search, Cart, Profile) */}
            <div className="flex items-center space-x-4">
              
              {/* Search Bar Input */}
              <div className="relative hidden lg:block">
                <input
                  type="text"
                  placeholder="Search fabric, zipper, snap..."
                  value={searchNavQuery}
                  onChange={(e) => setSearchNavQuery(e.target.value)}
                  className="w-52 pl-9 pr-4 py-2 text-xs bg-zinc-100 hover:bg-zinc-200/60 focus:bg-white border border-transparent focus:border-zinc-300 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:w-64 transition-all duration-300"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>

              {/* Cart Drawer Trigger / Link */}
              <Link
                href="/cart"
                aria-label="Keranjang Belanja"
                className="relative p-2.5 rounded-full text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors duration-200"
              >
                <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-zinc-900 rounded-full">
                  3
                </span>
              </Link>

              {/* Profile / Account Button (Active on Profile Page) */}
              <Link
                href="/profile"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-900 bg-zinc-900 text-white text-xs font-medium transition-all duration-200 cursor-pointer shadow-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white/95 backdrop-blur-md px-6 py-6 space-y-4">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchNavQuery}
                onChange={(e) => setSearchNavQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-100 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            </div>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-900"
            >
              Home
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Catalog
            </Link>
            <Link
              href="/#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Categories
            </Link>
            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              About Store
            </Link>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              My Orders
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Shopping Cart (3)
            </Link>
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-zinc-900 border-t border-zinc-100 pt-3"
            >
              Account Profile
            </Link>
          </div>
        )}
      </nav>

      {/* ===================================================================== */}
      {/* 2. PAGE HEADER                                                        */}
      {/* ===================================================================== */}
      <section className="pt-12 pb-8 px-4 md:px-12 xl:px-40 max-w-7xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
          <Link href="/" className="hover:text-zinc-700 transition-colors">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-zinc-800 font-medium">Akun Saya</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Akun Saya</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Kelola informasi pribadi, alamat default untuk pengiriman pesanan, dan keamanan kata sandi.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. MAIN DASHBOARD LAYOUT                                              */}
      {/* ===================================================================== */}
      <section className="px-4 md:px-12 xl:px-40 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto w-full flex-1">
        {/* =================================================================== */}
        {/* LEFT COLUMN: ACCOUNT SIDEBAR (span 3)                               */}
        {/* =================================================================== */}
        <aside className="lg:col-span-3">
          <div className="sticky top-32 bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs">
            {/* User Info Overview */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-100 mb-6">
              <div className="w-16 h-16 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xl mb-3.5 shadow-sm ring-4 ring-zinc-100">
                {userInitials}
              </div>
              <h2 className="font-bold text-zinc-900 text-base leading-snug">{name}</h2>
              <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-full px-2">{email}</p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-medium border border-zinc-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Pelanggan Terverifikasi</span>
              </div>
            </div>

            {/* Vertical Navigation Menu */}
            <nav className="space-y-1">
              {/* Active Tab: Profil Saya */}
              <Link
                href="/profile"
                className="font-semibold text-zinc-900 border-l-2 border-zinc-900 pl-4 py-2.5 block text-sm bg-zinc-50 rounded-r-xl transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-zinc-900" />
                  <span>Profil Saya</span>
                </div>
              </Link>

              {/* Inactive Tab: Pesanan Saya */}
              <Link
                href="/orders"
                className="text-zinc-500 hover:text-zinc-900 transition-colors pl-4 py-2.5 mb-4 block text-sm hover:bg-zinc-50 rounded-r-xl group"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                  <span>Pesanan Saya</span>
                </div>
              </Link>

              {/* Ghost / Danger Action: Keluar */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left text-red-500 hover:text-red-600 transition-colors pl-4 py-2.5 mt-8 block font-medium text-sm hover:bg-red-50/60 rounded-r-xl group"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                  <span>Keluar</span>
                </div>
              </button>
            </nav>
          </div>
        </aside>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: PROFILE FORMS (span 9)                                */}
        {/* =================================================================== */}
        <main className="lg:col-span-9">
          <form onSubmit={handleSaveProfile} noValidate>
            {/* Global Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                  <span className="font-medium text-xs sm:text-sm">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-400 hover:text-red-700 p-1 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION 1: INFORMASI PRIBADI                                    */}
            {/* =============================================================== */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xs mb-8">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Informasi Pribadi</h2>
                  <p className="text-xs text-zinc-500">
                    Informasi kontak utama akun pelanggan Anda di ENSTEINSTORE.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Input: Nama Lengkap */}
                <div>
                  <label
                    htmlFor="full-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                  >
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <input
                      id="full-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Bu Rina"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Input: Nomor Telepon */}
                <div>
                  <label
                    htmlFor="phone-number"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                  >
                    Nomor Telepon
                  </label>
                  <div className="relative">
                    <input
                      id="phone-number"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08123456789"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Input: Email (full width, span 2) */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="email-address"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email-address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rina@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* SECTION 2: ALAMAT PENGIRIMAN (DEFAULT ADDRESS)                 */}
            {/* =============================================================== */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xs mb-8">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Alamat Default</h2>
                  <p className="text-xs text-zinc-500">
                    Alamat pengiriman utama untuk pengantaran kain dan komponen konveksi.
                  </p>
                </div>
              </div>

              {/* Helper Text: Info Badge explaining automatic prefill for Checkout */}
              <div className="mt-5 mb-6 flex items-center gap-2.5 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-sm text-zinc-600">
                <Info className="w-4 h-4 text-zinc-800 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">
                  Alamat ini akan otomatis diisi saat Anda melakukan Checkout.
                </span>
              </div>

              {/* Textarea: Alamat Lengkap (4 rows) */}
              <div>
                <label
                  htmlFor="default-address"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                >
                  Alamat Lengkap
                </label>
                <textarea
                  id="default-address"
                  rows={4}
                  value={defaultAddress}
                  onChange={(e) => setDefaultAddress(e.target.value)}
                  placeholder="Masukkan nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota/kabupaten, dan kode pos..."
                  className="w-full p-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-y leading-relaxed"
                />
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Pastikan alamat mencantumkan patokan jelas agar kurir dapat mengantar pesanan dengan akurat.
                </p>
              </div>
            </div>

            {/* =============================================================== */}
            {/* SECTION 3: UBAH PASSWORD                                        */}
            {/* =============================================================== */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xs mb-8">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Ubah Password</h2>
                  <p className="text-xs text-zinc-500">
                    Kosongkan bagian ini jika Anda tidak ingin memperbarui kata sandi akun.
                  </p>
                </div>
              </div>

              <div className="space-y-5 mt-6">
                {/* Input: Password Saat Ini */}
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                  >
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password saat ini"
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 p-1 rounded-md transition-colors"
                      aria-label={showCurrentPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Input: Password Baru */}
                  <div>
                    <label
                      htmlFor="new-password"
                      className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                    >
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                      />
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 p-1 rounded-md transition-colors"
                        aria-label={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Input: Konfirmasi Password Baru */}
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                    >
                      Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                      />
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 p-1 rounded-md transition-colors"
                        aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {newPassword && (
                  <p
                    className={`text-xs flex items-center gap-1.5 ${
                      newPassword.length >= 8 ? 'text-emerald-600 font-medium' : 'text-amber-600'
                    }`}
                  >
                    {newPassword.length >= 8 ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    )}
                    <span>
                      {newPassword.length >= 8
                        ? 'Ketentuan minimal 8 karakter terpenuhi'
                        : 'Panjang password minimal 8 karakter'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* =============================================================== */}
            {/* FLOATING / FIXED SAVE ACTION                                    */}
            {/* =============================================================== */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-zinc-900 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2.5 text-sm"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </section>

      {/* =====================================================================
          4. MODERN FOOTER (`bg-white py-16 border-t border-zinc-200`)
          ===================================================================== */}
      <footer className="bg-white py-16 border-t border-zinc-200 text-zinc-600 mt-auto">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-zinc-100">
            
            {/* Col 1: Brand & Bio */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-100 p-1 flex items-center justify-center shrink-0">
                  <img
                    src="/ensteinlogo.png"
                    alt="Logo Toko Enstein"
                    width={32}
                    height={32}
                    style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-lg font-bold tracking-tight text-zinc-900 uppercase">
                  ENSTEIN<span className="text-amber-500 font-black">STORE</span>
                </span>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                Toko Enstein berlokasi di Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01). Penyedia bahan jas hujan (kain PVC, taslan, mika) beserta kancing snap, resleting, dan karet elastis bermutu tinggi.
              </p>

              <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 pt-1">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Kualitas Standar Konveksi &amp; Eceran</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Navigation</p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li><Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link></li>
                <li><Link href="/#products" className="hover:text-zinc-900 transition-colors">Featured Products</Link></li>
                <li><Link href="/#new-arrivals" className="hover:text-zinc-900 transition-colors">New Arrivals 2026</Link></li>
                <li><Link href="/#categories" className="hover:text-zinc-900 transition-colors">5 Main Categories</Link></li>
                <li><Link href="/#about" className="hover:text-zinc-900 transition-colors">About Us</Link></li>
              </ul>
            </div>

            {/* Col 3: Categories */}
            <div className="lg:col-span-3 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Product Categories</p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Material Jas Hujan
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Resleting
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Kancing
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Karet
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Aksesori
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact & Hours */}
            <div className="lg:col-span-3 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Visit &amp; Contact</p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-700 shrink-0 mt-0.5" />
                  <span>Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01), Jawa Tengah</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                  <a
                    href="https://wa.me/6283876942484"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-zinc-900 hover:text-amber-600 transition-colors"
                  >
                    +62 838 7694 2484
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                  <span>sales@ensteinstore.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                  <span>Senin - Sabtu: 08.00 - 17.00 WIB</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
            <p>© 2026 ENSTEINSTORE (Toko Enstein). All rights reserved.</p>
            <p>Tugas Akhir Pemrograman Berorientasi Objek &amp; Basis Data Semester 3</p>
          </div>

        </div>
      </footer>

      {/* ===================================================================== */}
      {/* FLOATING SUCCESS TOAST                                                */}
      {/* ===================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-zinc-900 text-white text-xs sm:text-sm font-medium shadow-2xl animate-in slide-in-from-bottom-5 duration-300 border border-zinc-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white p-0.5 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
