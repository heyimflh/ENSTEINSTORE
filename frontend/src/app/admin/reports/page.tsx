'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  Boxes,
  Store,
  BarChart3,
  Calendar,
  ChevronDown,
  ExternalLink,
  LogOut,
  Bell,
  Menu,
  CheckCircle2,
  DownloadCloud,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  Filter,
  Search,
  X,
  FileSpreadsheet,
  Layers3,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// ============================================================================
// DATA MODELS & TYPES (PRD SECTION 18.2, FR-50, FR-51, BR-12)
// ============================================================================

export type ReportType =
  | 'sales-summary'
  | 'product-sales'
  | 'stock-report'
  | 'transaction-report';

export interface DailySalesData {
  date: string;
  label: string;
  total: number;
  online: number;
  offline: number;
  orders: number;
}

export interface ProductSaleRecord {
  rank: number;
  productId: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantitySold: number;
  totalRevenue: number;
  percentageContribution: number;
}

export interface StockAuditRecord {
  productId: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  stockIn: number;
  stockOut: number;
  adjustment: number;
  currentStock: number;
  status: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface TransactionRecord {
  orderId: string;
  date: string;
  customerName: string;
  channel: 'ONLINE' | 'OFFLINE';
  paymentMethod: string;
  totalAmount: number;
  status: 'COMPLETED' | 'PROCESSING' | 'READY' | 'PAID';
}

// ============================================================================
// INITIAL MOCK DATA (PRD SECTION 18.2)
// ============================================================================

const SALES_CHART_DATA: DailySalesData[] = [
  { date: '2026-11-01', label: '01 Nov', total: 2450000, online: 1600000, offline: 850000, orders: 11 },
  { date: '2026-11-02', label: '02 Nov', total: 1850000, online: 1200000, offline: 650000, orders: 8 },
  { date: '2026-11-03', label: '03 Nov', total: 3100000, online: 2100000, offline: 1000000, orders: 14 },
  { date: '2026-11-04', label: '04 Nov', total: 2750000, online: 1800000, offline: 950000, orders: 12 },
  { date: '2026-11-05', label: '05 Nov', total: 2200000, online: 1400000, offline: 800000, orders: 9 },
  { date: '2026-11-06', label: '06 Nov', total: 3600000, online: 2400000, offline: 1200000, orders: 16 },
  { date: '2026-11-07', label: '07 Nov', total: 4100000, online: 2700000, offline: 1400000, orders: 19 },
  { date: '2026-11-08', label: '08 Nov', total: 3850000, online: 2500000, offline: 1350000, orders: 17 },
  { date: '2026-11-09', label: '09 Nov', total: 2900000, online: 1900000, offline: 1000000, orders: 13 },
  { date: '2026-11-10', label: '10 Nov', total: 4250000, online: 2800000, offline: 1450000, orders: 18 },
  { date: '2026-11-11', label: '11 Nov', total: 5800000, online: 3900000, offline: 1900000, orders: 24 },
  { date: '2026-11-12', label: '12 Nov', total: 4950000, online: 3100000, offline: 1850000, orders: 20 },
  { date: '2026-11-13', label: '13 Nov', total: 6720000, online: 4400000, offline: 2320000, orders: 28 },
  { date: '2026-11-14', label: '14 Nov', total: 7400000, online: 4900000, offline: 2500000, orders: 31 },
  { date: '2026-11-15', label: '15 Nov', total: 9850000, online: 6200000, offline: 3650000, orders: 42 },
  { date: '2026-11-16', label: '16 Nov', total: 9780000, online: 6200000, offline: 3580000, orders: 39 },
];

const PRODUCT_SALES_DATA: ProductSaleRecord[] = [
  {
    rank: 1,
    productId: 'PRD-BHN-001',
    sku: 'PVC-RED-015',
    name: 'Kain PVC Balon 0.15mm Merah',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    quantitySold: 482,
    totalRevenue: 12050000,
    percentageContribution: 24.7,
  },
  {
    rank: 2,
    productId: 'PRD-BHN-002',
    sku: 'PVC-NAVY-015',
    name: 'Kain PVC Balon 0.15mm Biru Navy',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    quantitySold: 340,
    totalRevenue: 8500000,
    percentageContribution: 17.4,
  },
  {
    rank: 3,
    productId: 'PRD-BHN-003',
    sku: 'TSL-MILK-ARM',
    name: 'Kain Taslan Milky Waterproof Hijau Army',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    quantitySold: 180,
    totalRevenue: 6840000,
    percentageContribution: 14.0,
  },
  {
    rank: 4,
    productId: 'PRD-RES-001',
    sku: 'ZIP-WP-070-BLK',
    name: 'Resleting Waterproof 70cm Hitam Seal Karet',
    category: 'Resleting',
    unit: 'Pcs',
    quantitySold: 340,
    totalRevenue: 4250000,
    percentageContribution: 8.7,
  },
  {
    rank: 5,
    productId: 'PRD-BHN-004',
    sku: 'MIKA-CLR-020',
    name: 'Mika Transparan Ketebalan 0.20mm',
    category: 'Material Jas Hujan',
    unit: 'Roll',
    quantitySold: 8,
    totalRevenue: 3600000,
    percentageContribution: 7.4,
  },
  {
    rank: 6,
    productId: 'PRD-AKS-002',
    sku: 'SEAM-TAPE-020',
    name: 'Seam Sealing Tape Panas 20mm Pelapis Jahitan',
    category: 'Aksesori',
    unit: 'Meter',
    quantitySold: 320,
    totalRevenue: 2560000,
    percentageContribution: 5.3,
  },
  {
    rank: 7,
    productId: 'PRD-KRT-001',
    sku: 'ELAS-BLK-025',
    name: 'Karet Elastis 2.5cm Grade A Hitam',
    category: 'Karet',
    unit: 'Meter',
    quantitySold: 290,
    totalRevenue: 1160000,
    percentageContribution: 2.4,
  },
  {
    rank: 8,
    productId: 'PRD-RES-002',
    sku: 'ZIP-COIL-065',
    name: 'Resleting Coil No. 5 Gigi Spiral 65cm',
    category: 'Resleting',
    unit: 'Pcs',
    quantitySold: 140,
    totalRevenue: 840000,
    percentageContribution: 1.7,
  },
  {
    rank: 9,
    productId: 'PRD-KNC-001',
    sku: 'SNP-MET-015',
    name: 'Kancing Snap Button Besi 15mm Nikel',
    category: 'Kancing',
    unit: 'Pcs',
    quantitySold: 420,
    totalRevenue: 630000,
    percentageContribution: 1.3,
  },
  {
    rank: 10,
    productId: 'PRD-KNC-002',
    sku: 'SNP-PLS-WHT',
    name: 'Kancing Snap Plastik Putih 12mm',
    category: 'Kancing',
    unit: 'Pcs',
    quantitySold: 680,
    totalRevenue: 510000,
    percentageContribution: 1.0,
  },
];

const STOCK_AUDIT_DATA: StockAuditRecord[] = [
  {
    productId: 'PRD-BHN-001',
    sku: 'PVC-RED-015',
    name: 'Kain PVC Balon 0.15mm Merah',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    stockIn: 150,
    stockOut: 100,
    adjustment: -2,
    currentStock: 120,
    status: 'NORMAL',
  },
  {
    productId: 'PRD-BHN-002',
    sku: 'PVC-NAVY-015',
    name: 'Kain PVC Balon 0.15mm Biru Navy',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    stockIn: 80,
    stockOut: 60,
    adjustment: 0,
    currentStock: 48,
    status: 'LOW_STOCK',
  },
  {
    productId: 'PRD-RES-001',
    sku: 'ZIP-WP-070-BLK',
    name: 'Resleting Waterproof 70cm Hitam Seal Karet',
    category: 'Resleting',
    unit: 'Pcs',
    stockIn: 50,
    stockOut: 36,
    adjustment: 0,
    currentStock: 14,
    status: 'LOW_STOCK',
  },
  {
    productId: 'PRD-KRT-001',
    sku: 'ELAS-BLK-025',
    name: 'Karet Elastis 2.5cm Grade A Hitam',
    category: 'Karet',
    unit: 'Meter',
    stockIn: 60,
    stockOut: 40,
    adjustment: -8,
    currentStock: 12,
    status: 'LOW_STOCK',
  },
  {
    productId: 'PRD-KNC-001',
    sku: 'SNP-MET-015',
    name: 'Kancing Snap Button Besi 15mm Nikel',
    category: 'Kancing',
    unit: 'Pcs',
    stockIn: 100,
    stockOut: 110,
    adjustment: 25,
    currentStock: 15,
    status: 'LOW_STOCK',
  },
  {
    productId: 'PRD-BHN-004',
    sku: 'MIKA-CLR-020',
    name: 'Mika Transparan Ketebalan 0.20mm',
    category: 'Material Jas Hujan',
    unit: 'Roll',
    stockIn: 10,
    stockOut: 10,
    adjustment: 0,
    currentStock: 0,
    status: 'OUT_OF_STOCK',
  },
  {
    productId: 'PRD-AKS-002',
    sku: 'SEAM-TAPE-020',
    name: 'Seam Sealing Tape Panas 20mm Pelapis Jahitan',
    category: 'Aksesori',
    unit: 'Meter',
    stockIn: 40,
    stockOut: 30,
    adjustment: -4,
    currentStock: 6,
    status: 'LOW_STOCK',
  },
  {
    productId: 'PRD-BHN-003',
    sku: 'TSL-MILK-ARM',
    name: 'Kain Taslan Milky Waterproof Hijau Army',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    stockIn: 200,
    stockOut: 150,
    adjustment: 0,
    currentStock: 250,
    status: 'NORMAL',
  },
  {
    productId: 'PRD-KNC-002',
    sku: 'SNP-PLS-WHT',
    name: 'Kancing Snap Plastik Putih 12mm',
    category: 'Kancing',
    unit: 'Pcs',
    stockIn: 500,
    stockOut: 70,
    adjustment: 20,
    currentStock: 450,
    status: 'NORMAL',
  },
  {
    productId: 'PRD-RES-002',
    sku: 'ZIP-COIL-065',
    name: 'Resleting Coil No. 5 Gigi Spiral 65cm',
    category: 'Resleting',
    unit: 'Pcs',
    stockIn: 200,
    stockOut: 20,
    adjustment: 0,
    currentStock: 180,
    status: 'NORMAL',
  },
];

const TRANSACTIONS_DATA: TransactionRecord[] = [
  {
    orderId: 'EST-20261116-0042',
    date: '16 Nov 2026, 14:15',
    customerName: 'Bu Rina (Konveksi Barokah)',
    channel: 'ONLINE',
    paymentMethod: 'Transfer Bank BCA',
    totalAmount: 1450000,
    status: 'PROCESSING',
  },
  {
    orderId: 'EST-OFF-20261116-0045',
    date: '16 Nov 2026, 13:45',
    customerName: 'Pak Budi (Walk-in)',
    channel: 'OFFLINE',
    paymentMethod: 'Tunai Kasir',
    totalAmount: 185000,
    status: 'COMPLETED',
  },
  {
    orderId: 'EST-20261116-0039',
    date: '16 Nov 2026, 11:30',
    customerName: 'Pak Hadi (Sentosa Tailor)',
    channel: 'ONLINE',
    paymentMethod: 'QRIS Midtrans',
    totalAmount: 1330000,
    status: 'PROCESSING',
  },
  {
    orderId: 'EST-OFF-20261116-0043',
    date: '16 Nov 2026, 10:15',
    customerName: 'Ibu Wahyu (Konveksi UD Hujan)',
    channel: 'OFFLINE',
    paymentMethod: 'Transfer Bank Mandiri',
    totalAmount: 840000,
    status: 'COMPLETED',
  },
  {
    orderId: 'EST-20261116-0038',
    date: '16 Nov 2026, 09:40',
    customerName: 'Budi Santoso',
    channel: 'ONLINE',
    paymentMethod: 'Transfer Bank BCA',
    totalAmount: 840000,
    status: 'READY',
  },
  {
    orderId: 'EST-OFF-20261116-0037',
    date: '16 Nov 2026, 09:15',
    customerName: 'Dewi Sartika (Walk-in)',
    channel: 'OFFLINE',
    paymentMethod: 'Tunai Kasir',
    totalAmount: 320000,
    status: 'COMPLETED',
  },
  {
    orderId: 'EST-20261115-0034',
    date: '15 Nov 2026, 16:30',
    customerName: 'CV Jas Mandiri Kebumen',
    channel: 'ONLINE',
    paymentMethod: 'Transfer Bank BCA',
    totalAmount: 4600000,
    status: 'COMPLETED',
  },
  {
    orderId: 'EST-OFF-20261115-0032',
    date: '15 Nov 2026, 14:10',
    customerName: 'Konveksi Berkah Mandiri',
    channel: 'OFFLINE',
    paymentMethod: 'Tunai Kasir',
    totalAmount: 1250000,
    status: 'COMPLETED',
  },
  {
    orderId: 'EST-20261115-0029',
    date: '15 Nov 2026, 11:00',
    customerName: 'Surya Pratama',
    channel: 'ONLINE',
    paymentMethod: 'QRIS Midtrans',
    totalAmount: 520000,
    status: 'COMPLETED',
  },
  {
    orderId: 'EST-OFF-20261114-0026',
    date: '14 Nov 2026, 16:00',
    customerName: 'Toko Abadi Kebumen',
    channel: 'OFFLINE',
    paymentMethod: 'QRIS Kasir',
    totalAmount: 2450000,
    status: 'COMPLETED',
  },
];

// Helper: Format Rupiah
const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function AdminReportsPage() {
  // Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Active Report Tab State (PRD 18.2)
  const [activeTab, setActiveTab] = useState<ReportType>('sales-summary');

  // Global Date Filter State (FR-50)
  const [dateFilter, setDateFilter] = useState<'MONTH' | '7DAYS' | 'TODAY'>('MONTH');

  // Client Mount Protection for Recharts SVG
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handle Export CSV (FR-51)
  const handleExportCSV = () => {
    let reportName = 'Ringkasan_Penjualan';
    if (activeTab === 'product-sales') reportName = 'Penjualan_Produk_Terlaris';
    if (activeTab === 'stock-report') reportName = 'Laporan_Mutasi_Stok';
    if (activeTab === 'transaction-report') reportName = 'Laporan_Transaksi_Multichannel';

    const dateSuffix =
      dateFilter === 'MONTH'
        ? '1-16_Nov_2026'
        : dateFilter === '7DAYS'
        ? '10-16_Nov_2026'
        : '16_Nov_2026';

    const filename = `${reportName}_${dateSuffix}.csv`;

    setToastMessage({
      title: 'Mengunduh Laporan CSV',
      desc: `File ${filename} sedang di-generate dan siap diunduh ke perangkat Anda.`,
      type: 'success',
    });
  };

  // Recharts Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload[0].value || 0;
      const online = payload[0].payload.online || 0;
      const offline = payload[0].payload.offline || 0;
      const orders = payload[0].payload.orders || 0;

      return (
        <div className="bg-zinc-900 border border-zinc-800 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 font-sans">
          <p className="font-semibold text-zinc-300 border-b border-zinc-800 pb-1">
            {label} 2026 &bull; {orders} Pesanan
          </p>
          <p className="font-bold text-amber-400 text-sm">{formatRupiah(total)}</p>
          <div className="text-[11px] text-zinc-400 space-y-0.5 pt-0.5">
            <p className="flex justify-between gap-4">
              <span>Online Store:</span>
              <span className="font-mono text-zinc-200">{formatRupiah(online)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Kasir Offline:</span>
              <span className="font-mono text-zinc-200">{formatRupiah(offline)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased flex flex-col">
      {/* =====================================================================
          1. THE STANDARDIZED ADMIN SIDEBAR
          (Red geometric 'E', dual typo, glass ADMIN badge, active Laporan)
      ===================================================================== */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`w-64 fixed inset-y-0 left-0 h-screen bg-zinc-950 text-zinc-300 border-r border-zinc-900 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* TOP BRAND HEADER */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-zinc-900/50 shrink-0">
          <div className="flex items-center">
            {/* Red Geometric Logo */}
            <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center text-white font-black text-sm mr-3 transform -skew-x-6 shadow-sm">
              E
            </div>

            {/* Brand Name */}
            <div className="flex items-center">
              <span className="text-white font-bold tracking-tight text-lg">ENSTEIN</span>
              <span className="text-amber-500 font-bold tracking-tight text-lg">STORE</span>
            </div>

            {/* Sleek Admin Badge */}
            <span className="ml-3 bg-white/10 text-white border border-white/20 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded uppercase backdrop-blur-sm">
              ADMIN
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MIDDLE NAV LINKS */}
        <div className="px-4 py-6 space-y-1 overflow-y-auto flex-1">
          <p className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-3 px-2">
            MENU UTAMA
          </p>
          <nav className="space-y-1">
            {/* Dashboard */}
            <Link
              href="/admin/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            {/* Products */}
            <Link
              href="/admin/products"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Produk</span>
              <span className="text-[11px] text-zinc-500 font-mono ml-auto">48</span>
            </Link>

            {/* Categories */}
            <Link
              href="/admin/categories"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Kategori &amp; Satuan</span>
              <span className="text-[11px] text-zinc-500 font-mono ml-auto">11</span>
            </Link>

            {/* Orders */}
            <Link
              href="/admin/orders"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pesanan</span>
              <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                4 Baru
              </span>
            </Link>

            {/* Payments */}
            <Link
              href="/admin/payments"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pembayaran</span>
              <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                2 Perlu Cek
              </span>
            </Link>

            {/* Inventory */}
            <Link
              href="/admin/inventory"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <Boxes className="w-4 h-4" />
              <span>Inventaris</span>
              <span className="ml-auto bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                6 Kritis
              </span>
            </Link>
          </nav>

          {/* Section: OPERASIONAL TOKO */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-3 px-2">
              OPERASIONAL TOKO
            </p>
            <nav className="space-y-1">
              <Link
                href="/admin/offline-sales"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
              >
                <Store className="w-4 h-4" />
                <span>Penjualan Offline</span>
                <span className="ml-auto bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase">
                  POS
                </span>
              </Link>

              {/* Laporan (ACTIVE) */}
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl bg-zinc-900 text-white shadow-xs transition-all"
              >
                <BarChart3 className="w-4 h-4 text-zinc-200" />
                <span>Laporan</span>
                <span className="ml-auto text-[11px] text-amber-400 font-mono font-bold">
                  CSV
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* BOTTOM SIDEBAR FOOTER */}
        <div className="p-4 border-t border-zinc-900/50 space-y-3 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Lihat Toko Publik
            </span>
            <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-zinc-500" />
          </Link>

          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-zinc-800">
                PE
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-zinc-200 truncate">Pak Enstein</p>
                <p className="text-[10px] text-zinc-500 truncate">Owner &amp; Admin</p>
              </div>
            </div>
            <button
              title="Logout"
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          2. MAIN CONTENT AREA (ml-64 min-h-screen bg-zinc-50 flex flex-col)
      ===================================================================== */}
      <main className="md:ml-64 min-h-screen flex flex-col transition-all duration-300">
        {/* TOPBAR */}
        <header className="h-16 px-8 border-b border-zinc-200 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <Link href="/admin/dashboard" className="hover:text-zinc-900 transition-colors">
                Manajemen
              </Link>
              <span>/</span>
              <span className="text-zinc-900 font-semibold">Laporan &amp; Analitik</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-600 border border-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Senin, 16 Nov 2026</span>
            </div>

            <button className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg relative">
              <Bell className="w-4 h-4" />
            </button>

            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-zinc-200">
              PE
            </div>
          </div>
        </header>

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 flex items-start gap-3 p-4 rounded-xl bg-zinc-900 text-white shadow-xl max-w-md animate-in fade-in slide-in-from-top-4 duration-200 border border-zinc-800">
            {toastMessage.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-xs font-bold text-zinc-100">{toastMessage.title}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                {toastMessage.desc}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 text-zinc-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ===================================================================
            3. ANALYTICS HEADER & GLOBAL CONTROLS (px-8 py-8 border-b bg-white)
        =================================================================== */}
        <div className="px-8 py-6 border-b border-zinc-200 bg-white sticky top-16 z-20 shadow-2xs">
          {/* Top Row: Title & Export Action */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Laporan &amp; Analitik
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Laporan terpusat performa penjualan multichannel, tren produk, mutasi stok, dan audit transaksi Toko Enstein (PRD 18.2).
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>
          </div>

          {/* Bottom Row: Tabs & Global Date Filter (FR-50) */}
          <div className="mt-6 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            {/* Left: 4 Report Tabs */}
            <div className="flex flex-wrap items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-medium">
              <button
                onClick={() => setActiveTab('sales-summary')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'sales-summary'
                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Ringkasan Penjualan
              </button>

              <button
                onClick={() => setActiveTab('product-sales')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'product-sales'
                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Penjualan Produk
              </button>

              <button
                onClick={() => setActiveTab('stock-report')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'stock-report'
                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Laporan Stok
              </button>

              <button
                onClick={() => setActiveTab('transaction-report')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'transaction-report'
                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Laporan Transaksi
              </button>
            </div>

            {/* Right: Global Date Range Selector (FR-50) */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="appearance-none bg-white border border-zinc-200 rounded-xl px-4 py-2 pr-9 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 transition-colors shadow-2xs cursor-pointer"
              >
                <option value="MONTH">1 Nov 2026 - 16 Nov 2026 (Bulan Ini)</option>
                <option value="7DAYS">10 Nov 2026 - 16 Nov 2026 (7 Hari Terakhir)</option>
                <option value="TODAY">16 Nov 2026 (Hari Ini)</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ===================================================================
            4. CONDITIONAL RENDER: THE 4 REPORT VIEWS (p-8 pb-12)
        =================================================================== */}
        <div className="p-8 pb-12 space-y-6 flex-1">
          {/* =================================================================
              VIEW 1: SALES SUMMARY (Ringkasan Penjualan + AreaChart)
          ================================================================= */}
          {activeTab === 'sales-summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 3 Highlight Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Pendapatan */}
                <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Total Pendapatan
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-extrabold tracking-tight text-zinc-900 font-mono">
                      Rp 48.750.000
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-zinc-100">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +18.4% vs bln lalu
                      </span>
                      <span className="text-zinc-400 font-medium text-[11px]">
                        Online: 64.6% &bull; Offline: 35.4%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Transaksi */}
                <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Total Transaksi
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-extrabold tracking-tight text-zinc-900 font-mono">
                      184 Pesanan
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-zinc-100">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +12.8% volume
                      </span>
                      <span className="text-zinc-500 font-medium text-[11px]">
                        142 Selesai &bull; 42 Berjalan
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rata-rata Nilai Transaksi (AOV) */}
                <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Rata-rata Transaksi (AOV)
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-extrabold tracking-tight text-zinc-900 font-mono">
                      Rp 264.945
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-zinc-100">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +5.2% basket size
                      </span>
                      <span className="text-zinc-500 font-medium text-[11px]">
                        Pesanan konveksi &amp; ecer
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales Trend Chart (Full width recharts AreaChart) */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900">
                      Tren Pendapatan Harian (Online vs Offline)
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Fluktuasi omzet penjualan bahan jas hujan selama periode terpilih
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-zinc-900" />
                      <span className="text-zinc-600">Total Omzet</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-zinc-600">Online Store</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-zinc-600">Kasir Toko (Offline)</span>
                    </div>
                  </div>
                </div>

                <div className="h-80 w-full pt-4">
                  {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={SALES_CHART_DATA}
                        margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="totalSalesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#18181b" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="onlineSalesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#71717a', fontSize: 11 }}
                          dy={10}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#71717a', fontSize: 11 }}
                          tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#18181b"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#totalSalesGrad)"
                        />
                        <Area
                          type="monotone"
                          dataKey="online"
                          stroke="#3b82f6"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          fillOpacity={1}
                          fill="url(#onlineSalesGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                      Memuat grafik penjualan...
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="text-zinc-500 block text-[11px]">Rata-rata Pendapatan Harian:</span>
                    <span className="font-bold text-zinc-900 font-mono text-sm mt-0.5 block">
                      Rp 3.046.875 / hari
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="text-zinc-500 block text-[11px]">Hari Penjualan Tertinggi:</span>
                    <span className="font-bold text-zinc-900 font-mono text-sm mt-0.5 block">
                      Sabtu, 15 Nov (Rp 9.850.000)
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="text-zinc-500 block text-[11px]">Rasio Multichannel:</span>
                    <span className="font-bold text-emerald-600 font-mono text-sm mt-0.5 block">
                      65% Online / 35% Toko Fisik
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW 2: PRODUCT SALES REPORT (Penjualan Produk Terlaris)
          ================================================================= */}
          {activeTab === 'product-sales' && (
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden animate-in fade-in duration-200">
              <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">
                    Peringkat Penjualan Produk (Best Selling Items)
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Urutan produk berdasarkan total volume terjual dan kontribusi omzet (PRD 18.2)
                  </p>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  10 Produk Teratas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-6 text-center w-16">PERINGKAT</th>
                      <th className="py-3.5 px-6">NAMA PRODUK</th>
                      <th className="py-3.5 px-6">KATEGORI</th>
                      <th className="py-3.5 px-6 text-right">JUMLAH TERJUAL</th>
                      <th className="py-3.5 px-6 text-right">TOTAL PENDAPATAN</th>
                      <th className="py-3.5 px-6 text-right">KONTRIBUSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 text-xs">
                    {PRODUCT_SALES_DATA.map((item) => (
                      <tr key={item.productId} className="hover:bg-zinc-50/80 transition-colors">
                        {/* PERINGKAT */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              item.rank === 1
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : item.rank === 2
                                ? 'bg-zinc-200 text-zinc-800 border border-zinc-300'
                                : item.rank === 3
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'text-zinc-500 font-mono'
                            }`}
                          >
                            {item.rank}
                          </span>
                        </td>

                        {/* NAMA PRODUK */}
                        <td className="py-4 px-6">
                          <p className="font-semibold text-zinc-900">{item.name}</p>
                          <span className="font-mono text-[11px] text-zinc-400">{item.sku}</span>
                        </td>

                        {/* KATEGORI */}
                        <td className="py-4 px-6">
                          <span className="bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-md text-[11px] font-medium border border-zinc-200">
                            {item.category}
                          </span>
                        </td>

                        {/* JUMLAH TERJUAL */}
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold text-zinc-900 font-mono text-sm">
                            {item.quantitySold}
                          </span>
                          <span className="text-zinc-500 text-xs ml-1">{item.unit}</span>
                        </td>

                        {/* TOTAL PENDAPATAN */}
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold text-zinc-900 font-mono text-sm">
                            {formatRupiah(item.totalRevenue)}
                          </span>
                        </td>

                        {/* KONTRIBUSI */}
                        <td className="py-4 px-6 text-right">
                          <span className="font-semibold text-emerald-600 font-mono">
                            {item.percentageContribution}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-zinc-50/60 border-t border-zinc-200 text-xs text-zinc-500 flex justify-between">
                <span>Material jas hujan kain PVC mendominasi 42.1% dari seluruh omzet bulanan Toko Enstein</span>
                <span className="font-medium text-zinc-700">Akumulasi: Rp 42.340.000 (Top 10)</span>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW 3: STOCK REPORT (Laporan Mutasi & Stok Fisik)
          ================================================================= */}
          {activeTab === 'stock-report' && (
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden animate-in fade-in duration-200">
              <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">
                    Laporan Perputaran Stok (Stock In / Out / Adjustment)
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Rekapitulasi keluar masuk barang dan posisi persediaan terkini
                  </p>
                </div>
                <Link
                  href="/admin/inventory/movements"
                  className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                >
                  <span>Buka Master Ledger</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-6">PRODUK</th>
                      <th className="py-3.5 px-6 text-center">BARANG MASUK (IN)</th>
                      <th className="py-3.5 px-6 text-center">BARANG KELUAR (OUT)</th>
                      <th className="py-3.5 px-6 text-center">PENYESUAIAN (ADJ)</th>
                      <th className="py-3.5 px-6 text-right">STOK SAAT INI</th>
                      <th className="py-3.5 px-6 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 text-xs">
                    {STOCK_AUDIT_DATA.map((item) => (
                      <tr key={item.productId} className="hover:bg-zinc-50/80 transition-colors">
                        {/* PRODUK */}
                        <td className="py-4 px-6">
                          <p className="font-semibold text-zinc-900">{item.name}</p>
                          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            {item.sku} &bull; {item.category}
                          </div>
                        </td>

                        {/* BARANG MASUK (In - Green) */}
                        <td className="py-4 px-6 text-center">
                          <span className="font-mono font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            +{item.stockIn} {item.unit}
                          </span>
                        </td>

                        {/* BARANG KELUAR (Out - Blue) */}
                        <td className="py-4 px-6 text-center">
                          <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                            -{item.stockOut} {item.unit}
                          </span>
                        </td>

                        {/* PENYESUAIAN (Adj - Amber/Rose) */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`font-mono font-semibold px-2 py-0.5 rounded ${
                              item.adjustment === 0
                                ? 'text-zinc-400'
                                : item.adjustment > 0
                                ? 'text-teal-700 bg-teal-50'
                                : 'text-amber-700 bg-amber-50'
                            }`}
                          >
                            {item.adjustment > 0 ? `+${item.adjustment}` : item.adjustment} {item.unit}
                          </span>
                        </td>

                        {/* STOK SAAT INI */}
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold text-zinc-900 font-mono text-sm">
                            {item.currentStock}
                          </span>
                          <span className="text-zinc-500 text-xs ml-1">{item.unit}</span>
                        </td>

                        {/* STATUS */}
                        <td className="py-4 px-6 text-right">
                          {item.status === 'NORMAL' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Normal
                            </span>
                          )}
                          {item.status === 'LOW_STOCK' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Low Stock
                            </span>
                          )}
                          {item.status === 'OUT_OF_STOCK' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              Out of Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW 4: TRANSACTION REPORT (Laporan Transaksi Multichannel)
          ================================================================= */}
          {activeTab === 'transaction-report' && (
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden animate-in fade-in duration-200">
              <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">
                    Laporan Transaksi Kasir &amp; Online (BR-12)
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Daftar seluruh pesanan terverifikasi dari penjualan toko online dan kasir fisik
                  </p>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                >
                  <span>Kelola Pesanan</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-6">ORDER ID</th>
                      <th className="py-3.5 px-6">TANGGAL</th>
                      <th className="py-3.5 px-6">PELANGGAN</th>
                      <th className="py-3.5 px-6 text-center">CHANNEL</th>
                      <th className="py-3.5 px-6">METODE PEMBAYARAN</th>
                      <th className="py-3.5 px-6 text-right">TOTAL BELANJA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 text-xs">
                    {TRANSACTIONS_DATA.map((trx) => (
                      <tr key={trx.orderId} className="hover:bg-zinc-50/80 transition-colors">
                        {/* ORDER ID */}
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-zinc-900">
                            #{trx.orderId}
                          </span>
                        </td>

                        {/* TANGGAL */}
                        <td className="py-4 px-6 text-zinc-600 font-mono text-[11px]">
                          {trx.date}
                        </td>

                        {/* PELANGGAN */}
                        <td className="py-4 px-6 font-semibold text-zinc-800">
                          {trx.customerName}
                        </td>

                        {/* CHANNEL (Aesthetic pill badge: Blue for Online, Purple for Offline) */}
                        <td className="py-4 px-6 text-center">
                          {trx.channel === 'ONLINE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Online Store
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              Kasir Toko (Offline)
                            </span>
                          )}
                        </td>

                        {/* METODE PEMBAYARAN */}
                        <td className="py-4 px-6 text-zinc-700">
                          {trx.paymentMethod}
                        </td>

                        {/* TOTAL BELANJA */}
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold text-zinc-900 font-mono text-sm">
                            {formatRupiah(trx.totalAmount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-zinc-50/60 border-t border-zinc-200 text-xs text-zinc-500 flex justify-between">
                <span>Data tersinkron otomatis antara toko fisik Jl. Kertanegara Kebumen dan website resmi</span>
                <span className="font-mono font-medium text-zinc-700">Total 10 Transaksi Sampel</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
