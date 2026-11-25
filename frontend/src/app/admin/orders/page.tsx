'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdminLayout } from '@/components/admin/AdminShell';
import {
  adminGetOrders,
  adminGetOrderDetail,
  adminUpdateOrderStatus,
  adminCancelOrder,
  adminGetPayments,
} from '../../../lib/orders-api';
import { resolveProductImageUrl } from '../../../lib/catalog-api';
import { ApiException } from '../../../lib/api';
import type {
  OrderDetailResponse,
  OrderItemResponse,
  OrderStatus,
} from '../../../types/api';
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
  Truck,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  MessageSquare,
  ChevronRight,
  Phone,
  MapPin,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
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

// ─── Status Options & Badges ─────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string; desc: string }
> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Bayar',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    dotClass: 'bg-amber-500',
    desc: 'Menunggu pembayaran dari pelanggan.',
  },
  PROCESSING: {
    label: 'Diproses',
    badgeClass: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
    dotClass: 'bg-violet-500',
    desc: 'Pesanan sedang disiapkan / dipotong di konveksi.',
  },
  READY_FOR_PICKUP: {
    label: 'Siap Diambil',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30',
    dotClass: 'bg-cyan-500',
    desc: 'Barang sudah siap untuk diambil pelanggan di toko.',
  },
  SHIPPED: {
    label: 'Dikirim',
    badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
    dotClass: 'bg-blue-500',
    desc: 'Pesanan sedang dalam pengiriman kurir ke alamat tujuan.',
  },
  COMPLETED: {
    label: 'Selesai',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    desc: 'Pesanan berhasil diterima dan transaksi selesai penuh.',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    badgeClass: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
    dotClass: 'bg-rose-500',
    desc: 'Pesanan dibatalkan dan reservasi stok dikembalikan.',
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  PAID: {
    label: 'Lunas',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
  },
  WAITING_VERIFICATION: {
    label: 'Verifikasi Transfer',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold animate-pulse',
  },
  PENDING: {
    label: 'Belum Bayar',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
  },
  UNPAID: {
    label: 'Belum Bayar',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
  },
  REJECTED: {
    label: 'Ditolak',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
  },
  EXPIRED: {
    label: 'Kedaluwarsa',
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200 font-medium',
  },
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isAdmin, logout, loading: authLoading } = useAuth();

  // ─── Main States ───────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<OrderDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Drawer & Selection
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeOrderDetail, setActiveOrderDetail] = useState<OrderDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fulfillment Action & Modal
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Navigation badge & UI
  const { toggleMobile } = useAdminLayout();
  const [pendingVerificationCount, setPendingVerificationCount] = useState<number>(0);

  // ─── Fetch Orders from PostgreSQL ──────────────────────────────────────────
  const fetchOrdersData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [ordersRes, paymentsRes] = await Promise.allSettled([
          adminGetOrders({
            page,
            size: 25,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
          }),
          adminGetPayments({ status: 'WAITING_VERIFICATION', size: 1 }),
        ]);

        let success = true;

        if (ordersRes.status === 'fulfilled') {
          const data = ordersRes.value;
          setOrders(data.content || []);
          setTotalPages(data.totalPages || 1);
          setTotalElements(data.totalElements || 0);
        } else {
          success = false;
          console.error('Error fetching orders:', ordersRes.reason);
        }

        if (paymentsRes.status === 'fulfilled') {
          setPendingVerificationCount(paymentsRes.value.totalElements || 0);
        }

        setDbConnected(success);
        if (!success) {
          setError('Gagal memuat pesanan dari basis data PostgreSQL.');
        }
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

  // Initial Auth & Load Guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/auth');
      return;
    }
    if (!authLoading && isAdmin) {
      fetchOrdersData();
    }
  }, [authLoading, isAdmin, router, fetchOrdersData]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // ─── Open Order Detail Drawer ──────────────────────────────────────────────
  const handleOpenDetail = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await adminGetOrderDetail(orderId);
      setActiveOrderDetail(detail);
    } catch (err) {
      setToastMsg({
        type: 'error',
        text: err instanceof ApiException ? err.message : 'Gagal memuat rincian pesanan.',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Close Drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrderId(null);
    setActiveOrderDetail(null);
  };

  // ─── Clipboard Copy Helper ─────────────────────────────────────────────────
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── State Machine Action Handlers ─────────────────────────────────────────
  const handleTransitionStatus = async (targetStatus: OrderStatus) => {
    if (!activeOrderDetail) return;
    setActionLoading(true);
    try {
      const updated = await adminUpdateOrderStatus(activeOrderDetail.id, {
        orderStatus: targetStatus,
      });
      setActiveOrderDetail(updated);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
      );
      setToastMsg({
        type: 'success',
        text: `Status pesanan #${updated.orderNumber} berhasil diubah ke ${STATUS_CONFIG[targetStatus]?.label || targetStatus}.`,
      });
      fetchOrdersData(true);
    } catch (err) {
      setToastMsg({
        type: 'error',
        text: err instanceof ApiException ? err.message : 'Gagal mengubah status pesanan.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!activeOrderDetail) return;
    if (!cancellationReason.trim()) {
      setToastMsg({ type: 'error', text: 'Mohon isi alasan pembatalan pesanan.' });
      return;
    }

    setActionLoading(true);
    try {
      const updated = await adminCancelOrder(activeOrderDetail.id, {
        cancellationReason: cancellationReason.trim(),
      });
      setActiveOrderDetail(updated);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
      );
      setCancelModalOpen(false);
      setCancellationReason('');
      setToastMsg({
        type: 'success',
        text: `Pesanan #${updated.orderNumber} berhasil dibatalkan. Reservasi stok telah dikembalikan ke PostgreSQL.`,
      });
      fetchOrdersData(true);
    } catch (err) {
      setToastMsg({
        type: 'error',
        text: err instanceof ApiException ? err.message : 'Gagal membatalkan pesanan.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Tier 1: Live KPI Stat Cards ───────────────────────────────────────────
  const kpiStats = useMemo(() => {
    const total = totalElements || orders.length;
    const needProcess = orders.filter((o) =>
      ['PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED'].includes(o.orderStatus)
    ).length;
    const pendingPay = orders.filter((o) => o.orderStatus === 'PENDING_PAYMENT').length;
    const completed = orders.filter((o) => o.orderStatus === 'COMPLETED').length;

    return {
      total,
      needProcess,
      pendingPay,
      completed,
    };
  }, [orders, totalElements]);

  // Status Filter Counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: orders.length,
      PENDING_PAYMENT: 0,
      PROCESSING: 0,
      READY_FOR_PICKUP: 0,
      SHIPPED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => {
      if (counts[o.orderStatus] !== undefined) {
        counts[o.orderStatus]++;
      }
    });
    return counts;
  }, [orders]);

  // ─── Tier 2: Filtered Orders Table Data ────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Channel Filter
      if (channelFilter !== 'ALL' && order.orderType !== channelFilter) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const numMatch = order.orderNumber?.toLowerCase().includes(q);
        const nameMatch = order.recipientName?.toLowerCase().includes(q);
        const phoneMatch = order.recipientPhone?.toLowerCase().includes(q);
        const addrMatch = order.deliveryAddress?.toLowerCase().includes(q);
        if (!numMatch && !nameMatch && !phoneMatch && !addrMatch) return false;
      }
      return true;
    });
  }, [orders, channelFilter, searchQuery]);

  // Auth Loading Screen
  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
          Memverifikasi Akses Admin...
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
              <span className="font-bold text-zinc-900 text-sm">Manajemen Pesanan</span>
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
              onClick={() => fetchOrdersData(true)}
              disabled={refreshing || loading}
              title="Segarkan data dari database"
              className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-zinc-900' : ''}`} />
            </button>

            <Link
              href="/admin/offline-sales"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-all shadow-xs"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Penjualan Offline</span>
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
              Manajemen Pesanan & Pemenuhan
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Pantau seluruh transaksi online dan offline, perbarui tahapan pesanan sesuai alur
              State Machine, dan kelola pemenuhan material jas hujan.
            </p>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* TIER 1: 4 LIVE ORDER KPI STAT CARDS                             */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Pesanan */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Total Pesanan
                </p>
                <p className="text-2xl font-black text-zinc-900 mt-1">
                  {kpiStats.total}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Seluruh pesanan masuk</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center text-zinc-700">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            {/* Perlu Diproses / Siap */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">
                  Perlu Diproses / Siap
                </p>
                <p className="text-2xl font-black text-violet-700 mt-1">
                  {kpiStats.needProcess}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Diproses, siap pickup, atau dikirim</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                <Package className="w-5 h-5" />
              </div>
            </div>

            {/* Menunggu Pembayaran */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  Menunggu Bayar
                </p>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {kpiStats.pendingPay}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Belum melunasi tagihan</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Pesanan Selesai */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  Pesanan Selesai
                </p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {kpiStats.completed}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Transaksi tuntas 100%</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
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
                { key: 'PENDING_PAYMENT', label: 'Menunggu Bayar', count: statusCounts.PENDING_PAYMENT },
                { key: 'PROCESSING', label: 'Diproses', count: statusCounts.PROCESSING },
                { key: 'READY_FOR_PICKUP', label: 'Siap Diambil', count: statusCounts.READY_FOR_PICKUP },
                { key: 'SHIPPED', label: 'Dikirim', count: statusCounts.SHIPPED },
                { key: 'COMPLETED', label: 'Selesai', count: statusCounts.COMPLETED },
                { key: 'CANCELLED', label: 'Dibatalkan', count: statusCounts.CANCELLED },
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
                        active
                          ? 'bg-zinc-800 text-zinc-200'
                          : 'bg-zinc-200 text-zinc-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Row: Search Input & Channel Selector */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-zinc-100">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No. Pesanan (EST-...), Nama Pelanggan, atau Telepon..."
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

              {/* Channel Segmented Filter */}
              <div className="flex items-center p-1 rounded-xl bg-zinc-100 border border-zinc-200/60 text-xs shrink-0 w-full sm:w-auto">
                {(['ALL', 'ONLINE', 'OFFLINE'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      channelFilter === ch
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {ch === 'ALL'
                      ? 'Semua Channel'
                      : ch === 'ONLINE'
                      ? 'Online Store'
                      : 'Kasir Toko (Offline)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* TIER 3: ENRICHED ORDERS DATA TABLE                              */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-zinc-400" />
                <p className="text-xs text-zinc-500 font-medium">
                  Memuat data pesanan dari PostgreSQL...
                </p>
              </div>
            ) : error ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-center px-4">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-sm font-bold text-zinc-900">{error}</p>
                <button
                  onClick={() => fetchOrdersData(true)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800"
                >
                  Coba Muat Ulang
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-center px-4">
                <ShoppingBag className="w-12 h-12 text-zinc-300 stroke-[1.5]" />
                <p className="text-sm font-bold text-zinc-800">
                  Tidak Ada Pesanan Ditemukan
                </p>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Tidak ada pesanan yang cocok dengan status atau kata kunci pencarian aktif.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="px-5 py-3.5">No. Pesanan & Waktu</th>
                      <th className="px-5 py-3.5">Pelanggan</th>
                      <th className="px-5 py-3.5">Channel & Metode</th>
                      <th className="px-5 py-3.5">Status Pembayaran</th>
                      <th className="px-5 py-3.5">Status Pesanan</th>
                      <th className="px-5 py-3.5 text-right">Total</th>
                      <th className="px-5 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredOrders.map((order) => {
                      const st = STATUS_CONFIG[order.orderStatus] || {
                        label: order.orderStatus,
                        badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                        dotClass: 'bg-zinc-400',
                      };
                      const pay = PAYMENT_STATUS_CONFIG[order.payment?.status || 'PENDING'] || {
                        label: order.payment?.status || 'Belum Bayar',
                        badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200',
                      };

                      return (
                        <tr
                          key={order.id}
                          onClick={() => handleOpenDetail(order.id)}
                          className="hover:bg-zinc-50/80 cursor-pointer transition-colors"
                        >
                          {/* No. Pesanan & Waktu */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-zinc-900 text-xs">
                                {order.orderNumber}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(order.orderNumber);
                                }}
                                title="Salin nomor pesanan"
                                className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
                              >
                                {copiedId === order.orderNumber ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {formatDate(order.orderDate)}
                            </p>
                          </td>

                          {/* Pelanggan */}
                          <td className="px-5 py-4">
                            <p className="font-semibold text-zinc-800">
                              {order.recipientName || 'Pelanggan Kasir / Walk-in'}
                            </p>
                            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                              {order.recipientPhone || '-'}
                            </p>
                          </td>

                          {/* Channel & Metode */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  order.orderType === 'ONLINE'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}
                              >
                                {order.orderType === 'ONLINE' ? 'Online' : 'Offline POS'}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1">
                              {order.fulfillmentMethod === 'DELIVERY'
                                ? 'Diantar (Delivery)'
                                : order.fulfillmentMethod === 'PICKUP'
                                ? 'Ambil di Toko (Pickup)'
                                : 'Kasir Langsung (In-Store)'}
                            </p>
                          </td>

                          {/* Status Pembayaran */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] border ${pay.badgeClass}`}
                            >
                              {pay.label}
                            </span>
                            {order.payment?.paymentMethod && (
                              <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase">
                                {order.payment.paymentMethod}
                              </p>
                            )}
                          </td>

                          {/* Status Pesanan */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${st.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                              {st.label}
                            </span>
                          </td>

                          {/* Total */}
                          <td className="px-5 py-4 text-right">
                            <p className="font-bold text-amber-700 text-sm">
                              {formatIDR(order.totalAmount)}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {order.items?.length || 0} material
                            </p>
                          </td>

                          {/* Aksi */}
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(order.id);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-semibold text-xs shadow-2xs transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Detail & Proses</span>
                            </button>
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
                  Menampilkan <span className="font-semibold text-zinc-800">{filteredOrders.length}</span> dari{' '}
                  <span className="font-semibold text-zinc-800">{totalElements}</span> pesanan
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
      {/* TIER 4: SLIDE-OVER ORDER DETAIL & FULFILLMENT DRAWER                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={handleCloseDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-950 flex items-center justify-center text-white">
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-zinc-900 font-mono">
                        #{activeOrderDetail?.orderNumber || 'EST-...'}
                      </h2>
                      <button
                        onClick={() =>
                          activeOrderDetail && copyToClipboard(activeOrderDetail.orderNumber)
                        }
                        title="Salin nomor pesanan"
                        className="p-1 rounded text-zinc-400 hover:text-zinc-700"
                      >
                        {copiedId === activeOrderDetail?.orderNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Dipesan pada: {formatDate(activeOrderDetail?.orderDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeOrderDetail && (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        STATUS_CONFIG[activeOrderDetail.orderStatus]?.badgeClass ||
                        'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {STATUS_CONFIG[activeOrderDetail.orderStatus]?.label ||
                        activeOrderDetail.orderStatus}
                    </span>
                  )}
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
                {detailLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-zinc-400" />
                    <p className="text-xs text-zinc-500 font-medium">
                      Mengambil data lengkap pesanan dari PostgreSQL...
                    </p>
                  </div>
                ) : !activeOrderDetail ? (
                  <div className="py-20 text-center text-zinc-400 text-xs">
                    Rincian pesanan tidak tersedia.
                  </div>
                ) : (
                  <>
                    {/* Visual Progress Status Bar */}
                    {activeOrderDetail.orderStatus === 'CANCELLED' ? (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-rose-900">
                            Pesanan Dibatalkan (CANCELLED)
                          </p>
                          <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                            Alasan: &ldquo;{activeOrderDetail.cancellationReason || 'Tidak ada alasan dicatat'}&rdquo;
                          </p>
                          {activeOrderDetail.cancelledAt && (
                            <p className="text-[10px] text-rose-500 mt-1">
                              Waktu batal: {formatDate(activeOrderDetail.cancelledAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-4">
                          Alur Status Pemenuhan (State Machine)
                        </p>
                        <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                          {/* Step 1: Menunggu Bayar */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 ${
                                activeOrderDetail.orderStatus === 'PENDING_PAYMENT'
                                  ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {activeOrderDetail.orderStatus === 'PENDING_PAYMENT' ? '1' : '✓'}
                            </div>
                            <span className="font-semibold text-zinc-800">Menunggu</span>
                            <span className="text-[10px] text-zinc-400">Bayar</span>
                          </div>

                          {/* Step 2: Diproses */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 ${
                                activeOrderDetail.orderStatus === 'PROCESSING'
                                  ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                                  : ['READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED'].includes(
                                      activeOrderDetail.orderStatus
                                    )
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-200 text-zinc-500'
                              }`}
                            >
                              {['READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED'].includes(
                                activeOrderDetail.orderStatus
                              )
                                ? '✓'
                                : '2'}
                            </div>
                            <span className="font-semibold text-zinc-800">Diproses</span>
                            <span className="text-[10px] text-zinc-400">Gunting/Kemas</span>
                          </div>

                          {/* Step 3: Siap / Dikirim */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 ${
                                ['READY_FOR_PICKUP', 'SHIPPED'].includes(
                                  activeOrderDetail.orderStatus
                                )
                                  ? 'bg-cyan-600 text-white ring-4 ring-cyan-100'
                                  : activeOrderDetail.orderStatus === 'COMPLETED'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-200 text-zinc-500'
                              }`}
                            >
                              {activeOrderDetail.orderStatus === 'COMPLETED' ? '✓' : '3'}
                            </div>
                            <span className="font-semibold text-zinc-800">
                              {activeOrderDetail.fulfillmentMethod === 'PICKUP'
                                ? 'Siap Diambil'
                                : 'Dikirim'}
                            </span>
                            <span className="text-[10px] text-zinc-400">Kurir / Toko</span>
                          </div>

                          {/* Step 4: Selesai */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 ${
                                activeOrderDetail.orderStatus === 'COMPLETED'
                                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                  : 'bg-zinc-200 text-zinc-500'
                              }`}
                            >
                              {activeOrderDetail.orderStatus === 'COMPLETED' ? '✓' : '4'}
                            </div>
                            <span className="font-semibold text-zinc-800">Selesai</span>
                            <span className="text-[10px] text-zinc-400">Tuntas</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Customer & Fulfillment Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pelanggan Card */}
                      <div className="p-4 rounded-2xl border border-zinc-200/80 bg-white space-y-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                          <User className="w-3.5 h-3.5" />
                          <span>Penerima / Pelanggan</span>
                        </div>
                        <p className="font-bold text-zinc-900 text-sm">
                          {activeOrderDetail.recipientName || 'Pelanggan Kasir'}
                        </p>
                        {activeOrderDetail.recipientPhone && (
                          <div className="flex items-center gap-2 text-xs text-zinc-600">
                            <Phone className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="font-mono">{activeOrderDetail.recipientPhone}</span>
                            <a
                              href={`https://wa.me/${activeOrderDetail.recipientPhone.replace(
                                /^0/,
                                '62'
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-0.5 ml-1"
                            >
                              <span>WhatsApp</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Fulfillment Method Card */}
                      <div className="p-4 rounded-2xl border border-zinc-200/80 bg-white space-y-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                          <Truck className="w-3.5 h-3.5" />
                          <span>Metode Pemenuhan</span>
                        </div>
                        <p className="font-bold text-zinc-900 text-sm">
                          {activeOrderDetail.fulfillmentMethod === 'DELIVERY'
                            ? 'Pengiriman ke Alamat (Delivery)'
                            : activeOrderDetail.fulfillmentMethod === 'PICKUP'
                            ? 'Ambil Sendiri di Toko (Pickup)'
                            : 'Kasir Toko (In-Store)'}
                        </p>
                        {activeOrderDetail.deliveryAddress ? (
                          <p className="text-xs text-zinc-500 leading-relaxed flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                            <span>{activeOrderDetail.deliveryAddress}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-400">
                            Pengambilan langsung di Toko Enstein (Bebas ongkir).
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Payment Status & Action Alert */}
                    <div className="p-4 rounded-2xl border border-zinc-200/80 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Status Pembayaran
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              PAYMENT_STATUS_CONFIG[activeOrderDetail.payment?.status || 'PENDING']
                                ?.badgeClass || 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {PAYMENT_STATUS_CONFIG[activeOrderDetail.payment?.status || 'PENDING']
                              ?.label ||
                              activeOrderDetail.payment?.status ||
                              'Belum Bayar'}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">
                            Metode: {activeOrderDetail.payment?.paymentMethod || 'TRANSFER'}
                          </span>
                        </div>
                      </div>

                      {activeOrderDetail.orderStatus === 'PENDING_PAYMENT' &&
                        activeOrderDetail.payment?.status === 'WAITING_VERIFICATION' && (
                          <Link
                            href="/admin/payments"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-xs"
                          >
                            <span>Verifikasi di Pembayaran</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                    </div>

                    {/* Customer Notes Box */}
                    {activeOrderDetail.notes && (
                      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-900">
                            Catatan Pelanggan / Permintaan Varian:
                          </p>
                          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                            &ldquo;{activeOrderDetail.notes}&rdquo;
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Itemized Product Breakdown Table */}
                    <div className="rounded-2xl border border-zinc-200/80 overflow-hidden bg-white">
                      <div className="px-5 py-3.5 bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        Rincian Item Material ({activeOrderDetail.items?.length || 0} Macam)
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {activeOrderDetail.items?.map((item: OrderItemResponse) => {
                          const img = resolveProductImageUrl(
                            item.image || item.productImageUrl || item.imageUrl
                          );
                          const itemName = item.name || item.productName || 'Material Jas Hujan';
                          const priceVal = item.price ?? item.unitPrice ?? item.priceAtOrder ?? 0;
                          const qtyVal = item.quantity ?? 1;
                          const subVal = item.subtotal ?? priceVal * qtyVal;
                          const unitSym = item.unitSymbol || item.unit || 'm';

                          return (
                            <div key={item.id} className="p-4 flex items-center gap-3">
                              {/* Thumbnail */}
                              <div className="w-12 h-12 rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden shrink-0 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img}
                                  alt={itemName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      '/images/placeholder-product.svg';
                                  }}
                                />
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-zinc-900 text-xs truncate">
                                  {itemName}
                                </p>
                                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                  SKU: {item.productCode || '-'}
                                </p>
                                <p className="text-xs text-zinc-600 mt-1">
                                  <span className="font-semibold text-zinc-900">
                                    {qtyVal} {unitSym}
                                  </span>{' '}
                                  × {formatIDR(priceVal)}
                                </p>
                              </div>

                              {/* Line Total */}
                              <div className="text-right shrink-0">
                                <p className="font-bold text-zinc-900 text-xs">
                                  {formatIDR(subVal)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary Calculation Footer */}
                      <div className="p-4 bg-zinc-50 border-t border-zinc-200/80 space-y-1.5 text-xs">
                        <div className="flex justify-between text-zinc-600">
                          <span>Subtotal Produk</span>
                          <span className="font-semibold">
                            {formatIDR(activeOrderDetail.subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-600">
                          <span>Biaya Pengiriman</span>
                          <span className="font-semibold">
                            {activeOrderDetail.deliveryFee && activeOrderDetail.deliveryFee > 0
                              ? formatIDR(activeOrderDetail.deliveryFee)
                              : 'Gratis / Ambil di Toko'}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2 border-t border-zinc-200 text-sm">
                          <span className="font-bold text-zinc-900">Total Pembayaran</span>
                          <span className="font-black text-amber-700 text-base">
                            {formatIDR(activeOrderDetail.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sticky Drawer Footer — Context-Aware State Machine Fulfillment Actions */}
              {activeOrderDetail && !detailLoading && (
                <div className="p-4 border-t border-zinc-200 bg-white flex items-center justify-between gap-3">
                  {/* Cancel Button (Available on non-terminal states) */}
                  {!['COMPLETED', 'CANCELLED'].includes(activeOrderDetail.orderStatus) && (
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                      Batalkan Pesanan
                    </button>
                  )}

                  {/* Forward Transitions */}
                  <div className="flex items-center gap-2 ml-auto">
                    {/* PENDING_PAYMENT -> PROCESSING */}
                    {activeOrderDetail.orderStatus === 'PENDING_PAYMENT' && (
                      <button
                        onClick={() => handleTransitionStatus('PROCESSING')}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-xs disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>Mulai Proses Pesanan</span>
                      </button>
                    )}

                    {/* PROCESSING -> READY_FOR_PICKUP (if PICKUP) */}
                    {activeOrderDetail.orderStatus === 'PROCESSING' &&
                      activeOrderDetail.fulfillmentMethod === 'PICKUP' && (
                        <button
                          onClick={() => handleTransitionStatus('READY_FOR_PICKUP')}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 transition-all shadow-xs disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Tandai Siap Diambil di Toko</span>
                        </button>
                      )}

                    {/* PROCESSING -> SHIPPED (if DELIVERY) */}
                    {activeOrderDetail.orderStatus === 'PROCESSING' &&
                      activeOrderDetail.fulfillmentMethod === 'DELIVERY' && (
                        <button
                          onClick={() => handleTransitionStatus('SHIPPED')}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-xs disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Truck className="w-3.5 h-3.5" />
                          )}
                          <span>Tandai Telah Dikirim Kurir</span>
                        </button>
                      )}

                    {/* READY_FOR_PICKUP or SHIPPED -> COMPLETED */}
                    {(activeOrderDetail.orderStatus === 'READY_FOR_PICKUP' ||
                      activeOrderDetail.orderStatus === 'SHIPPED') && (
                      <button
                        onClick={() => handleTransitionStatus('COMPLETED')}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Selesaikan Pesanan (Diterima)</span>
                      </button>
                    )}

                    {/* Terminal States Info */}
                    {activeOrderDetail.orderStatus === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Pesanan Telah Selesai (COMPLETED)
                      </span>
                    )}

                    {activeOrderDetail.orderStatus === 'CANCELLED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Pesanan Telah Dibatalkan (CANCELLED)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CANCELLATION MODAL                                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => !actionLoading && setCancelModalOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-zinc-900">
                  Batalkan Pesanan #{activeOrderDetail?.orderNumber}?
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Tindakan ini akan membatalkan status pesanan dan memicu trigger PostgreSQL untuk
                  melepaskan kuantitas stok yang dicadangkan kembali ke stok yang tersedia{' '}
                  <span className="font-mono font-semibold text-zinc-700">
                    (RESERVATION_RELEASE)
                  </span>
                  .
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Alasan Pembatalan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Pelanggan meminta pembatalan, pembayaran lewat batas waktu, atau stok rusak..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={actionLoading || !cancellationReason.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {actionLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Konfirmasi Batalkan Pesanan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
