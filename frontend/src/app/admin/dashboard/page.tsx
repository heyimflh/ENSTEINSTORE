'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
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
  Bell,
  LogOut,
  Plus,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Download,
  RefreshCw,
  ExternalLink,
  Menu,
  X,
  CreditCard,
  Check,
  AlertCircle,
  Calendar,
} from 'lucide-react';

// ============================================================================
// DUMMY DATA FOR DEMO & TESTING (TOKO ENSTEIN DOMAIN)
// ============================================================================

// 1. Sales Chart Data for different time filters
interface SalesDataPoint {
  date: string;
  day: string;
  sales: number;
  onlineSales: number;
  offlineSales: number;
  ordersCount: number;
}

const SALES_DATA_7D: SalesDataPoint[] = [
  { date: '10 Nov', day: 'Sen', sales: 4250000, onlineSales: 2800000, offlineSales: 1450000, ordersCount: 16 },
  { date: '11 Nov', day: 'Sel', sales: 5800000, onlineSales: 3900000, offlineSales: 1900000, ordersCount: 22 },
  { date: '12 Nov', day: 'Rab', sales: 4950000, onlineSales: 3100000, offlineSales: 1850000, ordersCount: 19 },
  { date: '13 Nov', day: 'Kam', sales: 6720000, onlineSales: 4400000, offlineSales: 2320000, ordersCount: 26 },
  { date: '14 Nov', day: 'Jum', sales: 7400000, onlineSales: 4900000, offlineSales: 2500000, ordersCount: 29 },
  { date: '15 Nov', day: 'Sab', sales: 9850000, onlineSales: 6200000, offlineSales: 3650000, ordersCount: 38 },
  { date: '16 Nov', day: 'Min', sales: 9780000, onlineSales: 6200000, offlineSales: 3580000, ordersCount: 34 },
];

const SALES_DATA_30D: SalesDataPoint[] = [
  { date: '18 Okt', day: 'Mgg 1', sales: 24500000, onlineSales: 16000000, offlineSales: 8500000, ordersCount: 95 },
  { date: '25 Okt', day: 'Mgg 2', sales: 28900000, onlineSales: 18500000, offlineSales: 10400000, ordersCount: 112 },
  { date: '01 Nov', day: 'Mgg 3', sales: 34100000, onlineSales: 22000000, offlineSales: 12100000, ordersCount: 134 },
  { date: '08 Nov', day: 'Mgg 4', sales: 38650000, onlineSales: 25100000, offlineSales: 13550000, ordersCount: 152 },
  { date: '16 Nov', day: 'Mgg 5', sales: 48750000, onlineSales: 31500000, offlineSales: 17250000, ordersCount: 184 },
];

// 2. Low Stock Products
interface LowStockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  status: 'critical' | 'low';
}

const INITIAL_LOW_STOCK_ITEMS: LowStockItem[] = [
  {
    id: 'prd-002',
    name: 'Kain PVC Balon 0.15mm Biru',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    currentStock: 8,
    minStock: 20,
    status: 'critical',
  },
  {
    id: 'prd-005',
    name: 'Resleting Waterproof 70cm Hitam',
    category: 'Resleting',
    unit: 'Pcs',
    currentStock: 4,
    minStock: 25,
    status: 'critical',
  },
  {
    id: 'prd-008',
    name: 'Karet Elastis 3cm Grade A',
    category: 'Komponen Karet',
    unit: 'Meter',
    currentStock: 12,
    minStock: 30,
    status: 'low',
  },
  {
    id: 'prd-012',
    name: 'Kancing Snap Button Besi 15mm',
    category: 'Kancing',
    unit: 'Pcs',
    currentStock: 15,
    minStock: 50,
    status: 'low',
  },
];

// 3. Recent Orders
interface RecentOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  channel: 'ONLINE_DELIVERY' | 'ONLINE_PICKUP' | 'OFFLINE_STORE';
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED';
  total: number;
  itemsSummary: string;
}

