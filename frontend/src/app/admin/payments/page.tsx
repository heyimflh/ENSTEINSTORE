'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdminLayout } from '@/components/admin/AdminShell';
import { adminGetPayments, adminVerifyPayment } from '../../../lib/orders-api';
import { ApiException, getToken } from '../../../lib/api';
import type { PaymentResponse, PaymentStatus } from '../../../types/api';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Boxes,
  Store,
  BarChart3,
  Activity,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  CreditCard,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Wallet,
  Building2,
  Banknote,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

// ─── Formatters ──────────────────────────────────────────────────────────────
function formatIDR(n?: number | null): string {
  if (n === undefined || n === null || isNaN(Number(n))) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n));
}

function formatDate(iso?: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatIndonesianFullDate(date: Date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Resolves proof of payment URL:
 * - If full URL (http/https/blob/data), returns as is.
 * - If leading slash (/uploads/...), prefixes backend origin.
 * - If bare filename, maps to backend uploads/payments path.
 */
function resolveProofImageUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const backendBase = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  ).replace(/\/api\/?$/, '');
  if (url.startsWith('/')) {
    return `${backendBase}${url}`;
  }
  return `${backendBase}/uploads/payments/${url}`;
}

// ─── Status Configurations ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string; desc: string }
> = {
  WAITING_VERIFICATION: {
    label: 'Menunggu Verifikasi',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold animate-pulse',
    dotClass: 'bg-amber-500',
    desc: 'Bukti transfer diunggah pelanggan, menunggu konfirmasi admin.',
  },
  PAID: {
    label: 'Lunas',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
    dotClass: 'bg-emerald-500',
    desc: 'Pembayaran telah disetujui & diverifikasi.',
  },
  PENDING: {
    label: 'Menunggu Bayar',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
    dotClass: 'bg-amber-400',
    desc: 'Pelanggan belum mengunggah bukti transfer.',
  },
  UNPAID: {
    label: 'Menunggu Bayar',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
    dotClass: 'bg-amber-400',
    desc: 'Pelanggan belum mengunggah bukti transfer.',
  },
  REJECTED: {
    label: 'Ditolak',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    dotClass: 'bg-rose-500',
    desc: 'Bukti transfer ditolak oleh admin toko.',
  },
  EXPIRED: {
    label: 'Kedaluwarsa',
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200 font-medium',
    dotClass: 'bg-zinc-400',
    desc: 'Batas waktu 24 jam pembayaran telah berakhir.',
  },
};

