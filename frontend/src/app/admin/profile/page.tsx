'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  Boxes,
  Store,
  BarChart3,
  User,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Camera,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ExternalLink,
  ChevronDown,
  Bell,
  Menu,
  X,
  Mail,
  Phone,
  Calendar,
  Check,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';

export default function AdminProfilePage() {
  // Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile Form States
  const [adminName, setAdminName] = useState('Pak Enstein');
  const [adminEmail, setAdminEmail] = useState('sales@ensteinstore.com');
  const [adminPhone, setAdminPhone] = useState('0812-3456-7890');
  const [adminRole] = useState('Super Admin');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility Toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImage(reader.result as string);
        setToastMessage({
          title: 'Foto Profil Diperbarui',
          desc: 'Foto avatar baru berhasil disimpan ke sistem.',
          type: 'success',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Save Profile Info
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim()) {
      setToastMessage({
        title: 'Form Belum Lengkap',
        desc: 'Nama dan email admin wajib diisi.',
        type: 'error',
      });
      return;
    }

    setToastMessage({
      title: 'Informasi Profil Disimpan',
      desc: 'Data profil admin berhasil diperbarui secara lokal.',
      type: 'success',
    });
  };

  // Handle Password Update
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setToastMessage({
        title: 'Password Saat Ini Wajib Diisi',
        desc: 'Masukkan password Anda saat ini untuk verifikasi keamanan.',
        type: 'error',
      });
      return;
    }

    if (newPassword.length < 8) {
      setToastMessage({
        title: 'Password Terlalu Pendek',
        desc: 'Password baru minimal harus terdiri dari 8 karakter.',
        type: 'error',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToastMessage({
        title: 'Konfirmasi Password Tidak Cocok',
        desc: 'Password baru dan konfirmasi password harus sama persis.',
        type: 'error',
      });
      return;
    }

    // Success
    setToastMessage({
      title: 'Password Berhasil Diperbarui',
      desc: 'Kata sandi akun admin telah berhasil diubah. Sesi Anda tetap aktif.',
      type: 'success',
    });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Handle Logout All Devices
  const handleLogoutAllDevices = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin keluar dari semua sesi di perangkat lain? Anda akan tetap login di perangkat ini.'
      )
    ) {
      setToastMessage({
        title: 'Sesi Diputus',
        desc: 'Seluruh sesi login admin di perangkat smartphone dan browser lain berhasil dinonaktifkan.',
        type: 'info',
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased flex flex-col">
      {/* =====================================================================
          1. THE STANDARDIZED ADMIN SIDEBAR
          (Red geometric 'E', dual typo, glass ADMIN badge, active Profil)
      ===================================================================== */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`w-64 fixed inset-y-0 left-0 h-screen bg-zinc-950 text-zinc-300 border-r border-zinc-900 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* TOP BRAND HEADER */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-zinc-900/50 shrink-0">
          <div className="flex items-center">
            {/* Red Geometric Logo */}
            <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center text-white font-black text-sm mr-3 transform -skew-x-6 shadow-sm">
              E
            </div>

            {/* Brand Name */}
            <div className="flex items-center">
              <span className="text-white font-bold tracking-tight text-lg">ENSTEIN</span>
              <span className="text-amber-500 font-bold tracking-tight text-lg">STORE</span>
            </div>

            {/* Sleek Admin Badge */}
            <span className="ml-3 bg-white/10 text-white border border-white/20 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded uppercase backdrop-blur-sm">
              ADMIN
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MIDDLE NAV LINKS */}
        <div className="px-4 py-6 space-y-1 overflow-y-auto flex-1">
          <p className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-3 px-2">
            MENU UTAMA
          </p>
          <nav className="space-y-1">
            {/* Dashboard */}
            <Link
              href="/admin/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            {/* Products */}
            <Link
              href="/admin/products"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Produk</span>
              <span className="text-[11px] text-zinc-500 font-mono ml-auto">48</span>
            </Link>

            {/* Categories */}
            <Link
              href="/admin/categories"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Kategori &amp; Satuan</span>
              <span className="text-[11px] text-zinc-500 font-mono ml-auto">11</span>
            </Link>

            {/* Orders */}
            <Link
              href="/admin/orders"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pesanan</span>
              <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                4 Baru
              </span>
            </Link>

            {/* Payments */}
            <Link
              href="/admin/payments"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pembayaran</span>
              <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                2 Perlu Cek
              </span>
            </Link>

            {/* Inventory */}
            <Link
              href="/admin/inventory"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <Boxes className="w-4 h-4" />
              <span>Inventaris</span>
              <span className="ml-auto bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                6 Kritis
              </span>
            </Link>
          </nav>

          {/* Section: OPERASIONAL TOKO */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-3 px-2">
              OPERASIONAL TOKO
            </p>
            <nav className="space-y-1">
              <Link
                href="/admin/offline-sales"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
              >
                <Store className="w-4 h-4" />
                <span>Penjualan Offline</span>
                <span className="ml-auto bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase">
                  POS
                </span>
              </Link>

              <Link
                href="/admin/reports"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Laporan</span>
                <span className="ml-auto text-[11px] text-zinc-500 font-mono">CSV</span>
              </Link>
            </nav>
          </div>

          {/* Section: PENGATURAN AKUN */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-3 px-2">
              PENGATURAN
            </p>
            <nav className="space-y-1">
              {/* Profil Admin (ACTIVE) */}
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl bg-zinc-900 text-white shadow-xs transition-all"
              >
                <User className="w-4 h-4 text-zinc-200" />
                <span>Profil Admin</span>
              </button>
            </nav>
          </div>
        </div>

        {/* BOTTOM SIDEBAR FOOTER */}
        <div className="p-4 border-t border-zinc-900/50 space-y-3 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Lihat Toko Publik
            </span>
            <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-zinc-500" />
          </Link>

          <Link
            href="/admin/profile"
            className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-zinc-800">
                PE
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-zinc-200 truncate">{adminName}</p>
                <p className="text-[10px] text-zinc-500 truncate">{adminRole}</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Aktif
            </span>
          </Link>
        </div>
      </aside>

      {/* =====================================================================
          2. MAIN CONTENT AREA (ml-64 min-h-screen bg-zinc-50 flex flex-col)
      ===================================================================== */}
      <main className="md:ml-64 min-h-screen flex flex-col transition-all duration-300">
        {/* TOPBAR */}
        <header className="h-16 px-8 border-b border-zinc-200 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <Link href="/admin/dashboard" className="hover:text-zinc-900 transition-colors">
                Manajemen
              </Link>
              <span>/</span>
              <span className="text-zinc-900 font-semibold">Profil Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-600 border border-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Senin, 16 Nov 2026</span>
            </div>

            <button className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg relative">
              <Bell className="w-4 h-4" />
            </button>

            <Link
              href="/admin/profile"
              className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-zinc-200"
            >
              PE
            </Link>
          </div>
        </header>

        {/* TOAST FEEDBACK */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 flex items-start gap-3 p-4 rounded-xl bg-zinc-900 text-white shadow-xl max-w-md animate-in fade-in slide-in-from-top-4 duration-200 border border-zinc-800">
            {toastMessage.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {toastMessage.type === 'error' && (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            {toastMessage.type === 'info' && (
              <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-xs font-bold text-zinc-100">{toastMessage.title}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                {toastMessage.desc}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 text-zinc-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* CONTENT WRAPPER (Constrained to max-w-4xl mx-auto w-full space-y-8) */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full space-y-8">
            {/* PAGE HEADER */}
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
                Profil Admin
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Kelola informasi pribadi, kontak, dan pengaturan keamanan akun Anda.
              </p>
            </div>

            {/* ===============================================================
                SECTION 1: INFORMASI PROFIL (SaaS Settings Card)
            =============================================================== */}
            <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs flex flex-col md:flex-row">
              {/* Left/Top (Avatar Area) */}
              <div className="p-8 md:w-1/3 bg-zinc-50/50 border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col items-center justify-center text-center">
                <div className="relative group">
                  {avatarImage ? (
                    <img
                      src={avatarImage}
                      alt="Avatar Admin"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-linear-to-tr from-zinc-900 to-zinc-800 text-white text-2xl font-bold flex items-center justify-center ring-4 ring-white shadow-md">
                      PE
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1"
                    title="Ganti Foto Avatar"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:underline inline-flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Ubah Foto</span>
                </button>

                {/* Read-only Role Badge: "Super Admin" */}
                <span className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-4 shadow-2xs">
                  {adminRole}
                </span>

                <p className="text-[11px] text-zinc-400 mt-2">
                  Terdaftar sejak November 2024
                </p>
              </div>

              {/* Right/Bottom (Form Area) */}
              <form onSubmit={handleSaveProfile} className="p-8 md:w-2/3 space-y-5">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="text-base font-bold text-zinc-900">
                    Informasi Akun
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Data identitas admin untuk notifikasi transaksi dan audit pesanan
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Nama lengkap Anda..."
                        className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="Alamat email aktif..."
                        className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Nomor Telepon */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">
                      Nomor Telepon / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="Nomor handphone..."
                        className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-2xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-medium text-xs hover:bg-zinc-800 transition-all shadow-xs active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Simpan Informasi</span>
                  </button>
                </div>
              </form>
            </div>

            {/* ===============================================================
                SECTION 2: KEAMANAN & PASSWORD
            =============================================================== */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                  <KeyRound className="w-5 h-5 text-zinc-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Ubah Password</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
                  </p>
                </div>
              </div>

              <div className="border-t border-zinc-100 my-6" />

              <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-xl text-xs">
                {/* Input: Password Saat Ini */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Password Saat Ini <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password Anda saat ini..."
                      className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-2xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Input: Password Baru */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Password Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter unik..."
                      className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-2xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
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
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Konfirmasi Password Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password baru..."
                      className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-2xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-medium text-xs hover:bg-zinc-800 transition-all shadow-xs active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Perbarui Password</span>
                  </button>
                </div>
              </form>
            </div>

            {/* ===============================================================
                SECTION 3: DANGER ZONE (Zona Bahaya)
            =============================================================== */}
            <div className="bg-rose-50/60 border border-rose-200 rounded-3xl p-8 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <span>Zona Bahaya</span>
                  </h3>
                  <p className="text-xs text-rose-600/90 mt-1 max-w-xl leading-relaxed">
                    Keluar dari sesi ini di semua perangkat aktif (desktop, tablet, kasir POS fisik) untuk mengamankan kredensial akun Anda.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutAllDevices}
                  className="border border-rose-300 text-rose-700 hover:bg-rose-100 bg-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-2xs shrink-0 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Logout Semua Perangkat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
