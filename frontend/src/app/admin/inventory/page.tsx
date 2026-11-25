'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdminLayout } from '@/components/admin/AdminShell';
import {
  adminGetProducts,
  getCategories,
  resolveProductImageUrl,
} from '../../../lib/catalog-api';
import {
  getStockMovements,
  stockIn,
  stockAdjustment,
} from '../../../lib/admin-api';
import { ApiException } from '../../../lib/api';
import type {
  ProductResponse,
  CategoryResponse,
  StockMovementResponse,
  StockMovementType,
} from '../../../types/api';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  Boxes,
  Store,
  BarChart3,
  Activity,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Check,
  TrendingUp,
  TrendingDown,
  History,
  Sparkles,
  Info,
  Calendar,
  ShieldCheck,
  Boxes as BoxesIcon,
} from 'lucide-react';

// ─── Number & Date Formatters ────────────────────────────────────────────────
function formatQty(n?: number | null, allowDecimal: boolean = false): string {
  if (n === undefined || n === null || isNaN(Number(n))) return '0';
  const num = Number(n);
  if (allowDecimal) {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  }
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(num);
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

// ─── Indonesian Movement Types Mapping ────────────────────────────────────────
const MOVEMENT_TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; desc: string }
> = {
  STOCK_IN: {
    label: 'Stok Masuk',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Penambahan stok fisik dari supplier / kulakan',
  },
  SALE: {
    label: 'Penjualan Offline',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Pengurangan langsung kasir toko fisik (POS)',
  },
  FULFILLMENT: {
    label: 'Penjualan Online',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Pemenuhan stok pesanan web lunas',
  },
  RESERVE: {
    label: 'Reservasi Pesanan',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Stok dikunci sementara saat checkout pelanggan',
  },
  UNRESERVE: {
    label: 'Pelepasan Reservasi',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    desc: 'Pengembalian kuota pesanan batal / kedaluwarsa',
  },
  ADJUSTMENT: {
    label: 'Penyesuaian Stok',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    desc: 'Koreksi stok opname fisik riil gudang',
  },
  RETURN: {
    label: 'Retur / Pengembalian',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    desc: 'Pengembalian barang retur pembeli ke stok gudang',
  },
};

// ─── True Signed Delta Calculation ───────────────────────────────────────────
function computeSignedDelta(m: StockMovementResponse) {
  const before = m.stockBefore !== undefined && m.stockBefore !== null ? Number(m.stockBefore) : null;
  const after = m.stockAfter !== undefined && m.stockAfter !== null ? Number(m.stockAfter) : null;
  const qty = Number(m.quantity || 0);

  if (m.movementType === 'STOCK_IN' || m.movementType === 'RETURN') {
    return {
      text: `+${qty}`,
      colorClass: 'text-emerald-600 font-bold',
      isPositive: true,
    };
  }

  if (m.movementType === 'SALE' || m.movementType === 'FULFILLMENT') {
    return {
      text: `-${qty}`,
      colorClass: 'text-rose-600 font-bold',
      isPositive: false,
    };
  }

  if (m.movementType === 'ADJUSTMENT') {
    if (before !== null && after !== null) {
      const diff = after - before;
      if (diff > 0) {
        return {
          text: `+${diff}`,
          colorClass: 'text-emerald-600 font-bold',
          isPositive: true,
        };
      }
      if (diff < 0) {
        return {
          text: `${diff}`,
          colorClass: 'text-rose-600 font-bold',
          isPositive: false,
        };
      }
      return {
        text: '±0',
        colorClass: 'text-zinc-500 font-bold',
        isPositive: false,
      };
    }
    return {
      text: `±${qty}`,
      colorClass: 'text-violet-600 font-bold',
      isPositive: true,
    };
  }

  if (m.movementType === 'RESERVE') {
    return {
      text: `0 Fisik (+${qty} Res)`,
      colorClass: 'text-amber-600 font-semibold text-xs',
      isPositive: false,
    };
  }

  if (m.movementType === 'UNRESERVE') {
    return {
      text: `0 Fisik (-${qty} Res)`,
      colorClass: 'text-cyan-600 font-semibold text-xs',
      isPositive: false,
    };
  }

  // Fallback using before and after diff if available
  if (before !== null && after !== null) {
    const diff = after - before;
    if (diff > 0) return { text: `+${diff}`, colorClass: 'text-emerald-600 font-bold', isPositive: true };
    if (diff < 0) return { text: `${diff}`, colorClass: 'text-rose-600 font-bold', isPositive: false };
  }

  return { text: `${qty}`, colorClass: 'text-zinc-700 font-semibold', isPositive: false };
}

// Preset Adjustment Reasons
const ADJUSTMENT_PRESETS = [
  'Hasil Stock Opname Fisik Berkala',
  'Koreksi Selisih Potongan Meteran',
  'Barang Cacat / Rusak / Basah',
  'Retur dari Supplier Diterima',
  'Penyesuaian Tutup Buku Bulanan',
];

