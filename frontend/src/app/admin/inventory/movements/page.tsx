'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useAdminLayout } from '@/components/admin/AdminShell';
import {
  getStockMovements,
  stockIn,
  stockAdjustment,
} from '../../../../lib/admin-api';
import {
  adminGetProducts,
  resolveProductImageUrl,
} from '../../../../lib/catalog-api';
import { ApiException } from '../../../../lib/api';
import type {
  StockMovementResponse,
  StockMovementType,
  ProductResponse,
} from '../../../../types/api';
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
  Download,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';

// ─── Formatters ──────────────────────────────────────────────────────────────
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

function formatIndonesianFullDate(date: Date = new Date()): string {
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
  { label: string; badgeClass: string; desc: string; icon: 'in' | 'out' | 'reserve' | 'neutral' }
> = {
  STOCK_IN: {
    label: 'Stok Masuk',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Penambahan stok fisik dari supplier / kulakan',
    icon: 'in',
  },
  SALE: {
    label: 'Penjualan Offline',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Pengurangan langsung kasir toko fisik (POS)',
    icon: 'out',
  },
  FULFILLMENT: {
    label: 'Penjualan Online',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Pemenuhan pesanan online lunas terverifikasi',
    icon: 'out',
  },
  RESERVE: {
    label: 'Reservasi Pesanan',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    desc: 'Alokasi stok pesanan pelanggan (stok fisik tetap)',
    icon: 'reserve',
  },
  UNRESERVE: {
    label: 'Pelepasan Reservasi',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    desc: 'Pengembalian kuota pesanan batal / kedaluwarsa',
    icon: 'neutral',
  },
  ADJUSTMENT: {
    label: 'Penyesuaian Stok',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    desc: 'Koreksi stok opname riil gudang',
    icon: 'neutral',
  },
  RETURN: {
    label: 'Retur / Pengembalian',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    desc: 'Pengembalian barang retur pembeli ke stok fisik',
    icon: 'in',
  },
};

// ─── Signed Delta Calculation ────────────────────────────────────────────────
function computeSignedDelta(m: StockMovementResponse) {
  const before = m.stockBefore !== undefined && m.stockBefore !== null ? Number(m.stockBefore) : null;
  const after = m.stockAfter !== undefined && m.stockAfter !== null ? Number(m.stockAfter) : null;
  const qty = Number(m.quantity || 0);

  if (m.movementType === 'STOCK_IN' || m.movementType === 'RETURN') {
    return {
      text: `+${qty}`,
      colorClass: 'text-emerald-600 font-bold',
      isPhysicalChange: true,
      direction: 'IN',
    };
  }

  if (m.movementType === 'SALE' || m.movementType === 'FULFILLMENT') {
    return {
      text: `-${qty}`,
      colorClass: 'text-rose-600 font-bold',
      isPhysicalChange: true,
      direction: 'OUT',
    };
  }

  if (m.movementType === 'ADJUSTMENT') {
    if (before !== null && after !== null) {
      const diff = after - before;
      if (diff > 0) {
        return {
          text: `+${diff}`,
          colorClass: 'text-emerald-600 font-bold',
          isPhysicalChange: true,
          direction: 'IN',
        };
      }
      if (diff < 0) {
        return {
          text: `${diff}`,
          colorClass: 'text-rose-600 font-bold',
          isPhysicalChange: true,
          direction: 'OUT',
        };
      }
      return {
        text: '±0',
        colorClass: 'text-zinc-500 font-bold',
        isPhysicalChange: false,
        direction: 'NONE',
      };
    }
    return {
      text: `±${qty}`,
      colorClass: 'text-violet-600 font-bold',
      isPhysicalChange: true,
      direction: 'NEUTRAL',
    };
  }

  if (m.movementType === 'RESERVE') {
    return {
      text: `0 Fisik (+${qty} Res)`,
      colorClass: 'text-amber-700 font-semibold',
      isPhysicalChange: false,
      direction: 'RESERVE',
    };
  }

  if (m.movementType === 'UNRESERVE') {
    return {
      text: `0 Fisik (-${qty} Res)`,
      colorClass: 'text-teal-700 font-semibold',
      isPhysicalChange: false,
      direction: 'UNRESERVE',
    };
  }

  if (before !== null && after !== null) {
    const diff = after - before;
    if (diff > 0) return { text: `+${diff}`, colorClass: 'text-emerald-600 font-bold', isPhysicalChange: true, direction: 'IN' };
    if (diff < 0) return { text: `${diff}`, colorClass: 'text-rose-600 font-bold', isPhysicalChange: true, direction: 'OUT' };
  }

  return { text: `${qty}`, colorClass: 'text-zinc-700 font-semibold', isPhysicalChange: false, direction: 'NONE' };
}

// Preset Adjustment Reasons
const ADJUSTMENT_PRESETS = [
  'Hasil Stock Opname Fisik Berkala',
  'Koreksi Selisih Potongan Meteran',
  'Barang Cacat / Rusak / Basah',
  'Retur dari Supplier Diterima',
  'Penyesuaian Tutup Buku Bulanan',
];

export default function AdminStockMovementsPage() {
  const router = useRouter();
  const { user, isAdmin, logout, loading: authLoading } = useAuth();

  // ─── Data States ───────────────────────────────────────────────────────────
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState(true);

  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedMovementType, setSelectedMovementType] = useState<string>('ALL');

  // Drawers
  const [drawerType, setDrawerType] = useState<'NONE' | 'STOCK_IN' | 'ADJUSTMENT'>('NONE');
  const [drawerProduct, setDrawerProduct] = useState<ProductResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Stock In Form States
  const [stockInQty, setStockInQty] = useState<number | string>(10);
  const [stockInNotes, setStockInNotes] = useState('');

  // Adjustment Form States
  const [adjMode, setAdjMode] = useState<'SET' | 'ADD' | 'SUBTRACT'>('SET');
  const [adjValue, setAdjValue] = useState<number | string>(0);
  const [adjReason, setAdjReason] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mobile Sidebar
  const { toggleMobile } = useAdminLayout();

  // ─── Auth Guard ────────────────────────────────────────────────────────────
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
  const fetchMovementsData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [movRes, prodRes] = await Promise.allSettled([
          getStockMovements({
            page,
            size: 25,
            productId: selectedProductId !== 'ALL' ? selectedProductId : undefined,
          }),
          adminGetProducts({ size: 100 }),
        ]);

        if (movRes.status === 'fulfilled') {
          setMovements(movRes.value.content || []);
          setTotalPages(movRes.value.totalPages || 1);
          setTotalElements(movRes.value.totalElements || 0);
          setDbConnected(true);
        } else {
          setDbConnected(false);
          throw movRes.reason;
        }

        if (prodRes.status === 'fulfilled') {
          setProducts(prodRes.value.content || []);
        }
      } catch (err) {
        setDbConnected(false);
        setError(err instanceof ApiException ? err.message : 'Gagal memuat log mutasi stok dari database.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, selectedProductId]
  );

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchMovementsData();
    }
  }, [authLoading, isAdmin, fetchMovementsData]);

  // ─── KPI Calculations ──────────────────────────────────────────────────────
  const kpiStats = useMemo(() => {
    let inflow = 0;
    let outflow = 0;

    movements.forEach((m) => {
      const qty = Number(m.quantity || 0);
      const before = m.stockBefore !== undefined && m.stockBefore !== null ? Number(m.stockBefore) : null;
      const after = m.stockAfter !== undefined && m.stockAfter !== null ? Number(m.stockAfter) : null;

      if (m.movementType === 'STOCK_IN' || m.movementType === 'RETURN') {
        inflow += qty;
      } else if (m.movementType === 'SALE' || m.movementType === 'FULFILLMENT') {
        outflow += qty;
      } else if (m.movementType === 'ADJUSTMENT' && before !== null && after !== null) {
        const diff = after - before;
        if (diff > 0) inflow += diff;
        else if (diff < 0) outflow += Math.abs(diff);
      }
    });

    const totalReservedStock = products.reduce(
      (sum, p) => sum + Number(p.reservedQuantity || 0),
      0
    );

    return {
      totalLogs: totalElements,
      inflow,
      outflow,
      totalReservedStock,
    };
  }, [movements, totalElements, products]);

  // ─── Filtered Movements ────────────────────────────────────────────────────
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // Movement Type Filter
      if (selectedMovementType !== 'ALL' && m.movementType !== selectedMovementType) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const pName = m.productName?.toLowerCase().includes(q);
        const pCode = m.productCode?.toLowerCase().includes(q);
        const notes = m.notes?.toLowerCase().includes(q);
        const refType = m.referenceType?.toLowerCase().includes(q);
        const actor = m.createdByName?.toLowerCase().includes(q);
        if (!pName && !pCode && !notes && !refType && !actor) return false;
      }

      return true;
    });
  }, [movements, selectedMovementType, searchQuery]);

  // Reset Filters
  const hasActiveFilters = searchQuery.trim() !== '' || selectedProductId !== 'ALL' || selectedMovementType !== 'ALL';
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedProductId('ALL');
    setSelectedMovementType('ALL');
    setPage(0);
  };

  // ─── Drawer Handlers ───────────────────────────────────────────────────────
  const handleOpenStockIn = (product?: ProductResponse) => {
    const target = product || products[0] || null;
    setDrawerProduct(target);
    setStockInQty(target?.allowDecimal ? 10 : 1);
    setStockInNotes('');
    setDrawerError(null);
    setDrawerType('STOCK_IN');
  };

  const handleOpenAdjustment = (product?: ProductResponse) => {
    const target = product || products[0] || null;
    setDrawerProduct(target);
    setAdjMode('SET');
    setAdjValue(target ? Number(target.stockOnHand || 0) : 0);
    setAdjReason('');
    setDrawerError(null);
    setDrawerType('ADJUSTMENT');
  };

  const handleCloseDrawer = () => {
    setDrawerType('NONE');
    setDrawerProduct(null);
    setDrawerError(null);
  };

  // Live impact calculation
  const liveStockInImpact = useMemo(() => {
    if (!drawerProduct) return null;
    const currentPhysical = Number(drawerProduct.stockOnHand || 0);
    const currentReserved = Number(drawerProduct.reservedQuantity || 0);
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
  }, [drawerProduct, stockInQty]);

  const liveAdjImpact = useMemo(() => {
    if (!drawerProduct) return null;
    const currentPhysical = Number(drawerProduct.stockOnHand || 0);
    const currentReserved = Number(drawerProduct.reservedQuantity || 0);
    const val = Number(adjValue) || 0;

    let targetPhysical = currentPhysical;
    if (adjMode === 'SET') targetPhysical = val;
    else if (adjMode === 'ADD') targetPhysical = currentPhysical + val;
    else if (adjMode === 'SUBTRACT') targetPhysical = currentPhysical - val;

    const diff = targetPhysical - currentPhysical;
    const newAvailable = targetPhysical - currentReserved;

    let error: string | null = null;
    if (targetPhysical < 0) {
      error = 'Stok fisik baru tidak boleh bernilai negatif.';
    } else if (targetPhysical < currentReserved) {
      error = `Stok fisik baru (${targetPhysical} ${drawerProduct.unitSymbol || ''}) tidak boleh kurang dari kuota pesanan yang direservasi (${currentReserved} ${drawerProduct.unitSymbol || ''}).`;
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
  }, [drawerProduct, adjMode, adjValue, adjReason]);

  // Submit Stock In
  const handleSubmitStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerProduct) return;

    const qty = Number(stockInQty);
    if (isNaN(qty) || qty <= 0) {
      setDrawerError('Jumlah barang masuk harus lebih besar dari 0.');
      return;
    }

    if (!drawerProduct.allowDecimal && !Number.isInteger(qty)) {
      setDrawerError(`Produk ${drawerProduct.name} hanya menerima bilangan bulat.`);
      return;
    }

    setIsSubmitting(true);
    setDrawerError(null);
    try {
      await stockIn({
        productId: drawerProduct.id,
        quantity: qty,
        notes: stockInNotes.trim() || `Restok gudang untuk ${drawerProduct.name}`,
      });

      setToastMsg({
        type: 'success',
        text: `Stok masuk ${qty} ${drawerProduct.unitSymbol || ''} untuk ${drawerProduct.name} berhasil dicatat di PostgreSQL!`,
      });

      handleCloseDrawer();
      await fetchMovementsData(true);
    } catch (err) {
      const errMsg = err instanceof ApiException ? err.message : 'Gagal mencatat stok masuk ke backend.';
      setDrawerError(errMsg);
      setToastMsg({ type: 'error', text: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Adjustment
  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerProduct || !liveAdjImpact) return;

    if (liveAdjImpact.error) {
      setDrawerError(liveAdjImpact.error);
      return;
    }

    if (!adjReason.trim()) {
      setDrawerError('Alasan penyesuaian stok wajib diisi untuk rekam audit gudang.');
      return;
    }

    setIsSubmitting(true);
    setDrawerError(null);
    try {
      await stockAdjustment({
        productId: drawerProduct.id,
        newActualStock: liveAdjImpact.targetPhysical,
        notes: adjReason.trim(),
      });

      setToastMsg({
        type: 'success',
        text: `Stok fisik ${drawerProduct.name} berhasil disesuaikan menjadi ${liveAdjImpact.targetPhysical} ${drawerProduct.unitSymbol || ''}!`,
      });

      handleCloseDrawer();
      await fetchMovementsData(true);
    } catch (err) {
      const errMsg = err instanceof ApiException ? err.message : 'Gagal melakukan penyesuaian stok.';
      setDrawerError(errMsg);
      setToastMsg({ type: 'error', text: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Export CSV Audit Ledger ───────────────────────────────────────────────
  const handleExportCsv = () => {
    if (filteredMovements.length === 0) {
      setToastMsg({ type: 'error', text: 'Tidak ada data mutasi untuk diekspor.' });
      return;
    }

    const headers = [
      'No',
      'ID Mutasi',
      'Waktu',
      'Kode Produk',
      'Nama Produk',
      'Jenis Mutasi',
      'Jumlah',
      'Stok Sebelum',
      'Stok Sesudah',
      'Keterangan',
      'Aktor',
      'Tipe Referensi',
    ];

    const rows = filteredMovements.map((m, idx) => [
      idx + 1,
      `"${m.id}"`,
      `"${formatDate(m.createdAt)}"`,
      `"${m.productCode || ''}"`,
      `"${(m.productName || '').replace(/"/g, '""')}"`,
      `"${m.movementType}"`,
      m.quantity,
      m.stockBefore ?? '',
      m.stockAfter ?? '',
      `"${(m.notes || '').replace(/"/g, '""')}"`,
      `"${(m.createdByName || 'Sistem').replace(/"/g, '""')}"`,
      `"${m.referenceType || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `enstemstore-buku-besar-mutasi-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMsg({
      type: 'success',
      text: `Buku besar audit mutasi (${filteredMovements.length} baris) berhasil diekspor ke CSV!`,
    });
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
                <Link href="/admin/inventory" className="hover:text-zinc-900 transition-colors">
                  Inventaris
                </Link>
                <span>/</span>
                <span className="text-zinc-900 font-semibold">Riwayat Pergerakan Stok</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Link
                  href="/admin/inventory"
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Ringkasan Stok</span>
                </Link>
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
            {/* Real Dynamic Date */}
            <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{formatIndonesianFullDate()}</span>
            </span>

            {/* Refresh Button */}
            <button
              onClick={() => fetchMovementsData(true)}
              disabled={refreshing}
              title="Muat Ulang Log Mutasi"
              className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-zinc-900' : ''}`} />
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              title="Ekspor Buku Besar ke Berkas CSV"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>

            {/* Penyesuaian Stok Outline Button */}
            <button
              onClick={() => handleOpenAdjustment()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold transition-all shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-600" />
              <span className="hidden sm:inline">Penyesuaian Stok</span>
            </button>

            {/* + Barang Masuk Primary Dark Button */}
            <button
              onClick={() => handleOpenStockIn()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Barang Masuk</span>
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
          {/* Page Heading (Clean SaaS Headline) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
                Riwayat Pergerakan Stok
              </h1>
              <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
                Buku besar audit seluruh mutasi barang masuk, reservasi pesanan online, penjualan kasir toko, dan penyesuaian stok fisik secara transaksional.
              </p>
            </div>
          </div>

          {/* Global Fetch Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
              <button
                onClick={() => fetchMovementsData(true)}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TIER 1: LIVE KPI CARDS COMPUTED FROM REAL DATABASE DATA          */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Log Mutasi */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Total Log Mutasi
                </span>
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <History className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-zinc-950">{kpiStats.totalLogs}</p>
                <span className="text-xs text-zinc-500 font-medium">Catatan Audit</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Tercatat permanen di PostgreSQL
              </p>
            </div>

            {/* Card 2: Total Inflow (Masuk) */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Total Inflow (Masuk)
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-emerald-600">
                  +{formatQty(kpiStats.inflow, true)}
                </p>
                <span className="text-xs text-emerald-700 font-medium">Unit</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 font-medium">
                Penerimaan supplier, retur & opname (+)
              </p>
            </div>

            {/* Card 3: Total Outflow (Keluar) */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Total Outflow (Keluar)
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-rose-600">
                  -{formatQty(kpiStats.outflow, true)}
                </p>
                <span className="text-xs text-rose-700 font-medium">Unit</span>
              </div>
              <p className="text-[11px] text-rose-800/80 font-medium">
                Penjualan online lunas & kasir toko
              </p>
            </div>

            {/* Card 4: Total Stok Direservasi */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Reservasi Aktif
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-amber-700">
                  {formatQty(kpiStats.totalReservedStock, true)}
                </p>
                <span className="text-xs text-amber-700 font-medium">Unit Terkunci</span>
              </div>
              <p className="text-[11px] text-amber-800/80 font-medium">
                Alokasi pesanan belum diproses/kirim
              </p>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TIER 2: MULTI-CRITERIA AUDIT FILTER TOOLBAR                       */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama produk, SKU, no order EST-..., aktor, atau catatan..."
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

              {/* Product Filter Dropdown */}
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setPage(0);
                }}
                className="px-3 py-2 rounded-xl border border-zinc-200 text-xs bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 font-medium max-w-xs"
              >
                <option value="ALL">Semua Produk Gudang</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>

              {/* Movement Type Filter Dropdown */}
              <select
                value={selectedMovementType}
                onChange={(e) => {
                  setSelectedMovementType(e.target.value);
                  setPage(0);
                }}
                className="px-3 py-2 rounded-xl border border-zinc-200 text-xs bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 font-medium"
              >
                <option value="ALL">Semua Jenis Mutasi (7 Tipe)</option>
                <option value="STOCK_IN">Stok Masuk (Restock / Kulakan)</option>
                <option value="RESERVE">Reservasi Pesanan Online</option>
                <option value="UNRESERVE">Pelepasan Reservasi (Batal)</option>
                <option value="FULFILLMENT">Penjualan Online (Lunas)</option>
                <option value="SALE">Penjualan Offline (Kasir POS)</option>
                <option value="ADJUSTMENT">Penyesuaian Stok (Stock Opname)</option>
                <option value="RETURN">Retur / Pengembalian</option>
              </select>

              {/* Reset Filter Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  title="Reset Filter"
                  className="px-3 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TIER 3: STRUCTURED AUDIT LEDGER TABLE                             */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="py-4 px-5">Tanggal & Waktu</th>
                    <th className="py-4 px-5">Produk & SKU</th>
                    <th className="py-4 px-4">Jenis Pergerakan</th>
                    <th className="py-4 px-4 text-right">Perubahan Stok</th>
                    <th className="py-4 px-5">Keterangan / Referensi</th>
                    <th className="py-4 px-5 text-right">Aktor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                        <p className="font-medium text-xs">Memuat buku besar audit mutasi stok...</p>
                      </td>
                    </tr>
                  ) : filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-400">
                        <History className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                        <p className="font-semibold text-zinc-700 text-sm">Tidak ada catatan mutasi yang cocok</p>
                        <p className="text-zinc-400 text-xs mt-1">Coba ubah kata kunci atau pilih jenis mutasi lain.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const typeCfg =
                        MOVEMENT_TYPE_CONFIG[m.movementType] || {
                          label: m.movementType,
                          badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                          desc: '',
                          icon: 'neutral',
                        };
                      const delta = computeSignedDelta(m);

                      // Detect order number link pattern (e.g. EST-20261124-0001)
                      const orderMatch = (m.notes || '').match(/(EST-[\w-]+)/i);

                      return (
                        <tr key={m.id} className="hover:bg-zinc-50/70 transition-colors">
                          {/* Tanggal & Waktu */}
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <p className="font-semibold text-zinc-900">{formatDate(m.createdAt)}</p>
                            <p className="font-mono text-[10px] text-zinc-400 mt-0.5">#{m.id.slice(0, 8)}</p>
                          </td>

                          {/* Produk & SKU */}
                          <td className="py-3.5 px-5">
                            <p className="font-bold text-zinc-900">{m.productName}</p>
                            <span className="font-mono text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              {m.productCode}
                            </span>
                          </td>

                          {/* Jenis Pergerakan */}
                          <td className="py-3.5 px-4">
                            <span
                              title={typeCfg.desc}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${typeCfg.badgeClass}`}
                            >
                              {typeCfg.icon === 'in' ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : typeCfg.icon === 'out' ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <Activity className="w-3 h-3" />
                              )}
                              <span>{typeCfg.label}</span>
                            </span>
                          </td>

                          {/* Perubahan Stok */}
                          <td className="py-3.5 px-4 text-right">
                            <p className={`text-sm font-black ${delta.colorClass}`}>
                              {delta.text}
                            </p>
                            {m.stockBefore !== undefined && m.stockAfter !== undefined && (
                              <p className="font-mono text-[10px] text-zinc-500 mt-0.5">
                                Fisik: {m.stockBefore} → {m.stockAfter}
                              </p>
                            )}
                          </td>

                          {/* Keterangan / Referensi */}
                          <td className="py-3.5 px-5">
                            <div className="space-y-1 max-w-md">
                              {orderMatch && (
                                <Link
                                  href="/admin/orders"
                                  className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition-colors"
                                  title="Buka detail di Manajemen Pesanan"
                                >
                                  <span>{orderMatch[1]}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              )}
                              <p className="text-zinc-700 font-medium text-xs leading-relaxed">
                                {m.notes || '-'}
                              </p>
                              {m.referenceType && (
                                <span className="inline-block text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.2 rounded">
                                  Tipe: {m.referenceType}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Aktor */}
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-700 font-bold text-[10px] flex items-center justify-center">
                                {m.createdByName?.[0]?.toUpperCase() || 'S'}
                              </div>
                              <span className="font-semibold text-zinc-800 text-xs">
                                {m.createdByName || 'Sistem Enstein'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 bg-zinc-50/70 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
              <p>
                Menampilkan <strong>{filteredMovements.length}</strong> dari <strong>{totalElements}</strong> catatan mutasi stok di database
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold disabled:opacity-40 transition-colors"
                  >
                    ← Sebelumnya
                  </button>
                  <span className="font-mono px-2">
                    Hal. {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold disabled:opacity-40 transition-colors"
                  >
                    Berikutnya →
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TIER 4: SLIDE-OVER DRAWER (STOK MASUK & PENYESUAIAN STOK)           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {drawerType !== 'NONE' && drawerProduct && (
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
                    value={drawerProduct.id}
                    onChange={(e) => {
                      const found = products.find((p) => p.id === e.target.value);
                      if (found) {
                        setDrawerProduct(found);
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

                {/* Selected Product Summary Card */}
                <div className="p-4 rounded-2xl bg-zinc-950 text-white space-y-3 shadow-md">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveProductImageUrl(drawerProduct.image)}
                      alt={drawerProduct.name}
                      className="w-12 h-12 rounded-xl object-cover bg-zinc-800 border border-zinc-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-zinc-100 truncate">{drawerProduct.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-amber-400">{drawerProduct.code}</span>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {drawerProduct.categoryName || 'Material Jas Hujan'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800 text-center">
                    <div className="p-2 rounded-xl bg-zinc-900/80">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Stok Fisik</p>
                      <p className="text-base font-black text-white mt-0.5">
                        {formatQty(drawerProduct.stockOnHand, drawerProduct.allowDecimal)}{' '}
                        <span className="text-xs font-normal text-zinc-400">{drawerProduct.unitSymbol}</span>
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-900/80">
                      <p className="text-[10px] font-bold text-amber-400 uppercase">Reservasi</p>
                      <p className="text-base font-black text-amber-400 mt-0.5">
                        {formatQty(drawerProduct.reservedQuantity, drawerProduct.allowDecimal)}{' '}
                        <span className="text-xs font-normal text-zinc-400">{drawerProduct.unitSymbol}</span>
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-900/80">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase">Tersedia</p>
                      <p className="text-base font-black text-emerald-400 mt-0.5">
                        {formatQty(
                          Math.max(
                            0,
                            Number(drawerProduct.stockOnHand || 0) - Number(drawerProduct.reservedQuantity || 0)
                          ),
                          drawerProduct.allowDecimal
                        )}{' '}
                        <span className="text-xs font-normal text-zinc-400">{drawerProduct.unitSymbol}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* ─── FORM: STOK MASUK ─── */}
                {drawerType === 'STOCK_IN' && (
                  <form onSubmit={handleSubmitStockIn} id="stock-in-form-ledger" className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-700">
                          Jumlah Barang Masuk ({drawerProduct.unitSymbol || 'unit'}) *
                        </label>
                        {drawerProduct.allowDecimal ? (
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
                        min={drawerProduct.allowDecimal ? '0.01' : '1'}
                        step={drawerProduct.allowDecimal ? '0.01' : '1'}
                        value={stockInQty}
                        onChange={(e) => setStockInQty(e.target.value)}
                        required
                        placeholder={`Masukkan kuantitas dalam ${drawerProduct.unitSymbol || 'unit'}...`}
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
                              {formatQty(liveStockInImpact.currentPhysical, drawerProduct.allowDecimal)} →{' '}
                              <span className="text-emerald-700 font-black">
                                {formatQty(liveStockInImpact.newPhysical, drawerProduct.allowDecimal)}{' '}
                                {drawerProduct.unitSymbol}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-500 font-sans">Stok Tersedia Baru</p>
                            <p className="font-bold text-sm text-emerald-700">
                              {formatQty(liveStockInImpact.newAvailable, drawerProduct.allowDecimal)}{' '}
                              {drawerProduct.unitSymbol}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                )}

                {/* ─── FORM: PENYESUAIAN STOK (OPNAME) ─── */}
                {drawerType === 'ADJUSTMENT' && (
                  <form onSubmit={handleSubmitAdjustment} id="adj-form-ledger" className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-700">
                        Metode Penyesuaian *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjMode('SET');
                            setAdjValue(Number(drawerProduct.stockOnHand || 0));
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

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-700">
                        {adjMode === 'SET'
                          ? `Stok Fisik Hasil Opname (${drawerProduct.unitSymbol || 'unit'}) *`
                          : adjMode === 'ADD'
                          ? `Jumlah Tambahan Fisik (${drawerProduct.unitSymbol || 'unit'}) *`
                          : `Jumlah Pengurangan Fisik (${drawerProduct.unitSymbol || 'unit'}) *`}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step={drawerProduct.allowDecimal ? '0.01' : '1'}
                        value={adjValue}
                        onChange={(e) => setAdjValue(e.target.value)}
                        required
                        className="w-full p-3 rounded-xl border border-zinc-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                      />
                    </div>

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

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-700">
                        Detail Alasan Rekam Audit Gudang *
                      </label>
                      <textarea
                        rows={2}
                        value={adjReason}
                        onChange={(e) => setAdjReason(e.target.value)}
                        required
                        placeholder="Wajib diisi untuk rekam audit riwayat mutasi..."
                        className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 resize-none"
                      />
                    </div>

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
                            {drawerProduct.unitSymbol}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-xs">
                          <div>
                            <p className="text-[10px] text-zinc-500 font-sans">Stok Fisik Baru</p>
                            <p className="font-bold text-sm text-zinc-900">
                              {formatQty(liveAdjImpact.currentPhysical, drawerProduct.allowDecimal)} →{' '}
                              <strong className="text-zinc-950 font-black">
                                {formatQty(liveAdjImpact.targetPhysical, drawerProduct.allowDecimal)}{' '}
                                {drawerProduct.unitSymbol}
                              </strong>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-500 font-sans">Stok Siap Jual Baru</p>
                            <p
                              className={`font-bold text-sm ${
                                liveAdjImpact.newAvailable <= 0 ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              {formatQty(liveAdjImpact.newAvailable, drawerProduct.allowDecimal)}{' '}
                              {drawerProduct.unitSymbol}
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
                    <button onClick={() => setDrawerError(null)} className="text-rose-400 hover:text-rose-600 p-0.5">
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
                    form="stock-in-form-ledger"
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
                    form="adj-form-ledger"
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