const METHOD_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  BANK_TRANSFER: {
    label: 'Transfer Bank',
    icon: Building2,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  E_WALLET: {
    label: 'E-Wallet / QRIS',
    icon: Wallet,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  CASH: {
    label: 'Tunai (Kasir Toko)',
    icon: Banknote,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  SIMULATED: {
    label: 'Simulasi Sandbox',
    icon: Sparkles,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

const REJECTION_PRESETS = [
  'Nominal transfer tidak sesuai tagihan pesanan.',
  'Foto bukti transfer buram, terpotong, atau tidak terbaca.',
  'Mutasi dana belum tercatat masuk ke rekening bank toko.',
  'Nama pemilik rekening tidak sesuai dengan konfirmasi pemesan.',
  'Bukti transfer ganda atau telah digunakan pada pesanan lain.',
];

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user, isAdmin, logout, loading: authLoading } = useAuth();

  // ─── Main States ───────────────────────────────────────────────────────────
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Drawer & Selection
  const [selectedPayment, setSelectedPayment] = useState<PaymentResponse | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [rejectionMode, setRejectionMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [drawerActionError, setDrawerActionError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Proof Image Authenticated Blob URL
  const [proofBlobUrl, setProofBlobUrl] = useState<string | null>(null);

  // Lightbox Modal
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  // Sidebar
  const { toggleMobile } = useAdminLayout();

  // ─── Fetch Payments from PostgreSQL ────────────────────────────────────────
  const fetchPaymentsData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await adminGetPayments({
          page,
          size: 25,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        });

        setPayments(res.content || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
        setDbConnected(true);
      } catch (err) {
        setDbConnected(false);
        setError(err instanceof ApiException ? err.message : 'Koneksi ke backend gagal.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, statusFilter]
  );

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/auth');
      return;
    }
    if (!authLoading && isAdmin) {
      fetchPaymentsData();
    }
  }, [authLoading, isAdmin, router, fetchPaymentsData]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // ─── Authenticated Proof Blob Loader ───────────────────────────────────────
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    const currentProofUrl = selectedPayment?.proofOfPaymentUrl;

    if (!currentProofUrl) {
      setProofBlobUrl(null);
      return;
    }

    const loadAuthenticatedImage = async () => {
      const rawUrl = currentProofUrl;
      const filename = rawUrl.split('/').pop() || rawUrl;
      const backendBase = (
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      ).replace(/\/api\/?$/, '');

      const candidates = [
        resolveProofImageUrl(rawUrl),
        `${backendBase}/api/payments/proofs/${filename}`,
        `${backendBase}/uploads/payments/${filename}`,
        `${backendBase}/uploads/proofs/${filename}`,
        `${backendBase}/uploads/${filename}`,
        `/uploads/payments/${filename}`,
        `/uploads/proofs/${filename}`,
        `/uploads/${filename}`,
      ];

      const token = getToken();

      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const blob = await res.blob();
            if (active && blob.size > 0) {
              objectUrl = URL.createObjectURL(blob);
              setProofBlobUrl(objectUrl);
              return;
            }
          }
        } catch {
          // continue to next candidate
        }
      }
    };

    loadAuthenticatedImage();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedPayment?.proofOfPaymentUrl]);

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxOpen) {
        setLightboxOpen(false);
        setLightboxZoom(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // ─── Drawer Handlers ───────────────────────────────────────────────────────
  const handleOpenDrawer = (payment: PaymentResponse) => {
    setSelectedPayment(payment);
    setRejectionMode(false);
    setRejectReason('');
    setDrawerActionError(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedPayment(null);
    setRejectionMode(false);
    setRejectReason('');
    setDrawerActionError(null);
    setProofBlobUrl(null);
  };

  // ─── Clipboard Copy Helper ─────────────────────────────────────────────────
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Verification Actions (Approve / Reject) ───────────────────────────────
  const handleVerifyDecision = async (approved: boolean) => {
    if (!selectedPayment) return;

    if (!approved && !rejectReason.trim()) {
      setDrawerActionError('Mohon pilih atau tulis alasan penolakan bukti transfer.');
      setToastMsg({ type: 'error', text: 'Mohon isi alasan penolakan bukti transfer.' });
      return;
    }

    setVerifying(true);
    setDrawerActionError(null);
    try {
      const targetId = selectedPayment.orderId || selectedPayment.id;
      const updated = await adminVerifyPayment(targetId, {
        approved,
        approve: approved,
        rejectionReason: approved ? undefined : rejectReason.trim(),
      });

      // Update local state immediately
      setSelectedPayment((prev) => {
        if (!prev) return updated;
        return {
          ...prev,
          ...updated,
          status: updated?.status || (approved ? 'PAID' : 'REJECTED'),
          rejectionReason: approved ? undefined : rejectReason.trim(),
        };
      });

      setPayments((prev) =>
        prev.map((p) =>
          p.id === selectedPayment.id || p.orderId === selectedPayment.orderId
            ? {
                ...p,
                ...updated,
                status: updated?.status || (approved ? 'PAID' : 'REJECTED'),
                rejectionReason: approved ? undefined : rejectReason.trim(),
              }
            : p
        )
      );

      setToastMsg({
        type: 'success',
        text: approved
          ? `Pembayaran #${selectedPayment.orderNumber || selectedPayment.id.slice(0, 8)} berhasil disetujui! Status pesanan kini Lunas (PAID).`
          : `Bukti transfer ditolak. Pelanggan dapat mengunggah bukti perbaikan.`,
      });

      setRejectionMode(false);
      setRejectReason('');
      fetchPaymentsData(true);
    } catch (err) {
      const errMsg =
        err instanceof ApiException
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Gagal memverifikasi pembayaran.';
      setDrawerActionError(errMsg);
      setToastMsg({
        type: 'error',
        text: errMsg,
      });
    } finally {
      setVerifying(false);
    }
  };

  // ─── Tier 1: KPI Statistics ────────────────────────────────────────────────
  const kpiStats = useMemo(() => {
    const waiting = payments.filter((p) => p.status === 'WAITING_VERIFICATION').length;
    const paid = payments.filter((p) => p.status === 'PAID').length;
    const paidSum = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const rejectedOrExpired = payments.filter((p) =>
      ['REJECTED', 'EXPIRED'].includes(p.status)
    ).length;

    return {
      waiting,
      paid,
      paidSum,
      rejectedOrExpired,
    };
  }, [payments]);

  // Status Filter Counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: payments.length,
      WAITING_VERIFICATION: 0,
      PAID: 0,
      PENDING: 0,
      REJECTED: 0,
      EXPIRED: 0,
    };
    payments.forEach((p) => {
      const st = p.status === 'UNPAID' ? 'PENDING' : p.status;
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });
    return counts;
  }, [payments]);

  // ─── Tier 2: Filtered Payments Table Data ──────────────────────────────────
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Method Filter
      if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const numMatch = p.orderNumber?.toLowerCase().includes(q);
        const idMatch = p.id?.toLowerCase().includes(q);
        const nameMatch = p.recipientName?.toLowerCase().includes(q);
        if (!numMatch && !idMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [payments, methodFilter, searchQuery]);

  // Display Proof URL (Blob preferred, fallback to direct)
  const activeProofDisplayUrl = useMemo(() => {
    if (proofBlobUrl) return proofBlobUrl;
    if (selectedPayment?.proofOfPaymentUrl) {
      return resolveProofImageUrl(selectedPayment.proofOfPaymentUrl);
    }
    return null;
  }, [proofBlobUrl, selectedPayment?.proofOfPaymentUrl]);

  // Auth Loading Screen
  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
          Memverifikasi Otoritas Admin...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Sticky Executive Topbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 h-16 flex items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-xl text-zinc-500 hover:bg-zinc-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 text-xs">
              <span className="font-semibold text-zinc-400">Admin Panel</span>
              <span className="text-zinc-300">/</span>
              <span className="font-bold text-zinc-900 text-sm">Manajemen Pembayaran</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ml-2 ${
                  dbConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                {dbConnected ? 'Database Live' : 'Koneksi Terputus'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-zinc-500 font-medium">
              {formatIndonesianFullDate()}
            </span>

            <button
              onClick={() => fetchPaymentsData(true)}
              disabled={refreshing || loading}
              title="Segarkan data dari database"
              className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-zinc-900' : ''}`} />
            </button>

            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-all shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>Lihat Semua Pesanan</span>
            </Link>
          </div>
        </header>

        {/* Global Toast Alert */}
        {toastMsg && (
          <div className="fixed top-20 right-6 z-50 max-w-md animate-in fade-in slide-in-from-top-3 duration-200">
            <div
              className={`p-4 rounded-2xl border shadow-lg flex items-start gap-3 ${
                toastMsg.type === 'success'
                  ? 'bg-emerald-900 text-white border-emerald-800'
                  : 'bg-rose-900 text-white border-rose-800'
              }`}
            >
              {toastMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs leading-relaxed font-medium">
                {toastMsg.text}
              </div>
              <button
                onClick={() => setToastMsg(null)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* PAGE CONTENT CONTAINER                                            */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Title & Subtitle */}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">
              Verifikasi & Manajemen Pembayaran
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Periksa bukti transfer manual, verifikasi pelunasan pesanan, dan kelola arus kas
              transaksi toko secara otoritatif di PostgreSQL.
            </p>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* TIER 1: 4 LIVE PAYMENT KPI STAT CARDS                           */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Perlu Verifikasi (Clickable filter) */}
            <div
              onClick={() => {
                setStatusFilter('WAITING_VERIFICATION');
                setPage(0);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
                statusFilter === 'WAITING_VERIFICATION'
                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
                  : 'bg-white border-zinc-200/80 hover:border-amber-400'
              }`}
            >
              <div>
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Perlu Verifikasi
                </p>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {kpiStats.waiting}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Bukti transfer masuk</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Pembayaran Lunas */}
            <div
              onClick={() => {
                setStatusFilter('PAID');
                setPage(0);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-white border-zinc-200/80 hover:border-emerald-400'
              }`}
            >
              <div>
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Pembayaran Lunas
                </p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {kpiStats.paid}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Transaksi terverifikasi</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Total Dana Terverifikasi */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Total Dana Terverifikasi
                </p>
                <p className="text-xl font-black text-blue-700 mt-1 truncate">
                  {formatIDR(kpiStats.paidSum)}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Akumulasi pelunasan</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Ditolak / Kedaluwarsa */}
            <div
              onClick={() => {
                setStatusFilter('REJECTED');
                setPage(0);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/20'
                  : 'bg-white border-zinc-200/80 hover:border-rose-400'
              }`}
            >
              <div>
                <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                  Ditolak / Kedaluwarsa
                </p>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  {kpiStats.rejectedOrExpired}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Batal atau invalid</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* TIER 2: FILTER TABS & SEARCH TOOLBAR                            */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs space-y-3">
            {/* Top Row: Horizontal Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { key: 'ALL', label: 'Semua Status', count: statusCounts.ALL },
                {
                  key: 'WAITING_VERIFICATION',
                  label: 'Menunggu Verifikasi',
                  count: statusCounts.WAITING_VERIFICATION,
                },
                { key: 'PAID', label: 'Lunas', count: statusCounts.PAID },
                { key: 'PENDING', label: 'Menunggu Bayar', count: statusCounts.PENDING },
                { key: 'REJECTED', label: 'Ditolak', count: statusCounts.REJECTED },
                { key: 'EXPIRED', label: 'Kedaluwarsa', count: statusCounts.EXPIRED },
              ].map(({ key, label, count }) => {
                const active = statusFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setStatusFilter(key);
                      setPage(0);
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        active ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Row: Search Input & Method Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-zinc-100">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No. Pesanan (EST-...), ID Pembayaran, atau Nama Pelanggan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Method Filter Dropdown / Pills */}
              <div className="flex items-center p-1 rounded-xl bg-zinc-100 border border-zinc-200/60 text-xs shrink-0 w-full sm:w-auto">
                {[
                  { key: 'ALL', label: 'Semua Metode' },
                  { key: 'BANK_TRANSFER', label: 'Transfer Bank' },
                  { key: 'CASH', label: 'Tunai (Kasir)' },
                  { key: 'SIMULATED', label: 'Simulasi' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setMethodFilter(key)}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      methodFilter === key
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* TIER 3: ENRICHED PAYMENTS DATA TABLE                            */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-zinc-400" />
                <p className="text-xs text-zinc-500 font-medium">
                  Memuat catatan pembayaran dari PostgreSQL...
                </p>
              </div>
            ) : error ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-center px-4">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-sm font-bold text-zinc-900">{error}</p>
                <button
                  onClick={() => fetchPaymentsData(true)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800"
                >
                  Coba Muat Ulang
                </button>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-center px-4">
                <CreditCard className="w-12 h-12 text-zinc-300 stroke-[1.5]" />
                <p className="text-sm font-bold text-zinc-800">
                  Tidak Ada Data Pembayaran Ditemukan
                </p>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Tidak ada catatan pembayaran yang cocok dengan filter atau kata kunci aktif.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Pesanan & ID Pembayaran</th>
                      <th className="px-5 py-3.5">Metode</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Waktu Dikirim / Lunas</th>
                      <th className="px-5 py-3.5 text-right">Nominal</th>
                      <th className="px-5 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredPayments.map((p) => {
                      const st = STATUS_CONFIG[p.status] || {
                        label: p.status,
                        badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                        dotClass: 'bg-zinc-400',
                        desc: '',
                      };
                      const meth = METHOD_CONFIG[p.paymentMethod] || {
                        label: p.paymentMethod || 'Lainnya',
                        icon: CreditCard,
                        badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                      };
                      const MethIcon = meth.icon;
                      const isWaiting = p.status === 'WAITING_VERIFICATION';

                      return (
                        <tr
                          key={p.id}
                          onClick={() => handleOpenDrawer(p)}
                          className="hover:bg-zinc-50/80 cursor-pointer transition-colors"
                        >
                          {/* Pesanan & ID Pembayaran */}
                          <td className="px-5 py-4">
                            {p.orderNumber ? (
                              <p className="font-mono font-bold text-zinc-900 text-xs">
                                {p.orderNumber}
                              </p>
                            ) : (
                              <p className="font-semibold text-zinc-800">
                                {p.recipientName || 'Pesanan Toko'}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] text-zinc-400">
                                #{p.id.slice(0, 13)}...
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(p.id);
                                }}
                                title="Salin ID Pembayaran"
                                className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60"
                              >
                                {copiedId === p.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Metode */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meth.badgeClass}`}
                            >
                              <MethIcon className="w-3 h-3" />
                              <span>{meth.label}</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${st.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                              <span>{st.label}</span>
                            </span>
                          </td>

                          {/* Waktu Dikirim / Lunas */}
                          <td className="px-5 py-4 text-zinc-500">
                            {formatDate(p.verifiedAt || p.submittedAt)}
                          </td>

                          {/* Nominal */}
                          <td className="px-5 py-4 text-right">
                            <p className="font-black text-amber-700 text-sm">
                              {formatIDR(p.amount)}
                            </p>
                          </td>

                          {/* Aksi (Visible on EVERY row) */}
                          <td className="px-5 py-4 text-center">
                            {isWaiting ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDrawer(p);
                                }}
                                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-zinc-950 text-white font-semibold text-xs hover:bg-zinc-800 transition-all shadow-xs"
                              >
                                <span>Verifikasi</span>
                                <ArrowRight className="w-3 h-3 text-amber-400" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDrawer(p);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-semibold text-xs shadow-2xs transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Detail</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-zinc-100 bg-zinc-50/50">
                <p className="text-xs text-zinc-500">
                  Menampilkan <span className="font-semibold text-zinc-800">{filteredPayments.length}</span> dari{' '}
                  <span className="font-semibold text-zinc-800">{totalElements}</span> transaksi
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Sebelumnya
                  </button>
                  <span className="text-xs text-zinc-600 font-medium px-2">
                    Hal. {page + 1} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                  >
                    Berikutnya
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TIER 4: SLIDE-OVER PAYMENT INSPECTION & VERIFICATION DRAWER         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {drawerOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={handleCloseDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-950 flex items-center justify-center text-white">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-900">
                      Verifikasi & Detail Pembayaran
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-xs text-zinc-500">
                        #{selectedPayment.id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedPayment.id)}
                        title="Salin ID Pembayaran"
                        className="text-zinc-400 hover:text-zinc-700"
                      >
                        {copiedId === selectedPayment.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      STATUS_CONFIG[selectedPayment.status]?.badgeClass ||
                      'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {STATUS_CONFIG[selectedPayment.status]?.label || selectedPayment.status}
                  </span>
                  <button
                    onClick={handleCloseDrawer}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Amount & Metadata Summary Card (Dark SaaS Card) */}
                <div className="rounded-2xl bg-zinc-950 text-white p-5 space-y-4 shadow-md">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Nominal Tagihan
                    </p>
                    <p className="text-3xl font-black text-amber-400 mt-1">
                      {formatIDR(selectedPayment.amount)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800 text-xs">
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold">
                        Metode Pembayaran
                      </p>
                      <p className="font-semibold text-zinc-200 mt-0.5">
                        {METHOD_CONFIG[selectedPayment.paymentMethod]?.label ||
                          selectedPayment.paymentMethod}
                      </p>
                    </div>

                    {selectedPayment.orderNumber && (
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold">
                          Nomor Pesanan
                        </p>
                        <Link
                          href="/admin/orders"
                          className="font-mono font-bold text-amber-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          <span>{selectedPayment.orderNumber}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold">
                        Waktu Kirim Bukti
                      </p>
                      <p className="text-zinc-300 mt-0.5">
                        {formatDate(selectedPayment.submittedAt)}
                      </p>
                    </div>

                    {selectedPayment.verifiedAt && (
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold">
                          Waktu Verifikasi
                        </p>
                        <p className="text-emerald-400 font-medium mt-0.5">
                          {formatDate(selectedPayment.verifiedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason Notice (If status REJECTED) */}
                {selectedPayment.status === 'REJECTED' && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-rose-900">
                        Bukti Pembayaran Ditolak
                      </p>
                      <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                        Alasan: &ldquo;
                        {selectedPayment.rejectionReason ||
                          'Bukti transfer tidak sesuai atau tidak terbaca.'}
                        &rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* Transfer Proof Preview Section */}
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-zinc-500" />
                      <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                        Bukti Transfer Pelanggan
                      </p>
                    </div>
                    {activeProofDisplayUrl && (
                      <button
                        onClick={() => {
                          setLightboxZoom(1);
                          setLightboxOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Perbesar Bukti (Zoom)</span>
                      </button>
                    )}
                  </div>

                  {activeProofDisplayUrl ? (
                    <div className="space-y-2">
                      <div
                        onClick={() => {
                          setLightboxZoom(1);
                          setLightboxOpen(true);
                        }}
                        className="relative rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden cursor-zoom-in group max-h-80 flex items-center justify-center"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeProofDisplayUrl}
                          alt="Bukti Transfer"
                          className="w-full h-auto max-h-80 object-contain transition-transform duration-200 group-hover:scale-102"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-xl bg-black/75 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5">
                            <ZoomIn className="w-3.5 h-3.5" /> Klik untuk perbesar
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 text-center">
                        Pastikan nominal, nomor rekening penerima Toko Enstein, dan tanggal transfer
                        sesuai.
                      </p>
                    </div>
                  ) : (
                    <div className="py-12 px-4 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center space-y-1.5">
                      <CreditCard className="w-8 h-8 text-zinc-300 mx-auto" />
                      <p className="text-xs font-bold text-zinc-700">
                        {selectedPayment.paymentMethod === 'CASH'
                          ? 'Pembayaran Tunai di Kasir Toko'
                          : selectedPayment.paymentMethod === 'SIMULATED'
                          ? 'Pembayaran Melalui Simulasi Sandbox'
                          : 'Belum Ada Bukti Transfer'}
                      </p>
                      <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                        {selectedPayment.paymentMethod === 'CASH' ||
                        selectedPayment.paymentMethod === 'SIMULATED'
                          ? 'Metode ini tidak memerlukan lampiran berkas bukti foto.'
                          : 'Pelanggan belum mengunggah foto struk bukti pembayaran manual.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Inline Rejection Reason Form */}
                {rejectionMode && (
                  <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-rose-900">
                        Pilih atau Tulis Alasan Penolakan:
                      </p>
                      <button
                        onClick={() => setRejectionMode(false)}
                        className="text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {REJECTION_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setRejectReason(preset)}
                          className={`text-[10px] text-left px-2.5 py-1 rounded-lg border transition-all ${
                            rejectReason === preset
                              ? 'bg-rose-600 text-white border-rose-700 font-semibold'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:border-rose-300'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Atau tulis alasan khusus penolakan untuk pelanggan..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-rose-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRejectionMode(false)}
                        disabled={verifying}
                        className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-white"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVerifyDecision(false)}
                        disabled={verifying || !rejectReason.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs"
                      >
                        {verifying && <RefreshCw className="w-3 h-3 animate-spin" />}
                        Konfirmasi Tolak Bukti
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Drawer Action Error Alert */}
                {drawerActionError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-rose-900">Gagal Memproses Verifikasi</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">{drawerActionError}</p>
                    </div>
                    <button
                      onClick={() => setDrawerActionError(null)}
                      className="text-rose-400 hover:text-rose-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sticky Verification Footer */}
              <div className="p-4 border-t border-zinc-200 bg-white flex items-center justify-between gap-3">
                {selectedPayment.status === 'WAITING_VERIFICATION' ? (
                  <>
                    {!rejectionMode && (
                      <button
                        onClick={() => setRejectionMode(true)}
                        disabled={verifying}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Tolak Bukti</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleVerifyDecision(true)}
                      disabled={verifying}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs ml-auto disabled:opacity-50"
                    >
                      {verifying ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Setujui Pembayaran (Lunas)</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        STATUS_CONFIG[selectedPayment.status]?.badgeClass ||
                        'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {selectedPayment.status === 'PAID' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-zinc-500" />
                      )}
                      <span>
                        Status Transaksi: {STATUS_CONFIG[selectedPayment.status]?.label || selectedPayment.status}
                      </span>
                    </span>

                    <button
                      onClick={handleCloseDrawer}
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800"
                    >
                      Tutup
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HIGH-RESOLUTION LIGHTBOX MODAL                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {lightboxOpen && activeProofDisplayUrl && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          {/* Lightbox Topbar */}
          <div className="h-14 px-6 border-b border-zinc-800 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold">
                Bukti Transfer #{selectedPayment?.orderNumber || selectedPayment?.id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLightboxZoom((z) => (z === 1 ? 1.5 : 1))}
                className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {lightboxZoom === 1 ? (
                  <>
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Perbesar 150%</span>
                  </>
                ) : (
                  <>
                    <ZoomOut className="w-3.5 h-3.5" />
                    <span>Reset 100%</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setLightboxOpen(false);
                  setLightboxZoom(1);
                }}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Image Viewport */}
          <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeProofDisplayUrl}
              alt="Bukti Transfer Fullscreen"
              style={{ transform: `scale(${lightboxZoom})`, transformOrigin: 'center' }}
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