export default function AdminInventoryPage() {
  const router = useRouter();
  const { user, isAdmin, logout, loading: authLoading } = useAuth();

  // ─── Data States ───────────────────────────────────────────────────────────
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState(true);

  // Active View Switcher
  const [activeView, setActiveView] = useState<'STOCK' | 'MOVEMENTS'>('STOCK');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Movements Pagination
  const [movementsPage, setMovementsPage] = useState(0);
  const [movementsTotalPages, setMovementsTotalPages] = useState(1);
  const [movementsTotalElements, setMovementsTotalElements] = useState(0);

  // Drawer States
  const [drawerType, setDrawerType] = useState<'NONE' | 'STOCK_IN' | 'ADJUSTMENT'>('NONE');
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Stock In Form
  const [stockInQty, setStockInQty] = useState<number | string>(1);
  const [stockInNotes, setStockInNotes] = useState('');

  // Adjustment Form
  const [adjMode, setAdjMode] = useState<'SET' | 'ADD' | 'SUBTRACT'>('SET');
  const [adjValue, setAdjValue] = useState<number | string>('');
  const [adjReason, setAdjReason] = useState('');

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mobile Sidebar
  const { toggleMobile } = useAdminLayout();

  // ─── Authentication Guard ──────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/auth');
    }
  }, [authLoading, isAdmin, router]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const fetchAllData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [prodRes, catRes, movRes] = await Promise.allSettled([
          adminGetProducts({ size: 100 }),
          getCategories(),
          getStockMovements({ page: movementsPage, size: 20 }),
        ]);

        if (prodRes.status === 'fulfilled') {
          setProducts(prodRes.value.content || []);
          setDbConnected(true);
        } else {
          setDbConnected(false);
          throw prodRes.reason;
        }

        if (catRes.status === 'fulfilled') {
          setCategories(catRes.value || []);
        }

        if (movRes.status === 'fulfilled') {
          setMovements(movRes.value.content || []);
          setMovementsTotalPages(movRes.value.totalPages || 1);
          setMovementsTotalElements(movRes.value.totalElements || 0);
        }
      } catch (err) {
        setDbConnected(false);
        setError(err instanceof ApiException ? err.message : 'Koneksi ke backend inventaris gagal.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [movementsPage]
  );

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchAllData();
    }
  }, [authLoading, isAdmin, fetchAllData]);

  // ─── Warehouse Health KPI Calculations ─────────────────────────────────────
  const kpiStats = useMemo(() => {
    let normal = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalPhysical = 0;
    let totalReserved = 0;

    products.forEach((p) => {
      const physical = Number(p.stockOnHand || 0);
      const reserved = Number(p.reservedQuantity || 0);
      const minStock = Number(p.minimumStock || 10);
      const available = Math.max(0, physical - reserved);

      totalPhysical += physical;
      totalReserved += reserved;

      if (available <= 0) {
        outOfStock++;
      } else if (available <= minStock) {
        lowStock++;
      } else {
        normal++;
      }
    });

    return {
      totalProducts: products.length,
      normal,
      lowStock,
      outOfStock,
      totalPhysical,
      totalReserved,
    };
  }, [products]);

  // ─── Filtered Products ─────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const physical = Number(p.stockOnHand || 0);
      const reserved = Number(p.reservedQuantity || 0);
      const minStock = Number(p.minimumStock || 10);
      const available = Math.max(0, physical - reserved);

      // Status Filter
      if (statusFilter === 'NORMAL' && !(available > minStock)) return false;
      if (statusFilter === 'LOW_STOCK' && !(available > 0 && available <= minStock)) return false;
      if (statusFilter === 'OUT_OF_STOCK' && !(available <= 0)) return false;

      // Category Filter
      if (categoryFilter !== 'ALL' && p.categoryId !== categoryFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = p.name?.toLowerCase().includes(q);
        const codeMatch = p.code?.toLowerCase().includes(q);
        const catMatch = p.categoryName?.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !catMatch) return false;
      }

      return true;
    });
  }, [products, statusFilter, categoryFilter, searchQuery]);

  // ─── Drawer Open Handlers ──────────────────────────────────────────────────
  const handleOpenStockIn = (product?: ProductResponse) => {
    const target = product || products[0] || null;
    setSelectedProduct(target);
    setStockInQty(target?.allowDecimal ? 10 : 1);
    setStockInNotes('');
    setDrawerError(null);
    setDrawerType('STOCK_IN');
  };

  const handleOpenAdjustment = (product?: ProductResponse) => {
    const target = product || products[0] || null;
    setSelectedProduct(target);
    setAdjMode('SET');
    setAdjValue(target ? Number(target.stockOnHand || 0) : 0);
    setAdjReason('');
    setDrawerError(null);
    setDrawerType('ADJUSTMENT');
  };

  const handleCloseDrawer = () => {
    setDrawerType('NONE');
    setSelectedProduct(null);
    setDrawerError(null);
  };

  // ─── Live Impact Calculations for Drawers ──────────────────────────────────
  const liveStockInImpact = useMemo(() => {
    if (!selectedProduct) return null;
    const currentPhysical = Number(selectedProduct.stockOnHand || 0);
    const currentReserved = Number(selectedProduct.reservedQuantity || 0);
    const qty = Number(stockInQty) || 0;
    const newPhysical = currentPhysical + qty;
    const newAvailable = Math.max(0, newPhysical - currentReserved);

    return {
      currentPhysical,
      currentReserved,
      qty,
      newPhysical,
      newAvailable,
      isValid: qty > 0,
    };
  }, [selectedProduct, stockInQty]);

  const liveAdjImpact = useMemo(() => {
    if (!selectedProduct) return null;
    const currentPhysical = Number(selectedProduct.stockOnHand || 0);
    const currentReserved = Number(selectedProduct.reservedQuantity || 0);
    const val = Number(adjValue) || 0;

    let targetPhysical = currentPhysical;
    if (adjMode === 'SET') {
      targetPhysical = val;
    } else if (adjMode === 'ADD') {
      targetPhysical = currentPhysical + val;
    } else if (adjMode === 'SUBTRACT') {
      targetPhysical = currentPhysical - val;
    }

    const diff = targetPhysical - currentPhysical;
    const newAvailable = targetPhysical - currentReserved;

    let error: string | null = null;
    if (targetPhysical < 0) {
      error = 'Stok fisik baru tidak boleh bernilai negatif.';
    } else if (targetPhysical < currentReserved) {
      error = `Stok fisik baru (${targetPhysical} ${selectedProduct.unitSymbol || ''}) tidak boleh lebih kecil dari kuota pesanan yang sedang direservasi (${currentReserved} ${selectedProduct.unitSymbol || ''}).`;
    }

    return {
      currentPhysical,
      currentReserved,
      targetPhysical,
      diff,
      newAvailable,
      error,
      isValid: error === null && adjReason.trim().length > 0,
    };
  }, [selectedProduct, adjMode, adjValue, adjReason]);

  // ─── Submit Handlers ───────────────────────────────────────────────────────
  const handleSubmitStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = Number(stockInQty);
    if (isNaN(qty) || qty <= 0) {
      setDrawerError('Jumlah barang masuk harus lebih besar dari 0.');
      return;
    }

    if (!selectedProduct.allowDecimal && !Number.isInteger(qty)) {
      setDrawerError(`Produk dengan satuan ${selectedProduct.unitSymbol || 'item'} harus berupa bilangan bulat (tanpa desimal).`);
      return;
    }

    setIsSubmitting(true);
    setDrawerError(null);
    try {
      await stockIn({
        productId: selectedProduct.id,
        quantity: qty,
        notes: stockInNotes.trim() || `Restok gudang produk ${selectedProduct.name}`,
      });

      setToastMsg({
        type: 'success',
        text: `Stok masuk ${qty} ${selectedProduct.unitSymbol || ''} untuk ${selectedProduct.name} berhasil dicatat di PostgreSQL!`,
      });

      handleCloseDrawer();
      await fetchAllData(true);
    } catch (err) {
      const errMsg = err instanceof ApiException ? err.message : 'Gagal mencatat stok masuk ke backend.';
      setDrawerError(errMsg);
      setToastMsg({ type: 'error', text: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !liveAdjImpact) return;

    if (liveAdjImpact.error) {
      setDrawerError(liveAdjImpact.error);
      return;
    }

    if (!adjReason.trim()) {
      setDrawerError('Alasan penyesuaian stok wajib diisi untuk rekam audit gudang.');
      return;
    }

    if (!selectedProduct.allowDecimal && !Number.isInteger(liveAdjImpact.targetPhysical)) {
      setDrawerError(`Stok fisik untuk satuan ${selectedProduct.unitSymbol || 'item'} harus berupa bilangan bulat.`);
      return;
    }

    setIsSubmitting(true);
    setDrawerError(null);
    try {
      await stockAdjustment({
        productId: selectedProduct.id,
        newActualStock: liveAdjImpact.targetPhysical,
        notes: adjReason.trim(),
      });

      setToastMsg({
        type: 'success',
        text: `Stok fisik ${selectedProduct.name} berhasil disesuaikan menjadi ${liveAdjImpact.targetPhysical} ${selectedProduct.unitSymbol || ''}!`,
      });

      handleCloseDrawer();
      await fetchAllData(true);
    } catch (err) {
      const errMsg = err instanceof ApiException ? err.message : 'Gagal melakukan penyesuaian stok.';
      setDrawerError(errMsg);
      setToastMsg({ type: 'error', text: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Auth Loading View ─────────────────────────────────────────────────────
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
      {/* Executive Sticky Topbar */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                <span>Admin Panel</span>
                <span>/</span>
                <span className="text-zinc-900 font-semibold">Manajemen Inventaris</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-sm font-extrabold text-zinc-950">
                  Kontrol Stok Gudang & Mutasi
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    dbConnected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span>{dbConnected ? 'Database Live' : 'Koneksi Terputus'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Refresh Button */}
            <button
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              title="Muat Ulang Data Inventaris"
              className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-zinc-900' : ''}`} />
            </button>

            {/* Link to full movements ledger */}
            <Link
              href="/admin/inventory/movements"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-zinc-500" />
              <span>Buku Besar Mutasi</span>
              <ArrowRight className="w-3 h-3 text-zinc-400" />
            </Link>

            {/* Penyesuaian Stok Outline Button */}
            <button
              onClick={() => handleOpenAdjustment()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold transition-all shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-600" />
              <span>Penyesuaian Stok</span>
            </button>

            {/* + Stok Masuk Primary Dark Button */}
            <button
              onClick={() => handleOpenStockIn()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Stok Masuk</span>
            </button>
          </div>
        </header>

        {/* Global Toast Notification */}
        {toastMsg && (
          <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
                toastMsg.type === 'success'
                  ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
                  : 'bg-rose-950 text-rose-100 border-rose-800'
              }`}
            >
              {toastMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{toastMsg.text}</span>
              <button onClick={() => setToastMsg(null)} className="text-zinc-400 hover:text-white p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Page Body Container */}
        <main className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Global Fetch Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
              <button
                onClick={() => fetchAllData(true)}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TIER 1: LIVE WAREHOUSE HEALTH KPI STAT CARDS                      */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total SKU Dipantau */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Total Item Gudang
                </span>
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-zinc-950">{kpiStats.totalProducts}</p>
                <span className="text-xs text-zinc-500 font-medium">SKU Aktif</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Total fisik: <strong className="text-zinc-700">{formatQty(kpiStats.totalPhysical, true)}</strong> unit
              </p>
            </div>

            {/* Card 2: Stok Normal (Siap Jual) */}
            <button
              onClick={() => {
                setStatusFilter((prev) => (prev === 'NORMAL' ? 'ALL' : 'NORMAL'));
                setActiveView('STOCK');
              }}
              className={`p-5 rounded-2xl text-left border transition-all shadow-xs space-y-2 ${
                statusFilter === 'NORMAL'
                  ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-white border-zinc-200/80 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Stok Siap Jual
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-emerald-700">{kpiStats.normal}</p>
                <span className="text-xs text-emerald-600 font-medium">SKU Aman</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 font-medium">
                Tersedia &gt; Batas Minimum
              </p>
            </button>

            {/* Card 3: Stok Menipis */}
            <button
              onClick={() => {
                setStatusFilter((prev) => (prev === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK'));
                setActiveView('STOCK');
              }}
              className={`p-5 rounded-2xl text-left border transition-all shadow-xs space-y-2 ${
                statusFilter === 'LOW_STOCK'
                  ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20'
                  : 'bg-white border-zinc-200/80 hover:border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Perlu Restok
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-amber-700">{kpiStats.lowStock}</p>
                <span className="text-xs text-amber-700 font-medium">SKU Menipis</span>
              </div>
              <p className="text-[11px] text-amber-800/80 font-medium">
                Tersedia &le; Batas Minimum
              </p>
            </button>

            {/* Card 4: Stok Habis */}
            <button
              onClick={() => {
                setStatusFilter((prev) => (prev === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK'));
                setActiveView('STOCK');
              }}
              className={`p-5 rounded-2xl text-left border transition-all shadow-xs space-y-2 ${
                statusFilter === 'OUT_OF_STOCK'
                  ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-white border-zinc-200/80 hover:border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Stok Habis (0)
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-rose-700">{kpiStats.outOfStock}</p>
                <span className="text-xs text-rose-700 font-medium">SKU Kosong</span>
              </div>
              <p className="text-[11px] text-rose-800/80 font-medium">
                Katalog web otomatis disembunyikan
              </p>
            </button>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TIER 2: VIEW SWITCHER, FORMULA PILL & TOOLBAR                     */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs space-y-4">
            {/* Row 1: Segmented View Switcher & Formula Explanation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-zinc-100 border border-zinc-200/60">
                <button
                  onClick={() => setActiveView('STOCK')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeView === 'STOCK'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Daftar Stok Gudang</span>
                  <span className="text-[10px] font-mono font-normal bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                    {filteredProducts.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveView('MOVEMENTS')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeView === 'MOVEMENTS'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Log Pergerakan Terbaru</span>
                  <span className="text-[10px] font-mono font-normal bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                    {movements.length}
                  </span>
                </button>
              </div>

              {/* Formula & Rule 7 Info Pill */}
              <div className="flex items-center gap-2">
                <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Formula: <strong>Tersedia</strong> = <strong>Fisik</strong> − <strong>Reservasi</strong></span>
                </div>

                <Link
                  href="/admin/inventory/movements"
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline inline-flex items-center gap-1 ml-auto"
                >
                  <span>Buku Besar Mutasi</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Row 2: Search & Filters (Visible when on 'STOCK' View) */}
            {activeView === 'STOCK' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-zinc-100">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama produk, kode SKU (misal: PRD-BHN-001)..."
                    className="w-full pl-10 pr-9 py-2 rounded-xl border border-zinc-200 text-xs bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
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

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      statusFilter === 'ALL'
                        ? 'bg-zinc-900 text-white shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    Semua ({products.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('NORMAL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      statusFilter === 'NORMAL'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    Normal ({kpiStats.normal})
                  </button>
                  <button
                    onClick={() => setStatusFilter('LOW_STOCK')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      statusFilter === 'LOW_STOCK'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    Menipis ({kpiStats.lowStock})
                  </button>
                  <button
                    onClick={() => setStatusFilter('OUT_OF_STOCK')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      statusFilter === 'OUT_OF_STOCK'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    Habis ({kpiStats.outOfStock})
                  </button>
                </div>

                {/* Category Dropdown Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-zinc-200 text-xs bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 font-medium"
                >
                  <option value="ALL">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TIER 3A: WAREHOUSE PRODUCT STOCK TABLE (PRIMARY VIEW)             */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeView === 'STOCK' && (
            <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="py-4 px-5">Produk & SKU</th>
                      <th className="py-4 px-4">Kategori</th>
                      <th className="py-4 px-4 text-right">Stok Fisik</th>
                      <th className="py-4 px-4 text-right">Reservasi</th>
                      <th className="py-4 px-4 text-right">Tersedia</th>
                      <th className="py-4 px-4 text-right">Min. Stok</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-5 text-right">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-zinc-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                          <p className="font-medium text-xs">Memuat katalog inventaris gudang...</p>
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-zinc-400">
                          <Boxes className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                          <p className="font-semibold text-zinc-700 text-sm">Tidak ada produk yang sesuai filter</p>
                          <p className="text-zinc-400 text-xs mt-1">Coba ubah kata kunci pencarian atau status filter.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const physical = Number(p.stockOnHand || 0);
                        const reserved = Number(p.reservedQuantity || 0);
                        const minStock = Number(p.minimumStock || 10);
                        const available = Math.max(0, physical - reserved);
                        const isDecimal = Boolean(p.allowDecimal);
                        const unit = p.unitSymbol || p.unit || 'unit';

                        let statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Normal</span>
                          </span>
                        );

                        if (available <= 0) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>Stok Habis</span>
                            </span>
                          );
                        } else if (available <= minStock) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>Stok Menipis</span>
                            </span>
                          );
                        }

                        return (
                          <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                            {/* Product & SKU */}
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={resolveProductImageUrl(p.image)}
                                  alt={p.name}
                                  className="w-11 h-11 rounded-xl object-cover bg-zinc-100 border border-zinc-200/80 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-bold text-zinc-900 truncate max-w-xs">{p.name}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                                      {p.code}
                                    </span>
                                    {isDecimal && (
                                      <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1 rounded border border-blue-200">
                                        Desimal
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-[11px] font-medium">
                                {p.categoryName || 'Bahan Jas Hujan'}
                              </span>
                            </td>

                            {/* Stok Fisik */}
                            <td className="py-3.5 px-4 text-right">
                              <p className="font-bold text-zinc-900 text-sm">
                                {formatQty(physical, isDecimal)}{' '}
                                <span className="text-xs font-normal text-zinc-500">{unit}</span>
                              </p>
                            </td>

                            {/* Reservasi */}
                            <td className="py-3.5 px-4 text-right">
                              {reserved > 0 ? (
                                <span
                                  title="Stok dikunci pesanan menunggu verifikasi / proses"
                                  className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200"
                                >
                                  <span>{formatQty(reserved, isDecimal)}</span>
                                  <span className="text-[10px] font-normal">{unit}</span>
                                </span>
                              ) : (
                                <span className="text-zinc-400 font-mono">0 {unit}</span>
                              )}
                            </td>

                            {/* Tersedia (Fisik - Reservasi) */}
                            <td className="py-3.5 px-4 text-right">
                              <p
                                className={`text-sm font-black ${
                                  available <= 0
                                    ? 'text-rose-600'
                                    : available <= minStock
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {formatQty(available, isDecimal)}{' '}
                                <span className="text-xs font-normal text-zinc-500">{unit}</span>
                              </p>
                            </td>

                            {/* Min. Stok */}
                            <td className="py-3.5 px-4 text-right text-zinc-500 font-mono">
                              {formatQty(minStock, isDecimal)} {unit}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">{statusBadge}</td>

                            {/* Quick Actions */}
                            <td className="py-3.5 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenStockIn(p)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-bold transition-all shadow-2xs"
                                >
                                  <Plus className="w-3 h-3 text-amber-400" />
                                  <span>+ Restok</span>
                                </button>
                                <button
                                  onClick={() => handleOpenAdjustment(p)}
                                  title="Penyesuaian Stok Opname"
                                  className="p-1.5 rounded-full border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              <div className="px-6 py-4 bg-zinc-50/70 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
                <p>
                  Menampilkan <strong>{filteredProducts.length}</strong> dari <strong>{products.length}</strong> produk gudang
                </p>
                <div className="flex items-center gap-4 text-[11px]">
                  <span>
                    Total Stok Fisik: <strong className="text-zinc-800">{formatQty(kpiStats.totalPhysical, true)} unit</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Total Direservasi: <strong className="text-amber-700">{formatQty(kpiStats.totalReserved, true)} unit</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TIER 3B: RECENT STOCK MOVEMENTS LOG VIEW                          */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeView === 'MOVEMENTS' && (
            <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Log Riwayat Mutasi Stok Otentik (Rule 7 Database Trigger)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Seluruh pergerakan stok dicatat melalui trigger PostgreSQL `trg_apply_stock_movement`
                  </p>
                </div>
                <Link
                  href="/admin/inventory/movements"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span>Buka Buku Besar Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="py-4 px-5">Produk</th>
                      <th className="py-4 px-4">Jenis Mutasi</th>
                      <th className="py-4 px-4 text-right">Perubahan</th>
                      <th className="py-4 px-4 text-center">Fisik (Sebelum → Sesudah)</th>
                      <th className="py-4 px-4">Aktor / Pembuat</th>
                      <th className="py-4 px-4">Catatan / Referensi</th>
                      <th className="py-4 px-5 text-right">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {movements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-zinc-400">
                          <History className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                          <p className="font-semibold text-zinc-700 text-sm">Belum ada riwayat mutasi stok</p>
                        </td>
                      </tr>
                    ) : (
                      movements.map((m) => {
                        const typeCfg =
                          MOVEMENT_TYPE_CONFIG[m.movementType] || {
                            label: m.movementType,
                            badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                            desc: '',
                          };
                        const delta = computeSignedDelta(m);

                        return (
                          <tr key={m.id} className="hover:bg-zinc-50/70 transition-colors">
                            {/* Product */}
                            <td className="py-3.5 px-5">
                              <p className="font-bold text-zinc-900">{m.productName}</p>
                              <p className="font-mono text-[10px] text-zinc-400 mt-0.5">{m.productCode}</p>
                            </td>

                            {/* Movement Type Badge */}
                            <td className="py-3.5 px-4">
                              <span
                                title={typeCfg.desc}
                                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${typeCfg.badgeClass}`}
                              >
                                {typeCfg.label}
                              </span>
                            </td>

                            {/* Signed Delta */}
                            <td className="py-3.5 px-4 text-right">
                              <span className={`text-sm font-black ${delta.colorClass}`}>
                                {delta.text}
                              </span>
                            </td>

                            {/* Sebelum -> Sesudah */}
                            <td className="py-3.5 px-4 text-center font-mono text-zinc-600">
                              <span className="text-zinc-500 font-semibold">{m.stockBefore}</span>
                              <span className="mx-2 text-zinc-400">→</span>
                              <span className="text-zinc-900 font-bold">{m.stockAfter}</span>
                            </td>

                            {/* Aktor */}
                            <td className="py-3.5 px-4">
                              <span className="font-medium text-zinc-800">
                                {m.createdByName || 'Sistem Enstein'}
                              </span>
                            </td>

                            {/* Notes / Reference */}
                            <td className="py-3.5 px-4">
                              <p className="text-zinc-600 truncate max-w-xs">{m.notes || '-'}</p>
                              {m.referenceType && (
                                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.2 rounded">
                                  {m.referenceType}
                                </span>
                              )}
                            </td>

                            {/* Waktu */}
                            <td className="py-3.5 px-5 text-right text-zinc-500 font-mono">
                              {formatDate(m.createdAt)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Movements Pagination Controls */}
              {movementsTotalPages > 1 && (
                <div className="p-4 bg-zinc-50/70 border-t border-zinc-200/80 flex items-center justify-between text-xs">
                  <p className="text-zinc-500">
                    Halaman <strong>{movementsPage + 1}</strong> dari <strong>{movementsTotalPages}</strong> ({movementsTotalElements} total mutasi)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMovementsPage((p) => Math.max(0, p - 1))}
                      disabled={movementsPage === 0}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-white font-semibold disabled:opacity-40"
                    >
                      ← Sebelumnya
                    </button>
                    <button
                      onClick={() => setMovementsPage((p) => Math.min(movementsTotalPages - 1, p + 1))}
                      disabled={movementsPage >= movementsTotalPages - 1}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-white font-semibold disabled:opacity-40"
                    >
                      Berikutnya →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TIER 4: SLIDE-OVER DRAWER (STOK MASUK & PENYESUAIAN STOK)           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {drawerType !== 'NONE' && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={handleCloseDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-950 flex items-center justify-center text-white">
                    {drawerType === 'STOCK_IN' ? (
                      <Plus className="w-5 h-5 text-amber-400" />
                    ) : (
                      <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-900">
                      {drawerType === 'STOCK_IN' ? 'Catat Stok Masuk (Restock)' : 'Penyesuaian Stok (Opname)'}
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {drawerType === 'STOCK_IN'
                        ? 'Menambah kuantitas stok fisik dari supplier / kulakan'
                        : 'Menyelaraskan stok sistem dengan hitungan fisik riil'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseDrawer}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Product Selection Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Pilih Produk Gudang *
                  </label>
                  <select
                    value={selectedProduct.id}
                    onChange={(e) => {
                      const found = products.find((p) => p.id === e.target.value);
                      if (found) {
                        setSelectedProduct(found);
                        if (drawerType === 'ADJUSTMENT') {
                          setAdjValue(Number(found.stockOnHand || 0));
                        }
                      }
                    }}
                    className="w-full p-3 rounded-xl border border-zinc-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 shadow-2xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name} (Fisik: {formatQty(p.stockOnHand, p.allowDecimal)} {p.unitSymbol || ''})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Product Summary Card (Dark SaaS Card) */}
                <div className="p-4 rounded-2xl bg-zinc-950 text-white space-y-3 shadow-md">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveProductImageUrl(selectedProduct.image)}
                      alt={selectedProduct.name}
                      className="w-12 h-12 rounded-xl object-cover bg-zinc-800 border border-zinc-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-zinc-100 truncate">{selectedProduct.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-amber-400">{selectedProduct.code}</span>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {selectedProduct.categoryName || 'Material Jas Hujan'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800 text-center">
                    <div className="p-2 rounded-xl bg-zinc-900/80">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Stok Fisik</p>
                      <p className="text-base font-black text-white mt-0.5">
                        {formatQty(selectedProduct.stockOnHand, selectedProduct.allowDecimal)}{' '}
                        <span className="text-xs font-normal text-zinc-400">{selectedProduct.unitSymbol}</span>
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-900/80">
                      <p className="text-[10px] font-bold text-amber-400 uppercase">Reservasi</p>
                      <p className="text-base font-black text-amber-400 mt-0.5">
                        {formatQty(selectedProduct.reservedQuantity, selectedProduct.allowDecimal)}{' '}
                        <span className="text-xs font-normal text-zinc-400">{selectedProduct.unitSymbol}</span>
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-900/80">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase">Tersedia</p>
                      <p className="text-base font-black text-emerald-400 mt-0.5">
                        {formatQty(
                          Math.max(
                            0,
                            Number(selectedProduct.stockOnHand || 0) - Number(selectedProduct.reservedQuantity || 0)
                          ),
                          selectedProduct.allowDecimal
                        )}{' '}
                        <span className="text-xs font-normal text-zinc-400">{selectedProduct.unitSymbol}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* ─── FORM: STOK MASUK ─── */}
                {drawerType === 'STOCK_IN' && (
                  <form onSubmit={handleSubmitStockIn} id="stock-in-form" className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-700">
                          Jumlah Barang Masuk ({selectedProduct.unitSymbol || 'unit'}) *
                        </label>
                        {selectedProduct.allowDecimal ? (
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Mendukung desimal (contoh: 10.5)
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-semibold bg-zinc-100 px-2 py-0.5 rounded-full">
                            Bilangan bulat saja
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min={selectedProduct.allowDecimal ? '0.01' : '1'}
                        step={selectedProduct.allowDecimal ? '0.01' : '1'}
                        value={stockInQty}
                        onChange={(e) => setStockInQty(e.target.value)}
                        required
                        placeholder={`Masukkan kuantitas masuk dalam ${selectedProduct.unitSymbol || 'unit'}...`}
                        className="w-full p-3 rounded-xl border border-zinc-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-700">
                        Catatan Sumber / No. Faktur Kulakan
                      </label>
                      <input
                        type="text"
                        value={stockInNotes}
                        onChange={(e) => setStockInNotes(e.target.value)}
                        placeholder="Contoh: Kulakan rol PVC dari CV Sumber Berkah, Nota #2026/XI/88"
                        className="w-full p-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                      />
                    </div>

                    {/* Live Stock-In Impact Preview */}
                    {liveStockInImpact && (
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-emerald-900 font-bold">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <span>Simulasi Dampak Stok Setelah Transaksi:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-zinc-700">
                          <div>
                            <p className="text-[10px] text-zinc-500 font-sans">Stok Fisik Baru</p>
                            <p className="font-bold text-sm text-zinc-900">
                              {formatQty(liveStockInImpact.currentPhysical, selectedProduct.allowDecimal)} →{' '}
                              <span className="text-emerald-700 font-black">
                                {formatQty(liveStockInImpact.newPhysical, selectedProduct.allowDecimal)}{' '}
                                {selectedProduct.unitSymbol}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-500 font-sans">Stok Tersedia Baru</p>
                            <p className="font-bold text-sm text-emerald-700">
                              {formatQty(liveStockInImpact.newAvailable, selectedProduct.allowDecimal)}{' '}
                              {selectedProduct.unitSymbol}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                )}

                {/* ─── FORM: PENYESUAIAN STOK (OPNAME) ─── */}
                {drawerType === 'ADJUSTMENT' && (
                  <form onSubmit={handleSubmitAdjustment} id="adj-form" className="space-y-4">
                    {/* Mode Switcher */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-700">
                        Metode Penyesuaian *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjMode('SET');
                            setAdjValue(Number(selectedProduct.stockOnHand || 0));
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                            adjMode === 'SET'
                              ? 'bg-zinc-900 text-white border-zinc-950 shadow-xs'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                          }`}
                        >
                          Set Stok Baru
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdjMode('ADD');
                            setAdjValue(1);
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                            adjMode === 'ADD'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                          }`}
                        >
                          Tambah (+)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdjMode('SUBTRACT');
                            setAdjValue(1);
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                            adjMode === 'SUBTRACT'
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                          }`}
                        >
                          Kurangi (−)
                        </button>
                      </div>
                    </div>

                    {/* Numeric Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-700">
                        {adjMode === 'SET'
                          ? `Stok Fisik Hasil Opname (${selectedProduct.unitSymbol || 'unit'}) *`
                          : adjMode === 'ADD'
                          ? `Jumlah Tambahan Fisik (${selectedProduct.unitSymbol || 'unit'}) *`
                          : `Jumlah Pengurangan Fisik (${selectedProduct.unitSymbol || 'unit'}) *`}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step={selectedProduct.allowDecimal ? '0.01' : '1'}
                        value={adjValue}
                        onChange={(e) => setAdjValue(e.target.value)}
                        required
                        className="w-full p-3 rounded-xl border border-zinc-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                      />
                    </div>

                    {/* Preset Reasons */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-700">
                        Pilih Cepat Alasan Penyesuaian:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {ADJUSTMENT_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAdjReason(preset)}
                            className={`text-[10px] text-left px-2.5 py-1 rounded-lg border transition-all ${
                              adjReason === preset
                                ? 'bg-zinc-900 text-white border-zinc-950 font-semibold'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Reason Textarea */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-700">
                        Detail Alasan Rekam Audit Gudang *
                      </label>
                      <textarea
                        rows={2}
                        value={adjReason}
                        onChange={(e) => setAdjReason(e.target.value)}
                        required
                        placeholder="Wajib diisi (contoh: Koreksi selisih potongan rol setelah stock opname akhir pekan)..."
                        className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 resize-none"
                      />
                    </div>

                    {/* Live Adjustment Impact Preview */}
                    {liveAdjImpact && (
                      <div
                        className={`p-4 rounded-2xl border text-xs space-y-2 ${
                          liveAdjImpact.error
                            ? 'bg-rose-50 border-rose-300 text-rose-900'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-zinc-600" />
                            <span>Preview Dampak Penyesuaian:</span>
                          </span>
                          <span
                            className={`font-mono font-black ${
                              liveAdjImpact.diff > 0
                                ? 'text-emerald-600'
                                : liveAdjImpact.diff < 0
                                ? 'text-rose-600'
                                : 'text-zinc-500'
                            }`}
                          >
                            Selisih: {liveAdjImpact.diff > 0 ? `+${liveAdjImpact.diff}` : liveAdjImpact.diff}{' '}
                            {selectedProduct.unitSymbol}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-xs">
                          <div>
                            <p className="text-[10px] text-zinc-500 font-sans">Stok Fisik Baru</p>
                            <p className="font-bold text-sm text-zinc-900">
                              {formatQty(liveAdjImpact.currentPhysical, selectedProduct.allowDecimal)} →{' '}
                              <strong className="text-zinc-950 font-black">
                                {formatQty(liveAdjImpact.targetPhysical, selectedProduct.allowDecimal)}{' '}
                                {selectedProduct.unitSymbol}
                              </strong>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-500 font-sans">Stok Siap Jual Baru</p>
                            <p
                              className={`font-bold text-sm ${
                                liveAdjImpact.newAvailable <= 0
                                  ? 'text-rose-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {formatQty(liveAdjImpact.newAvailable, selectedProduct.allowDecimal)}{' '}
                              {selectedProduct.unitSymbol}
                            </p>
                          </div>
                        </div>

                        {liveAdjImpact.error && (
                          <div className="pt-2 text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{liveAdjImpact.error}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </form>
                )}

                {/* Drawer Error Banner */}
                {drawerError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-rose-900">Gagal Memproses Transaksi</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">{drawerError}</p>
                    </div>
                    <button
                      onClick={() => setDrawerError(null)}
                      className="text-rose-400 hover:text-rose-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Drawer Sticky Footer */}
              <div className="p-4 border-t border-zinc-200 bg-white flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Batal
                </button>

                {drawerType === 'STOCK_IN' ? (
                  <button
                    type="submit"
                    form="stock-in-form"
                    disabled={isSubmitting || !liveStockInImpact?.isValid}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 ml-auto"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 text-amber-400" />
                    )}
                    <span>Simpan Stok Masuk</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="adj-form"
                    disabled={isSubmitting || !liveAdjImpact?.isValid}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 ml-auto"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 text-amber-400" />
                    )}
                    <span>Simpan Penyesuaian</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
