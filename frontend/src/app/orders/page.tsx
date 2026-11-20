'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ShoppingCart,
  User,
  Menu,
  ShieldCheck,
  Mail,
  Receipt,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Store,
  Filter,
  Eye,
  CreditCard,
  AlertCircle,
  HelpCircle,
  X,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  FileText,
  ChevronDown,
  Info,
} from 'lucide-react';

// ============================================================================
// TYPES & ENUMS (PRD & DATA SPECIFICATIONS)
// ============================================================================

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'UNPAID'
  | 'WAITING_VERIFICATION'
  | 'PAID'
  | 'EXPIRED'
  | 'CANCELLED';

export type TabKey =
  | 'SEMUA'
  | 'BELUM_BAYAR'
  | 'SEDANG_DIPROSES'
  | 'SELESAI'
  | 'DIBATALKAN';

export interface OrderItem {
  id: string;
  name: string;
  variant: string;
  quantity: number;
  unit: 'meter' | 'pcs' | 'roll';
  price: number;
  subtotal: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  deliveryAddress?: string;
  shippingCourier?: string;
  trackingNumber?: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  paymentDeadline?: string;
  cancellationReason?: string;
  items: OrderItem[];
}

// ============================================================================
// MOCK DATA (STRICT PRD BUSINESS RULES & DIVERSE STATUSES)
// ============================================================================

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    orderNumber: '#EST-20261115-0042',
    createdAt: '15 Nov 2026, 21:15 WIB',
    orderStatus: 'PENDING_PAYMENT',
    paymentStatus: 'UNPAID',
    paymentMethod: 'Transfer Bank BCA (Virtual Account)',
    fulfillmentType: 'DELIVERY',
    deliveryAddress: 'Jl. Rancabolang No. 14, Gedebage, Bandung, Jawa Barat (Konveksi Barokah)',
    shippingCourier: 'J&T Express - Regular (2-3 Hari)',
    subtotal: 245500,
    shippingFee: 15000,
    discount: 0,
    totalAmount: 260500,
    paymentDeadline: '16 Nov 2026, 21:15 WIB (Sisa 23 jam)',
    items: [
      {
        id: 'item-101',
        name: 'Kain PVC Balon Waterproof 0.18mm Navy',
        variant: 'Navy Premium / Lebar 150cm',
        quantity: 5,
        unit: 'meter',
        price: 38000,
        subtotal: 190000,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCNavy.jpeg',
      },
      {
        id: 'item-102',
        name: 'Resleting Waterproof 70cm Hitam Heavy-Duty',
        variant: 'Hitam Matte / Gigi Rapat Seal TPU',
        quantity: 3,
        unit: 'pcs',
        price: 8500,
        subtotal: 25500,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
      },
      {
        id: 'item-103',
        name: 'Kancing Cetik Besi 15mm Anti-Karat Gunmetal',
        variant: 'Gunmetal Anti Karat / 15mm',
        quantity: 20,
        unit: 'pcs',
        price: 1500,
        subtotal: 30000,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg',
      },
    ],
  },
  {
    id: 'ord-002',
    orderNumber: '#EST-20261114-0028',
    createdAt: '14 Nov 2026, 10:20 WIB',
    orderStatus: 'PROCESSING',
    paymentStatus: 'PAID',
    paymentMethod: 'Transfer Bank Mandiri',
    fulfillmentType: 'PICKUP',
    deliveryAddress: 'Ambil di Toko Enstein (Jl. Kertanegara Km. 03 Tanahsari, Kebumen)',
    shippingCourier: 'Self Pickup / Ambil Mandiri',
    subtotal: 565000,
    shippingFee: 0,
    discount: 0,
    totalAmount: 565000,
    items: [
      {
        id: 'item-201',
        name: 'Kain Taslan Balon Waterproof Hitam Pekat',
        variant: 'Hitam Pekat / Coating Balon Tebal',
        quantity: 12,
        unit: 'meter',
        price: 45000,
        subtotal: 540000,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHitam.jpeg',
      },
      {
        id: 'item-202',
        name: 'Karet Elastis Pipih 2.5cm Putih Salju',
        variant: 'Putih / Elastisitas Tinggi Konveksi',
        quantity: 10,
        unit: 'meter',
        price: 2500,
        subtotal: 25000,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikPutih.jpeg',
      },
    ],
  },
  {
    id: 'ord-003',
    orderNumber: '#EST-20261113-0019',
    createdAt: '13 Nov 2026, 16:45 WIB',
    orderStatus: 'READY',
    paymentStatus: 'PAID',
    paymentMethod: 'QRIS Dinamis Toko Enstein',
    fulfillmentType: 'PICKUP',
    deliveryAddress: 'Siap di Counter Toko (Tanahsari, Kebumen)',
    shippingCourier: 'Siap Diambil di Toko',
    subtotal: 316000,
    shippingFee: 0,
    discount: 0,
    totalAmount: 316000,
    items: [
      {
        id: 'item-301',
        name: 'Mika Transparan Elastis 0.25mm Lembaran',
        variant: 'Super Clear Transparan / 0.25mm',
        quantity: 8,
        unit: 'meter',
        price: 32000,
        subtotal: 256000,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
      },
      {
        id: 'item-302',
        name: 'Pita Skotlet Reflektif 2.5cm Silver Safety',
        variant: 'Silver Reflektif / High Visibility',
        quantity: 15,
        unit: 'meter',
        price: 4000,
        subtotal: 60000,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg',
      },
    ],
  },
  {
    id: 'ord-004',
    orderNumber: '#EST-20261110-0012',
    createdAt: '10 Nov 2026, 09:12 WIB',
    orderStatus: 'COMPLETED',
    paymentStatus: 'PAID',
    paymentMethod: 'Transfer Bank BCA',
    fulfillmentType: 'DELIVERY',
    deliveryAddress: 'Jl. Mayor Basuno No. 22, Pejagoan, Kebumen',
    shippingCourier: 'JNE Trucking / Cargo (Resi: JNE8829102931)',
    trackingNumber: 'JNE8829102931',
    subtotal: 1155000,
    shippingFee: 45000,
    discount: 0,
    totalAmount: 1200000,
    items: [
      {
        id: 'item-401',
        name: 'Kain Parasut Balon Ripstop Orange Neon',
        variant: 'Orange Neon Safety / Grid Ripstop Kotak',
        quantity: 20,
        unit: 'meter',
        price: 48000,
        subtotal: 960000,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSalem.jpeg',
      },
      {
        id: 'item-402',
        name: 'Resleting Vislon No. 5 Gigi Kasar 80cm',
        variant: 'Hitam Gigi Tebal / Open End Slider',
        quantity: 10,
        unit: 'pcs',
        price: 9000,
        subtotal: 90000,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ResletingHitam.jpg',
      },
      {
        id: 'item-403',
        name: 'Kancing Jepret Plastik T5 Hitam Doff',
        variant: 'Hitam Doff / Polyacetal Tahan Air',
        quantity: 50,
        unit: 'pcs',
        price: 800,
        subtotal: 40000,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingHitam.jpeg',
      },
      {
        id: 'item-404',
        name: 'Seam Sealing Tape Waterproof 20mm Hot Air',
        variant: '2 Layer Tape / 50 Meter Roll',
        quantity: 1,
        unit: 'roll',
        price: 65000,
        subtotal: 65000,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SilenMantel.webp',
      },
    ],
  },
  {
    id: 'ord-005',
    orderNumber: '#EST-20261108-0005',
    createdAt: '08 Nov 2026, 13:00 WIB',
    orderStatus: 'CANCELLED',
    paymentStatus: 'EXPIRED',
    paymentMethod: 'Transfer Bank BRI',
    fulfillmentType: 'DELIVERY',
    deliveryAddress: 'Jl. Kutoarjo Km. 2, Panjer, Kebumen',
    shippingCourier: 'SiCepat Regular',
    subtotal: 780000,
    shippingFee: 22000,
    discount: 0,
    totalAmount: 802000,
    cancellationReason:
      'Melewati batas waktu pembayaran 24 jam. Reservasi stok telah dikembalikan ke inventaris toko.',
    items: [
      {
        id: 'item-501',
        name: 'Kain Oxford Waterproof 600D Abu-abu Baja',
        variant: 'Abu Baja / PU Coated Tahan Sobek',
        quantity: 15,
        unit: 'meter',
        price: 52000,
        subtotal: 780000,
        imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSage.jpg',
      },
    ],
  },
];