const INITIAL_RECENT_ORDERS: RecentOrder[] = [
  {
    id: 'ORD-20261116-042',
    customerName: 'Bu Rina (Konveksi Barokah)',
    customerPhone: '0812-9876-5432',
    date: '16 Nov 2026, 14:15',
    channel: 'ONLINE_DELIVERY',
    status: 'PENDING',
    total: 1450000,
    itemsSummary: 'Kain PVC Balon Merah 25m, Resleting 70cm 10pcs',
  },
  {
    id: 'ORD-20261116-039',
    customerName: 'Pak Hadi (Sentosa Tailor)',
    customerPhone: '0857-3344-9988',
    date: '16 Nov 2026, 11:30',
    channel: 'ONLINE_PICKUP',
    status: 'PROCESSING',
    total: 890000,
    itemsSummary: 'Karet Elastis 3cm 40m, Kancing Snap 100pcs',
  },
  {
    id: 'ORD-20261116-037',
    customerName: 'Dewi Sartika (Pelanggan Toko)',
    customerPhone: '0813-2211-4455',
    date: '16 Nov 2026, 09:45',
    channel: 'OFFLINE_STORE',
    status: 'COMPLETED',
    total: 320000,
    itemsSummary: 'Kain PVC Balon Transparan 5m, Lem PVC 2pcs',
  },
  {
    id: 'ORD-20261115-088',
    customerName: 'Budi Santoso',
    customerPhone: '0878-1122-3344',
    date: '15 Nov 2026, 16:10',
    channel: 'ONLINE_DELIVERY',
    status: 'PROCESSING',
    total: 2150000,
    itemsSummary: 'Kain PVC Balon Hijau TNI 50m, Seam Sealing 2 roll',
  },
  {
    id: 'ORD-20261115-084',
    customerName: 'CV Jas Mandiri Kebumen',
    customerPhone: '0819-7788-9900',
    date: '15 Nov 2026, 13:20',
    channel: 'ONLINE_DELIVERY',
    status: 'COMPLETED',
    total: 4600000,
    itemsSummary: 'Kain PVC Balon Hitam 100m, Resleting Waterproof 50pcs',
  },
];

// 4. Best Selling Products
interface BestSellerItem {
  rank: number;
  name: string;
  category: string;
  soldCount: number;
  unit: string;
  revenue: number;
  imageUrl: string;
}

const BEST_SELLING_PRODUCTS: BestSellerItem[] = [
  {
    rank: 1,
    name: 'PVC Super Ketebalan 0.25',
    category: 'Material Jas Hujan',
    soldCount: 482,
    unit: 'Meter',
    revenue: 16870000,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
  },
  {
    rank: 2,
    name: 'Resleting Waterproof (Hitam/Putih)',
    category: 'Resleting Anti Air',
    soldCount: 340,
    unit: 'Pcs',
    revenue: 2890000,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
  },
  {
    rank: 3,
    name: 'Karet Elastis (2cm - 2.5cm)',
    category: 'Komponen Karet',
    soldCount: 290,
    unit: 'Meter',
    revenue: 1015000,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikAll.jpeg',
  },
  {
    rank: 4,
    name: 'Kancing Snap (Hitam/Putih)',
    category: 'Kancing Snap',
    soldCount: 215,
    unit: 'Pcs',
    revenue: 107500,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg',
  },
  {
    rank: 5,
    name: 'Seam Sealing Tape (Silent Weath)',
    category: 'Aksesori Pelapis',
    soldCount: 180,
    unit: 'Meter',
    revenue: 810000,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SilenMantel.webp',
  },
];

// Helper: Format Indonesian Rupiah
const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

