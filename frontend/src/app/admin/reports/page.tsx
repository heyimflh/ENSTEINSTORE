'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdminLayout } from '@/components/admin/AdminShell';
import {
  getDailySalesData,
  getMonthlySalesData,
  getTopProductsData,
  getStockReportData,
  downloadDailySalesReport,
  downloadMonthlySalesReport,
  downloadTopProductsReport,
  downloadStockReport,
} from '../../../lib/admin-api';
import type {
  DailySalesResponse,
  MonthlySalesResponse,
  TopProductResponse,
  StockReportResponse,
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
  LogOut,
  Menu,
  X,
  TrendingUp,
  Calendar,
  Award,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';

function formatIDR(value: number = 0): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactIDR(value: number = 0): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return `Rp ${value}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

type TabType = 'daily' | 'monthly' | 'top' | 'stock';

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, isAdmin, logout, loading: authLoading } = useAuth();
  const { toggleMobile } = useAdminLayout();
  const [mounted, setMounted] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  // Filter States
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [dailyStart, setDailyStart] = useState(thirtyDaysAgo);
  const [dailyEnd, setDailyEnd] = useState(todayStr);
  const [monthlyYear, setMonthlyYear] = useState(now.getFullYear());
  const [topLimit, setTopLimit] = useState<number>(10);
  const [topStart, setTopStart] = useState('');
  const [topEnd, setTopEnd] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Data States
  const [dailyData, setDailyData] = useState<DailySalesResponse[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySalesResponse[]>([]);
  const [topProductsData, setTopProductsData] = useState<TopProductResponse[]>([]);
  const [stockData, setStockData] = useState<StockReportResponse[]>([]);

  // Loading & Toast States
  const [loadingData, setLoadingData] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Table pagination state
  const [previewPage, setPreviewPage] = useState(1);
  const pageSize = 8;

  // Mount detection for client charts
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Fetch Report Data based on active tab
  const fetchActiveReport = useCallback(async () => {
    setLoadingData(true);
    try {
      if (activeTab === 'daily') {
        const data = await getDailySalesData(dailyStart, dailyEnd);
        setDailyData(data);
      } else if (activeTab === 'monthly') {
        const data = await getMonthlySalesData(monthlyYear);
        setMonthlyData(data);
      } else if (activeTab === 'top') {
        const data = await getTopProductsData(topStart || undefined, topEnd || undefined, topLimit);
        setTopProductsData(data);
      } else if (activeTab === 'stock') {
        const data = await getStockReportData();
        setStockData(data);
      }
      setPreviewPage(1);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setToast({
        type: 'error',
        message: 'Gagal memuat data laporan dari backend. Pastikan server Spring Boot aktif.',
      });
    } finally {
      setLoadingData(false);
    }
  }, [activeTab, dailyStart, dailyEnd, monthlyYear, topStart, topEnd, topLimit]);

  useEffect(() => {
    if (isAdmin) {
      fetchActiveReport();
    }
  }, [isAdmin, fetchActiveReport]);

  // Quick Preset Handlers
  const handlePresetDate = (type: 'today' | '7days' | '30days' | 'thisMonth') => {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    let start = end;

    if (type === '7days') {
      const d = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      start = d.toISOString().slice(0, 10);
    } else if (type === '30days') {
      const d = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      start = d.toISOString().slice(0, 10);
    } else if (type === 'thisMonth') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      start = d.toISOString().slice(0, 10);
    }

    setDailyStart(start);
    setDailyEnd(end);
  };

  // CSV Download Handlers
  const handleDownload = async (type: string, fn: () => Promise<void>, filenameDesc: string) => {
    setDownloading(type);
    try {
      await fn();
      setToast({
        type: 'success',
        message: `Berkas ${filenameDesc} berhasil diunduh!`,
      });
    } catch (err) {
      console.error('CSV Download failed:', err);
      setToast({
        type: 'error',
        message: `Gagal mengunduh berkas ${filenameDesc}. Coba beberapa saat lagi.`,
      });
    } finally {
      setDownloading(null);
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    if (activeTab === 'daily') {
      const totalRev = dailyData.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
      const paidOrders = dailyData.reduce((acc, curr) => acc + (Number(curr.paidOrders) || 0), 0);
      const totalOrders = dailyData.reduce((acc, curr) => acc + (Number(curr.totalOrders) || 0), 0);
      const aov = paidOrders > 0 ? totalRev / paidOrders : 0;
      return {
        kpi1Label: 'Pendapatan Periode',
        kpi1Value: formatIDR(totalRev),
        kpi1Sub: `${dailyData.length} hari terdata`,
        kpi2Label: 'Transaksi Lunas',
        kpi2Value: paidOrders.toLocaleString('id-ID'),
        kpi2Sub: `Dari total ${totalOrders} pesanan`,
        kpi3Label: 'Rata-Rata Transaksi',
        kpi3Value: formatIDR(aov),
        kpi3Sub: 'Nilai keranjang rata-rata',
        kpi4Label: 'Tingkat Pembayaran',
        kpi4Value: totalOrders > 0 ? `${((paidOrders / totalOrders) * 100).toFixed(1)}%` : '0%',
        kpi4Sub: 'Persentase pesanan terbayar',
      };
    } else if (activeTab === 'monthly') {
      const totalRev = monthlyData.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
      const paidOrders = monthlyData.reduce((acc, curr) => acc + (Number(curr.paidOrders) || 0), 0);
      const totalOrders = monthlyData.reduce((acc, curr) => acc + (Number(curr.totalOrders) || 0), 0);
      const avgMonthly = monthlyData.length > 0 ? totalRev / monthlyData.length : 0;
      return {
        kpi1Label: `Pendapatan Tahun ${monthlyYear}`,
        kpi1Value: formatIDR(totalRev),
        kpi1Sub: `${monthlyData.length} bulan aktif tercatat`,
        kpi2Label: 'Total Pesanan Lunas',
        kpi2Value: paidOrders.toLocaleString('id-ID'),
        kpi2Sub: `Dari total ${totalOrders} pesanan`,
        kpi3Label: 'Rata-rata Pendapatan / Bln',
        kpi3Value: formatIDR(avgMonthly),
        kpi3Sub: 'Rata-rata bulanan berjalan',
        kpi4Label: 'Bulan Paling Produktif',
        kpi4Value:
          monthlyData.length > 0
            ? [...monthlyData].sort((a, b) => Number(b.revenue) - Number(a.revenue))[0]?.month || '-'
            : '-',
        kpi4Sub: 'Berdasarkan omset tertinggi',
      };
    } else if (activeTab === 'top') {
      const totalRev = topProductsData.reduce((acc, curr) => acc + (Number(curr.totalRevenue) || 0), 0);
      const totalUnits = topProductsData.reduce((acc, curr) => acc + (Number(curr.totalSold) || 0), 0);
      const topOne = topProductsData[0];
      return {
        kpi1Label: 'Penjualan Top Produk',
        kpi1Value: formatIDR(totalRev),
        kpi1Sub: `Akumulasi ${topProductsData.length} produk teratas`,
        kpi2Label: 'Total Unit Terjual',
        kpi2Value: `${totalUnits.toLocaleString('id-ID')} unit`,
        kpi2Sub: 'Volume penjualan tercatat',
        kpi3Label: 'Produk Terlaris #1',
        kpi3Value: topOne ? topOne.productName : '-',
        kpi3Sub: topOne ? `${Number(topOne.totalSold)} ${topOne.unitSymbol || 'unit'} terjual` : 'Belum ada data',
        kpi4Label: 'Kontribusi Omset Teratas',
        kpi4Value: topOne && totalRev > 0 ? `${((Number(topOne.totalRevenue) / totalRev) * 100).toFixed(1)}%` : '0%',
        kpi4Sub: 'Dari total penjualan top tier',
      };
    } else {
      const totalProducts = stockData.length;
      const totalStock = stockData.reduce((acc, curr) => acc + (Number(curr.stockOnHand) || 0), 0);
      const lowStockCount = stockData.filter((p) => p.status?.includes('Menipis') || p.status?.includes('Low')).length;
      const outOfStockCount = stockData.filter((p) => p.status?.includes('Habis') || p.status?.includes('Out') || Number(p.stockOnHand) <= 0).length;
      return {
        kpi1Label: 'Total Katalog SKU',
        kpi1Value: `${totalProducts} SKU`,
        kpi1Sub: 'Produk terdaftar di gudang',
        kpi2Label: 'Total Unit Stok Fisik',
        kpi2Value: `${totalStock.toLocaleString('id-ID')}`,
        kpi2Sub: 'Akumulasi kuantitas fisik',
        kpi3Label: 'Peringatan Stok Menipis',
        kpi3Value: `${lowStockCount} Produk`,
        kpi3Sub: 'Membutuhkan restock segera',
        kpi4Label: 'Stok Habis (Kosong)',
        kpi4Value: `${outOfStockCount} Produk`,
        kpi4Sub: 'Perlu restock supplier',
      };
    }
  }, [activeTab, dailyData, monthlyData, monthlyYear, topProductsData, stockData]);

  // Filtered Stock Data for table
  const filteredStockData = useMemo(() => {
    return stockData.filter((item) => {
      const matchSearch =
        !stockSearch ||
        item.productName.toLowerCase().includes(stockSearch.toLowerCase()) ||
        item.productCode.toLowerCase().includes(stockSearch.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(stockSearch.toLowerCase());

      if (!matchSearch) return false;

      if (stockStatusFilter === 'OUT_OF_STOCK') {
        return item.status?.includes('Habis') || item.status?.includes('Out') || Number(item.stockOnHand) <= 0;
      }
      if (stockStatusFilter === 'LOW_STOCK') {
        return item.status?.includes('Menipis') || item.status?.includes('Low');
      }
      if (stockStatusFilter === 'IN_STOCK') {
        return !item.status?.includes('Habis') && !item.status?.includes('Menipis') && Number(item.stockOnHand) > 0;
      }
      return true;
    });
  }, [stockData, stockSearch, stockStatusFilter]);

  // Paginated Preview Rows
  const paginatedRows = useMemo(() => {
    let dataset: unknown[] = [];
    if (activeTab === 'daily') dataset = dailyData;
    else if (activeTab === 'monthly') dataset = monthlyData;
    else if (activeTab === 'top') dataset = topProductsData;
    else dataset = filteredStockData;

    const start = (previewPage - 1) * pageSize;
    return {
      total: dataset.length,
      totalPages: Math.ceil(dataset.length / pageSize) || 1,
      rows: dataset.slice(start, start + pageSize),
    };
  }, [activeTab, dailyData, monthlyData, topProductsData, filteredStockData, previewPage]);

  // Loading skeleton
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-xs tracking-wider uppercase font-semibold">Memuat Sesi Admin...</p>
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
              <span className="text-zinc-900 font-bold text-sm">Laporan & Analitik Bisnis</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchActiveReport}
              disabled={loadingData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-zinc-900' : ''}`} />
              <span className="hidden sm:inline">Segarkan Data</span>
            </button>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lihat Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Executive Workspace */}
        <main className="flex-1 p-5 sm:p-7 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Title & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                  Business Intelligence & Data Export Center
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live PostgreSQL
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Pantau visualisasi performa penjualan, audit tren produk terlaris, dan ekspor berkas CSV aman resmi (TC-18 & PRD §18).
              </p>
            </div>
          </div>

          {/* ─── TIER 1: 4 LIVE ANALYTICAL KPI CARDS ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500">{kpis.kpi1Label}</p>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-black text-zinc-900 mt-2 truncate">
                {kpis.kpi1Value}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{kpis.kpi1Sub}</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500">{kpis.kpi2Label}</p>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-black text-zinc-900 mt-2 truncate">
                {kpis.kpi2Value}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{kpis.kpi2Sub}</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500">{kpis.kpi3Label}</p>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-black text-zinc-900 mt-2 truncate">
                {kpis.kpi3Value}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{kpis.kpi3Sub}</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500">{kpis.kpi4Label}</p>
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-black text-zinc-900 mt-2 truncate">
                {kpis.kpi4Value}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{kpis.kpi4Sub}</p>
            </div>
          </div>

          {/* ─── TIER 2: INTERACTIVE REPORT EXPLORER ─── */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-7 shadow-xs space-y-6">
            {/* Segmented Switcher Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-zinc-100">
              <div className="inline-flex p-1 rounded-2xl bg-zinc-100/80 border border-zinc-200/60 overflow-x-auto max-w-full">
                <button
                  onClick={() => setActiveTab('daily')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'daily'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Penjualan Harian</span>
                </button>
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'monthly'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Penjualan Bulanan</span>
                </button>
                <button
                  onClick={() => setActiveTab('top')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'top'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60'
                  }`}
                >
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Produk Terlaris</span>
                </button>
                <button
                  onClick={() => setActiveTab('stock')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'stock'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60'
                  }`}
                >
                  <Boxes className="w-4 h-4 text-violet-600" />
                  <span>Stok Inventaris</span>
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                <span>Format Resmi PRD §18</span>
              </div>
            </div>

            {/* Context-Aware Filter & Export Bar */}
            <div className="bg-zinc-50/90 rounded-2xl p-4 sm:p-5 border border-zinc-200/70 flex flex-wrap items-end justify-between gap-4">
              {/* Daily Filter */}
              {activeTab === 'daily' && (
                <div className="flex flex-wrap items-end gap-3 flex-1 min-w-[280px]">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={dailyStart}
                      onChange={(e) => setDailyStart(e.target.value)}
                      className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Tanggal Akhir</label>
                    <input
                      type="date"
                      value={dailyEnd}
                      onChange={(e) => setDailyEnd(e.target.value)}
                      className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-2xs"
                    />
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handlePresetDate('today')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors"
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetDate('7days')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors"
                    >
                      7 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetDate('30days')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors"
                    >
                      30 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetDate('thisMonth')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors"
                    >
                      Bulan Ini
                    </button>
                  </div>
                </div>
              )}

              {/* Monthly Filter */}
              {activeTab === 'monthly' && (
                <div className="flex items-end gap-3 flex-1 min-w-[240px]">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Tahun Laporan</label>
                    <select
                      value={monthlyYear}
                      onChange={(e) => setMonthlyYear(Number(e.target.value))}
                      className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-2xs"
                    >
                      <option value={2024}>Tahun 2024</option>
                      <option value={2025}>Tahun 2025</option>
                      <option value={2026}>Tahun 2026 (Aktif)</option>
                      <option value={2027}>Tahun 2027</option>
                    </select>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">
                    Rekapitulasi 12 bulan penuh dari transaksi lunas di PostgreSQL.
                  </p>
                </div>
              )}

              {/* Top Products Filter */}
              {activeTab === 'top' && (
                <div className="flex flex-wrap items-end gap-3 flex-1 min-w-[280px]">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Batas Produk</label>
                    <select
                      value={topLimit}
                      onChange={(e) => setTopLimit(Number(e.target.value))}
                      className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-2xs"
                    >
                      <option value={5}>Top 5 Produk</option>
                      <option value={10}>Top 10 Produk</option>
                      <option value={20}>Top 20 Produk</option>
                      <option value={50}>Top 50 Produk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Dari Tanggal (Opsional)</label>
                    <input
                      type="date"
                      value={topStart}
                      onChange={(e) => setTopStart(e.target.value)}
                      className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Sampai Tanggal (Opsional)</label>
                    <input
                      type="date"
                      value={topEnd}
                      onChange={(e) => setTopEnd(e.target.value)}
                      className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* Stock Inventory Filter */}
              {activeTab === 'stock' && (
                <div className="flex flex-wrap items-end gap-3 flex-1 min-w-[280px]">
                  <div className="relative min-w-[200px]">
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Cari Nama / SKU</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Contoh: PVC, Kancing..."
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-2xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Status Ketersediaan</label>
                    <select
                      value={stockStatusFilter}
                      onChange={(e) => setStockStatusFilter(e.target.value as typeof stockStatusFilter)}
                      className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-2xs"
                    >
                      <option value="ALL">Semua Status ({stockData.length})</option>
                      <option value="IN_STOCK">Tersedia (Aman)</option>
                      <option value="LOW_STOCK">Menipis (Low Stock)</option>
                      <option value="OUT_OF_STOCK">Habis (Kosong)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Download CSV Button on Right */}
              <div>
                <button
                  onClick={() => {
                    if (activeTab === 'daily') {
                      handleDownload('daily', () => downloadDailySalesReport(dailyStart, dailyEnd), 'Laporan Penjualan Harian');
                    } else if (activeTab === 'monthly') {
                      handleDownload('monthly', () => downloadMonthlySalesReport(monthlyYear), `Laporan Penjualan Bulanan ${monthlyYear}`);
                    } else if (activeTab === 'top') {
                      handleDownload('top', () => downloadTopProductsReport(topStart || undefined, topEnd || undefined, topLimit), 'Laporan Produk Terlaris');
                    } else {
                      handleDownload('stock', downloadStockReport, 'Laporan Stok Inventaris');
                    }
                  }}
                  disabled={downloading !== null || loadingData}
                  className="bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                  {downloading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>{downloading ? 'Mengunduh CSV...' : 'Unduh Laporan CSV'}</span>
                </button>
              </div>
            </div>

            {/* ─── INTERACTIVE RECHARTS VISUALIZATION ─── */}
            <div className="p-4 sm:p-6 rounded-2xl bg-zinc-50/50 border border-zinc-200/60">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900">
                    {activeTab === 'daily' && 'Grafik Tren Penjualan Harian (Omset & Pesanan)'}
                    {activeTab === 'monthly' && `Grafik Rekapitulasi Penjualan Bulanan (Tahun ${monthlyYear})`}
                    {activeTab === 'top' && 'Grafik Kontribusi Produk Terlaris (Pendapatan & Terjual)'}
                    {activeTab === 'stock' && 'Distribusi Status Ketersediaan Stok Fisik Gudang'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Visualisasi interaktif 100% dari rekaman transaksi basis data PostgreSQL.
                  </p>
                </div>
              </div>

              {loadingData ? (
                <div className="h-[280px] sm:h-[320px] flex items-center justify-center flex-col gap-2 text-zinc-400">
                  <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin" />
                  <p className="text-xs font-semibold">Mengambil data analitik...</p>
                </div>
              ) : !mounted ? (
                <div className="h-[280px] sm:h-[320px]" />
              ) : (
                <div className="h-[280px] sm:h-[320px] w-full">
                  {/* Daily Area Chart */}
                  {activeTab === 'daily' && (
                    dailyData.length === 0 ? (
                      <div className="h-full flex items-center justify-center flex-col gap-1 text-zinc-400">
                        <AlertCircle className="w-8 h-8 text-zinc-300" />
                        <p className="text-xs font-medium">Belum ada rekaman transaksi pada rentang tanggal ini.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(val) => formatDate(val).slice(0, 6)}
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            axisLine={{ stroke: '#e4e4e7' }}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(v) => formatCompactIDR(v)}
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const row = payload[0].payload as DailySalesResponse;
                                return (
                                  <div className="bg-zinc-950 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-zinc-800">
                                    <p className="font-bold text-zinc-300">{formatDate(String(label || ''))}</p>
                                    <p className="text-emerald-400 font-extrabold text-sm">
                                      Pendapatan: {formatIDR(Number(row.revenue))}
                                    </p>
                                    <p className="text-zinc-300">
                                      Pesanan Lunas: <span className="font-bold text-white">{row.paidOrders}</span> dari {row.totalOrders} order
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            name="Pendapatan (Rp)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )
                  )}

                  {/* Monthly Bar Chart */}
                  {activeTab === 'monthly' && (
                    monthlyData.length === 0 ? (
                      <div className="h-full flex items-center justify-center flex-col gap-1 text-zinc-400">
                        <AlertCircle className="w-8 h-8 text-zinc-300" />
                        <p className="text-xs font-medium">Belum ada rekaman transaksi pada tahun {monthlyYear}.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            axisLine={{ stroke: '#e4e4e7' }}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(v) => formatCompactIDR(v)}
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const row = payload[0].payload as MonthlySalesResponse;
                                return (
                                  <div className="bg-zinc-950 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-zinc-800">
                                    <p className="font-bold text-zinc-300">Bulan: {label}</p>
                                    <p className="text-emerald-400 font-extrabold text-sm">
                                      {formatIDR(Number(row.revenue))}
                                    </p>
                                    <p className="text-zinc-300">
                                      Pesanan Lunas: <span className="font-bold text-white">{row.paidOrders}</span> pesanan
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Pendapatan (Rp)" />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  )}

                  {/* Top Products Horizontal Bar Chart */}
                  {activeTab === 'top' && (
                    topProductsData.length === 0 ? (
                      <div className="h-full flex items-center justify-center flex-col gap-1 text-zinc-400">
                        <AlertCircle className="w-8 h-8 text-zinc-300" />
                        <p className="text-xs font-medium">Belum ada rekaman produk terjual untuk kriteria ini.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topProductsData}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                          <XAxis
                            type="number"
                            tickFormatter={(v) => formatCompactIDR(v)}
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            dataKey="productName"
                            type="category"
                            width={140}
                            tick={{ fontSize: 10, fill: '#3f3f46' }}
                            tickFormatter={(val) => (val.length > 18 ? val.slice(0, 18) + '...' : val)}
                            axisLine={{ stroke: '#e4e4e7' }}
                            tickLine={false}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const row = payload[0].payload as TopProductResponse;
                                return (
                                  <div className="bg-zinc-950 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-zinc-800">
                                    <p className="font-bold text-zinc-200">{row.productName}</p>
                                    <p className="text-zinc-400 text-[10px]">SKU: {row.productCode} • {row.categoryName}</p>
                                    <p className="text-amber-400 font-extrabold text-sm">
                                      Omset: {formatIDR(Number(row.totalRevenue))}
                                    </p>
                                    <p className="text-emerald-400 font-semibold">
                                      Terjual: {Number(row.totalSold)} {row.unitSymbol || 'unit'}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="totalRevenue" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Total Penjualan (Rp)" />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  )}

                  {/* Stock Inventory Summary & Breakdown */}
                  {activeTab === 'stock' && (
                    <div className="h-full flex flex-col justify-between">
                      {/* Top status indicator cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Stok Tersedia (Aman)</p>
                            <p className="text-xl font-black text-emerald-900 mt-1">
                              {stockData.filter((p) => !p.status?.includes('Habis') && !p.status?.includes('Menipis') && Number(p.stockOnHand) > 0).length} SKU
                            </p>
                          </div>
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Stok Menipis (Warning)</p>
                            <p className="text-xl font-black text-amber-900 mt-1">
                              {stockData.filter((p) => p.status?.includes('Menipis') || p.status?.includes('Low')).length} SKU
                            </p>
                          </div>
                          <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200/70 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Stok Habis (Kosong)</p>
                            <p className="text-xl font-black text-rose-900 mt-1">
                              {stockData.filter((p) => p.status?.includes('Habis') || p.status?.includes('Out') || Number(p.stockOnHand) <= 0).length} SKU
                            </p>
                          </div>
                          <AlertCircle className="w-6 h-6 text-rose-600" />
                        </div>
                      </div>

                      {/* Bar chart of stock on hand */}
                      <div className="flex-1 w-full min-h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stockData.slice(0, 10)} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                            <XAxis
                              dataKey="productName"
                              tick={{ fontSize: 10, fill: '#71717a' }}
                              tickFormatter={(val) => (val.length > 12 ? val.slice(0, 12) + '...' : val)}
                              axisLine={{ stroke: '#e4e4e7' }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: '#71717a' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const row = payload[0].payload as StockReportResponse;
                                  return (
                                    <div className="bg-zinc-950 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-zinc-800">
                                      <p className="font-bold text-white">{row.productName}</p>
                                      <p className="text-zinc-400 text-[10px]">SKU: {row.productCode} • {row.categoryName}</p>
                                      <p className="text-violet-400 font-bold">
                                        Stok Fisik: {Number(row.stockOnHand)} {row.unitName}
                                      </p>
                                      <p className="text-amber-400">
                                        Terreservasi: {Number(row.reservedQuantity)} {row.unitName}
                                      </p>
                                      <p className="text-emerald-400 font-extrabold">
                                        Siap Jual: {Number(row.availableQuantity)} {row.unitName}
                                      </p>
                                      <p className="text-zinc-300">Status: {row.status}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="stockOnHand" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Stok Fisik" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── LIVE REPORT DATA PREVIEW TABLE ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-900">
                    Preview Data Laporan Resmi ({paginatedRows.total} Baris Tercatat)
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                    Halaman {previewPage} dari {paginatedRows.totalPages}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Data siap diunduh dalam format berkas CSV standar RFC 4180
                </p>
              </div>

              <div className="overflow-x-auto border border-zinc-200/80 rounded-2xl bg-white shadow-2xs">
                {activeTab === 'daily' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4 text-center">Total Pesanan</th>
                        <th className="py-3 px-4 text-center">Pesanan Lunas</th>
                        <th className="py-3 px-4 text-center">Tingkat Pembayaran</th>
                        <th className="py-3 px-4 text-right">Total Pendapatan (IDR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {paginatedRows.rows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-400">
                            Tidak ada data untuk rentang tanggal yang dipilih.
                          </td>
                        </tr>
                      ) : (
                        (paginatedRows.rows as DailySalesResponse[]).map((row, idx) => {
                          const rate = row.totalOrders > 0 ? ((row.paidOrders / row.totalOrders) * 100).toFixed(0) : '0';
                          return (
                            <tr key={row.date || idx} className="hover:bg-zinc-50/60 transition-colors">
                              <td className="py-3 px-4 font-bold text-zinc-900">{formatDate(row.date)}</td>
                              <td className="py-3 px-4 text-center text-zinc-600">{row.totalOrders}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {row.paidOrders} Lunas
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-zinc-600 font-semibold">{rate}%</td>
                              <td className="py-3 px-4 text-right font-black text-emerald-700">
                                {formatIDR(Number(row.revenue))}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'monthly' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Bulan Laporan</th>
                        <th className="py-3 px-4 text-center">Total Pesanan</th>
                        <th className="py-3 px-4 text-center">Pesanan Lunas</th>
                        <th className="py-3 px-4 text-right">Rata-Rata per Order</th>
                        <th className="py-3 px-4 text-right">Total Pendapatan (IDR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {paginatedRows.rows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-400">
                            Tidak ada data penjualan bulanan untuk tahun {monthlyYear}.
                          </td>
                        </tr>
                      ) : (
                        (paginatedRows.rows as MonthlySalesResponse[]).map((row, idx) => {
                          const aov = row.paidOrders > 0 ? Number(row.revenue) / row.paidOrders : 0;
                          return (
                            <tr key={row.month || idx} className="hover:bg-zinc-50/60 transition-colors">
                              <td className="py-3 px-4 font-bold text-zinc-900">{row.month}</td>
                              <td className="py-3 px-4 text-center text-zinc-600">{row.totalOrders}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {row.paidOrders} Lunas
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-zinc-600 font-medium">
                                {formatIDR(aov)}
                              </td>
                              <td className="py-3 px-4 text-right font-black text-emerald-700">
                                {formatIDR(Number(row.revenue))}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'top' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4 text-center">Peringkat</th>
                        <th className="py-3 px-4">Kode SKU</th>
                        <th className="py-3 px-4">Nama Produk</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4 text-center">Total Terjual</th>
                        <th className="py-3 px-4 text-right">Total Penjualan (IDR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {paginatedRows.rows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-400">
                            Tidak ada data produk terlaris untuk kriteria ini.
                          </td>
                        </tr>
                      ) : (
                        (paginatedRows.rows as TopProductResponse[]).map((row, idx) => {
                          const rank = (previewPage - 1) * pageSize + idx + 1;
                          return (
                            <tr key={row.productCode || idx} className="hover:bg-zinc-50/60 transition-colors">
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                                    rank === 1
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : rank === 2
                                      ? 'bg-zinc-200 text-zinc-800'
                                      : rank === 3
                                      ? 'bg-amber-700/20 text-amber-900'
                                      : 'text-zinc-500'
                                  }`}
                                >
                                  #{rank}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-zinc-600">{row.productCode}</td>
                              <td className="py-3 px-4 font-bold text-zinc-900">{row.productName}</td>
                              <td className="py-3 px-4 text-zinc-500">{row.categoryName}</td>
                              <td className="py-3 px-4 text-center font-bold text-zinc-800">
                                {Number(row.totalSold)} {row.unitSymbol || 'unit'}
                              </td>
                              <td className="py-3 px-4 text-right font-black text-emerald-700">
                                {formatIDR(Number(row.totalRevenue))}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'stock' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Kode SKU</th>
                        <th className="py-3 px-4">Nama Produk</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4 text-center">Stok Fisik</th>
                        <th className="py-3 px-4 text-center">Terreservasi</th>
                        <th className="py-3 px-4 text-center">Siap Jual</th>
                        <th className="py-3 px-4 text-right">Harga Satuan</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {paginatedRows.rows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-zinc-400">
                            Tidak ada produk yang cocok dengan pencarian / filter status.
                          </td>
                        </tr>
                      ) : (
                        (paginatedRows.rows as StockReportResponse[]).map((row, idx) => {
                          const isOut = row.status?.includes('Habis') || Number(row.stockOnHand) <= 0;
                          const isLow = row.status?.includes('Menipis');
                          return (
                            <tr key={row.productCode || idx} className="hover:bg-zinc-50/60 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-zinc-600">{row.productCode}</td>
                              <td className="py-3 px-4 font-bold text-zinc-900">{row.productName}</td>
                              <td className="py-3 px-4 text-zinc-500">{row.categoryName}</td>
                              <td className="py-3 px-4 text-center font-bold text-zinc-800">
                                {Number(row.stockOnHand)} {row.unitName}
                              </td>
                              <td className="py-3 px-4 text-center text-amber-600 font-semibold">
                                {Number(row.reservedQuantity)} {row.unitName}
                              </td>
                              <td className="py-3 px-4 text-center font-black text-emerald-600">
                                {Number(row.availableQuantity)} {row.unitName}
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-zinc-700">
                                {formatIDR(Number(row.price))}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isOut
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : isLow
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              {paginatedRows.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-zinc-400">
                    Menampilkan baris {(previewPage - 1) * pageSize + 1} -{' '}
                    {Math.min(previewPage * pageSize, paginatedRows.total)} dari {paginatedRows.total} total
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                      disabled={previewPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-xs font-bold text-zinc-800 px-2">
                      {previewPage} / {paginatedRows.totalPages}
                    </span>
                    <button
                      onClick={() => setPreviewPage((p) => Math.min(paginatedRows.totalPages, p + 1))}
                      disabled={previewPage === paginatedRows.totalPages}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── TIER 3: QUICK ONE-CLICK CSV EXPORT CARDS ─── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Pusat Ekspor Dokumen CSV Cepat (One-Click Export)</span>
              </h2>
              <span className="text-xs text-zinc-400">Aman dari CSV Injection (K13 & PRD §18)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Export Card 1: Harian */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900">Penjualan Harian</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Rekapitulasi omset & pesanan per hari untuk rentang waktu terpilih.
                  </p>
                  <div className="mt-2 text-[10px] text-zinc-400 font-mono">
                    {dailyStart} s/d {dailyEnd}
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleDownload(
                      'daily-quick',
                      () => downloadDailySalesReport(dailyStart, dailyEnd),
                      'Penjualan Harian'
                    )
                  }
                  disabled={downloading !== null}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {downloading === 'daily-quick' ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span>{downloading === 'daily-quick' ? 'Mengunduh...' : 'Unduh CSV Harian'}</span>
                </button>
              </div>

              {/* Export Card 2: Bulanan */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900">Penjualan Bulanan</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Rekapitulasi 12 bulan kinerja penjualan dan total pendapatan tahunan.
                  </p>
                  <div className="mt-2 text-[10px] text-zinc-400 font-mono">
                    Tahun Anggaran {monthlyYear}
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleDownload(
                      'monthly-quick',
                      () => downloadMonthlySalesReport(monthlyYear),
                      `Penjualan Bulanan ${monthlyYear}`
                    )
                  }
                  disabled={downloading !== null}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {downloading === 'monthly-quick' ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{downloading === 'monthly-quick' ? 'Mengunduh...' : 'Unduh CSV Bulanan'}</span>
                </button>
              </div>

              {/* Export Card 3: Top Produk */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900">Produk Terlaris</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Daftar peringkat produk berkinerja tertinggi berdasarkan volume & omset.
                  </p>
                  <div className="mt-2 text-[10px] text-zinc-400 font-mono">
                    Top {topLimit} Produk Teratas
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleDownload(
                      'top-quick',
                      () => downloadTopProductsReport(topStart || undefined, topEnd || undefined, topLimit),
                      'Produk Terlaris'
                    )
                  }
                  disabled={downloading !== null}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {downloading === 'top-quick' ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{downloading === 'top-quick' ? 'Mengunduh...' : 'Unduh CSV Terlaris'}</span>
                </button>
              </div>

              {/* Export Card 4: Stok Inventaris */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900">Stok Inventaris</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Snapshot ketersediaan stok fisik, alokasi reservasi, dan harga satuan.
                  </p>
                  <div className="mt-2 text-[10px] text-zinc-400 font-mono">
                    {stockData.length} Total Master SKU
                  </div>
                </div>
                <button
                  onClick={() => handleDownload('stock-quick', downloadStockReport, 'Stok Inventaris')}
                  disabled={downloading !== null}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {downloading === 'stock-quick' ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-violet-400" />
                  )}
                  <span>{downloading === 'stock-quick' ? 'Mengunduh...' : 'Unduh CSV Stok'}</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}