// Format currency IDR
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================================
// MAIN COMPONENT: MY ORDERS PAGE
// ============================================================================

export default function MyOrdersPage() {
  const router = useRouter();

  // State management
  const [orders, setOrders] = useState<Order[]>(INITIAL_MOCK_ORDERS);
  const [activeTab, setActiveTab] = useState<TabKey>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchNavQuery, setSearchNavQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Quick view / detail modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter tab definitions with counts
  const tabCounts = useMemo(() => {
    return {
      SEMUA: orders.length,
      BELUM_BAYAR: orders.filter((o) => o.orderStatus === 'PENDING_PAYMENT').length,
      SEDANG_DIPROSES: orders.filter((o) =>
        ['PAID', 'PROCESSING', 'READY'].includes(o.orderStatus)
      ).length,
      SELESAI: orders.filter((o) => o.orderStatus === 'COMPLETED').length,
      DIBATALKAN: orders.filter((o) => o.orderStatus === 'CANCELLED').length,
    };
  }, [orders]);

  // Filtered orders according to active tab and optional search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Tab filtering logic
      let matchesTab = true;
      if (activeTab === 'BELUM_BAYAR') {
        matchesTab = order.orderStatus === 'PENDING_PAYMENT';
      } else if (activeTab === 'SEDANG_DIPROSES') {
        matchesTab = ['PAID', 'PROCESSING', 'READY'].includes(order.orderStatus);
      } else if (activeTab === 'SELESAI') {
        matchesTab = order.orderStatus === 'COMPLETED';
      } else if (activeTab === 'DIBATALKAN') {
        matchesTab = order.orderStatus === 'CANCELLED';
      }

      // 2. Search query filter
      if (!matchesTab) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchOrderNum = order.orderNumber.toLowerCase().includes(q);
      const matchPaymentMethod = order.paymentMethod.toLowerCase().includes(q);
      const matchItems = order.items.some((item) =>
        item.name.toLowerCase().includes(q) || item.variant.toLowerCase().includes(q)
      );

      return matchOrderNum || matchPaymentMethod || matchItems;
    });
  }, [orders, activeTab, searchQuery]);

  // Copy order number to clipboard helper
  const handleCopyOrderNumber = (e: React.MouseEvent, orderNumber: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(orderNumber);
    setCopiedOrderId(orderNumber);
    setTimeout(() => {
      setCopiedOrderId(null);
    }, 2000);
  };

  // Helper to get raw ID for payment route
  const getOrderSlug = (order: Order) => {
    return order.orderNumber.replace('#', '');
  };

  // Navigation handlers
  const handlePayNow = (order: Order) => {
    const slug = getOrderSlug(order);
    router.push(`/orders/${slug}/payment`);
  };

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950">
      {/* =================================================================== */}
      {/* 1. STANDARDIZED GLOBAL NAVBAR (Consistent with All Pages)           */}
      {/* =================================================================== */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-zinc-200 transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-zinc-100 p-1 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0">
                  <img
                    src="/ensteinlogo.png"
                    alt="Logo Toko Enstein"
                    width={36}
                    height={36}
                    style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold tracking-tight text-zinc-900 uppercase">
                    ENSTEIN<span className="text-amber-500 font-black">STORE</span>
                  </span>
                  <span className="text-[10px] tracking-widest uppercase font-medium text-zinc-400">
                    Kebumen • Jawa Tengah
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center space-x-10">
              <Link
                href="/"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                href="/products"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                Catalog
              </Link>
              <Link
                href="/#categories"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                Categories
              </Link>
              <Link
                href="/#about"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                About Store
              </Link>
              <Link
                href="/orders"
                className="text-sm font-semibold text-zinc-900 border-b-2 border-zinc-900 pb-0.5 transition-colors duration-200"
              >
                My Orders
              </Link>
            </div>

            {/* Right: Actions (Search, Cart, Profile) */}
            <div className="flex items-center space-x-4">
              
              {/* Search Bar Input */}
              <div className="relative hidden lg:block">
                <input
                  type="text"
                  placeholder="Search fabric, zipper, snap..."
                  value={searchNavQuery}
                  onChange={(e) => setSearchNavQuery(e.target.value)}
                  className="w-52 pl-9 pr-4 py-2 text-xs bg-zinc-100 hover:bg-zinc-200/60 focus:bg-white border border-transparent focus:border-zinc-300 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:w-64 transition-all duration-300"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>

              {/* Cart Drawer Trigger / Link */}
              <Link
                href="/cart"
                aria-label="Keranjang Belanja"
                className="relative p-2.5 rounded-full text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors duration-200"
              >
                <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-zinc-900 rounded-full">
                  3
                </span>
              </Link>

              {/* Profile / Account Button */}
              <Link
                href="/profile"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-900 text-zinc-800 text-xs font-medium transition-all duration-200 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white/95 backdrop-blur-md px-6 py-6 space-y-4">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchNavQuery}
                onChange={(e) => setSearchNavQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-100 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            </div>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-900"
            >
              Home
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Catalog
            </Link>
            <Link
              href="/#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Categories
            </Link>
            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              About Store
            </Link>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-zinc-900"
            >
              My Orders
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Shopping Cart (3)
            </Link>
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900 border-t border-zinc-100 pt-3"
            >
              Account Profile
            </Link>
          </div>
        )}
      </nav>

      {/* =================================================================== */}
      {/* 2. PAGE HEADER & FILTER TABS                                        */}
      {/* pt-12 px-4 md:px-12 xl:px-40                                        */}
      {/* =================================================================== */}
      <section className="pt-12 px-4 md:px-12 xl:px-40 max-w-[1600px] mx-auto w-full">
        {/* Breadcrumb Trail */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-900 font-medium">Pesanan Saya</span>
        </nav>

        {/* Page Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
              Pesanan Saya
            </h1>
            <p className="mt-2 text-sm text-zinc-500 max-w-2xl">
              Lacak status pemesanan, periksa rincian pembelian material jas hujan, dan lanjutkan pembayaran Anda dengan cepat dan aman.
            </p>
          </div>

          {/* Search within Orders */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor pesanan atau barang..."
              className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border border-zinc-200 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all duration-300 shadow-sm"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sleek Tab Navigation */}
        {/* mt-8 border-b border-zinc-200 flex gap-8 overflow-x-auto scrollbar-hide */}
        <div className="mt-8 border-b border-zinc-200 flex gap-8 overflow-x-auto scrollbar-hide">
          {/* Tab: Semua */}
          <button
            onClick={() => setActiveTab('SEMUA')}
            className={`cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'SEMUA'
                ? 'border-b-2 border-zinc-900 text-zinc-900 font-medium pb-4'
                : 'text-zinc-500 hover:text-zinc-700 pb-4'
            }`}
          >
            <span>Semua</span>
            <span
              className={`px-2 py-0.5 text-[11px] rounded-full font-semibold ${
                activeTab === 'SEMUA'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {tabCounts.SEMUA}
            </span>
          </button>

          {/* Tab: Belum Bayar */}
          <button
            onClick={() => setActiveTab('BELUM_BAYAR')}
            className={`cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'BELUM_BAYAR'
                ? 'border-b-2 border-zinc-900 text-zinc-900 font-medium pb-4'
                : 'text-zinc-500 hover:text-zinc-700 pb-4'
            }`}
          >
            <span>Belum Bayar</span>
            {tabCounts.BELUM_BAYAR > 0 && (
              <span
                className={`px-2 py-0.5 text-[11px] rounded-full font-semibold ${
                  activeTab === 'BELUM_BAYAR'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {tabCounts.BELUM_BAYAR}
              </span>
            )}
          </button>

          {/* Tab: Sedang Diproses */}
          <button
            onClick={() => setActiveTab('SEDANG_DIPROSES')}
            className={`cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'SEDANG_DIPROSES'
                ? 'border-b-2 border-zinc-900 text-zinc-900 font-medium pb-4'
                : 'text-zinc-500 hover:text-zinc-700 pb-4'
            }`}
          >
            <span>Sedang Diproses</span>
            <span
              className={`px-2 py-0.5 text-[11px] rounded-full font-semibold ${
                activeTab === 'SEDANG_DIPROSES'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {tabCounts.SEDANG_DIPROSES}
            </span>
          </button>

          {/* Tab: Selesai */}
          <button
            onClick={() => setActiveTab('SELESAI')}
            className={`cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'SELESAI'
                ? 'border-b-2 border-zinc-900 text-zinc-900 font-medium pb-4'
                : 'text-zinc-500 hover:text-zinc-700 pb-4'
            }`}
          >
            <span>Selesai</span>
            <span
              className={`px-2 py-0.5 text-[11px] rounded-full font-semibold ${
                activeTab === 'SELESAI'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {tabCounts.SELESAI}
            </span>
          </button>

          {/* Tab: Dibatalkan */}
          <button
            onClick={() => setActiveTab('DIBATALKAN')}
            className={`cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'DIBATALKAN'
                ? 'border-b-2 border-zinc-900 text-zinc-900 font-medium pb-4'
                : 'text-zinc-500 hover:text-zinc-700 pb-4'
            }`}
          >
            <span>Dibatalkan</span>
            <span
              className={`px-2 py-0.5 text-[11px] rounded-full font-semibold ${
                activeTab === 'DIBATALKAN'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {tabCounts.DIBATALKAN}
            </span>
          </button>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. ORDER LIST SECTION                                               */}
      {/* py-8 px-4 md:px-12 xl:px-40 space-y-6 pb-24                         */}
      {/* =================================================================== */}
      <main className="py-8 px-4 md:px-12 xl:px-40 max-w-[1600px] mx-auto w-full flex-1 pb-24">
        {filteredOrders.length === 0 ? (
          /* =============================================================== */
          /* 4. EMPTY STATE UI                                               */
          /* =============================================================== */
          <div className="bg-white border border-zinc-200 rounded-3xl p-12 md:p-16 text-center max-w-xl mx-auto my-8 shadow-sm transition-all duration-300">
            <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-6">
              <Receipt className="w-10 h-10 stroke-[1.5]" />
            </div>

            <h3 className="text-2xl font-bold text-zinc-900 mb-2">
              Belum ada pesanan
            </h3>

            <p className="text-sm text-zinc-500 leading-relaxed mb-8 max-w-md mx-auto">
              {searchQuery
                ? `Tidak ditemukan pesanan dengan kata kunci "${searchQuery}". Silakan coba kata kunci lain atau bersihkan pencarian.`
                : activeTab === 'SEMUA'
                ? 'Anda belum pernah melakukan pemesanan. Temukan material jas hujan, resleting waterproof, dan aksesoris terbaik untuk konveksi Anda.'
                : `Tidak ada pesanan dengan status "${activeTab.replace('_', ' ').toLowerCase()}" saat ini.`}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-full sm:w-auto px-6 py-2.5 border border-zinc-200 rounded-full text-xs font-semibold text-zinc-700 hover:border-zinc-900 transition-colors"
                >
                  Bersihkan Pencarian
                </button>
              ) : (
                <Link
                  href="/products"
                  className="bg-zinc-900 text-white rounded-full px-8 py-3 text-sm font-medium hover:bg-zinc-800 transition-all duration-300 shadow-sm flex items-center justify-center gap-2 group w-full sm:w-auto"
                >
                  <span>Mulai Belanja</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* LIST OF ORDER CARDS (STRICTLY NO <table>) */
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const firstItem = order.items[0];
              const remainingCount = order.items.length - 1;

              return (
                <article
                  key={order.id}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 hover:shadow-md transition-shadow transition-all duration-300 group"
                >
                  {/* -------------------------------------------------------- */}
                  {/* TOP ROW (Flex between)                                   */}
                  {/* -------------------------------------------------------- */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Icon, Order Number, Date */}
                    <div className="flex items-center gap-3.5 flex-wrap">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900 text-sm tracking-tight">
                          {order.orderNumber}
                        </span>

                        <button
                          onClick={(e) => handleCopyOrderNumber(e, order.orderNumber)}
                          className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 rounded-md"
                          title="Salin nomor pesanan"
                          aria-label="Salin nomor pesanan"
                        >
                          {copiedOrderId === order.orderNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <span className="text-zinc-300">•</span>

                        <span className="text-sm text-zinc-500">
                          {order.createdAt}
                        </span>

                        <span className="text-zinc-300 hidden md:inline">•</span>

                        {/* Payment Status Label (FR-24 requirement) */}
                        <span className="text-xs font-medium text-zinc-500 hidden md:inline">
                          Pembayaran:{' '}
                          <span
                            className={
                              order.paymentStatus === 'PAID'
                                ? 'text-blue-700 font-semibold'
                                : order.paymentStatus === 'UNPAID'
                                ? 'text-amber-700 font-semibold'
                                : 'text-zinc-600'
                            }
                          >
                            {order.paymentStatus === 'PAID'
                              ? 'Lunas'
                              : order.paymentStatus === 'UNPAID'
                              ? 'Belum Bayar'
                              : order.paymentStatus === 'EXPIRED'
                              ? 'Kedaluwarsa'
                              : order.paymentStatus}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Status Badge (PRD 11 Color-coded pill) */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <StatusBadge status={order.orderStatus} />
                    </div>
                  </div>

                  {/* Top Notice for Pending Payment Countdown */}
                  {order.orderStatus === 'PENDING_PAYMENT' && order.paymentDeadline && (
                    <div className="mt-3.5 bg-amber-50/80 border border-amber-200/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-800">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Selesaikan pembayaran sebelum{' '}
                          <strong className="font-semibold">{order.paymentDeadline}</strong>{' '}
                          agar stok tidak dilepas ke pelanggan lain.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* DIVIDER                                                  */}
                  {/* -------------------------------------------------------- */}
                  <div className="border-t border-zinc-100 my-4" />

                  {/* -------------------------------------------------------- */}
                  {/* MIDDLE ROW (Order Preview: FIRST ITEM)                   */}
                  {/* -------------------------------------------------------- */}
                  <div
                    onClick={() => handleOpenDetail(order)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* First item thumbnail */}
                      <img
                        src={firstItem.imageUrl}
                        alt={firstItem.name}
                        className="w-20 h-20 rounded-xl object-cover bg-zinc-100 border border-zinc-100 shrink-0 shadow-xs"
                      />

                      {/* Item details */}
                      <div className="flex flex-col justify-center">
                        <h4 className="font-semibold text-zinc-900 text-sm md:text-base leading-snug hover:text-amber-600 transition-colors">
                          {firstItem.name}
                        </h4>

                        <p className="text-xs text-zinc-500 mt-1">
                          Varian: <span className="text-zinc-700">{firstItem.variant}</span>
                        </p>

                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                          <span>
                            {firstItem.quantity} {firstItem.unit}
                          </span>
                          <span>×</span>
                          <span className="font-medium text-zinc-700">
                            {formatRupiah(firstItem.price)}
                          </span>
                        </div>

                        {/* + X produk lainnya pill */}
                        {remainingCount > 0 && (
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors">
                              <span>+ {remainingCount} produk lainnya</span>
                              <ChevronRight className="w-3 h-3 text-zinc-400" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Method & Fulfillment Info */}
                    <div className="text-left sm:text-right text-xs text-zinc-500 pl-24 sm:pl-0">
                      <p className="font-medium text-zinc-700">
                        {order.fulfillmentType === 'DELIVERY'
                          ? 'Pengiriman Ekspedisi'
                          : 'Ambil di Toko (Tanahsari)'}
                      </p>
                      <p className="text-zinc-400 mt-0.5">
                        {order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  {/* -------------------------------------------------------- */}
                  {/* DIVIDER                                                  */}
                  {/* -------------------------------------------------------- */}
                  <div className="border-t border-zinc-100 my-4" />

                  {/* -------------------------------------------------------- */}
                  {/* BOTTOM ROW (Flex between items-center)                   */}
                  {/* -------------------------------------------------------- */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Total Belanja */}
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-500">
                        Total Belanja
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-zinc-900">
                          {formatRupiah(order.totalAmount)}
                        </span>
                        {order.shippingFee > 0 && (
                          <span className="text-[11px] text-zinc-400">
                            (termasuk ongkir {formatRupiah(order.shippingFee)})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                      {order.orderStatus === 'PENDING_PAYMENT' ? (
                        <>
                          <Link
                            href={`/orders/${getOrderSlug(order)}`}
                            className="border border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 px-5 py-2.5 rounded-full text-xs font-medium transition-colors"
                          >
                            Detail Pesanan
                          </Link>
                          <button
                            onClick={() => handlePayNow(order)}
                            className="bg-zinc-900 text-white px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-1.5"
                          >
                            <span>Bayar Sekarang</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          {order.orderStatus === 'COMPLETED' && (
                            <Link
                              href="/products"
                              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium px-4 py-2"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Beli Lagi</span>
                            </Link>
                          )}
                          <Link
                            href={`/orders/${getOrderSlug(order)}`}
                            className="border border-zinc-200 text-zinc-900 hover:border-zinc-900 px-6 py-2.5 rounded-full text-xs font-medium transition-colors hover:bg-zinc-50 flex items-center gap-1.5"
                          >
                            <span>Lihat Detail</span>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* 5. ORDER DETAIL MODAL (PRD 9.2.8 & 9.2.7 ORDER TRACKING TIMELINE)   */}
      {/* =================================================================== */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-3xl border border-zinc-200 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                    <span>Rincian Pesanan</span>
                    <span className="text-zinc-400 font-normal">|</span>
                    <span className="text-amber-600 font-semibold">{selectedOrder.orderNumber}</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Dibuat pada {selectedOrder.createdAt}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Order Status & Timeline */}
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Status Pesanan
                  </span>
                  <StatusBadge status={selectedOrder.orderStatus} />
                </div>

                {/* Linimasa Status (PRD 9.2.7) */}
                <OrderStatusStepper status={selectedOrder.orderStatus} />
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">
                  Daftar Produk ({selectedOrder.items.length})
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-100 bg-white hover:bg-zinc-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover bg-zinc-100 border border-zinc-100 shrink-0"
                        />
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 leading-tight">
                            {item.name}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {item.variant}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {item.quantity} {item.unit} × {formatRupiah(item.price)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-zinc-900">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery / Pickup Details */}
              <div className="bg-white border border-zinc-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  {selectedOrder.fulfillmentType === 'DELIVERY' ? (
                    <>
                      <Truck className="w-4 h-4 text-zinc-700" />
                      <span>Alamat Pengiriman & Kurir</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4 text-zinc-700" />
                      <span>Metode Pengambilan Toko</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed pl-6">
                  {selectedOrder.deliveryAddress}
                </p>
                <p className="text-xs text-zinc-500 pl-6">
                  Layanan: {selectedOrder.shippingCourier}
                  {selectedOrder.trackingNumber && (
                    <span className="font-semibold text-zinc-900 ml-1">
                      (No. Resi: {selectedOrder.trackingNumber})
                    </span>
                  )}
                </p>
              </div>

              {/* Payment Summary */}
              <div className="bg-zinc-50 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal Produk</span>
                  <span className="font-medium text-zinc-900">
                    {formatRupiah(selectedOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Ongkos Kirim</span>
                  <span className="font-medium text-zinc-900">
                    {selectedOrder.shippingFee === 0
                      ? 'Gratis'
                      : formatRupiah(selectedOrder.shippingFee)}
                  </span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Diskon</span>
                    <span>-{formatRupiah(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="border-t border-zinc-200/80 pt-2 flex justify-between text-sm font-bold text-zinc-900">
                  <span>Total Belanja</span>
                  <span>{formatRupiah(selectedOrder.totalAmount)}</span>
                </div>
                <div className="text-[11px] text-zinc-500 pt-1">
                  Metode Pembayaran: <span className="font-medium text-zinc-700">{selectedOrder.paymentMethod}</span>
                </div>
              </div>

              {/* Cancellation Note if cancelled */}
              {selectedOrder.orderStatus === 'CANCELLED' && selectedOrder.cancellationReason && (
                <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Alasan Pembatalan: </span>
                    <span>{selectedOrder.cancellationReason}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 md:p-6 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href={`https://wa.me/6283876942484?text=Halo%20Admin%20Toko%20Enstein,%20saya%20ingin%20menanyakan%20pesanan%20${encodeURIComponent(selectedOrder.orderNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Bantuan Admin (WhatsApp)</span>
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full sm:w-auto px-5 py-2.5 border border-zinc-200 text-zinc-700 rounded-full text-xs font-semibold hover:border-zinc-900 hover:text-zinc-900 transition-colors"
                >
                  Tutup
                </button>

                {selectedOrder.orderStatus === 'PENDING_PAYMENT' && (
                  <button
                    onClick={() => {
                      const slug = getOrderSlug(selectedOrder);
                      router.push(`/orders/${slug}/payment`);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900 text-white rounded-full text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>Bayar Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. MODERN FOOTER (`bg-white py-16 border-t border-zinc-200`)
          ===================================================================== */}
      <footer className="bg-white py-16 border-t border-zinc-200 text-zinc-600 mt-auto">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-zinc-100">
            
            {/* Col 1: Brand & Bio */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-100 p-1 flex items-center justify-center shrink-0">
                  <img
                    src="/ensteinlogo.png"
                    alt="Logo Toko Enstein"
                    width={32}
                    height={32}
                    style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-lg font-bold tracking-tight text-zinc-900 uppercase">
                  ENSTEIN<span className="text-amber-500 font-black">STORE</span>
                </span>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                Toko Enstein berlokasi di Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01). Penyedia bahan jas hujan (kain PVC, taslan, mika) beserta kancing snap, resleting, dan karet elastis bermutu tinggi.
              </p>

              <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 pt-1">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Kualitas Standar Konveksi &amp; Eceran</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Navigation</p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li><Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link></li>
                <li><Link href="/#products" className="hover:text-zinc-900 transition-colors">Featured Products</Link></li>
                <li><Link href="/#new-arrivals" className="hover:text-zinc-900 transition-colors">New Arrivals 2026</Link></li>
                <li><Link href="/#categories" className="hover:text-zinc-900 transition-colors">5 Main Categories</Link></li>
                <li><Link href="/#about" className="hover:text-zinc-900 transition-colors">About Us</Link></li>
              </ul>
            </div>

            {/* Col 3: Categories */}
            <div className="lg:col-span-3 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Product Categories</p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Material Jas Hujan
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Resleting
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Kancing
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Karet
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Aksesori
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact & Hours */}
            <div className="lg:col-span-3 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Visit &amp; Contact</p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-700 shrink-0 mt-0.5" />
                  <span>Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01), Jawa Tengah</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                  <a
                    href="https://wa.me/6283876942484"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-zinc-900 hover:text-amber-600 transition-colors"
                  >
                    +62 838 7694 2484
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                  <span>sales@ensteinstore.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                  <span>Senin - Sabtu: 08.00 - 17.00 WIB</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
            <p>© 2026 ENSTEINSTORE (Toko Enstein). All rights reserved.</p>
            <p>Tugas Akhir Pemrograman Berorientasi Objek &amp; Basis Data Semester 3</p>
          </div>

        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENT: STATUS BADGE (STRICT PRD 11 SPECIFICATION)
// ============================================================================

interface StatusBadgeProps {
  status: OrderStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Belum Bayar
        </span>
      );

    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200/80">
          <CheckCircle2 className="w-3 h-3 text-blue-600" />
          Sudah Bayar
        </span>
      );

    case 'PROCESSING':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200/80">
          <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
          Sedang Diproses
        </span>
      );

    case 'READY':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80">
          <Package className="w-3 h-3 text-indigo-600" />
          Siap Diambil
        </span>
      );

    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Selesai
        </span>
      );

    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase bg-rose-50 text-rose-700 border border-rose-200/80">
          <XCircle className="w-3 h-3 text-rose-500" />
          Dibatalkan
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase bg-zinc-100 text-zinc-600 border border-zinc-200">
          {status}
        </span>
      );
  }
}