// ============================================================================
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================================================
export default function AdminDashboardPage() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'inventory' | 'offline' | 'reports'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('7d');
  const [isMounted, setIsMounted] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Business State / Data
  const [orders, setOrders] = useState<RecentOrder[]>(INITIAL_RECENT_ORDERS);
  const [lowStockList, setLowStockList] = useState<LowStockItem[]>(INITIAL_LOW_STOCK_ITEMS);
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);
  const [restockModalItem, setRestockModalItem] = useState<LowStockItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(20);
  const [restockSupplier, setRestockSupplier] = useState<string>('Pabrik Tekstil Sentosa');

  // Interactive Toast State
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' } | null>(null);

  // Client-side mount protection for Recharts SVG calculation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Dynamic Chart Dataset based on period
  const activeChartData = useMemo(() => {
    return chartPeriod === '7d' ? SALES_DATA_7D : SALES_DATA_30D;
  }, [chartPeriod]);

  // Order Process Handler
  const handleProcessOrder = (order: RecentOrder) => {
    setSelectedOrder(order);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: RecentOrder['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    setSelectedOrder(null);
    setToastMessage({
      title: 'Status Pesanan Diperbarui',
      desc: `Pesanan #${orderId} berhasil diubah statusnya menjadi ${newStatus}.`,
      type: 'success',
    });
  };

  // Restock Handler
  const handleConfirmRestock = () => {
    if (!restockModalItem) return;
    const added = Number(restockAmount) || 0;
    setLowStockList((prev) =>
      prev.map((item) =>
        item.id === restockModalItem.id
          ? {
              ...item,
              currentStock: item.currentStock + added,
              status: item.currentStock + added >= item.minStock ? 'low' : 'critical',
            }
          : item
      )
    );
    setToastMessage({
      title: 'Restock Berhasil Ditambahkan',
      desc: `Stok ${restockModalItem.name} berhasil ditambah +${added} ${restockModalItem.unit}.`,
      type: 'success',
    });
    setRestockModalItem(null);
  };

  // Recharts Custom Tooltip Component
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as SalesDataPoint;
      return (
        <div className="bg-zinc-900 text-white p-3.5 rounded-xl shadow-2xl border border-zinc-800 text-xs min-w-[210px] backdrop-blur-sm">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <span className="font-semibold text-zinc-200">
              {data.day}, {data.date}
            </span>
            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-medium">
              {data.ordersCount} Transaksi
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-bold text-white text-sm">
              <span className="text-zinc-400 font-normal">Total Omzet:</span>
              <span>{formatRupiah(data.sales)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Penjualan Online:
              </span>
              <span className="text-zinc-300 font-medium">{formatRupiah(data.onlineSales)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Penjualan Offline (Toko):
              </span>
              <span className="text-zinc-300 font-medium">{formatRupiah(data.offlineSales)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased flex flex-col">
      {/* =====================================================================
          1. THE UPGRADED ADMIN SIDEBAR
          (w-64 fixed h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between)
      ===================================================================== */}
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`w-64 fixed inset-y-0 left-0 h-screen bg-zinc-950 text-zinc-300 border-r border-zinc-900 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* TOP BRAND HEADER (h-20 px-6 flex items-center border-b border-zinc-900/50) */}
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

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MIDDLE NAV LINKS (px-4 py-6 space-y-1 overflow-y-auto) */}
        <div className="px-4 py-6 space-y-1 overflow-y-auto flex-1">
          {/* Section: MENU UTAMA */}
          <p className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-3 px-2">
            MENU UTAMA
          </p>
          <nav className="space-y-1">
            {/* Dashboard (Active) */}
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-zinc-200" />
              <span>Dashboard</span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-auto animate-pulse"></span>
            </button>

            {/* Products */}
            <button
              onClick={() => {
                setActiveTab('products');
                setSidebarOpen(false);
                setToastMessage({
                  title: 'Modul Produk',
                  desc: 'Membuka katalog master produk & manajemen stok (PRD 9.3.2).',
                  type: 'info',
                });
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                activeTab === 'products'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Produk</span>
              <span className="text-[11px] text-zinc-500 font-mono ml-auto">48</span>
            </button>

            {/* Categories */}
            <button
              onClick={() => {
                setActiveTab('categories');
                setSidebarOpen(false);
                setToastMessage({
                  title: 'Modul Kategori',
                  desc: 'Membuka kelola kategori bahan & satuan jual meter/pcs (PRD 9.3.3).',
                  type: 'info',
                });
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                activeTab === 'categories'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Kategori</span>
              <span className="text-[11px] text-zinc-500 font-mono ml-auto">5</span>
            </button>

            {/* Orders */}
            <button
              onClick={() => {
                setActiveTab('orders');
                setSidebarOpen(false);
                setToastMessage({
                  title: 'Modul Pesanan',
                  desc: 'Membuka antrean pesanan & verifikasi pembayaran (PRD 9.3.4 & 9.3.5).',
                  type: 'info',
                });
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                activeTab === 'orders'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pesanan</span>
              <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                4 Baru
              </span>
            </button>

            {/* Inventory */}
            <button
              onClick={() => {
                setActiveTab('inventory');
                setSidebarOpen(false);
                setToastMessage({
                  title: 'Modul Inventaris',
                  desc: 'Membuka kontrol stok, peringatan minimum, & stock movement (PRD 9.3.6).',
                  type: 'info',
                });
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Inventaris</span>
              <span className="ml-auto bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                5 Kritis
              </span>
            </button>
          </nav>

          {/* Section: OPERASIONAL TOKO */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-3 px-2">
              OPERASIONAL TOKO
            </p>
            <nav className="space-y-1">
              {/* Offline Sales */}
              <button
                onClick={() => {
                  setActiveTab('offline');
                  setSidebarOpen(false);
                  setToastMessage({
                    title: 'Pencatatan Offline',
                    desc: 'Form transaksi kasir fisik Toko Enstein (PRD 9.3.8).',
                    type: 'info',
                  });
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === 'offline'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Penjualan Offline</span>
                <span className="ml-auto bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase">
                  POS
                </span>
              </button>

              {/* Reports */}
              <button
                onClick={() => {
                  setActiveTab('reports');
                  setSidebarOpen(false);
                  setToastMessage({
                    title: 'Laporan Penjualan',
                    desc: 'Laporan ringkasan penjualan & ekspor CSV otomatis (PRD 9.3.9).',
                    type: 'info',
                  });
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Laporan</span>
                <span className="ml-auto text-[11px] text-zinc-500 font-mono">CSV</span>
              </button>
            </nav>
          </div>
        </div>

        {/* BOTTOM PROFILE (p-4 border-t border-zinc-900/50) */}
        <div className="p-4 border-t border-zinc-900/50 space-y-3 shrink-0">
          {/* Quick link to client storefront */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/60 rounded-xl transition-all group"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
              Lihat Toko Publik
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* User Card for Pak Enstein (Owner & Admin) */}
          <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-2xl hover:bg-zinc-800 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-xs ring-1 ring-zinc-700">
                  PE
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-zinc-950"></span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Pak Enstein</p>
                <p className="text-[11px] text-zinc-400 truncate">Owner &amp; Admin</p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setToastMessage({
                  title: 'Logout Admin',
                  desc: 'Sesi admin aman. Anda dapat masuk kembali kapan saja.',
                  type: 'info',
                });
              }}
              title="Keluar dari Panel Admin"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          2. MAIN CONTENT AREA (Offset by sidebar width: ml-64)
      ===================================================================== */}
      <div className="md:ml-64 flex-1 min-h-screen bg-zinc-50 flex flex-col">
        {/* ===================================================================
            TOPBAR (h-20 bg-white border-b border-zinc-200 px-8)
        =================================================================== */}
        <header className="h-20 bg-white border-b border-zinc-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-400 font-medium">Overview</span>
              <span className="text-zinc-300">/</span>
              <span className="text-zinc-900 font-semibold tracking-tight">Dashboard</span>
              <span className="hidden sm:inline-flex ml-3 items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Database Live
              </span>
            </div>
          </div>

          {/* Right: Date, Actions, Notification, Avatar */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Date Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Senin, 16 Nov 2026</span>
            </div>

            {/* Quick Action Button: Record Offline Sale (PRD 9.3.8) */}
            <button
              onClick={() => {
                setToastMessage({
                  title: 'Modul Penjualan Offline',
                  desc: 'Form input walk-in customer dibuka. Data langsung mengurangi stok otomatis.',
                  type: 'info',
                });
              }}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Penjualan Offline</span>
            </button>

            {/* Notification Bell with Red Dot */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                title="Pemberitahuan Sistem"
              >
                <Bell className="w-5 h-5" />
                {/* Red Dot Alert Indicator */}
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
              </button>

              {/* Notification Popover Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-zinc-200 rounded-2xl shadow-xl p-4 z-50 text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <h4 className="font-bold text-sm text-zinc-900">Notifikasi Toko</h4>
                    <span className="text-[11px] font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                      3 Baru
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100 mt-2 max-h-72 overflow-y-auto">
                    <div className="py-2.5 hover:bg-zinc-50 rounded-lg px-2 transition-colors cursor-pointer">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-0.5">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900">
                            Pesanan Baru #{orders[0].id}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Bu Rina telah mengupload bukti transfer manual Rp 1.450.000.
                          </p>
                          <span className="text-[10px] text-zinc-400 mt-1 block">5 menit yang lalu</span>
                        </div>
                      </div>
                    </div>

                    <div className="py-2.5 hover:bg-zinc-50 rounded-lg px-2 transition-colors cursor-pointer">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900">
                            Peringatan Stok Menipis
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Kain PVC Balon Biru tersisa 8 meter (di bawah batas minimum 20m).
                          </p>
                          <span className="text-[10px] text-zinc-400 mt-1 block">28 menit yang lalu</span>
                        </div>
                      </div>
                    </div>

                    <div className="py-2.5 hover:bg-zinc-50 rounded-lg px-2 transition-colors cursor-pointer">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900">
                            Penjualan Offline Dicatat
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Transaksi walk-in Rp 320.000 berhasil masuk pembukuan hari ini.
                          </p>
                          <span className="text-[10px] text-zinc-400 mt-1 block">1 jam yang lalu</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 text-center">
                    <button
                      onClick={() => setNotificationOpen(false)}
                      className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold"
                    >
                      Tutup Notifikasi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-zinc-300 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  PE
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-50 text-left">
                  <div className="px-3 py-2 border-b border-zinc-100">
                    <p className="text-xs font-bold text-zinc-900">Pak Enstein</p>
                    <p className="text-[11px] text-zinc-500">admin@ensteinstore.com</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">
                      Pemilik Toko
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setToastMessage({
                          title: 'Profil Admin',
                          desc: 'Membuka pengaturan akun admin dan ganti password (PRD 9.3.10).',
                          type: 'info',
                        });
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
                    >
                      Pengaturan Akun Admin
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setToastMessage({
                          title: 'Profil Toko',
                          desc: 'Toko Enstein: Jl. Kertanegara Km. 03, Tanahsari, Kebumen.',
                          type: 'info',
                        });
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
                    >
                      Informasi Toko Enstein
                    </button>
                  </div>

                  <div className="pt-1 border-t border-zinc-100">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setToastMessage({
                          title: 'Logout Admin',
                          desc: 'Sesi admin berakhir.',
                          type: 'info',
                        });
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span>Keluar (Logout)</span>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ===================================================================
            DASHBOARD CONTENT BODY (p-8 space-y-8)
        =================================================================== */}
        <main className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* PAGE TITLE & WELCOME HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                Dashboard Overview
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Selamat datang kembali, Pak Enstein. Pantau performa penjualan, pesanan, dan persediaan bahan jas hujan.
              </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setToastMessage({
                    title: 'Memperbarui Data...',
                    desc: 'Data transaksi dan stok berhasil disinkronkan dengan database.',
                    type: 'success',
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl shadow-xs transition-colors"
                title="Sinkronisasi Data"
              >
                <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => {
                  setToastMessage({
                    title: 'Ekspor Dimulai',
                    desc: 'Mengunduh laporan rekapitulasi penjualan CSV (PRD 9.3.9).',
                    type: 'success',
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* =================================================================
              A. METRIC CARDS GRID (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6)
          ================================================================= */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Total Sales */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-all duration-200">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <TrendingUp className="w-3 h-3" />
                    +18.4%
                  </span>
                </div>
                <p className="text-sm text-zinc-500 font-medium mt-4">Total Penjualan</p>
                <p className="text-3xl font-bold text-zinc-900 mt-1 tracking-tight">
                  Rp 48.750.000
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                <span>Online: Rp 31,5 jt</span>
                <span className="text-zinc-300">•</span>
                <span>Offline: Rp 17,2 jt</span>
              </div>
            </div>

            {/* Card 2: Total Orders */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-all duration-200">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    <TrendingUp className="w-3 h-3" />
                    +12.8%
                  </span>
                </div>
                <p className="text-sm text-zinc-500 font-medium mt-4">Total Pesanan</p>
                <p className="text-3xl font-bold text-zinc-900 mt-1 tracking-tight">
                  184 Pesanan
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                <span className="text-emerald-600 font-semibold">142 Selesai</span>
                <span className="text-zinc-300">•</span>
                <span className="text-amber-600 font-semibold">12 Perlu Diproses</span>
              </div>
            </div>

            {/* Card 3: Total Products */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-all duration-200">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    5 Kategori
                  </span>
                </div>
                <p className="text-sm text-zinc-500 font-medium mt-4">Total Produk</p>
                <p className="text-3xl font-bold text-zinc-900 mt-1 tracking-tight">
                  48 Produk
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                <span>Material, Resleting, Kancing, Karet</span>
              </div>
            </div>

            {/* Card 4: Low Stock (Use RED accent) */}
            <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all duration-200 bg-gradient-to-b from-rose-50/20 to-transparent">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-200 animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    Perlu Tindakan
                  </span>
                </div>
                <p className="text-sm text-zinc-500 font-medium mt-4">Peringatan Stok</p>
                <p className="text-3xl font-bold text-rose-600 mt-1 tracking-tight">
                  {lowStockList.length} Produk
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-600 font-semibold">
                <span>2 Kritis (Stok &lt; 10)</span>
                <span className="text-rose-200">•</span>
                <span>Restock Segera</span>
              </div>
            </div>
          </section>

          {/* =================================================================
              B. MIDDLE ROW: CHART & LOW STOCK (grid grid-cols-1 lg:grid-cols-3 gap-6)
          ================================================================= */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SALES CHART (lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm) */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              {/* Header with Title and Sleek Dropdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                    Grafik Penjualan
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Tren pendapatan harian penjualan bahan jas hujan (Online & Offline)
                  </p>
                </div>

                {/* Dropdown / Filter for period */}
                <div className="flex items-center gap-2">
                  <div className="relative inline-flex items-center">
                    <select
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value as '7d' | '30d')}
                      className="appearance-none bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-800 text-xs font-semibold py-2 pl-3.5 pr-8 rounded-xl shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all"
                    >
                      <option value="7d">7 Hari Terakhir</option>
                      <option value="30d">30 Hari Terakhir</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Chart Body using Recharts */}
              <div className="pt-6 pb-2 w-full h-[320px]">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activeChartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#18181b" stopOpacity={0.16} />
                          <stop offset="95%" stopColor="#18181b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={{ stroke: '#e4e4e7' }}
                        tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }}
                        dy={6}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#18181b"
                        strokeWidth={2.5}
                        fill="url(#salesGradient)"
                        activeDot={{
                          r: 6,
                          fill: '#18181b',
                          stroke: '#ffffff',
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 text-xs">
                    Memuat grafik penjualan...
                  </div>
                )}
              </div>

              {/* Chart Highlights Footer */}
              <div className="pt-4 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Rata-rata Harian</span>
                  <span className="font-bold text-zinc-900 text-sm">Rp 6.960.000</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Hari Penjualan Tertinggi</span>
                  <span className="font-bold text-zinc-900 text-sm">Sabtu (Rp 9,85 jt)</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-zinc-400 block text-[11px]">Rasio Channel</span>
                  <span className="font-bold text-emerald-600 text-sm">65% Online / 35% Toko</span>
                </div>
              </div>
            </div>

            {/* LOW STOCK ALERT (lg:col-span-1 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm) */}
            <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                {/* Header with AlertTriangle Icon */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-900">Peringatan Stok</h3>
                      <p className="text-xs text-zinc-500">Mendekati ambang batas minimum</p>
                    </div>
                  </div>
                  <span className="bg-rose-50 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-rose-200">
                    {lowStockList.length} Item
                  </span>
                </div>

                {/* List of 3-4 Low Stock Products */}
                <div className="divide-y divide-zinc-100 mt-2">
                  {lowStockList.map((item) => {
                    const percentage = Math.min(
                      100,
                      Math.round((item.currentStock / item.minStock) * 100)
                    );
                    return (
                      <div key={item.id} className="py-3.5 group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-zinc-900 truncate group-hover:text-zinc-800">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-zinc-500 mt-0.5">{item.category}</p>
                          </div>
                          {/* Red bold text for "Sisa: X" */}
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-rose-600">
                              Sisa: {item.currentStock} {item.unit}
                            </span>
                            <span className="block text-[10px] text-zinc-400 mt-0.5">
                              Min: {item.minStock} {item.unit}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar & Quick Restock Button */}
                        <div className="mt-2.5 flex items-center gap-3">
                          <div className="flex-1 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <button
                            onClick={() => {
                              setRestockModalItem(item);
                              setRestockAmount(item.minStock * 2);
                            }}
                            className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 transition-colors"
                          >
                            + Restock
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Card Link */}
              <div className="pt-4 border-t border-zinc-100">
                <button
                  onClick={() => {
                    setToastMessage({
                      title: 'Inventaris Lengkap',
                      desc: 'Membuka seluruh tabel kontrol stok dan stock movement (PRD 9.3.6).',
                      type: 'info',
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-200 transition-colors"
                >
                  <span>Kelola Seluruh Stok Toko</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>
            </div>
          </section>

          {/* =================================================================
              C. BOTTOM ROW: RECENT ORDERS & BEST SELLERS (grid grid-cols-1 lg:grid-cols-3 gap-6)
          ================================================================= */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* RECENT ORDERS (lg:col-span-2 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden) */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
              {/* Header (p-6 border-b border-zinc-200) */}
              <div className="p-6 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                    Pesanan Terbaru
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Pesanan terkini yang memerlukan konfirmasi pembayaran dan pengemasan
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-500">
                    Total: {orders.length} pesanan aktif
                  </span>
                </div>
              </div>

              {/* Sleek Admin Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-6">Order ID</th>
                      <th className="py-3.5 px-6">Pelanggan</th>
                      <th className="py-3.5 px-6">Tanggal</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Total</th>
                      <th className="py-3.5 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {orders.map((order) => {
                      // Pill badges as per PRD & specifications
                      let statusBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      );

                      if (order.status === 'PROCESSING') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            <RefreshCw className="w-3 h-3" />
                            Diproses
                          </span>
                        );
                      } else if (order.status === 'READY') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                            <Store className="w-3 h-3" />
                            Siap Diambil
                          </span>
                        );
                      } else if (order.status === 'COMPLETED') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Selesai
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-zinc-50/80 transition-colors group"
                        >
                          {/* Order ID */}
                          <td className="py-4 px-6 font-mono font-bold text-zinc-900">
                            <div className="flex flex-col">
                              <span>#{order.id}</span>
                              <span className="text-[10px] font-sans font-medium text-zinc-400 mt-0.5">
                                {order.channel === 'ONLINE_DELIVERY' && 'Pengiriman (Delivery)'}
                                {order.channel === 'ONLINE_PICKUP' && 'Ambil Toko (Pickup)'}
                                {order.channel === 'OFFLINE_STORE' && 'Transaksi Kasir (Offline)'}
                              </span>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-4 px-6">
                            <div className="font-semibold text-zinc-900">
                              {order.customerName}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {order.customerPhone}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-6 text-zinc-500 whitespace-nowrap">
                            {order.date}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6 whitespace-nowrap">{statusBadge}</td>

                          {/* Total */}
                          <td className="py-4 px-6 font-bold text-zinc-900 whitespace-nowrap">
                            {formatRupiah(order.total)}
                          </td>

                          {/* Aksi: "Process" ghost button */}
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleProcessOrder(order)}
                              className="px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-transparent hover:bg-zinc-900 hover:text-white border border-zinc-200 rounded-lg shadow-xs transition-all active:scale-95"
                            >
                              Process
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
                <span>Menampilkan 5 pesanan terbaru dari database</span>
                <button
                  onClick={() => {
                    setToastMessage({
                      title: 'Manajemen Pesanan',
                      desc: 'Membuka seluruh tabel pesanan lengkap dengan filter tanggal dan status.',
                      type: 'info',
                    });
                  }}
                  className="font-semibold text-zinc-900 hover:underline flex items-center gap-1"
                >
                  <span>Lihat Semua Pesanan</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* BEST SELLERS (lg:col-span-1 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm) */}
            <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Produk Terlaris</h3>
                    <p className="text-xs text-zinc-500">Berdasarkan volume penjualan bulan ini</p>
                  </div>
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>

                {/* Ranked List: Rank (1, 2, 3), Small thumbnail, Product Name, "X Terjual" */}
                <div className="divide-y divide-zinc-100 mt-2">
                  {BEST_SELLING_PRODUCTS.map((prod) => {
                    // Rank badge styling
                    let rankBadgeClass =
                      'bg-zinc-100 text-zinc-700 border border-zinc-200';
                    if (prod.rank === 1) {
                      rankBadgeClass =
                        'bg-amber-100 text-amber-800 border border-amber-300 font-bold';
                    } else if (prod.rank === 2) {
                      rankBadgeClass =
                        'bg-slate-200 text-slate-800 border border-slate-300 font-bold';
                    } else if (prod.rank === 3) {
                      rankBadgeClass =
                        'bg-amber-50 text-amber-900 border border-amber-200 font-bold';
                    }

                    return (
                      <div
                        key={prod.rank}
                        className="py-3.5 flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank Number */}
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${rankBadgeClass}`}
                          >
                            {prod.rank}
                          </div>

                          {/* Thumbnail */}
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Product Name & Category */}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-zinc-900 truncate">
                              {prod.name}
                            </h4>
                            <p className="text-[11px] text-zinc-500 mt-0.5">{prod.category}</p>
                          </div>
                        </div>

                        {/* "X Terjual" in muted text */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-zinc-900 block">
                            {formatRupiah(prod.revenue)}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-medium">
                            {prod.soldCount} {prod.unit} Terjual
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Card Link */}
              <div className="pt-4 border-t border-zinc-100">
                <button
                  onClick={() => {
                    setToastMessage({
                      title: 'Laporan Produk Terlaris',
                      desc: 'Membuka rincian analisis volume penjualan dan tren per kategori (PRD Bagian 18).',
                      type: 'info',
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-200 transition-colors"
                >
                  <span>Lihat Analisis Penjualan Lengkap</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* =====================================================================
          MODAL: PROCESS ORDER (Verifikasi & Ubah Status)
      ===================================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  Proses Pesanan #{selectedOrder.id}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Verifikasi pembayaran &amp; ubah tahapan pesanan pelanggan
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Details */}
            <div className="py-4 space-y-4 text-xs">
              <div className="bg-zinc-50 p-4 rounded-xl space-y-2 border border-zinc-200">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nama Pelanggan:</span>
                  <span className="font-bold text-zinc-900">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nomor WhatsApp:</span>
                  <span className="font-semibold text-zinc-800">{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Metode Pengambilan:</span>
                  <span className="font-semibold text-zinc-800">
                    {selectedOrder.channel === 'ONLINE_DELIVERY' && 'Antar Toko (Delivery)'}
                    {selectedOrder.channel === 'ONLINE_PICKUP' && 'Ambil Langsung (Pickup)'}
                    {selectedOrder.channel === 'OFFLINE_STORE' && 'Langsung di Toko (Walk-in)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ringkasan Item:</span>
                  <span className="font-medium text-zinc-800 text-right max-w-[240px]">
                    {selectedOrder.itemsSummary}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-200 font-bold text-sm">
                  <span className="text-zinc-900">Total Tagihan:</span>
                  <span className="text-zinc-900">{formatRupiah(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2">
                  Perbarui Status Pesanan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PENDING')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      selectedOrder.status === 'PENDING'
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PROCESSING')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      selectedOrder.status === 'PROCESSING'
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Diproses
                  </button>
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'COMPLETED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      selectedOrder.status === 'COMPLETED'
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PROCESSING')}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 shadow-xs transition-colors"
              >
                Verifikasi &amp; Kemas Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: RESTOCK INVENTORY (Stock In Form - PRD 9.3.7)
      ===================================================================== */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Restock Barang Masuk</h3>
                  <p className="text-xs text-zinc-500">Catat penambahan stok ke database</p>
                </div>
              </div>
              <button
                onClick={() => setRestockModalItem(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <p className="text-xs font-bold text-zinc-900">{restockModalItem.name}</p>
                <div className="flex justify-between text-zinc-500 mt-1">
                  <span>Kategori: {restockModalItem.category}</span>
                  <span className="font-bold text-rose-600">
                    Sisa Saat Ini: {restockModalItem.currentStock} {restockModalItem.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Jumlah Barang Masuk ({restockModalItem.unit}):
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Number(e.target.value))}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Supplier / Catatan Nota:
                </label>
                <input
                  type="text"
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setRestockModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRestock}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 shadow-xs transition-colors"
              >
                Simpan Stok Masuk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOAST FEEDBACK NOTIFICATION
      ===================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl border border-zinc-800 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg mt-0.5 shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold text-white">{toastMessage.title}</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
              {toastMessage.desc}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
