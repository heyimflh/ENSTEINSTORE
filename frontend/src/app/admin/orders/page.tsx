'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Boxes,
  Store,
  BarChart3,
  Search,
  Eye,
  X,
  Filter,
  Calendar,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  LogOut,
  Bell,
  Menu,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Truck,
  CreditCard,
  ArrowRight,
  RefreshCw,
  User,
  XCircle,
  Receipt,
} from 'lucide-react';

// ============================================================================
// DATA MODELS & TYPES (PRD SECTION 11.1 & 13.4.9)
// ============================================================================

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export type SalesChannel = 'ONLINE' | 'OFFLINE';

export type FulfillmentMethod = 'DELIVERY' | 'PICKUP' | 'IN_STORE';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string; // e.g., #EST-20261116-0042
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  date: string;
  salesChannel: SalesChannel;
  fulfillmentMethod: FulfillmentMethod;
  deliveryAddress?: string;
  paymentMethod: string;
  status: OrderStatus;
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  notes?: string;
  items: OrderItem[];
}

// Initial Mock Dataset for Toko Enstein rainwear business
const INITIAL_ORDERS: AdminOrder[] = [
  {
    id: 'ord-001',
    orderNumber: 'EST-20261116-0042',
    customerName: 'Bu Rina (Konveksi Barokah)',
    customerPhone: '0812-9876-5432',
    customerEmail: 'rina.konveksi@gmail.com',
    date: '16 Nov 2026, 14:15',
    salesChannel: 'ONLINE',
    fulfillmentMethod: 'DELIVERY',
    deliveryAddress: 'Jl. Kertanegara No. 45, Tanahsari, Kebumen, Jawa Tengah',
    paymentMethod: 'Transfer Bank BCA (Manual)',
    status: 'PENDING_PAYMENT',
    subtotalAmount: 870000,
    deliveryFee: 15000,
    totalAmount: 885000,
    notes: 'Mohon dicek apakah bahan warna merah roll utuh tanpa cacat sambungan.',
    items: [
      {
        id: 'item-1',
        productId: 'prd-001',
        productName: 'Kain PVC Balon 0.15mm Merah',
        sku: 'PVC-RED-015',
        unit: 'Meter',
        quantity: 25,
        unitPrice: 25000,
        subtotal: 625000,
        imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'item-2',
        productId: 'prd-004',
        productName: 'Resleting Waterproof 70cm Hitam',
        sku: 'ZIP-WP-070-BLK',
        unit: 'Pcs',
        quantity: 10,
        unitPrice: 12500,
        subtotal: 125000,
        imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'item-3',
        productId: 'prd-008',
        productName: 'Karet Elastis 2.5cm Grade A Hitam',
        sku: 'ELAS-BLK-025',
        unit: 'Meter',
        quantity: 30,
        unitPrice: 4000,
        subtotal: 120000,
        imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    id: 'ord-002',
    orderNumber: 'EST-20261116-0039',
    customerName: 'Pak Hadi (Sentosa Tailor)',
    customerPhone: '0857-3344-9988',
    customerEmail: 'hadi.sentosa@yahoo.com',
    date: '16 Nov 2026, 11:30',
    salesChannel: 'ONLINE',
    fulfillmentMethod: 'PICKUP',
    deliveryAddress: 'Ambil di Toko Enstein (Jl. Kertanegara Km. 03 Tanahsari, Kebumen)',
    paymentMethod: 'Transfer Bank Mandiri',
    status: 'PROCESSING',
    subtotalAmount: 1330000,
    deliveryFee: 0,
    totalAmount: 1330000,
    notes: 'Akan diambil sore sekitar jam 16:30 oleh pegawai konveksi.',
    items: [
      {
        id: 'item-4',
        productId: 'prd-002',
        productName: 'Kain PVC Balon 0.15mm Biru Navy',
        sku: 'PVC-BLU-015',
        unit: 'Meter',
        quantity: 50,
        unitPrice: 25000,
        subtotal: 125000,
        imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'item-5',
        productId: 'prd-006',
        productName: 'Kancing Snap Button Besi 15mm Anti-Karat',
        sku: 'SNAP-MET-015',
        unit: 'Pcs',
        quantity: 100,
        unitPrice: 800,
        subtotal: 80000,
        imageUrl: 'https://images.unsplash.com/photo-1608248597359-001097e3a8fa?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    id: 'ord-003',
    orderNumber: 'EST-20261116-0037',
    customerName: 'Walk-in Customer (Toko Fisik)',
    customerPhone: '0813-2211-4455',
    customerEmail: undefined,
    date: '16 Nov 2026, 09:45',
    salesChannel: 'OFFLINE',
    fulfillmentMethod: 'IN_STORE',
    deliveryAddress: 'Transaksi Kasir Fisik Toko Enstein Kebumen',
    paymentMethod: 'Tunai Kasir (Cash)',
    status: 'COMPLETED',
    subtotalAmount: 279000,
    deliveryFee: 0,
    totalAmount: 279000,
    notes: 'Pelanggan beli langsung di toko untuk perbaikan jas hujan motor robek.',
    items: [
      {
        id: 'item-6',
        productId: 'prd-003',
        productName: 'Kain Mika Transparan 0.20mm Super Clear',
        sku: 'MIKA-CLR-020',
        unit: 'Meter',
        quantity: 5,
        unitPrice: 32000,
        subtotal: 160000,
        imageUrl: 'https://images.unsplash.com/photo-1608248597359-001097e3a8fa?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'item-7',
        productId: 'prd-005',
        productName: 'Resleting Vislon Heavy Duty 60cm',
        sku: 'ZIP-VIS-060-BLU',
        unit: 'Pcs',
        quantity: 4,
        unitPrice: 8500,
        subtotal: 34000,
        imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'item-8',
        productId: 'prd-009',
        productName: 'Seam Sealing Tape Panas 20mm (1 Roll / 100m)',
        sku: 'TAPE-SEAM-020',
        unit: 'Roll',
        quantity: 1,
        unitPrice: 85000,
        subtotal: 85000,
        imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    id: 'ord-004',
    orderNumber: 'EST-20261115-0088',
    customerName: 'Budi Santoso',
    customerPhone: '0878-1122-3344',
    customerEmail: 'budi.santoso@gmail.com',
    date: '15 Nov 2026, 16:10',
    salesChannel: 'ONLINE',
    fulfillmentMethod: 'DELIVERY',
    deliveryAddress: 'Jl. Pemuda No. 12, Panjer, Kebumen, Jawa Tengah',
    paymentMethod: 'Transfer Bank BRI',
    status: 'PAID',
    subtotalAmount: 575000,
    deliveryFee: 15000,
    totalAmount: 590000,
    notes: 'Kirim saat jam kerja kantor.',
    items: [
      {
        id: 'item-9',
        productId: 'prd-001',
        productName: 'Kain PVC Balon 0.15mm Merah',
        sku: 'PVC-RED-015',
        unit: 'Meter',
        quantity: 15,
        unitPrice: 25000,
        subtotal: 375000,
        imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'item-10',
        productId: 'prd-008',
        productName: 'Karet Elastis 2.5cm Grade A Hitam',
        sku: 'ELAS-BLK-025',
        unit: 'Meter',
        quantity: 50,
        unitPrice: 4000,
        subtotal: 200000,
        imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    id: 'ord-005',
    orderNumber: 'EST-20261115-0084',
    customerName: 'CV Jas Mandiri Kebumen',
    customerPhone: '0819-7788-9900',
    customerEmail: 'order@jasmandiri.co.id',
    date: '15 Nov 2026, 13:20',
    salesChannel: 'ONLINE',
    fulfillmentMethod: 'DELIVERY',
    deliveryAddress: 'Kawasan Sentra Industri Muktisari No. 8, Kebumen',
    paymentMethod: 'Transfer Bank BCA',
    status: 'READY',
    subtotalAmount: 3295000,
    deliveryFee: 25000,
    totalAmount: 3320000,
    notes: 'Pesanan partai besar material jas hujan standar BPBD.',
    items: [
      {
        id: 'item-11',
        productId: 'prd-001',
        productName: 'Kain PVC Balon 0.15mm Merah',
        sku: 'PVC-RED-015',
        unit: 'Meter',
        quantity: 100,
        unitPrice: 25000,
        subtotal: 2500000,
        imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'item-12',
        productId: 'prd-004',
        productName: 'Resleting Waterproof 70cm Hitam',
        sku: 'ZIP-WP-070-BLK',
        unit: 'Pcs',
        quantity: 50,
        unitPrice: 12500,
        subtotal: 625000,
        imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'item-13',
        productId: 'prd-009',
        productName: 'Seam Sealing Tape Panas 20mm (1 Roll / 100m)',
        sku: 'TAPE-SEAM-020',
        unit: 'Roll',
        quantity: 2,
        unitPrice: 85000,
        subtotal: 170000,
        imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    id: 'ord-006',
    orderNumber: 'EST-20261114-0019',
    customerName: 'Agus Prasetyo',
    customerPhone: '0821-4455-6677',
    customerEmail: 'agus.pras@gmail.com',
    date: '14 Nov 2026, 10:00',
    salesChannel: 'ONLINE',
    fulfillmentMethod: 'PICKUP',
    deliveryAddress: 'Ambil di Toko',
    paymentMethod: 'Transfer Bank BNI',
    status: 'CANCELLED',
    subtotalAmount: 250000,
    deliveryFee: 0,
    totalAmount: 250000,
    notes: 'Batal karena melewati batas waktu pembayaran 24 jam.',
    items: [
      {
        id: 'item-14',
        productId: 'prd-002',
        productName: 'Kain PVC Balon 0.15mm Biru Navy',
        sku: 'PVC-BLU-015',
        unit: 'Meter',
        quantity: 10,
        unitPrice: 25000,
        subtotal: 250000,
        imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
];

// Helper: Format Rupiah
const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

// ============================================================================
// MAIN COMPONENT: ADMIN ORDERS
// ============================================================================

export default function AdminOrdersPage() {
  // Navigation & UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<AdminOrder[]>(INITIAL_ORDERS);

  // Filter States (FR-26)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('ALL');

  // Slide-out Drawer State (FR-27)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<OrderStatus>('PENDING_PAYMENT');

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Sync drawer pending status when an order is selected
  useEffect(() => {
    if (selectedOrder) {
      setPendingStatusUpdate(selectedOrder.status);
    }
  }, [selectedOrder]);

  // Handle Save Status Transition (State Machine: PRD 11.1)
  const handleSaveStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const previousStatus = selectedOrder.status;
    const newStatus = pendingStatusUpdate;

    // Update in order list
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === selectedOrder.id ? { ...ord, status: newStatus } : ord
      )
    );

    // Update current selected order preview
    setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));

    // Toast feedback detailing the transition
    setToastMessage({
      title: 'Status Pesanan Berhasil Diperbarui',
      desc: `Pesanan #${selectedOrder.orderNumber} diubah dari ${previousStatus} menjadi ${newStatus}. Perubahan stok telah disinkronkan (PRD 11.1).`,
      type: 'success',
    });
  };

  // Filtered Orders Logic (FR-26)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search matching (Order Number, Customer Name, or Phone)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        (order.customerPhone && order.customerPhone.includes(q));

      // Status matching
      const matchesStatus =
        statusFilter === 'ALL' || order.status === statusFilter;

      // Channel matching
      const matchesChannel =
        channelFilter === 'ALL' || order.salesChannel === channelFilter;

      // Date matching (demo filters: 'ALL', 'TODAY' (16 Nov), 'WEEK')
      let matchesDate = true;
      if (dateRangeFilter === 'TODAY') {
        matchesDate = order.date.includes('16 Nov 2026');
      } else if (dateRangeFilter === 'YESTERDAY') {
        matchesDate = order.date.includes('15 Nov 2026');
      }

      return matchesSearch && matchesStatus && matchesChannel && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, channelFilter, dateRangeFilter]);

  // Status Badge Component Helper (Color-coded aesthetic badges)
  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Payment
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Check className="w-3 h-3 text-sky-600" />
            Paid (Lunas)
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <RefreshCw className="w-3 h-3 text-indigo-600" />
            Processing
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Package className="w-3 h-3 text-teal-600" />
            Ready for Fulfillment
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased flex flex-col">
      {/* =====================================================================
          1. THE STANDARDIZED ADMIN SIDEBAR
          (Consistent top brand header, red 'E', dual typo, glass ADMIN badge)
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

            {/* Orders (ACTIVE) */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl bg-zinc-900 text-white shadow-xs transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-zinc-200" />
              <span>Pesanan</span>
              <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                4 Baru
              </span>
            </button>

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
                5 Kritis
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
                href="/admin/offline"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
              >
                <Store className="w-4 h-4" />
                <span>Penjualan Offline</span>
                <span className="ml-auto bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase">
                  POS
                </span>
              </Link>

              <Link
                href="/admin/reports"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Laporan</span>
                <span className="ml-auto text-[11px] text-zinc-500 font-mono">CSV</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* BOTTOM PROFILE */}
        <div className="p-4 border-t border-zinc-900/50 space-y-3 shrink-0">
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
              onClick={() => {
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
        {/* TOPBAR */}
        <header className="h-20 bg-white border-b border-zinc-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-400 font-medium">Manajemen</span>
              <span className="text-zinc-300">/</span>
              <span className="text-zinc-900 font-semibold tracking-tight">Pesanan</span>
              <span className="hidden sm:inline-flex ml-3 items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Database Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Selasa, 17 Nov 2026</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                title="Pemberitahuan Sistem"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl p-4 z-50 text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <h4 className="font-bold text-sm text-zinc-900">Notifikasi Pesanan</h4>
                    <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                      4 Baru
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                    Pesanan #{orders[0].orderNumber} dari {orders[0].customerName} menunggu verifikasi bukti transfer.
                  </p>
                  <div className="pt-2 mt-2 border-t border-zinc-100 text-center">
                    <button
                      onClick={() => setNotificationOpen(false)}
                      className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-zinc-300 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  PE
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* ===================================================================
            PAGE CONTENT & ADVANCED FILTERS
        =================================================================== */}
        <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* PAGE HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                  Manajemen Pesanan
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700">
                  {orders.length} Transaksi
                </span>
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                Pantau antrean pesanan online &amp; offline, verifikasi pembayaran, dan atur tahapan pengiriman (PRD 9.3.4 &amp; 11.1).
              </p>
            </div>

            {/* Quick Refresh & Summary */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setToastMessage({
                    title: 'Memperbarui Antrean Pesanan...',
                    desc: 'Data transaksi online dan kasir offline berhasil disinkronkan.',
                    type: 'info',
                  });
                }}
                className="p-2.5 text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl shadow-xs transition-colors flex items-center gap-2 text-xs font-semibold"
                title="Sinkronisasi Pesanan"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* =================================================================
              3. DATA TABLE SECTION (p-8 pt-6)
          ================================================================= */}
          {/* ADVANCED FILTER BAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left (Search): Search input with Search icon */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari Nomor Order atau Nama Pelanggan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all shadow-xs"
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

            {/* Right: Date Picker trigger, Channel, & Status Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Filter */}
              <div className="relative">
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="appearance-none bg-white border border-zinc-200 rounded-lg pl-8 pr-9 py-2.5 text-xs font-semibold text-zinc-700 hover:border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 shadow-xs cursor-pointer transition-colors"
                >
                  <option value="ALL">Semua Tanggal</option>
                  <option value="TODAY">Hari Ini (16 Nov)</option>
                  <option value="YESTERDAY">Kemarin (15 Nov)</option>
                </select>
                <Calendar className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Channel Filter (FR-26: Online vs Offline) */}
              <div className="relative">
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="appearance-none bg-white border border-zinc-200 rounded-lg px-4 py-2.5 pr-9 text-xs font-semibold text-zinc-700 hover:border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 shadow-xs cursor-pointer transition-colors"
                >
                  <option value="ALL">Semua Channel</option>
                  <option value="ONLINE">Online Store</option>
                  <option value="OFFLINE">In-Store / Kasir</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-zinc-200 rounded-lg px-4 py-2.5 pr-9 text-xs font-semibold text-zinc-700 hover:border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 shadow-xs cursor-pointer transition-colors"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="PAID">Paid (Lunas)</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="READY">Ready</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* THE TABLE */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-4 px-6">ORDER ID</th>
                    <th className="py-4 px-6">PELANGGAN</th>
                    <th className="py-4 px-6">TANGGAL</th>
                    <th className="py-4 px-6">CHANNEL</th>
                    <th className="py-4 px-6">TOTAL</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-right">AKSI</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {/* Order ID: Bold Text */}
                        <td className="py-4 px-6 font-mono font-bold text-zinc-900 whitespace-nowrap">
                          <span className="text-zinc-900 group-hover:underline">
                            #{order.orderNumber}
                          </span>
                        </td>

                        {/* Customer: Name + subtext phone */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-zinc-900">
                            {order.customerName}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {order.customerPhone || 'Walk-in / Tanpa No. HP'}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-6 text-zinc-500 whitespace-nowrap">
                          {order.date}
                        </td>

                        {/* Channel: Small pill (Online vs Offline) */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          {order.salesChannel === 'ONLINE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              In-Store
                            </span>
                          )}
                        </td>

                        {/* Total: Formatted in Rupiah */}
                        <td className="py-4 px-6 whitespace-nowrap font-bold text-zinc-900">
                          {formatRupiah(order.totalAmount)}
                        </td>

                        {/* Status: Color-coded aesthetic badges */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          {renderStatusBadge(order.status)}
                        </td>

                        {/* Actions: Ghost button "Lihat Detail" */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Lihat Detail</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        <ShoppingBag className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                        <p className="text-sm font-semibold text-zinc-700">
                          Tidak ada pesanan yang cocok
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Coba atur ulang kata kunci pencarian atau sesuaikan filter channel/status.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Menampilkan <strong>{filteredOrders.length}</strong> dari{' '}
                <strong>{orders.length}</strong> pesanan transaksi
              </span>
              <span className="text-[11px] text-zinc-400">
                Data terpusat tabel `orders` &amp; `order_items` (PRD 13.4.9)
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* =====================================================================
          4. ORDER DETAIL & STATUS UPDATE DRAWER (Slide-out panel)
          (w-full max-w-xl bg-white shadow-2xl border-l border-zinc-200 z-50)
      ===================================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Dark Overlay */}
          <div
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />

          {/* Drawer Shell */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl border-l border-zinc-200 z-50 flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
            {/* Header: Order Number and Close button */}
            <div className="h-20 px-6 sm:px-8 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight font-mono">
                      #{selectedOrder.orderNumber}
                    </h3>
                    {selectedOrder.salesChannel === 'ONLINE' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Online
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        In-Store
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Dibuat pada {selectedOrder.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body (p-8 space-y-8 bg-zinc-50 overflow-y-auto) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-zinc-50 text-xs">
              {/* SECTION 1: Customer & Fulfillment Info */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-500" />
                    <span>Informasi Pelanggan &amp; Pengiriman</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    {selectedOrder.fulfillmentMethod === 'DELIVERY' && 'Antar Toko (Delivery)'}
                    {selectedOrder.fulfillmentMethod === 'PICKUP' && 'Ambil di Toko (Pickup)'}
                    {selectedOrder.fulfillmentMethod === 'IN_STORE' && 'Kasir Fisik Langsung'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Nama Pembeli</span>
                    <span className="font-semibold text-zinc-900 text-sm mt-0.5 block">
                      {selectedOrder.customerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[11px]">Nomor WhatsApp / Telepon</span>
                    <span className="font-semibold text-zinc-800 text-xs mt-0.5 block flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      {selectedOrder.customerPhone || 'Tidak dicantumkan'}
                    </span>
                  </div>

                  {selectedOrder.customerEmail && (
                    <div>
                      <span className="text-zinc-400 block text-[11px]">Alamat Email</span>
                      <span className="text-zinc-700 text-xs mt-0.5 block flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" />
                        {selectedOrder.customerEmail}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-zinc-400 block text-[11px]">Metode Pembayaran</span>
                    <span className="text-zinc-800 font-medium text-xs mt-0.5 block flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                      {selectedOrder.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Delivery Address Box */}
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 mt-2">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-zinc-800 block text-xs">
                        Tujuan Pengiriman / Titik Pengambilan:
                      </span>
                      <p className="text-zinc-600 mt-0.5 text-xs leading-relaxed">
                        {selectedOrder.deliveryAddress || 'Ambil langsung di gerai Toko Enstein.'}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="text-[11px] text-zinc-500 bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl">
                    <span className="font-bold text-amber-900 block mb-0.5">Catatan Pesanan:</span>
                    {selectedOrder.notes}
                  </div>
                )}
              </div>

              {/* SECTION 2: Order Items */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-zinc-500" />
                    <span>Daftar Produk Pesanan ({selectedOrder.items.length} Item)</span>
                  </h4>
                </div>

                <div className="divide-y divide-zinc-100">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 text-xs truncate">
                            {item.productName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                            <span className="font-mono bg-zinc-100 px-1.5 py-0.2 rounded text-zinc-600">
                              {item.sku}
                            </span>
                            <span>•</span>
                            <span>
                              {formatRupiah(item.unitPrice)} / {item.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-zinc-900 text-xs block">
                          {formatRupiah(item.subtotal)}
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-500">
                          Qty: {item.quantity} {item.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal, Delivery Fee & Grand Total */}
                <div className="pt-4 border-t border-zinc-100 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal Produk:</span>
                    <span className="font-medium text-zinc-800">
                      {formatRupiah(selectedOrder.subtotalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Biaya Ongkir / Antar Toko:</span>
                    <span className="font-medium text-zinc-800">
                      {selectedOrder.deliveryFee > 0
                        ? formatRupiah(selectedOrder.deliveryFee)
                        : 'Gratis (Ambil di Toko)'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold text-zinc-900">
                    <span>Total Tagihan:</span>
                    <span>{formatRupiah(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Update Status Control (State Machine PRD 11.1) */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs border-l-4 border-l-zinc-900 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-zinc-700" />
                    <span>Perbarui Status Pesanan</span>
                  </h4>
                  <div>{renderStatusBadge(selectedOrder.status)}</div>
                </div>

                {/* State Machine Flow Indicator */}
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase block mb-1.5">
                    Alur Transisi Status (PRD Section 11.1):
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 flex-wrap">
                    <span className={selectedOrder.status === 'PENDING_PAYMENT' ? 'text-amber-700 font-bold' : ''}>
                      Pending
                    </span>
                    <ArrowRight className="w-2.5 h-2.5 text-zinc-400" />
                    <span className={selectedOrder.status === 'PAID' ? 'text-sky-700 font-bold' : ''}>
                      Paid
                    </span>
                    <ArrowRight className="w-2.5 h-2.5 text-zinc-400" />
                    <span className={selectedOrder.status === 'PROCESSING' ? 'text-indigo-700 font-bold' : ''}>
                      Processing
                    </span>
                    <ArrowRight className="w-2.5 h-2.5 text-zinc-400" />
                    <span className={selectedOrder.status === 'READY' ? 'text-teal-700 font-bold' : ''}>
                      Ready
                    </span>
                    <ArrowRight className="w-2.5 h-2.5 text-zinc-400" />
                    <span className={selectedOrder.status === 'COMPLETED' ? 'text-emerald-700 font-bold' : ''}>
                      Completed
                    </span>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Ubah Tahapan Pesanan:
                  </label>
                  <select
                    value={pendingStatusUpdate}
                    onChange={(e) => setPendingStatusUpdate(e.target.value as OrderStatus)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 shadow-xs cursor-pointer transition-all"
                  >
                    <option value="PENDING_PAYMENT">PENDING_PAYMENT (Menunggu Bukti Transfer)</option>
                    <option value="PAID">PAID (Pembayaran Terverifikasi Lunas)</option>
                    <option value="PROCESSING">PROCESSING (Sedang Dikemas di Toko)</option>
                    <option value="READY">READY (Siap Diambil / Siap Diantar Kurir)</option>
                    <option value="COMPLETED">COMPLETED (Pesanan Diterima Pelanggan / Selesai)</option>
                    <option value="CANCELLED">CANCELLED (Dibatalkan / Lepas Reservasi Stok)</option>
                  </select>
                </div>

                {/* Helper text */}
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Perubahan status akan langsung memperbarui data stok produk terkait (PRD 11.1). Jika dibatalkan (`CANCELLED`), seluruh kuantitas reservasi akan dikembalikan otomatis ke stok aktif.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-zinc-200 flex items-center justify-end gap-3 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveStatusUpdate}
                className="bg-zinc-900 text-white px-6 py-2.5 text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOAST NOTIFICATION FEEDBACK
      ===================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl border border-zinc-800 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
              toastMessage.type === 'warning'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {toastMessage.type === 'warning' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
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
