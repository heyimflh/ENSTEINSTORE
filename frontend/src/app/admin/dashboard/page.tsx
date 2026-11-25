'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdminLayout } from '@/components/admin/AdminShell';
import {
  getDashboard,
  fetchDailySalesReport,
  fetchTopProductsReport,
  type DailySalesRecord,
  type TopProductRecord,
} from '../../../lib/admin-api';
import { adminGetProducts } from '../../../lib/catalog-api';
import { adminGetOrders, adminGetPayments } from '../../../lib/orders-api';
import { ApiException } from '../../../lib/api';
import type {
  DashboardSummaryResponse,
  ProductResponse,
  OrderSummaryResponse,
  OrderDetailResponse,
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
  TrendingUp,
  AlertTriangle,
  LogOut,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  Activity,
  User,
  Plus,
  PackagePlus,
  FileSpreadsheet,
  Flame,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

function formatIDR(n: number = 0) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateShort(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function formatDateMedium(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatExecutiveHeaderDate(date: Date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING_PAYMENT: {
    label: 'Menunggu Bayar',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200/70',
  },
  PAID: {
    label: 'Dibayar',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200/70',
  },
  PROCESSING: {
    label: 'Diproses',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200/70',
  },
  READY: {
    label: 'Siap',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200/70',
  },
  READY_FOR_PICKUP: {
    label: 'Siap Diambil',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200/70',
  },
  SHIPPED: {
    label: 'Dikirim',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200/70',
  },
  COMPLETED: {
    label: 'Selesai',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200/70',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200/70',
  },
};

type PeriodOption = '7D' | '30D' | 'ALL';

interface TrendPoint {
  dateKey: string;
  dateFormatted: string;
  fullDate: string;
  revenue: number;
  orders: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, logout, loading: authLoading } = useAuth();

  // Primary Data State
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [dailySales, setDailySales] = useState<DailySalesRecord[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductRecord[]>([]);
  const [criticalProducts, setCriticalProducts] = useState<ProductResponse[]>([]);
  const [allRecentOrders, setAllRecentOrders] = useState<(OrderSummaryResponse | OrderDetailResponse)[]>([]);
  const [pendingVerificationCount, setPendingVerificationCount] = useState<number>(0);

  // UI Interactive Controls
  const [period, setPeriod] = useState<PeriodOption>('7D');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'orders'>('revenue');
  const [activeDonutTab, setActiveDonutTab] = useState<'stock' | 'channel'>('stock');

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toggleMobile } = useAdminLayout();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute Start & End Date for Selected Period
  const dateRange = useMemo(() => {
    const end = new Date();
    const endDate = end.toISOString().split('T')[0];
    const start = new Date();
    if (period === '7D') {
      start.setDate(end.getDate() - 6);
    } else if (period === '30D') {
      start.setDate(end.getDate() - 29);
    } else {
      start.setDate(end.getDate() - 90);
    }
    const startDate = start.toISOString().split('T')[0];
    return { startDate, endDate };
  }, [period]);

  // Parallel Live Data Fetching
  const fetchAllDashboardData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [
          dashboardResult,
          dailySalesResult,
          topProductsResult,
          productsResult,
          paymentsResult,
          ordersResult,
        ] = await Promise.allSettled([
          getDashboard(),
          fetchDailySalesReport(dateRange.startDate, dateRange.endDate),
          fetchTopProductsReport(dateRange.startDate, dateRange.endDate, 5),
          adminGetProducts({ size: 100 }),
          adminGetPayments({ status: 'WAITING_VERIFICATION', size: 1 }),
          adminGetOrders({ page: 0, size: 50 }),
        ]);

        // 1. Primary Dashboard Summary
        if (dashboardResult.status === 'fulfilled') {
          setData(dashboardResult.value);
        } else {
          console.error('Failed to load dashboard summary:', dashboardResult.reason);
        }

        // 2. Daily Sales Trend
        if (dailySalesResult.status === 'fulfilled') {
          setDailySales(dailySalesResult.value);
        } else {
          console.error('Failed to load daily sales:', dailySalesResult.reason);
          setDailySales([]);
        }

        // 3. Top Products
        let resolvedTopProducts: TopProductRecord[] = [];
        if (topProductsResult.status === 'fulfilled' && topProductsResult.value.length > 0) {
          resolvedTopProducts = topProductsResult.value;
        }

        // 4. Products for Critical Stock & Fallback Top Products
        if (productsResult.status === 'fulfilled') {
          const prods = productsResult.value.content || [];
          // Filter critical stock: stockOnHand <= 0 (out of stock) or <= minimumStock (low stock)
          const critical = prods.filter(
            (p) =>
              (p.stockOnHand !== undefined ? p.stockOnHand <= 0 : p.stock <= 0) ||
              (p.minimumStock > 0 &&
                (p.stockOnHand !== undefined
                  ? p.stockOnHand <= p.minimumStock
                  : p.stock <= p.minimumStock))
          );
          // Sort so out of stock appears first
          critical.sort((a, b) => (a.stockOnHand ?? a.stock) - (b.stockOnHand ?? b.stock));
          setCriticalProducts(critical);

          // If top products report is empty (e.g. recent sales period), enrich with catalog sales
          if (resolvedTopProducts.length === 0) {
            const catalogTop = [...prods]
              .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
              .slice(0, 4)
              .map((p) => ({
                productCode: p.code,
                productName: p.name,
                categoryName: p.categoryName || 'Material',
                totalSold: p.salesCount || 0,
                unitSymbol: p.unitSymbol || p.unit || 'pcs',
                totalRevenue: (p.salesCount || 0) * (p.price || 0),
              }));
            resolvedTopProducts = catalogTop;
          }
        }
        setTopProducts(resolvedTopProducts);

        // 5. Pending Payments Verification Count
        if (paymentsResult.status === 'fulfilled') {
          setPendingVerificationCount(paymentsResult.value.totalElements || 0);
        }

        // 6. Recent Orders with channel details
        if (ordersResult.status === 'fulfilled') {
          setAllRecentOrders(ordersResult.value.content || []);
        }
      } catch (err) {
        console.error('Unexpected dashboard fetch error:', err);
        if (err instanceof ApiException) setError(err.message);
        else setError('Gagal menyinkronkan data dashboard dengan server.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateRange]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/auth');
      return;
    }
    fetchAllDashboardData();
  }, [isAdmin, authLoading, fetchAllDashboardData, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  // ─── KPI Computed Metrics ──────────────────────────────────────────────────
  const totalRevenue = data?.sales?.totalRevenue ?? 0;
  const totalOrders = data?.sales?.totalOrders ?? 0;
  const paidOrders = data?.sales?.paidOrders ?? 0;
  const pendingOrders =
    data?.sales?.pendingOrders ?? Math.max(0, Number(totalOrders) - Number(paidOrders));
  const averageOrderValue = data?.sales?.averageOrderValue ?? 0;

  const totalProducts = data?.stock?.totalProducts ?? 0;
  const inStockProducts =
    data?.stock?.inStockProducts ??
    Math.max(
      0,
      Number(totalProducts) -
        (Number(data?.stock?.lowStockProducts ?? 0) +
          Number(data?.stock?.outOfStockProducts ?? 0))
    );
  const lowStockProducts = data?.stock?.lowStockProducts ?? 0;
  const outOfStockProducts = data?.stock?.outOfStockProducts ?? 0;
  const totalCriticalStock = Number(lowStockProducts) + Number(outOfStockProducts);

  // ─── Trend Chart Data Assembly ─────────────────────────────────────────────
  const trendChartData = useMemo<TrendPoint[]>(() => {
    const map = new Map<string, { revenue: number; orders: number }>();

    // Seed with report records
    dailySales.forEach((rec) => {
      map.set(rec.date, { revenue: rec.revenue, orders: rec.totalOrders });
    });

    // If report returned 0 records, seed from allRecentOrders within range
    if (dailySales.length === 0 && allRecentOrders.length > 0) {
      allRecentOrders.forEach((o) => {
        if (!o.orderDate) return;
        const d = o.orderDate.split('T')[0];
        const prev = map.get(d) || { revenue: 0, orders: 0 };
        map.set(d, {
          revenue: prev.revenue + (o.orderStatus !== 'CANCELLED' ? o.totalAmount : 0),
          orders: prev.orders + 1,
        });
      });
    }

    // Build continuous date points for 7D / 30D
    const points: TrendPoint[] = [];
    const end = new Date(dateRange.endDate);
    const start = new Date(dateRange.startDate);
    const cur = new Date(start);

    while (cur <= end) {
      const key = cur.toISOString().split('T')[0];
      const entry = map.get(key) || { revenue: 0, orders: 0 };
      points.push({
        dateKey: key,
        dateFormatted: formatDateShort(key),
        fullDate: formatDateMedium(key),
        revenue: entry.revenue,
        orders: entry.orders,
      });
      cur.setDate(cur.getDate() + 1);
    }

    return points;
  }, [dailySales, allRecentOrders, dateRange]);

  const periodAggregates = useMemo(() => {
    let rev = 0;
    let ord = 0;
    trendChartData.forEach((p) => {
      rev += p.revenue;
      ord += p.orders;
    });
    return { revenue: rev, orders: ord };
  }, [trendChartData]);

  // ─── Donut Chart Data ──────────────────────────────────────────────────────
  const donutData = useMemo(() => {
    if (activeDonutTab === 'stock') {
      const inStock = Number(inStockProducts);
      const low = Number(lowStockProducts);
      const out = Number(outOfStockProducts);
      const total = inStock + low + out;

      return [
        {
          name: 'Siap Jual',
          value: inStock,
          color: '#10b981', // emerald-500
          pct: total > 0 ? Math.round((inStock / total) * 100) : 0,
        },
        {
          name: 'Stok Menipis',
          value: low,
          color: '#f59e0b', // amber-500
          pct: total > 0 ? Math.round((low / total) * 100) : 0,
        },
        {
          name: 'Stok Habis',
          value: out,
          color: '#f43f5e', // rose-500
          pct: total > 0 ? Math.round((out / total) * 100) : 0,
        },
      ];
    } else {
      // Channel Order Breakdown
      let online = 0;
      let offline = 0;

      allRecentOrders.forEach((o) => {
        if (o.orderType === 'OFFLINE') offline++;
        else online++;
      });

      // If no orders loaded yet, fallback to proportionate estimate based on totalOrders
      if (online === 0 && offline === 0 && totalOrders > 0) {
        online = Number(totalOrders);
      }
      const total = online + offline;

      return [
        {
          name: 'Online Store',
          value: online,
          color: '#3b82f6', // blue-500
          pct: total > 0 ? Math.round((online / total) * 100) : 0,
        },
        {
          name: 'Penjualan Offline',
          value: offline,
          color: '#8b5cf6', // violet-500
          pct: total > 0 ? Math.round((offline / total) * 100) : 0,
        },
      ];
    }
  }, [
    activeDonutTab,
    inStockProducts,
    lowStockProducts,
    outOfStockProducts,
    allRecentOrders,
    totalOrders,
  ]);

  const donutTotal = useMemo(() => {
    return donutData.reduce((acc, cur) => acc + cur.value, 0);
  }, [donutData]);

  // Combined Recent Orders (resolving walk-in fallback & channel badge)
  const displayRecentOrders = useMemo(() => {
    // Prefer allRecentOrders if populated, otherwise data.recentOrders
    if (allRecentOrders.length > 0) {
      return allRecentOrders.slice(0, 5).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.recipientName || 'Pelanggan Walk-in (Toko)',
        channel: o.orderType === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
        totalAmount: o.totalAmount,
        orderStatus: o.orderStatus,
        orderDate: o.orderDate,
      }));
    }

    if (data?.recentOrders && data.recentOrders.length > 0) {
      return data.recentOrders.slice(0, 5).map((o) => {
        const custName = o.customerName || o.recipientName || 'Pelanggan Walk-in (Toko)';
        const isOffline = o.orderType === 'OFFLINE' || o.orderNumber.includes('OFF') || (!o.customerName && !o.recipientName);
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: custName,
          channel: (isOffline ? 'OFFLINE' : 'ONLINE') as 'OFFLINE' | 'ONLINE',
          totalAmount: o.totalAmount,
          orderStatus: (o.orderStatus || 'PENDING_PAYMENT') as OrderStatus,
          orderDate: o.orderDate,
        };
      });
    }

    return [];
  }, [allRecentOrders, data?.recentOrders]);

  // Max sold unit for proportional progress bar in Top Products
  const maxTopSold = useMemo(() => {
    if (topProducts.length === 0) return 1;
    return Math.max(...topProducts.map((p) => p.totalSold), 1);
  }, [topProducts]);

  // ─── Loading Screen ────────────────────────────────────────────────────────
  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
          Memuat Panel Eksekutif...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Sticky Executive Topbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 h-16 flex items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span>Admin Panel</span>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-600 font-medium">Ringkasan Bisnis</span>
              </div>
              <h1 className="text-sm lg:text-base font-bold text-zinc-900 truncate">
                {formatExecutiveHeaderDate()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Interactive Period Switcher */}
            <div className="hidden sm:flex items-center bg-zinc-100 p-1 rounded-2xl border border-zinc-200/60">
              {(
                [
                  { id: '7D', label: '7 Hari' },
                  { id: '30D', label: '30 Hari' },
                  { id: 'ALL', label: 'Semua Waktu' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPeriod(opt.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    period === opt.id
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchAllDashboardData(true)}
              disabled={loading || refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 px-3 py-2 rounded-2xl transition-colors border border-zinc-200/60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Perbarui</span>
            </button>

            {/* + Penjualan Offline Shortcut Button */}
            <Link
              href="/admin/offline-sales"
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Penjualan Offline</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="p-5 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchAllDashboardData(true)}
                className="underline font-semibold text-rose-700 hover:text-rose-900"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TIER 1: 4 DISTINCT KPI STAT CARDS (ZERO DUPLICATES)          */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* CARD 1: Total Pendapatan */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Total Pendapatan</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">
                  {formatIDR(totalRevenue)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Dari <strong className="text-zinc-800 font-semibold">{paidOrders}</strong>{' '}
                  transaksi lunas (Online & Offline)
                </p>
              </div>
            </div>

            {/* CARD 2: Total Pesanan */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Total Pesanan</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">
                  {totalOrders} <span className="text-sm font-normal text-zinc-500">Pesanan</span>
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                    {paidOrders} Lunas
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full">
                    {pendingOrders} Menunggu
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: Rata-Rata Nilai Order (AOV) */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">
                  Rata-Rata Nilai Order (AOV)
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100/80 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">
                  {formatIDR(averageOrderValue)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Rata-rata belanja per transaksi</p>
              </div>
            </div>

            {/* CARD 4: Kesehatan Stok Gudang */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Kesehatan Stok Gudang</span>
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    totalCriticalStock > 0
                      ? 'bg-rose-50 text-rose-600 border border-rose-100/80'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100/80'
                  }`}
                >
                  {totalCriticalStock > 0 ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Boxes className="w-5 h-5" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">
                  {inStockProducts}{' '}
                  <span className="text-sm font-normal text-zinc-500">
                    / {totalProducts} Siap Jual
                  </span>
                </p>
                <div className="mt-1">
                  {totalCriticalStock > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-full">
                      {outOfStockProducts} Habis • {lowStockProducts} Menipis
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Semua Stok Aman
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TIER 2: INTERACTIVE DATA VISUALIZATIONS                      */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT (lg:col-span-8): Revenue & Order Trend Chart */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between">
              {/* Header with Title & Metric Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Tren Penjualan & Transaksi
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Total{' '}
                    <strong className="text-zinc-800 font-semibold">
                      {formatIDR(periodAggregates.revenue)}
                    </strong>{' '}
                    • {periodAggregates.orders} Transaksi (
                    {period === '7D'
                      ? '7 Hari Terakhir'
                      : period === '30D'
                      ? '30 Hari Terakhir'
                      : 'Semua Data Terdaftar'}
                    )
                  </p>
                </div>

                {/* Metric Selector Toggle */}
                <div className="flex items-center bg-zinc-100 p-1 rounded-2xl border border-zinc-200/60 self-start sm:self-auto">
                  <button
                    onClick={() => setActiveMetric('revenue')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      activeMetric === 'revenue'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    Pendapatan (Rp)
                  </button>
                  <button
                    onClick={() => setActiveMetric('orders')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      activeMetric === 'orders'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    Jumlah Transaksi
                  </button>
                </div>
              </div>

              {/* Chart Render Area */}
              <div className="w-full h-[300px]">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="dateFormatted"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => {
                          if (activeMetric === 'revenue') {
                            if (v >= 1000000) return `${(v / 1000000).toFixed(1)}jt`;
                            if (v >= 1000) return `${Math.round(v / 1000)}rb`;
                            return `${v}`;
                          }
                          return `${v}`;
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload as TrendPoint;
                            return (
                              <div className="bg-zinc-950/95 text-white border border-zinc-800 shadow-xl rounded-2xl p-3.5 text-xs backdrop-blur-md">
                                <p className="font-semibold text-zinc-300 mb-1.5 border-b border-zinc-800 pb-1">
                                  {p.fullDate}
                                </p>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-zinc-400 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                                      Pendapatan:
                                    </span>
                                    <span className="font-bold text-amber-400">
                                      {formatIDR(p.revenue)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-zinc-400 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                                      Transaksi:
                                    </span>
                                    <span className="font-bold text-blue-400">
                                      {p.orders} Pesanan
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={activeMetric === 'revenue' ? 'revenue' : 'orders'}
                        stroke={activeMetric === 'revenue' ? '#d97706' : '#2563eb'}
                        strokeWidth={2.5}
                        fill={
                          activeMetric === 'revenue'
                            ? 'url(#colorRevenue)'
                            : 'url(#colorOrders)'
                        }
                        activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
                  </div>
                )}
              </div>

              {/* Informative footer state note */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Data dihitung otomatis dari transaksi tervalidasi di PostgreSQL.</span>
                <span className="font-medium text-zinc-600">
                  Zona Waktu: Asia/Jakarta (WIB)
                </span>
              </div>
            </div>

            {/* RIGHT (lg:col-span-4): Inventory & Sales Channel Breakdown */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                {/* Header with Segmented Tab */}
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-bold text-zinc-900">Distribusi Rasio</h2>
                  <div className="flex items-center bg-zinc-100 p-0.5 rounded-xl border border-zinc-200/60">
                    <button
                      onClick={() => setActiveDonutTab('stock')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                        activeDonutTab === 'stock'
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      Status Stok
                    </button>
                    <button
                      onClick={() => setActiveDonutTab('channel')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                        activeDonutTab === 'channel'
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      Channel Order
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mb-4">
                  {activeDonutTab === 'stock'
                    ? 'Tingkat ketersediaan seluruh item katalog'
                    : 'Perbandingan asal transaksi yang masuk'}
                </p>

                {/* Donut Chart with Centered Total */}
                <div className="relative w-full h-[210px] flex items-center justify-center">
                  {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={88}
                          paddingAngle={4}
                          strokeWidth={0}
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-zinc-950/95 text-white border border-zinc-800 shadow-xl rounded-xl px-3 py-1.5 text-xs backdrop-blur-md">
                                  <span
                                    className="font-bold mr-1"
                                    style={{ color: d.color }}
                                  >
                                    {d.name}:
                                  </span>
                                  <span>
                                    {d.value}{' '}
                                    {activeDonutTab === 'stock' ? 'item' : 'pesanan'} (
                                    {d.pct}%)
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : null}

                  {/* Centered Readout inside Donut Ring */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                      {donutTotal}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      {activeDonutTab === 'stock' ? 'Total Produk' : 'Total Order'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-2 mt-4 pt-3 border-t border-zinc-100">
                {donutData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs py-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-zinc-600 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-zinc-900">{item.value}</span>
                      <span className="text-zinc-400 font-normal w-9 text-right">
                        ({item.pct}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TIER 3: OPERATIONAL ACTION GRID                              */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT (lg:col-span-7): Pesanan Terbaru */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Pesanan Terbaru</h3>
                    <p className="text-xs text-zinc-400">
                      Transaksi live yang baru saja dicatat oleh sistem
                    </p>
                  </div>
                  <Link
                    href="/admin/orders"
                    className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 group transition-colors"
                  >
                    Kelola Semua Pesanan{' '}
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>

                {displayRecentOrders.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <ShoppingBag className="w-10 h-10 text-zinc-300 mb-2" />
                    <p className="text-sm font-semibold text-zinc-600">
                      Belum ada pesanan yang tercatat
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Pesanan pelanggan online dan offline akan muncul di sini.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {displayRecentOrders.map((order) => {
                      const statusCfg =
                        ORDER_STATUS_CONFIG[order.orderStatus] ||
                        ORDER_STATUS_CONFIG.PENDING_PAYMENT;
                      return (
                        <div
                          key={order.id}
                          className="py-3.5 flex items-center justify-between gap-4 hover:bg-zinc-50/70 rounded-2xl px-2 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900 text-sm">
                                {order.orderNumber}
                              </span>
                              {order.channel === 'OFFLINE' ? (
                                <span className="bg-violet-50 text-violet-700 border border-violet-200/60 font-semibold text-[10px] px-1.5 py-0.5 rounded-md">
                                  Offline
                                </span>
                              ) : (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold text-[10px] px-1.5 py-0.5 rounded-md">
                                  Online
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5 truncate">
                              <span className="font-medium text-zinc-700">
                                {order.customerName}
                              </span>{' '}
                              · {formatDateMedium(order.orderDate)}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-zinc-900">
                              {formatIDR(order.totalAmount)}
                            </p>
                            <span
                              className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                            >
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                <span>Diperbarui secara real-time dari PostgreSQL</span>
                <Link
                  href="/admin/orders"
                  className="font-semibold text-zinc-700 hover:text-zinc-950"
                >
                  Lihat Selengkapnya →
                </Link>
              </div>
            </div>

            {/* RIGHT (lg:col-span-5 space-y-6): Critical Stock Alert & Top Selling Products */}
            <div className="lg:col-span-5 space-y-6">
              {/* CARD A: Peringatan Stok Kritis */}
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900">
                      Peringatan Stok Kritis
                    </h3>
                  </div>
                  <Link
                    href="/admin/inventory"
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-900"
                  >
                    Restok Gudang →
                  </Link>
                </div>

                {criticalProducts.length > 0 ? (
                  <div className="space-y-2.5">
                    {criticalProducts.slice(0, 3).map((prod) => {
                      const stockVal = prod.stockOnHand ?? prod.stock ?? 0;
                      const isZero = stockVal <= 0;
                      return (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-200/60"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-zinc-900 truncate">
                              {prod.name}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono">
                              SKU: {prod.code}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                isZero
                                  ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                                  : 'bg-amber-50 text-amber-700 border-amber-200/80'
                              }`}
                            >
                              {stockVal} {prod.unitSymbol || prod.unit || 'm'} •{' '}
                              {isZero ? 'Habis' : 'Menipis'}
                            </span>
                            <Link
                              href="/admin/inventory"
                              className="text-xs font-bold text-zinc-900 hover:underline"
                            >
                              Restok
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-emerald-900">Semua Stok Aman</p>
                      <p className="text-emerald-700 text-[11px] mt-0.5">
                        Seluruh produk memiliki ketersediaan yang cukup di atas ambang batas
                        minimum.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD B: Produk Terlaris (Top Selling Materials) */}
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">Produk Terlaris</h3>
                      <p className="text-[10px] text-zinc-400">
                        Top material berdasarkan volume penjualan
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/admin/reports"
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-900"
                  >
                    Laporan Lengkap →
                  </Link>
                </div>

                {topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {topProducts.slice(0, 4).map((item, idx) => {
                      const pct = Math.min(
                        100,
                        Math.round((item.totalSold / maxTopSold) * 100)
                      );
                      const isFirst = idx === 0;
                      return (
                        <div key={item.productCode} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                  isFirst
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-zinc-100 text-zinc-600'
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              <span className="font-semibold text-zinc-900 truncate">
                                {item.productName}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-zinc-900">
                                {item.totalSold} {item.unitSymbol}
                              </span>
                              <span className="text-zinc-400 text-[10px] ml-1">
                                ({formatIDR(item.totalRevenue)})
                              </span>
                            </div>
                          </div>
                          {/* Proportional Progress Bar */}
                          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isFirst ? 'bg-amber-500' : 'bg-zinc-700'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-zinc-400">
                    Belum ada data penjualan material pada periode ini.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TIER 4: QUICK OPERATIONAL SHORTCUTS STRIP                    */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Shortcut 1 */}
            <Link
              href="/admin/inventory/movements"
              className="bg-white hover:bg-zinc-50/80 border border-zinc-200/80 rounded-3xl p-5 shadow-xs transition-all hover:shadow-sm hover:-translate-y-0.5 group flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900">Catat Barang Masuk</h4>
                <p className="text-xs text-zinc-500">
                  Kulakan & tambah stok fisik gudang melalui mutasi resmi
                </p>
                <p className="text-xs font-semibold text-zinc-900 pt-1 flex items-center gap-1">
                  Buka Form Mutasi <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
            </Link>

            {/* Shortcut 2 */}
            <Link
              href="/admin/offline-sales"
              className="bg-white hover:bg-zinc-50/80 border border-zinc-200/80 rounded-3xl p-5 shadow-xs transition-all hover:shadow-sm hover:-translate-y-0.5 group flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Store className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900">
                  Transaksi Kasir Offline
                </h4>
                <p className="text-xs text-zinc-500">
                  POS instan untuk memproses pembelian pelanggan langsung di toko
                </p>
                <p className="text-xs font-semibold text-amber-700 pt-1 flex items-center gap-1">
                  Mulai Kasir POS <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
            </Link>

            {/* Shortcut 3 */}
            <Link
              href="/admin/reports"
              className="bg-white hover:bg-zinc-50/80 border border-zinc-200/80 rounded-3xl p-5 shadow-xs transition-all hover:shadow-sm hover:-translate-y-0.5 group flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900">Ekspor Laporan CSV</h4>
                <p className="text-xs text-zinc-500">
                  Unduh rekapitulasi penjualan harian, bulanan, dan stok barang
                </p>
                <p className="text-xs font-semibold text-emerald-700 pt-1 flex items-center gap-1">
                  Lihat Menu Unduhan <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
            </Link>
          </div>
        </main>
      </div>
  );
}
