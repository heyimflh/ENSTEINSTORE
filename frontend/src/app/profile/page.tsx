'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getMyProfile, updateMyProfile, changeMyPassword, isAuthenticated } from '@/lib/auth-api';
import { getMyOrders } from '@/lib/orders-api';
import { ApiException, clearToken } from '@/lib/api';
import type { UserProfileResponse, PagedResponse, OrderSummaryResponse, OrderStatus } from '@/types/api';
import { Navbar } from '@/components/store/Navbar';
import { Footer } from '@/components/store/Footer';
import {
  User,
  ShoppingBag,
  ShoppingCart,
  Lock,
  Mail,
  Phone,
  MapPin,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogOut,
  Building,
  Calendar,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

function formatIDR(n: number | null | undefined): string {
  const num = typeof n === 'number' && !isNaN(n) ? n : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return {
        label: 'Menunggu Pembayaran',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'PAID':
      return {
        label: 'Terverifikasi (Lunas)',
        className: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    case 'PROCESSING':
      return {
        label: 'Sedang Diproses',
        className: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      };
    case 'READY':
      return {
        label: 'Siap Diambil / Dikirim',
        className: 'bg-purple-50 text-purple-800 border-purple-200',
      };
    case 'COMPLETED':
      return {
        label: 'Selesai',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'CANCELLED':
      return {
        label: 'Dibatalkan',
        className: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    default:
      return {
        label: status,
        className: 'bg-zinc-50 text-zinc-700 border-zinc-200',
      };
  }
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoggedIn, loading: authLoading, logout, updateUser } = useAuth();

  // Page data states
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [ordersPage, setOrdersPage] = useState<PagedResponse<OrderSummaryResponse> | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Form 1: Profile & Address states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Form 2: Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Fetch real profile and recent orders
  const fetchProfileAndOrders = useCallback(async () => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    try {
      setPageLoading(true);
      setProfileErrorMsg(null);

      // Parallel fetch profile + recent orders
      const [profileRes, ordersRes] = await Promise.all([
        getMyProfile(),
        getMyOrders(0, 3).catch(() => null),
      ]);

      setProfile(profileRes);
      setFullName(profileRes.fullName || '');
      setEmail(profileRes.email || '');
      setPhone(profileRes.phone || '');
      setAddress(profileRes.address || '');
      setCity(profileRes.city || '');

      if (ordersRes) {
        setOrdersPage(ordersRes);
      }
    } catch (err) {
      if (err instanceof ApiException && (err.status === 401 || err.code === 'UNAUTHORIZED')) {
        clearToken();
        await logout();
        router.push('/auth');
        return;
      }
      setProfileErrorMsg(err instanceof Error ? err.message : 'Gagal memuat profil pengguna.');
    } finally {
      setPageLoading(false);
    }
  }, [logout, router]);

  // Auth Guard
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/auth');
      } else {
        fetchProfileAndOrders();
      }
    }
  }, [authLoading, isLoggedIn, router, fetchProfileAndOrders]);

  // Derived mini-stats
  const totalOrdersCount = ordersPage?.totalElements ?? 0;
  const activeOrdersCount = useMemo(() => {
    if (!ordersPage?.content) return 0;
    return ordersPage.content.filter(
      (o: OrderSummaryResponse) => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED'
    ).length;
  }, [ordersPage]);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    if (!fullName.trim()) {
      setProfileErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    setIsSavingProfile(true);

    try {
      const updated = await updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
      });

      setProfile(updated);
      setFullName(updated.fullName);
      setPhone(updated.phone || '');
      setAddress(updated.address || '');
      setCity(updated.city || '');

      // Sync name back to AuthContext so Navbar updates immediately
      updateUser({ name: updated.fullName });

      // Save default address fallback for checkout convenience
      if (typeof window !== 'undefined') {
        if (updated.address) {
          localStorage.setItem('ensteinstore_default_address', updated.address);
        }
      }

      setProfileSuccessMsg('Profil dan alamat pengiriman utama berhasil diperbarui.');
      setTimeout(() => setProfileSuccessMsg(null), 5000);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status === 401 || err.code === 'UNAUTHORIZED') {
          clearToken();
          await logout();
          router.push('/auth');
          return;
        }
        setProfileErrorMsg(err.message);
      } else {
        setProfileErrorMsg('Gagal memperbarui profil. Silakan coba kembali.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg('Password saat ini wajib diisi.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordErrorMsg('Password baru harus terdiri dari minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    setIsSavingPassword(true);

    try {
      await changeMyPassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccessMsg('Kata sandi akun Anda berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(null), 5000);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status === 401 || err.code === 'UNAUTHORIZED') {
          clearToken();
          await logout();
          router.push('/auth');
          return;
        }
        setPasswordErrorMsg(err.message);
      } else {
        setPasswordErrorMsg('Gagal mengubah password. Pastikan password saat ini sesuai.');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari akun ENSTEINSTORE?')) {
      await logout();
      router.push('/auth');
    }
  };

  // Unauthenticated or Loading View
  if (authLoading || (pageLoading && !profile)) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/profile" />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-zinc-800">Menyiapkan Akun Saya</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Memuat profil pelanggan dan riwayat pesanan dari sistem...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Global Standardized Navbar */}
      <Navbar cartItemCount={0} activeRoute="/profile" />

      {/* 2. Main Profile Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        
        {/* Top Breadcrumb & Navigation */}
        <nav aria-label="Breadcrumb" className="pb-6 border-b border-zinc-200/80">
          <ol className="flex items-center gap-2 text-xs text-zinc-500">
            <li>
              <Link href="/" className="hover:text-zinc-900 transition-colors">
                Beranda
              </Link>
            </li>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <li className="font-semibold text-zinc-900">
              Akun Saya
            </li>
          </ol>
        </nav>

        {/* Page Title & Subtitle */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Akun Saya
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1">
              Kelola informasi pribadi, alamat pengiriman utama, dan keamanan kata sandi akun Anda.
            </p>
          </div>

          {/* Admin shortcut if applicable */}
          {authUser?.role === 'ADMIN' && (
            <Link
              href="/admin/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs self-start sm:self-auto"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Buka Profil Administrator</span>
            </Link>
          )}
        </div>

        {/* 3. Main 2-Column Responsive Workspace */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (4 cols): Sticky Customer Account Sidebar */}
          <aside className="lg:col-span-4 sticky top-24 space-y-5">
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs">
              
              {/* Identity Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-xl font-extrabold tracking-wider shrink-0 shadow-sm">
                  {getInitials(profile?.fullName || authUser?.name || 'Customer')}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-zinc-900 truncate">
                    {profile?.fullName || authUser?.name || 'Pelanggan'}
                  </h2>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {profile?.email || authUser?.email || '-'}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pelanggan Terverifikasi</span>
                  </div>
                </div>
              </div>

              {/* Live Order Mini-Stats */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-zinc-100 text-center">
                <div className="bg-zinc-50/80 rounded-2xl p-3 border border-zinc-100">
                  <span className="text-[11px] font-medium text-zinc-500 block">Total Pesanan</span>
                  <strong className="text-lg font-extrabold text-zinc-900 block mt-0.5">
                    {totalOrdersCount}
                  </strong>
                </div>
                <div className="bg-zinc-50/80 rounded-2xl p-3 border border-zinc-100">
                  <span className="text-[11px] font-medium text-zinc-500 block">Pesanan Aktif</span>
                  <strong className="text-lg font-extrabold text-amber-600 block mt-0.5">
                    {activeOrdersCount}
                  </strong>
                </div>
              </div>

              {/* Account Navigation Links */}
              <nav className="mt-6 pt-6 border-t border-zinc-100 space-y-1.5">
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-zinc-900 text-white text-xs font-bold shadow-xs">
                  <span className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>Profil &amp; Alamat</span>
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>

                <Link
                  href="/orders"
                  className="flex items-center justify-between px-4 py-3 rounded-2xl text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-zinc-400" />
                    <span>Pesanan Saya</span>
                  </span>
                  {totalOrdersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold">
                      {totalOrdersCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/cart"
                  className="flex items-center justify-between px-4 py-3 rounded-2xl text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingCart className="w-4 h-4 text-zinc-400" />
                    <span>Keranjang Belanja</span>
                  </span>
                </Link>

                <div className="pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </nav>

            </div>
          </aside>

          {/* Right Column (8 cols): Modular Management Cards */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1: INFORMASI PRIBADI & ALAMAT PENGIRIMAN UTAMA */}
            <section className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs">
              
              {/* Header */}
              <div className="flex items-start gap-3.5 pb-6 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                    Informasi Pribadi &amp; Kontak
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Data kontak ini digunakan untuk konfirmasi pesanan dan informasi pengiriman.
                  </p>
                </div>
              </div>

              {/* Form 1 */}
              <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
                
                {profileSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama lengkap Anda"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-2xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Nomor Telepon */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                      Nomor Telepon (WhatsApp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08123456789"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-2xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      Alamat Email
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Terdaftar &amp; Terverifikasi
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-zinc-100/70 border border-zinc-200 rounded-2xl text-xs sm:text-sm text-zinc-500 cursor-not-allowed outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Email digunakan sebagai identitas login utama akun Anda dan tidak dapat diubah secara langsung.
                  </p>
                </div>

                {/* Sub-section: Alamat Pengiriman Utama */}
                <div className="pt-6 border-t border-zinc-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-bold text-zinc-900">
                      Alamat Pengiriman Utama
                    </h4>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
                    Alamat utama yang disimpan di sini akan otomatis terisi saat Anda melakukan Checkout untuk mempercepat pemesanan.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                      Alamat Lengkap (Jalan, RT/RW, Dusun, Kelurahan, Kecamatan)
                    </label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Contoh: Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01)"
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-2xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 transition-all outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                      Kota / Kabupaten &amp; Kode Pos
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Contoh: Kebumen, 54311"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-2xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Footer */}
                <div className="pt-5 border-t border-zinc-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white rounded-full text-xs sm:text-sm font-semibold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Profil...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Profil &amp; Alamat</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </section>

            {/* CARD 2: KEAMANAN & UBAH KATA SANDI */}
            <section className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs">
              
              {/* Header */}
              <div className="flex items-start gap-3.5 pb-6 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                    Ubah Kata Sandi
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Gunakan minimal 8 karakter dengan kombinasi huruf dan angka untuk menjaga keamanan akun Anda.
                  </p>
                </div>
              </div>

              {/* Form 2 */}
              <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4">
                
                {passwordSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{passwordSuccessMsg}</span>
                  </div>
                )}

                {passwordErrorMsg && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{passwordErrorMsg}</span>
                  </div>
                )}

                {/* Password Saat Ini */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                    Password Saat Ini <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password saat ini"
                      className="w-full pl-4 pr-11 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-2xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-1"
                      title={showCurrentPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Baru & Konfirmasi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Password Baru */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                        Password Baru <span className="text-rose-500">*</span>
                      </label>
                      {newPassword.length >= 8 && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Min. 8 Karakter</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className="w-full pl-4 pr-11 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-2xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-1"
                        title={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Konfirmasi Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                        Konfirmasi Password <span className="text-rose-500">*</span>
                      </label>
                      {confirmPassword && newPassword === confirmPassword && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Cocok</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        className="w-full pl-4 pr-11 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-2xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-1"
                        title={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save Footer */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPassword || !currentPassword || newPassword.length < 8}
                    className="px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white rounded-full text-xs sm:text-sm font-semibold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memperbarui Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Perbarui Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </section>

            {/* CARD 3: AKTIVITAS PESANAN TERAKHIR */}
            <section className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs">
              
              <div className="flex items-center justify-between pb-6 border-b border-zinc-100">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                    Pesanan Terakhir Anda
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Riwayat transaksi belanja bahan jas hujan dan komponen konveksi.
                  </p>
                </div>

                <Link
                  href="/orders"
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1"
                >
                  <span>Lihat Semua Pesanan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-6">
                {!ordersPage?.content || ordersPage.content.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 mx-auto mb-3 shadow-2xs">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-zinc-800">Belum Ada Riwayat Pesanan</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      Yuk mulai belanja material dan perlengkapan jas hujan di katalog ENSTEINSTORE!
                    </p>
                    <Link
                      href="/products"
                      className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-semibold shadow-xs"
                    >
                      <span>Mulai Belanja Material</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {ordersPage.content.map((ord: OrderSummaryResponse) => {
                      const badge = getStatusBadge(ord.orderStatus);
                      return (
                        <div
                          key={ord.id}
                          className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-zinc-900 text-sm">
                                #{ord.orderNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(ord.orderDate)}</span>
                              </span>
                              <span>•</span>
                              <span>{ord.fulfillmentMethod === 'PICKUP' ? 'Ambil di Toko' : 'Pengiriman Kurir'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                            <strong className="text-sm font-extrabold text-zinc-900">
                              {formatIDR(ord.totalAmount)}
                            </strong>
                            <Link
                              href={`/orders/${ord.orderNumber}`}
                              className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-full text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <span>Detail</span>
                              <ChevronRight className="w-3 h-3 text-zinc-400" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </section>

          </div>

        </div>

      </main>

      {/* 4. Global Standardized Footer */}
      <Footer />
    </div>
  );
}
