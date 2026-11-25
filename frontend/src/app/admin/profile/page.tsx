'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdminLayout } from '@/components/admin/AdminShell';
import { getMyProfile, updateMyProfile, changeMyPassword } from '../../../lib/auth-api';
import { getStoreConfig } from '../../../lib/orders-api';
import { getDashboard } from '../../../lib/admin-api';
import type {
  UserProfileResponse,
  StoreConfigResponse,
  DashboardSummaryResponse,
} from '../../../types/api';
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
  User,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Menu,
  X,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  UserCog,
  MapPin,
  Truck,
  Clock,
  Sparkles,
  Building,
} from 'lucide-react';

function formatIDR(val: number = 0): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function formatMemberDate(dateStr?: string | null): string {
  if (!dateStr) return 'Akun Pengelola Resmi';
  try {
    const d = new Date(dateStr);
    return `Terdaftar sejak ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
  } catch {
    return 'Akun Pengelola Resmi';
  }
}

export default function AdminProfilePage() {
  const router = useRouter();
  const { user, isAdmin, logout, updateUser, loading: authLoading } = useAuth();
  const { toggleMobile } = useAdminLayout();

  // Live Data States
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfigResponse | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Form: Account Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Form: Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Confirmation Modal for Logout
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/auth');
    }
  }, [authLoading, isAdmin, router]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch All Admin & Store Data in Parallel
  const fetchAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [profileRes, configRes, dashRes] = await Promise.all([
        getMyProfile().catch((e) => {
          console.warn('Failed to fetch profile:', e);
          return null;
        }),
        getStoreConfig().catch((e) => {
          console.warn('Failed to fetch store config:', e);
          return null;
        }),
        getDashboard().catch((e) => {
          console.warn('Failed to fetch dashboard summary:', e);
          return null;
        }),
      ]);

      if (profileRes) {
        setProfile(profileRes);
        setFullName(profileRes.fullName || '');
        setPhone(profileRes.phone || '');
      } else if (user) {
        setFullName(user.name || '');
      }

      if (configRes) setStoreConfig(configRes);
      if (dashRes) setDashboardData(dashRes);
    } catch (err) {
      console.error('Error fetching admin profile hub data:', err);
      setToast({
        type: 'error',
        message: 'Gagal memuat sebagian data profil. Pastikan backend Spring Boot aktif.',
      });
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin, fetchAllData]);

  // Save Account Info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setToast({ type: 'error', message: 'Nama lengkap wajib diisi.' });
      return;
    }

    setSavingInfo(true);
    try {
      const updated = await updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: profile?.address,
        city: profile?.city,
      });

      setProfile(updated);
      setFullName(updated.fullName);
      setPhone(updated.phone || '');

      // Immediately synchronize into AuthContext & localStorage so sidebar/topbar update without reload
      updateUser({ name: updated.fullName });

      setToast({
        type: 'success',
        message: 'Informasi akun admin berhasil diperbarui dan disinkronisasi!',
      });
    } catch (err: unknown) {
      console.error('Failed to update admin profile:', err);
      const errMsg = err instanceof Error ? err.message : 'Gagal memperbarui profil admin.';
      setToast({ type: 'error', message: errMsg });
    } finally {
      setSavingInfo(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setToast({ type: 'error', message: 'Password saat ini wajib diisi.' });
      return;
    }

    if (newPassword.length < 8) {
      setToast({ type: 'error', message: 'Password baru minimal harus 8 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    setSavingPassword(true);
    try {
      await changeMyPassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setToast({
        type: 'success',
        message: 'Kata sandi berhasil diperbarui! Gunakan password baru untuk login berikutnya.',
      });
    } catch (err: unknown) {
      console.error('Failed to update password:', err);
      const errMsg = err instanceof Error ? err.message : 'Gagal memperbarui password. Periksa password lama Anda.';
      setToast({ type: 'error', message: errMsg });
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Logout with Session Revocation
  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/auth');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/auth');
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const displayName = profile?.fullName || user?.name || 'Admin Toko';
  const displayEmail = profile?.email || user?.email || 'admin@ensteinstore.com';
  const displayInitial = (displayName || 'A').charAt(0).toUpperCase();

  const isPasswordValid = newPassword.length >= 8;
  const isPasswordMatch = newPassword.length > 0 && newPassword === confirmPassword;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-xs tracking-wider uppercase font-semibold">Memuat Sesi Pengelola...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium transition-all transform animate-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-zinc-950 text-white border border-emerald-500/30 shadow-emerald-950/20'
              : 'bg-zinc-950 text-white border border-rose-500/30 shadow-rose-950/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── LOGOUT CONFIRMATION MODAL ─── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Keluar dari Sesi Administrator?</h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Sesi autentikasi JWT Anda akan dicabut secara permanen di server PostgreSQL demi keamanan sistem kasir & gudang.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={loggingOut}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-2"
              >
                {loggingOut && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{loggingOut ? 'Mencabut Sesi...' : 'Ya, Keluar Sesi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Executive Topbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 h-16 flex items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <span className="hidden sm:inline">Admin Panel</span>
              <ChevronRight className="w-3.5 h-3.5 hidden sm:inline" />
              <span className="text-zinc-900 font-bold text-sm">Pengaturan & Profil Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <button
              onClick={fetchAllData}
              disabled={loadingData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-zinc-900' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-amber-400 flex items-center justify-center text-xs font-black border border-zinc-700 shadow-2xs">
              {displayInitial}
            </div>
          </div>
        </header>

        {/* Executive Workspace */}
        <main className="flex-1 p-5 sm:p-7 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Title & Live Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                  Pengaturan Akun & Profil Toko
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live PostgreSQL
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Kelola identitas akun administrator, preferensi keamanan sandi, dan pantau status konfigurasi operasional toko.
              </p>
            </div>
          </div>

          {/* 2-Column Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ─── LEFT COLUMN: STICKY IDENTITY & STORE STATUS (lg:col-span-4) ─── */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
              {/* Identity Card */}
              <div className="bg-white rounded-3xl border border-zinc-200/80 overflow-hidden shadow-xs">
                {/* Banner */}
                <div className="h-24 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/90 relative p-4 flex justify-end items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white backdrop-blur-xs border border-white/20">
                    MASTER CONTROL
                  </span>
                </div>

                {/* Overlapping High-Contrast Avatar */}
                <div className="px-6 pb-6 relative">
                  <div className="-mt-12 mb-3 flex items-end justify-between">
                    <div className="w-20 h-20 rounded-2xl bg-zinc-950 text-amber-400 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black tracking-tight shrink-0">
                      {displayInitial}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ADMIN AKTIF
                      </span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-zinc-900 tracking-tight">
                      {displayName}
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium truncate mt-0.5">
                      {displayEmail}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                      ROLE_ADMIN
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      JWT PROTECTED
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-medium mt-3">
                    {formatMemberDate(profile?.createdAt)}
                  </p>

                  {/* Live Operational Snapshot */}
                  <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-zinc-100 text-center">
                    <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase">Katalog SKU</p>
                      <p className="text-sm font-black text-zinc-900 mt-0.5">
                        {dashboardData?.stock?.totalProducts ?? '-'}
                      </p>
                    </div>
                    <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase">Total Order</p>
                      <p className="text-sm font-black text-zinc-900 mt-0.5">
                        {dashboardData?.sales?.totalOrders ?? '-'}
                      </p>
                    </div>
                    <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase">Order Lunas</p>
                      <p className="text-sm font-black text-emerald-700 mt-0.5">
                        {dashboardData?.sales?.paidOrders ?? '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Store Info Card */}
              <div className="bg-zinc-950 text-white rounded-3xl p-6 border border-zinc-800/80 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Parameter Operasional Toko
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500">PRD §13</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> Lokasi Fisik:
                    </span>
                    <span className="font-semibold text-right text-zinc-200">
                      {storeConfig?.storeName || 'Toko Enstein'} • Kebumen
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> Tarif Kirim:
                    </span>
                    <span className="font-semibold text-zinc-200">
                      {formatIDR(storeConfig?.deliveryFee ?? 10000)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> Batas Bayar:
                    </span>
                    <span className="font-semibold text-zinc-200">
                      {storeConfig?.paymentExpiryHours ?? 24} Jam
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> Mode Demo:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        storeConfig?.simulationEnabled
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {storeConfig?.simulationEnabled ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>

                {/* Bank Account Quick Reference */}
                {storeConfig?.bankAccounts && storeConfig.bankAccounts.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800 text-xs">
                    <p className="text-[11px] font-semibold text-zinc-400 mb-1">Rekening Pembayaran Utama:</p>
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <p className="font-bold text-amber-400 text-xs">
                        {storeConfig.bankAccounts[0].bankName}
                      </p>
                      <p className="font-mono text-zinc-300 text-xs mt-0.5 tracking-wider">
                        {storeConfig.bankAccounts[0].accountNumber}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        a/n {storeConfig.bankAccounts[0].accountHolder}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── RIGHT COLUMN: MODULAR ACCOUNT & SECURITY FORMS (lg:col-span-8) ─── */}
            <div className="lg:col-span-8 space-y-6">
              {/* CARD 1: INFORMASI AKUN ADMINISTRATOR */}
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0 border border-zinc-200">
                    <UserCog className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                      Informasi Akun & Kontak Administrator
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                      Identitas resmi pengelola toko yang tercatat pada log audit pesanan, pembayaran, dan mutasi stok gudang.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveInfo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Nama Lengkap Admin <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Masukkan nama lengkap Anda..."
                          className="w-full bg-zinc-50/80 border border-zinc-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Nomor Telepon / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Contoh: 081234567890"
                          className="w-full bg-zinc-50/80 border border-zinc-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email (Read-Only) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-zinc-700">
                        Alamat Email Login
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terverifikasi Akun Induk
                      </span>
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        disabled
                        value={displayEmail}
                        className="w-full bg-zinc-100 border border-zinc-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium text-zinc-600 cursor-not-allowed select-none"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Email login diikat sebagai identitas primer di PostgreSQL dan tidak dapat diubah sembarangan.
                    </p>
                  </div>

                  {/* Role Badge (Read-Only) */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Peran & Hak Akses Sistem
                    </label>
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-zinc-900">
                            ROLE_ADMIN (Super Administrator)
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Akses penuh manajemen katalog, pesanan, verifikasi transfer, kontrol stok gudang, dan laporan keuangan.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                        Akses Penuh
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingInfo}
                      className="bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {savingInfo && <RefreshCw className="w-4 h-4 animate-spin" />}
                      <span>{savingInfo ? 'Menyimpan...' : 'Simpan Informasi Akun'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* CARD 2: KEAMANAN & UBAH PASSWORD */}
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/70">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                      Keamanan & Ubah Password
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                      Perbarui kata sandi secara berkala (minimal 8 karakter) untuk melindungi akses panel admin dan data transaksi toko.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Password Saat Ini <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Masukkan password saat ini..."
                        className="w-full bg-zinc-50/80 border border-zinc-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-zinc-700">
                          Password Baru <span className="text-rose-500">*</span>
                        </label>
                        {newPassword.length > 0 && (
                          <span
                            className={`text-[10px] font-bold ${
                              isPasswordValid ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {isPasswordValid ? '✓ Minimal 8 karakter terpenuhi' : `${newPassword.length}/8 Karakter`}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 8 karakter..."
                          className="w-full bg-zinc-50/80 border border-zinc-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-zinc-700">
                          Konfirmasi Password Baru <span className="text-rose-500">*</span>
                        </label>
                        {confirmPassword.length > 0 && (
                          <span
                            className={`text-[10px] font-bold ${
                              isPasswordMatch ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isPasswordMatch ? '✓ Password cocok' : '✗ Belum cocok'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ketik ulang password baru..."
                          className="w-full bg-zinc-50/80 border border-zinc-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingPassword || !isPasswordValid || !isPasswordMatch}
                      className="bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {savingPassword && <RefreshCw className="w-4 h-4 animate-spin" />}
                      <span>{savingPassword ? 'Memperbarui...' : 'Perbarui Password'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* CARD 3: MANAJEMEN SESI & KELUAR AKUN (SECURITY / DANGER ZONE) */}
              <div className="bg-rose-50/60 rounded-3xl border border-rose-200/80 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-bold text-rose-950">
                      Zona Keamanan & Pengakhiran Sesi Admin
                    </h3>
                  </div>
                  <p className="text-xs text-rose-800/80 leading-relaxed">
                    Mengakhiri sesi akan mencabut token akses (JWT) Anda saat ini dari server backend sehingga akun tetap aman saat meninggalkan perangkat kasir toko.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="bg-white hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-300 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 flex items-center justify-center gap-2 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Sesi Admin</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}
