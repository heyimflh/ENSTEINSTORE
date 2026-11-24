'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getMyOrders } from '@/lib/orders-api';
import { getCart, addToCart } from '@/lib/cart-api';
import { getProducts, getFeaturedProducts } from '@/lib/catalog-api';
import { ApiException } from '@/lib/api';
import type { OrderSummaryResponse, ProductResponse } from '@/types/api';
import { Navbar } from '@/components/store/Navbar';
import { Footer } from '@/components/store/Footer';
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Store,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  CreditCard,
  ChevronRight,
  Sparkles,
  Plus,
  Check,
  MessageCircle,
  Lock,
  Filter,
  RefreshCw,
  ExternalLink,
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
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// Complete OrderStatus mapping with accurate Indonesian labels, colors & icons
interface StatusConfig {
  label: string;
  color: string;
  dotColor: string;
  icon: React.ReactNode;
}

const ORDER_STATUS_MAP: Record<string, StatusConfig> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Pembayaran',
    color: 'text-amber-700 bg-amber-50 border-amber-200/80',
    dotColor: 'bg-amber-500',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  PAID: {
    label: 'Dibayar / Terverifikasi',
    color: 'text-blue-700 bg-blue-50 border-blue-200/80',
    dotColor: 'bg-blue-500',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  PROCESSING: {
    label: 'Diproses / Dikemas',
    color: 'text-violet-700 bg-violet-50 border-violet-200/80',
    dotColor: 'bg-violet-500',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  READY: {
    label: 'Siap Diambil / Dikirim',
    color: 'text-cyan-700 bg-cyan-50 border-cyan-200/80',
    dotColor: 'bg-cyan-500',
    icon: <Store className="w-3.5 h-3.5" />,
  },
  READY_FOR_PICKUP: {
    label: 'Siap Diambil di Toko',
    color: 'text-cyan-700 bg-cyan-50 border-cyan-200/80',
    dotColor: 'bg-cyan-500',
    icon: <Store className="w-3.5 h-3.5" />,
  },
  SHIPPED: {
    label: 'Sedang Dikirim',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200/80',
    dotColor: 'bg-indigo-500',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  COMPLETED: {
    label: 'Selesai',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
    dotColor: 'bg-emerald-500',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'text-rose-700 bg-rose-50 border-rose-200/80',
    dotColor: 'bg-rose-500',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  UNPAID: { label: 'Belum Bayar', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  WAITING_VERIFICATION: { label: 'Menunggu Verifikasi', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  PAID: { label: 'Lunas', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  REJECTED: { label: 'Ditolak', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  EXPIRED: { label: 'Kadaluarsa', color: 'text-zinc-600 bg-zinc-100 border-zinc-200' },
};

// Filter Tab keys
type FilterStatus = 'ALL' | 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';

const FILTER_TABS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'PENDING_PAYMENT', label: 'Menunggu Bayar' },
  { key: 'PAID', label: 'Dibayar' },
  { key: 'PROCESSING', label: 'Diproses' },
  { key: 'READY', label: 'Siap' },
  { key: 'COMPLETED', label: 'Selesai' },
  { key: 'CANCELLED', label: 'Dibatalkan' },
];

export default function OrdersPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('ALL');

  // Cart Badge sync
  const [cartCount, setCartCount] = useState(0);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<ProductResponse[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [addingRecId, setAddingRecId] = useState<string | null>(null);
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);

  // 1. Fetch Orders
  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getMyOrders(page, 15);
      setOrders(res.content || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('Gagal memuat riwayat pesanan. Silakan periksa koneksi Anda.');
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 2. Fetch Cart Count for Navbar
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

  // 3. Fetch Recommendations
  const fetchRecommendations = useCallback(async () => {
    setLoadingRecs(true);
    try {
      const paged = await getProducts({ size: 8, sort: 'terpopuler' });
      if (paged?.content?.length) {
        setRecommendations(paged.content.slice(0, 4));
      } else {
        const featured = await getFeaturedProducts();
        setRecommendations((featured || []).slice(0, 4));
      }
    } catch {
      // silent fallback
    } finally {
      setLoadingRecs(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // 4. Handle Add Recommendation to Cart
  const handleAddRecommendation = async (product: ProductResponse) => {
    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }
    setAddingRecId(product.id);
    try {
      await addToCart({ productId: product.id, quantity: product.allowDecimal ? 1 : 1 });
      setAddedSuccessId(product.id);
      refreshCartCount();
      setTimeout(() => setAddedSuccessId(null), 3000);
    } catch (err) {
      if (err instanceof ApiException) {
        alert(err.message);
      } else {
        alert('Gagal menambahkan produk ke keranjang.');
      }
    } finally {
      setAddingRecId(null);
    }
  };

  // Filter orders by active tab
  const filteredOrders = useMemo(() => {
    if (selectedStatus === 'ALL') return orders;
    return orders.filter((order) => {
      if (selectedStatus === 'READY') {
        return order.orderStatus === 'READY' || order.orderStatus === 'READY_FOR_PICKUP';
      }
      return order.orderStatus === selectedStatus;
    });
  }, [orders, selectedStatus]);

  // Status count map for tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    orders.forEach((o) => {
      const st = (o.orderStatus as string) === 'READY_FOR_PICKUP' ? 'READY' : o.orderStatus;
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Guest / Unauthenticated State
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/orders" />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/70 mx-auto flex items-center justify-center mb-5 text-amber-600">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              Masuk untuk Melihat Pesanan
            </h1>
            <p className="text-zinc-600 text-sm leading-relaxed mb-8">
              Pantau status konfirmasi pembayaran, reservasi bahan, dan riwayat pesanan konveksi Anda di ENSTEINSTORE.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth?mode=login"
                className="w-full sm:w-auto px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-sm font-semibold shadow-md transition-all active:scale-95"
              >
                Masuk ke Akun
              </Link>
              <Link
                href="/products"
                className="w-full sm:w-auto px-7 py-3.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-full text-sm font-semibold transition-all"
              >
                Jelajahi Katalog
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Global Standardized Navbar */}
      <Navbar cartItemCount={cartCount} activeRoute="/orders" />

      {/* 2. Main Orders Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center gap-2 text-xs text-zinc-500">
            <li>
              <Link href="/" className="hover:text-zinc-900 transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <li className="font-semibold text-zinc-900">
              Pesanan Saya
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 mb-2">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
              <span>Riwayat Transaksi Pelanggan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Pesanan Saya
            </h1>
            <p className="text-zinc-600 text-sm mt-1 max-w-2xl leading-relaxed">
              Pantau status pembayaran, proses pengemasan bahan jas hujan, dan riwayat pembelian material konveksi Anda.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 transition-colors group self-start md:self-auto"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:-translate-x-1 transition-transform" />
            <span>Katalog Produk</span>
          </Link>
        </div>

        {/* Status Filter Tabs (Horizontal Scrollable) */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const count = statusCounts[tab.key] || 0;
            const isActive = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/80'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content States: Loading, Error, Empty, or Populated List */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-xs text-zinc-500 font-medium">Memuat riwayat pesanan...</p>
          </div>
        ) : error ? (
          <div className="mt-8 p-6 bg-white rounded-3xl border border-rose-200 text-center max-w-lg mx-auto shadow-xs">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-900 mb-1">Gagal Memuat Pesanan</h3>
            <p className="text-xs text-zinc-500 mb-5">{error}</p>
            <button
              type="button"
              onClick={fetchOrders}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-semibold transition-all inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* RICH EMPTY STATE */
          <div className="mt-8 space-y-12">
            
            {/* Main Empty Card */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-12 text-center shadow-xs max-w-3xl mx-auto">
              
              {/* Layered Icon Badge */}
              <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200/70 mx-auto flex items-center justify-center mb-6 text-amber-600 shadow-inner">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>

              {/* Headline & Subtitle */}
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
                {selectedStatus === 'ALL'
                  ? 'Belum Ada Riwayat Pesanan'
                  : `Tidak Ada Pesanan dengan Status "${FILTER_TABS.find((t) => t.key === selectedStatus)?.label}"`}
              </h2>
              <p className="text-zinc-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
                {selectedStatus === 'ALL'
                  ? 'Anda belum memiliki transaksi di ENSTEINSTORE. Mulai pesan kain PVC, taslan, resleting waterproof, maupun aksesori konveksi secara eceran atau roll.'
                  : 'Saat ini belum ada pesanan yang sesuai dengan filter status ini. Coba pilih status lain atau kembali ke Semua Pesanan.'}
              </p>

              {/* Quick Category Shortcut Chips */}
              <div className="mb-8">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-3">
                  Pencarian Kategori Populer
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { name: 'Material Jas Hujan', slug: 'material-jas-hujan' },
                    { name: 'Resleting Waterproof', slug: 'resleting' },
                    { name: 'Kancing Snap', slug: 'kancing' },
                    { name: 'Karet Elastis', slug: 'karet' },
                    { name: 'Aksesori Konveksi', slug: 'aksesori' },
                  ].map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/products?category=${cat.slug}`}
                      className="bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700 text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 active:scale-95"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {selectedStatus !== 'ALL' ? (
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('ALL')}
                    className="w-full sm:w-auto px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-sm font-semibold shadow-sm transition-all"
                  >
                    Tampilkan Semua Pesanan
                  </button>
                ) : (
                  <Link
                    href="/products"
                    className="w-full sm:w-auto px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Mulai Belanja Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                <a
                  href="https://wa.me/6283876942484?text=Halo%20Admin%20ENSTEINSTORE,%20saya%20ingin%20konsultasi%20pemesanan%20bahan%20jas%20hujan%20atau%20pembelian%20partai."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 border border-zinc-300 hover:border-zinc-900 text-zinc-800 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all hover:bg-white"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Konsultasi Partai via WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Live Backend "Rekomendasi Material Populer" Section */}
            {recommendations.length > 0 && (
              <section className="pt-8 border-t border-zinc-200/80">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-amber-600 text-xs font-bold tracking-wider uppercase block">
                      REKOMENDASI MATERIAL
                    </span>
                    <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                      Material Jas Hujan &amp; Aksesori Terpopuler
                    </h3>
                  </div>
                  <Link
                    href="/products"
                    className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 underline underline-offset-2 flex items-center gap-1"
                  >
                    <span>Lihat Semua</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {recommendations.map((prod) => {
                    const isAdding = addingRecId === prod.id;
                    const isSuccess = addedSuccessId === prod.id;
                    const stockAvail = Number(prod.stockOnHand ?? prod.stock ?? 0) - Number(prod.reservedQuantity ?? 0);
                    const isOutOfStock = stockAvail <= 0 || !prod.available;

                    return (
                      <div
                        key={prod.id}
                        className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden group hover:shadow-md hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div className="relative aspect-square bg-zinc-100 overflow-hidden">
                          <Link href={`/products/${prod.code || prod.id}`}>
                            <img
                              src={prod.image || '/images/placeholder-product.jpg'}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </Link>
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/60 px-2.5 py-1 rounded-full">
                                Stok Habis
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                              {prod.categoryName || 'Material'}
                            </span>
                            <Link
                              href={`/products/${prod.code || prod.id}`}
                              className="block font-bold text-zinc-900 group-hover:text-amber-600 transition-colors line-clamp-2 text-sm leading-snug mb-2"
                            >
                              {prod.name}
                            </Link>
                          </div>

                          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-xs text-zinc-400 block leading-none">Harga</span>
                              <span className="text-sm font-extrabold text-zinc-900">
                                {formatIDR(prod.price)}
                                <span className="text-[10px] font-normal text-zinc-500 ml-0.5">
                                  /{prod.unitSymbol || prod.unit || 'pcs'}
                                </span>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddRecommendation(prod)}
                              disabled={isOutOfStock || isAdding}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                isSuccess
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-white active:scale-95'
                              }`}
                              aria-label={`Tambah ${prod.name} ke keranjang`}
                            >
                              {isAdding ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isSuccess ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Ditambahkan!</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Keranjang</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* POPULATED ORDERS LIST */
          <div className="mt-8 space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig =
                ORDER_STATUS_MAP[order.orderStatus] || {
                  label: order.orderStatus,
                  color: 'text-zinc-600 bg-zinc-100 border-zinc-200',
                  dotColor: 'bg-zinc-400',
                  icon: null,
                };

              const paymentConfig =
                PAYMENT_STATUS_MAP[order.paymentStatus] || {
                  label: order.paymentStatus || 'Status Bayar',
                  color: 'text-zinc-600 bg-zinc-100 border-zinc-200',
                };

              const isPendingPayment = order.orderStatus === 'PENDING_PAYMENT';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-6 hover:border-zinc-300 hover:shadow-xs transition-all duration-200"
                >
                  {/* Top Bar: Order Number & Date & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Link
                        href={`/orders/${order.orderNumber}`}
                        className="text-base font-bold text-zinc-900 hover:text-amber-600 transition-colors tracking-tight font-mono"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="text-zinc-300 hidden sm:inline">•</span>
                      <span className="text-xs text-zinc-500">
                        {formatDate(order.orderDate)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Fulfillment Badge */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {order.fulfillmentMethod === 'DELIVERY' ? (
                          <>
                            <Truck className="w-3 h-3 text-zinc-500" />
                            <span>Pengiriman Ekspedisi</span>
                          </>
                        ) : (
                          <>
                            <Store className="w-3 h-3 text-amber-600" />
                            <span>Ambil di Toko Kebumen</span>
                          </>
                        )}
                      </span>

                      {/* Payment Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${paymentConfig.color}`}
                      >
                        {paymentConfig.label}
                      </span>

                      {/* Order Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusConfig.color}`}
                      >
                        {statusConfig.icon}
                        <span>{statusConfig.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Middle: Recipient & Total */}
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-zinc-600 space-y-1">
                      <p>
                        Penerima: <strong className="text-zinc-800">{order.recipientName}</strong>
                      </p>
                      <p className="text-zinc-400">
                        ID Transaksi: <span className="font-mono text-zinc-500">{order.id}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-zinc-400 block">Total Transaksi</span>
                      <span className="text-lg sm:text-xl font-extrabold text-zinc-900 tracking-tight">
                        {formatIDR(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-zinc-400">
                      {isPendingPayment ? (
                        <span className="text-amber-700 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Menunggu bukti transfer / pembayaran
                        </span>
                      ) : (
                        <span>Transaksi resmi ENSTEINSTORE</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      {isPendingPayment && (
                        <Link
                          href={`/orders/${order.orderNumber}/payment`}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Bayar Sekarang</span>
                        </Link>
                      )}

                      <Link
                        href={`/orders/${order.orderNumber}`}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <span>Lihat Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 disabled:opacity-40 hover:bg-zinc-50 transition-all cursor-pointer"
                >
                  ← Sebelumnya
                </button>
                <span className="text-xs text-zinc-500 font-medium">
                  Halaman {page + 1} dari {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 disabled:opacity-40 hover:bg-zinc-50 transition-all cursor-pointer"
                >
                  Selanjutnya →
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* 3. Global Standardized Footer */}
      <Footer />
    </div>
  );
}
