'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getOrderDetail, cancelMyOrder } from '@/lib/orders-api';
import { getCart, addToCart } from '@/lib/cart-api';
import { ApiException } from '@/lib/api';
import type { OrderDetailResponse, OrderItemResponse, OrderStatus } from '@/types/api';
import { Navbar } from '@/components/store/Navbar';
import { Footer } from '@/components/store/Footer';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  CreditCard,
  Store,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  RotateCcw,
  MessageCircle,
  AlertTriangle,
  X,
  FileText,
  Lock,
  Plus,
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// Complete OrderStatus mapping
const ORDER_STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    color: 'text-amber-700 bg-amber-50 border-amber-200/80',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  PAID: {
    label: 'Dibayar / Terverifikasi',
    color: 'text-blue-700 bg-blue-50 border-blue-200/80',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  PROCESSING: {
    label: 'Sedang Diproses',
    color: 'text-violet-700 bg-violet-50 border-violet-200/80',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  READY: {
    label: 'Siap Dikirim / Diambil',
    color: 'text-cyan-700 bg-cyan-50 border-cyan-200/80',
    icon: <Store className="w-3.5 h-3.5" />,
  },
  READY_FOR_PICKUP: {
    label: 'Siap Diambil di Toko',
    color: 'text-cyan-700 bg-cyan-50 border-cyan-200/80',
    icon: <Store className="w-3.5 h-3.5" />,
  },
  SHIPPED: {
    label: 'Sedang Dikirim',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200/80',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  COMPLETED: {
    label: 'Pesanan Selesai',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'text-rose-700 bg-rose-50 border-rose-200/80',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Menunggu Pembayaran', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  UNPAID: { label: 'Belum Bayar', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  WAITING_VERIFICATION: { label: 'Menunggu Verifikasi Admin', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  PAID: { label: 'Lunas & Terverifikasi', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  REJECTED: { label: 'Bukti Ditolak', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  EXPIRED: { label: 'Batas Waktu Habis', color: 'text-zinc-600 bg-zinc-100 border-zinc-200' },
};

// 5-Step Order Progress Configuration
const TRACKING_STEPS = [
  { key: 'PENDING_PAYMENT', label: 'Pesanan Dibuat', desc: 'Menunggu pembayaran' },
  { key: 'PAID', label: 'Terverifikasi', desc: 'Pembayaran lunas' },
  { key: 'PROCESSING', label: 'Diproses', desc: 'Disiapkan & dikemas' },
  { key: 'READY', label: 'Siap', desc: 'Siap diambil / dikirim' },
  { key: 'COMPLETED', label: 'Selesai', desc: 'Pesanan diterima' },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const orderIdOrNumber = (routeParams?.id as string) || '';

  const { isLoggedIn, loading: authLoading } = useAuth();

  // Core Data States
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart Badge sync
  const [cartCount, setCartCount] = useState(0);

  // Action states
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderSuccessId, setReorderSuccessId] = useState<string | null>(null);
  const [reorderingAll, setReorderingAll] = useState(false);

  // Cancel Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonOption, setCancelReasonOption] = useState('Ingin mengubah jumlah / warna produk');
  const [customReasonText, setCustomReasonText] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Countdown timer state for PENDING_PAYMENT
  const [timeLeftStr, setTimeLeftStr] = useState<string | null>(null);

  // 1. Fetch Order Details
  const fetchOrder = useCallback(async () => {
    if (!orderIdOrNumber) return;
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await getOrderDetail(orderIdOrNumber);
      setOrder(res);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('Pesanan tidak ditemukan atau gagal dimuat.');
      }
    } finally {
      setLoading(false);
    }
  }, [orderIdOrNumber, isLoggedIn]);

  useEffect(() => {
    if (!authLoading) {
      fetchOrder();
    }
  }, [authLoading, fetchOrder]);

  // 2. Fetch Cart Badge
  const refreshCartCount = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const c = await getCart();
      setCartCount(c.totalItems || 0);
    } catch {
      // ignore
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  // 3. Countdown timer for pending payment
  useEffect(() => {
    if (!order?.paymentDeadline || order.orderStatus !== 'PENDING_PAYMENT') {
      setTimeLeftStr(null);
      return;
    }

    const deadlineTime = new Date(order.paymentDeadline).getTime();

    const updateTimer = () => {
      const diff = deadlineTime - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('00:00:00 (Batas Waktu Berakhir)');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeftStr(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order?.paymentDeadline, order?.orderStatus]);

  // 4. Copy Order Number Handler
  const handleCopyOrderNumber = () => {
    if (!order?.orderNumber) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopiedOrderNumber(true);
      setTimeout(() => setCopiedOrderNumber(false), 2000);
    }
  };

  // 5. Reorder single item
  const handleReorderItem = async (item: OrderItemResponse) => {
    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }
    setReorderingId(item.id);
    try {
      await addToCart({
        productId: item.productId,
        quantity: item.quantity,
      });
      setReorderSuccessId(item.id);
      refreshCartCount();
      setTimeout(() => setReorderSuccessId(null), 3000);
    } catch (err) {
      if (err instanceof ApiException) {
        alert(err.message);
      } else {
        alert('Gagal menambahkan item ke keranjang.');
      }
    } finally {
      setReorderingId(null);
    }
  };

  // 6. Reorder all items from order
  const handleReorderAll = async () => {
    if (!order?.items?.length || !isLoggedIn) return;
    setReorderingAll(true);
    try {
      for (const item of order.items) {
        await addToCart({
          productId: item.productId,
          quantity: item.quantity,
        });
      }
      refreshCartCount();
      router.push('/cart');
    } catch (err) {
      if (err instanceof ApiException) {
        alert(err.message);
      } else {
        alert('Gagal menambahkan produk ke keranjang.');
      }
    } finally {
      setReorderingAll(false);
    }
  };

  // 7. Cancel Order Handler
  const handleConfirmCancel = async () => {
    if (!order) return;
    const finalReason =
      cancelReasonOption === 'Alasan lainnya'
        ? customReasonText.trim() || 'Dibatalkan oleh pelanggan'
        : cancelReasonOption;

    setCancelling(true);
    setCancelError(null);

    try {
      const updated = await cancelMyOrder(order.id || order.orderNumber, {
        cancellationReason: finalReason,
      });
      setOrder(updated);
      setShowCancelModal(false);
    } catch (err) {
      if (err instanceof ApiException) {
        setCancelError(err.message);
      } else {
        setCancelError('Gagal membatalkan pesanan. Silakan coba kembali.');
      }
    } finally {
      setCancelling(false);
    }
  };

  // Stepper progress index helper
  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    const st = order.orderStatus;
    if (st === 'PENDING_PAYMENT') return 0;
    if (st === 'PAID') return 1;
    if (st === 'PROCESSING') return 2;
    if (st === 'READY' || st === 'READY_FOR_PICKUP' || st === 'SHIPPED') return 3;
    if (st === 'COMPLETED') return 4;
    return 0;
  }, [order?.orderStatus]);

  // Unauthenticated Guard
  if (!authLoading && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/orders" />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/70 mx-auto flex items-center justify-center mb-5 text-amber-600">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Masuk untuk Melihat Detail Pesanan</h1>
            <p className="text-zinc-600 text-sm mb-8 leading-relaxed">
              Silakan login ke akun Anda untuk memantau status pesanan dan rincian transaksi ini.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/auth?mode=login"
                className="px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-sm font-semibold shadow-md transition-all"
              >
                Masuk ke Akun
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading Skeleton
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/orders" />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-6 w-48 bg-zinc-200/80 rounded-full animate-pulse mb-6" />
          <div className="h-10 w-72 bg-zinc-200/80 rounded-2xl animate-pulse mb-8" />
          <div className="h-28 bg-zinc-200/60 rounded-3xl animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-64 bg-zinc-200/60 rounded-3xl animate-pulse" />
              <div className="h-48 bg-zinc-200/60 rounded-3xl animate-pulse" />
            </div>
            <div className="lg:col-span-4">
              <div className="h-80 bg-zinc-200/60 rounded-3xl animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error State
  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/orders" />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="w-full bg-white rounded-3xl border border-zinc-200/80 p-8 text-center shadow-xs">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Pesanan Tidak Ditemukan</h2>
            <p className="text-zinc-500 text-sm mb-6">{error || 'Data pesanan yang Anda tuju tidak tersedia.'}</p>
            <div className="flex justify-center gap-3">
              <Link
                href="/orders"
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-semibold"
              >
                Kembali ke Daftar Pesanan
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statusConfig =
    ORDER_STATUS_MAP[order.orderStatus] || {
      label: order.orderStatus,
      color: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      icon: null,
    };

  const paymentStatus = order.payment?.status || (order as any).paymentStatus || 'PENDING';
  const paymentConfig =
    PAYMENT_STATUS_MAP[paymentStatus] || {
      label: paymentStatus,
      color: 'text-zinc-700 bg-zinc-100 border-zinc-200',
    };

  const isPendingPayment = order.orderStatus === 'PENDING_PAYMENT';
  const isCancelled = order.orderStatus === 'CANCELLED';

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Global Standardized Navbar */}
      <Navbar cartItemCount={cartCount} activeRoute="/orders" />

      {/* 2. Main Order Detail Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-xs text-zinc-500">
              <li>
                <Link href="/" className="hover:text-zinc-900 transition-colors">
                  Beranda
                </Link>
              </li>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <li>
                <Link href="/orders" className="hover:text-zinc-900 transition-colors">
                  Pesanan Saya
                </Link>
              </li>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <li className="font-semibold text-zinc-900 font-mono">
                {order.orderNumber}
              </li>
            </ol>
          </nav>

          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Riwayat Pesanan</span>
          </Link>
        </div>

        {/* Actionable Header Row */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight font-mono">
                #{order.orderNumber}
              </h1>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                title="Salin nomor pesanan"
              >
                {copiedOrderNumber ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Dipesan pada <strong className="text-zinc-800">{formatDate(order.orderDate)}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200">
              {order.orderType === 'OFFLINE' ? 'Transaksi Offline Kasir' : 'Pesanan Online Web'}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}>
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </span>
          </div>
        </div>

        {/* 3. VISUAL ORDER TRACKING STEPPER / ALERT CARD */}
        <div className="mt-8">
          {isCancelled ? (
            /* Cancelled Alert Card */
            <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div className="text-xs sm:text-sm text-rose-900 space-y-1">
                  <h3 className="text-base font-bold text-rose-950">Pesanan Dibatalkan</h3>
                  <p className="text-rose-800">
                    Alasan Pembatalan: <strong className="text-rose-950">{order.cancellationReason || 'Dibatalkan oleh pelanggan'}</strong>
                  </p>
                  <p className="text-rose-700 text-xs pt-1">
                    Seluruh kuantitas bahan yang sebelumnya direservasi telah dikembalikan ke stok gudang Toko Enstein.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Active 5-Step Order Progress Tracker */
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs">
              
              {/* Stepper Progress Bar */}
              <div className="relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-zinc-100 -z-0" />

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 relative z-10">
                  {TRACKING_STEPS.map((step, idx) => {
                    const isCompleted = currentStepIndex > idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-zinc-900 text-white ring-4 ring-zinc-900/10 shadow-sm'
                              : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                        </div>

                        <span
                          className={`mt-2.5 text-xs font-bold leading-tight ${
                            isCurrent ? 'text-zinc-900' : isCompleted ? 'text-emerald-800' : 'text-zinc-400'
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-[11px] text-zinc-400 hidden sm:block mt-0.5">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inline Payment Action Strip if Pending Payment */}
              {isPendingPayment && (
                <div className="mt-6 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-200/80">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-700 animate-pulse shrink-0" />
                    <div className="text-xs text-amber-900">
                      <p className="font-bold">Menunggu Pembayaran Pesanan</p>
                      {timeLeftStr && (
                        <p className="text-amber-800 font-mono mt-0.5">
                          Sisa batas waktu: <strong>{timeLeftStr}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/orders/${order.orderNumber}/payment`}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:opacity-95 text-white rounded-full text-xs font-bold shadow-sm transition-all inline-flex items-center justify-center gap-1.5 self-start sm:self-auto active:scale-95"
                  >
                    <span>Selesaikan Pembayaran</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. MAIN 2-COLUMN DETAIL WORKSPACE */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (8 cols): Order Items & Shipping Information */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CARD 1: DAFTAR PRODUK DIPESAN */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                    Item Pesanan
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-zinc-100 text-zinc-700 rounded-full">
                    {order.items.length} Produk
                  </span>
                </div>

                {order.orderStatus === 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={handleReorderAll}
                    disabled={reorderingAll}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-amber-600 transition-colors"
                  >
                    {reorderingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Beli Lagi Semua</span>
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="divide-y divide-zinc-100">
                {order.items.map((item) => {
                  const productName = item.name || item.productName || item.productCode || 'Bahan Konveksi';
                  const unitPrice = Number(item.price ?? item.unitPrice ?? item.priceAtOrder ?? 0);
                  const unitLabel = item.unit || item.unitSymbol || item.unitName || 'pcs';
                  const lineSubtotal = Number(item.subtotal ?? (unitPrice * item.quantity));
                  const isReordering = reorderingId === item.id;
                  const isSuccess = reorderSuccessId === item.id;

                  return (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start gap-4">
                      {/* Product Thumbnail */}
                      <Link
                        href={`/products/${item.productCode || item.productId}`}
                        className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-100 shrink-0 group relative"
                      >
                        <img
                          src={item.image || item.productImageUrl || item.imageUrl || '/images/placeholder-product.jpg'}
                          alt={productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </Link>

                      {/* Middle: Details */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                          {item.productCode}
                        </span>
                        <Link
                          href={`/products/${item.productCode || item.productId}`}
                          className="block font-bold text-zinc-900 hover:text-amber-600 transition-colors text-sm sm:text-base leading-snug line-clamp-2 mt-0.5"
                        >
                          {productName}
                        </Link>
                        
                        <div className="mt-1 text-xs text-zinc-500 font-medium">
                          <span>
                            {item.quantity} {unitLabel} × {formatIDR(unitPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Subtotal & Reorder Button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-50 gap-2">
                        <span className="text-sm sm:text-base font-extrabold text-zinc-900 tracking-tight">
                          {formatIDR(lineSubtotal)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleReorderItem(item)}
                          disabled={isReordering}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                            isSuccess
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700'
                          }`}
                          title="Beli produk ini lagi"
                        >
                          {isReordering ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isSuccess ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Ditambahkan!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Beli Lagi</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CARD 2: INFORMASI PENGIRIMAN & PENERIMA */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight pb-4 border-b border-zinc-100">
                Informasi Pengiriman &amp; Penerima
              </h2>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
                
                {/* Col 1: Recipient & Address */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Data Penerima
                  </span>
                  <div>
                    <strong className="text-zinc-900 text-sm sm:text-base block">{order.recipientName}</strong>
                    <span className="text-zinc-500 font-mono mt-0.5 block">{order.recipientPhone}</span>
                  </div>

                  <div className="pt-2 border-t border-zinc-100">
                    <span className="text-zinc-500 font-medium block mb-1">Alamat Penerima:</span>
                    <p className="text-zinc-700 leading-relaxed">
                      {order.fulfillmentMethod === 'PICKUP'
                        ? 'Ambil Sendiri di Outlet Fisik Toko Enstein — Jl. Kertanegara Km. 03, Tanahsari, Kebumen (08.00–17.00 WIB)'
                        : order.deliveryAddress || 'Alamat pengiriman tidak tercantum.'}
                    </p>
                  </div>
                </div>

                {/* Col 2: Method & Notes */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Metode &amp; Catatan
                  </span>

                  <div>
                    <span className="text-zinc-500 font-medium block mb-1">Metode Pemenuhan:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                      {order.fulfillmentMethod === 'DELIVERY' ? (
                        <>
                          <Truck className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Pengiriman Kurir / Ekspedisi</span>
                        </>
                      ) : (
                        <>
                          <Store className="w-3.5 h-3.5 text-amber-600" />
                          <span>Ambil Langsung di Toko Kebumen</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-100">
                    <span className="text-zinc-500 font-medium block mb-1">Catatan Pesanan:</span>
                    <p className="text-zinc-700 italic bg-zinc-50 p-3 rounded-2xl border border-zinc-200/60 leading-relaxed text-xs">
                      {order.notes || 'Tidak ada catatan tambahan untuk pesanan ini.'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Right Column (4 cols): Sticky Payment & Action Summary */}
          <div className="lg:col-span-4 sticky top-24 space-y-5">
            
            {/* Summary Card */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                  Rincian Pembayaran
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${paymentConfig.color}`}>
                  {paymentConfig.label}
                </span>
              </div>

              {/* Financial Breakdown */}
              <div className="py-4 space-y-2.5 text-xs text-zinc-600">
                <div className="flex justify-between items-center">
                  <span>Subtotal Produk</span>
                  <span className="font-semibold text-zinc-900">{formatIDR(order.subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Biaya Pengiriman</span>
                  <span className={order.deliveryFee > 0 ? 'font-semibold text-zinc-900' : 'font-semibold text-emerald-700'}>
                    {order.deliveryFee > 0 ? formatIDR(order.deliveryFee) : 'Gratis'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Metode Pembayaran</span>
                  <span className="font-semibold text-zinc-800">
                    {order.payment?.paymentMethod || 'TRANSFER BANK'}
                  </span>
                </div>
              </div>

              {/* Total Line */}
              <div className="pt-4 pb-6 border-t border-zinc-200 flex justify-between items-baseline">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-zinc-500 block">
                    Total Transaksi
                  </span>
                  <span className="text-[10px] text-zinc-400">Sudah termasuk ongkir</span>
                </div>
                <span className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                  {formatIDR(order.totalAmount)}
                </span>
              </div>

              {/* Context-Aware Primary Actions */}
              <div className="space-y-2.5">
                {isPendingPayment && paymentStatus !== 'WAITING_VERIFICATION' && (
                  <Link
                    href={`/orders/${order.orderNumber}/payment`}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:opacity-95 text-white rounded-full font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <span>Bayar Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                {paymentStatus === 'WAITING_VERIFICATION' && (
                  <Link
                    href={`/orders/${order.orderNumber}/payment`}
                    className="w-full py-3.5 bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 rounded-full font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Lihat Bukti &amp; Status Pembayaran</span>
                  </Link>
                )}

                {paymentStatus === 'REJECTED' && (
                  <Link
                    href={`/orders/${order.orderNumber}/payment`}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Unggah Ulang Bukti Pembayaran</span>
                  </Link>
                )}

                {order.orderStatus === 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={handleReorderAll}
                    disabled={reorderingAll}
                    className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-semibold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    {reorderingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                    <span>Pesan Lagi Semua Item</span>
                  </button>
                )}

                {/* Cancel Button trigger (only when PENDING_PAYMENT) */}
                {isPendingPayment && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-full transition-colors cursor-pointer"
                  >
                    Batalkan Pesanan
                  </button>
                )}
              </div>
            </div>

            {/* Store Support Card */}
            <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-sm border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Butuh Bantuan Pesanan?</h4>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Ada pertanyaan mengenai konfirmasi transfer, ketersediaan roll tambahan, atau pengiriman? Staf Toko Enstein siap membantu.
              </p>
              <a
                href={`https://wa.me/6283876942484?text=${encodeURIComponent(
                  `Halo Admin ENSTEINSTORE, saya ingin menanyakan mengenai pesanan #${order.orderNumber}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all mt-2"
              >
                <span>Hubungi Admin via WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>

      </main>

      {/* 5. INTERACTIVE CANCEL ORDER MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-zinc-900">Batalkan Pesanan?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Pesanan #{order.orderNumber} akan dibatalkan dan reservasi stok bahan akan segera dikembalikan ke katalog toko.
            </p>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {cancelError}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Alasan Pembatalan:
              </label>
              {[
                'Ingin mengubah jumlah / warna produk',
                'Salah memilih metode pengiriman / pembayaran',
                'Berubah pikiran',
                'Alasan lainnya',
              ].map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200/80 hover:bg-zinc-50 cursor-pointer text-xs font-medium text-zinc-800"
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={opt}
                    checked={cancelReasonOption === opt}
                    onChange={(e) => setCancelReasonOption(e.target.value)}
                    className="w-4 h-4 text-zinc-900 focus:ring-0"
                  />
                  <span>{opt}</span>
                </label>
              ))}

              {cancelReasonOption === 'Alasan lainnya' && (
                <textarea
                  rows={2}
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  placeholder="Tuliskan alasan pembatalan Anda..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 mt-2"
                />
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Ya, Batalkan Pesanan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Global Standardized Footer */}
      <Footer />
    </div>
  );
}