// ============================================================================
// HELPER COMPONENT: ORDER STATUS STEPPER (PRD 9.2.7 ORDER TRACKING)
// PENDING_PAYMENT → PAID → PROCESSING → READY → COMPLETED (+ CANCELLED)
// ============================================================================

function OrderStatusStepper({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') {
    return (
      <div className="bg-rose-50/70 border border-rose-200/60 rounded-xl p-3.5 flex items-center gap-3">
        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <div>
          <p className="text-xs font-bold text-rose-900">
            Pesanan Telah Dibatalkan
          </p>
          <p className="text-[11px] text-rose-700 mt-0.5">
            Reservasi stok barang telah dilepas kembali ke inventaris gudang toko.
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING_PAYMENT', label: 'Menunggu Bayar' },
    { key: 'PAID', label: 'Dibayar' },
    { key: 'PROCESSING', label: 'Diproses' },
    { key: 'READY', label: 'Siap' },
    { key: 'COMPLETED', label: 'Selesai' },
  ];

  const getStepIndex = (s: OrderStatus) => {
    switch (s) {
      case 'PENDING_PAYMENT':
        return 0;
      case 'PAID':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'READY':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="relative pt-2">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-zinc-900 text-white ring-4 ring-zinc-200'
                    : 'bg-zinc-200 text-zinc-500'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs mt-2 text-center font-medium leading-tight ${
                  isCurrent
                    ? 'text-zinc-900 font-bold'
                    : isDone
                    ? 'text-emerald-700'
                    : 'text-zinc-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress connector line */}
      <div className="absolute top-[22px] left-6 right-6 h-0.5 bg-zinc-200 -z-0">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
