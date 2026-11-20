'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  CreditCard,
  CheckCircle2,
  Package,
  Truck,
  Home,
  XCircle,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  ShoppingBag,
  ShoppingCart,
  Search,
  Menu,
  Phone,
  MapPin,
  Mail,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
  RefreshCw,
  FileText,
  ChevronRight,
  User,
  Calendar,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES & STATUS DEFINITIONS (PRD 9.2.7 & 11.1)
// ============================================================================

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface TimelineStep {
  key: OrderStatus;
  title: string;
  description: string;
  timestamp?: string;
  icon: React.ComponentType<{ className?: string }>;
}

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

export interface FulfillmentInfo {
  type: 'DELIVERY' | 'PICKUP';
  courierName: string;
  serviceType: string;
  trackingNumber?: string;
  estimatedArrival: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
}

// ============================================================================
// DUMMY ORDER DATA
// ============================================================================

const DUMMY_ITEMS: OrderItem[] = [
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
    variant: 'Gunmetal Anti-Karat / 15mm',
    quantity: 20,
    unit: 'pcs',
    price: 1500,
    subtotal: 30000,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg',
  },
];

const DUMMY_FULFILLMENT: FulfillmentInfo = {
  type: 'DELIVERY',
  courierName: 'J&T Express',
  serviceType: 'Regular Service (2 - 3 Hari)',
  trackingNumber: 'JNT-8829102931',
  estimatedArrival: '18 Nov 2026 (Estimasi Sore)',
  recipientName: 'Bu Rina (Konveksi Barokah)',
  recipientPhone: '+62 812-9876-5432',
  shippingAddress:
    'Jl. Rancabolang No. 14, RT 03 / RW 05, Kel. Sekejati, Kec. Gedebage, Kota Bandung, Jawa Barat 40295',
};

// Formatting currency helper
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================================
// MAIN PAGE COMPONENT: ORDER TRACKING & DETAIL
// ============================================================================

export default function OrderTrackingDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Extract ID from params or fallback
  const rawId = params?.id;
  const orderId = useMemo(() => {
    if (typeof rawId === 'string' && rawId.trim()) {
      return rawId.startsWith('EST-') ? `#${rawId}` : rawId.startsWith('#') ? rawId : `#${rawId}`;
    }
    if (Array.isArray(rawId) && rawId[0]) {
      return `#${rawId[0]}`;
    }
    return '#EST-20261115-0042';
  }, [rawId]);

  // Robust State for Status (default: 'PROCESSING' so timeline is partially filled)
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>('PROCESSING');
  const [searchNavQuery, setSearchNavQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);

  // Financial calculations
  const subtotal = useMemo(() => {
    return DUMMY_ITEMS.reduce((acc, item) => acc + item.subtotal, 0);
  }, []);
  const deliveryFee = 15000;
  const insuranceFee = 2000;
  const totalAmount = subtotal + deliveryFee + insuranceFee;

  // PRD 9.2.7 Timeline Steps Definition
  const timelineSteps: TimelineStep[] = [
    {
      key: 'PENDING_PAYMENT',
      title: 'Menunggu Pembayaran',
      description: 'Pesanan telah dibuat. Stok barang telah direservasi sementara selama 24 jam.',
      timestamp: '15 Nov 2026, 21:15 WIB',
      icon: CreditCard,
    },
    {
      key: 'PAID',
      title: 'Pembayaran Dikonfirmasi',
      description: 'Pembayaran berhasil diverifikasi oleh sistem Toko Enstein via Virtual Account BCA.',
      timestamp: '15 Nov 2026, 21:22 WIB',
      icon: CheckCircle2,
    },
    {
      key: 'PROCESSING',
      title: 'Sedang Diproses Toko',
      description: 'Material PVC Balon sedang dipotong per meter & aksesoris disiapkan rapi oleh tim gudang Kebumen.',
      timestamp: '16 Nov 2026, 08:30 WIB',
      icon: Package,
    },
    {
      key: 'READY',
      title: 'Siap Dikirim / Diserahkan ke Kurir',
      description: 'Paket telah dikemas kedap air dan siap diserahkan ke gerai J&T Express Kebumen.',
      timestamp: '16 Nov 2026, 14:00 WIB',
      icon: Truck,
    },
    {
      key: 'COMPLETED',
      title: 'Pesanan Selesai',
      description: 'Material telah diterima dengan baik oleh pemesan di Bandung. Transaksi tuntas.',
      timestamp: '18 Nov 2026, 11:45 WIB',
      icon: Home,
    },
  ];

  // Helper index mapping for linear progression
  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
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
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(currentStatus);

  // Copy helpers
  const handleCopy = (text: string, type: 'order' | 'resi') => {
    navigator.clipboard?.writeText(text);
    if (type === 'order') {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    } else {
      setCopiedResi(true);
      setTimeout(() => setCopiedResi(false), 2000);
    }
  };

  // Route to payment page
  const handleProceedPayment = () => {
    const slug = orderId.replace('#', '');
    router.push(`/orders/${slug}/payment`);
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
      {/* 2. PAGE HEADER                                                      */}
      {/* pt-12 pb-8 px-4 md:px-12 xl:px-32                                   */}
      {/* =================================================================== */}
      <section className="pt-12 pb-8 px-4 md:px-12 xl:px-32 max-w-[1600px] mx-auto w-full">
        {/* Breadcrumbs: Home / Pesanan Saya / Detail Pesanan */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <Link href="/orders" className="hover:text-zinc-900 transition-colors">
            Pesanan Saya
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-900 font-medium">Detail Pesanan</span>
        </nav>

        {/* Title Row (Flex between) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Title & Order ID */}
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/orders"
                className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                title="Kembali ke Daftar Pesanan"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
                Detail Pesanan
              </h1>
            </div>

            <div className="flex items-center gap-2.5 mt-2 text-zinc-500 text-sm">
              <span>Nomor Pesanan:</span>
              <strong className="font-semibold text-zinc-900">{orderId}</strong>
              <button
                onClick={() => handleCopy(orderId, 'order')}
                className="text-zinc-400 hover:text-zinc-900 transition-colors p-1 rounded-md"
                title="Salin Nomor Pesanan"
                aria-label="Salin nomor pesanan"
              >
                {copiedOrderId ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <span className="text-zinc-300">•</span>
              <span className="text-xs text-zinc-500">15 Nov 2026, 21:15 WIB</span>
            </div>
          </div>

          {/* Right: Status Badge */}
          <div className="self-start sm:self-center">
            {currentStatus === 'PENDING_PAYMENT' && (
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Menunggu Pembayaran
              </span>
            )}
            {currentStatus === 'PAID' && (
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Pembayaran Dikonfirmasi
              </span>
            )}
            {currentStatus === 'PROCESSING' && (
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide uppercase bg-zinc-900 text-white shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                Sedang Diproses
              </span>
            )}
            {currentStatus === 'READY' && (
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                Siap Dikirim / Diambil
              </span>
            )}
            {currentStatus === 'COMPLETED' && (
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Pesanan Selesai
              </span>
            )}
            {currentStatus === 'CANCELLED' && (
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide uppercase bg-rose-100 text-rose-800 border border-rose-200">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Pesanan Dibatalkan
              </span>
            )}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. MAIN LAYOUT                                                      */}
      {/* px-4 md:px-12 xl:px-32 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12*/}
      {/* =================================================================== */}
      <main className="px-4 md:px-12 xl:px-32 pb-24 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* ================================================================= */}
        {/* LEFT COLUMN: TIMELINE & SHIPPING INFO (span 7 or 8)               */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          {/* -------------------------------------------------------------- */}
          {/* TRACKING TIMELINE CARD                                         */}
          {/* bg-white border border-zinc-200 rounded-3xl p-8 lg:p-10 shadow-sm */}
          {/* -------------------------------------------------------------- */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 lg:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                  Status Pesanan
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Linimasa perjalanan pesanan material dari toko hingga tiba di lokasi Anda.
                </p>
              </div>

              {currentStatus === 'PROCESSING' && (
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/80">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Estimasi Pengemasan: Hari ini</span>
                </div>
              )}
            </div>

            {/* Cancelled State Graceful Abort Notice */}
            {currentStatus === 'CANCELLED' ? (
              <div className="space-y-6">
                <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-6 text-rose-900">
                  <div className="flex items-start gap-3.5">
                    <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-base text-rose-900">
                        Pesanan Dibatalkan
                      </h4>
                      <p className="text-xs text-rose-700 leading-relaxed">
                        Pesanan ini telah dibatalkan karena melewati batas waktu pembayaran 24 jam.
                        Seluruh material kain dan komponen yang sebelumnya direservasi telah dikembalikan ke inventaris toko.
                      </p>
                      <div className="pt-2 text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Dibatalkan pada: 16 Nov 2026, 21:16 WIB (Kedaluwarsa)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Stepper in Aborted / Halted State */}
                <div className="pt-4 pl-2">
                  <div className="relative flex items-start gap-5 pb-8">
                    {/* Circle */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center relative z-10 font-bold bg-zinc-900 text-white">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    {/* Halted Connecting Line */}
                    <div className="absolute top-10 bottom-[-1rem] left-5 -translate-x-1/2 w-[2px] bg-rose-300" />
                    <div className="pt-1">
                      <h4 className="font-semibold text-zinc-900 text-sm">
                        Pesanan Dibuat
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        15 Nov 2026, 21:15 WIB • Menunggu pembayaran awal
                      </p>
                    </div>
                  </div>

                  <div className="relative flex items-start gap-5">
                    {/* Circle */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center relative z-10 font-bold bg-rose-600 text-white shadow-sm ring-4 ring-rose-100">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold text-rose-600 text-sm">
                        Transaksi Dihentikan &amp; Reservasi Dilepas
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        16 Nov 2026, 21:16 WIB • Batas waktu pembayaran 24 jam terlewati.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ============================================================ */
              /* VERTICAL STEPPER (EXACT 5 PRD STATUSES)                     */
              /* ============================================================ */
              <div className="space-y-0 pt-2 pl-2">
                {timelineSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isPast = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const isFuture = index > currentStepIndex;
                  const isLast = index === timelineSteps.length - 1;

                  // Active line condition: line from step X to X+1 is active if step X is completed/past
                  const isLineActive = index < currentStepIndex;

                  return (
                    <div
                      key={step.key}
                      className="relative flex items-start gap-5 pb-8 last:pb-0 group"
                    >
                      {/* Left: Icon Container & Connecting Line */}
                      <div className="relative flex flex-col items-center shrink-0">
                        {/* Circle */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 font-bold transition-all duration-300 ${
                            isPast
                              ? 'bg-zinc-900 text-white'
                              : isCurrent
                              ? 'bg-zinc-900 text-white ring-4 ring-zinc-200 shadow-md scale-105'
                              : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                          }`}
                        >
                          {isPast ? (
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <StepIcon className="w-4 h-4" />
                          )}
                        </div>

                        {/* Connecting Line: absolute top-10 bottom-[-1rem] left-5 w-[2px] */}
                        {!isLast && (
                          <div
                            className={`absolute top-10 bottom-[-1rem] left-5 -translate-x-1/2 w-[2px] transition-colors duration-500 ${
                              isLineActive ? 'bg-zinc-900' : 'bg-zinc-200'
                            }`}
                          />
                        )}
                      </div>

                      {/* Right: Text content */}
                      <div className="pt-1 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h3
                            className={`font-semibold text-base transition-colors ${
                              isCurrent
                                ? 'text-zinc-900 font-bold flex items-center gap-2'
                                : isPast
                                ? 'text-zinc-800'
                                : 'text-zinc-400'
                            }`}
                          >
                            <span>{step.title}</span>
                            {isCurrent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                                Tahap Saat Ini
                              </span>
                            )}
                          </h3>

                          {/* Timestamp */}
                          {step.timestamp && (isPast || isCurrent) && (
                            <span className="text-xs text-zinc-400 sm:text-right">
                              {step.timestamp}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-sm mt-1 leading-relaxed ${
                            isCurrent
                              ? 'text-zinc-700 font-normal'
                              : isPast
                              ? 'text-zinc-500'
                              : 'text-zinc-400'
                          }`}
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* -------------------------------------------------------------- */}
          {/* FULFILLMENT INFO CARD (FR-25)                                  */}
          {/* bg-white border border-zinc-200 rounded-3xl p-8 mt-8 shadow-sm */}
          {/* -------------------------------------------------------------- */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 lg:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                    Informasi Pengiriman / Pengambilan
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Rincian tujuan pengiriman bahan dan identitas penerima paket konveksi.
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Pengiriman Berasuransi
              </span>
            </div>

            {/* Grid layout for fulfillment details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Courier & Service */}
              <div className="space-y-1.5 bg-zinc-50/70 p-4 rounded-2xl border border-zinc-100">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Metode &amp; Ekspedisi
                </span>
                <p className="text-sm font-bold text-zinc-900">
                  {DUMMY_FULFILLMENT.courierName}
                </p>
                <p className="text-xs text-zinc-600">
                  Layanan: {DUMMY_FULFILLMENT.serviceType}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Estimasi Tiba:</span>
                  <span className="font-semibold text-zinc-900">
                    {DUMMY_FULFILLMENT.estimatedArrival}
                  </span>
                </div>
              </div>

              {/* Tracking Number */}
              <div className="space-y-1.5 bg-zinc-50/70 p-4 rounded-2xl border border-zinc-100">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Nomor Resi Pengiriman
                </span>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono font-bold text-sm text-zinc-900 tracking-wider">
                    {DUMMY_FULFILLMENT.trackingNumber}
                  </span>
                  <button
                    onClick={() => handleCopy(DUMMY_FULFILLMENT.trackingNumber || '', 'resi')}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-semibold px-2.5 py-1 bg-white rounded-lg border border-zinc-200 transition-colors shadow-2xs"
                    title="Salin Resi"
                  >
                    {copiedResi ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 pt-1">
                  Dapat dilacak langsung di situs resmi ekspedisi J&amp;T.
                </p>
              </div>

              {/* Recipient Contact */}
              <div className="space-y-1.5 bg-zinc-50/70 p-4 rounded-2xl border border-zinc-100">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Penerima Paket
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <p className="text-sm font-bold text-zinc-900">
                    {DUMMY_FULFILLMENT.recipientName}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{DUMMY_FULFILLMENT.recipientPhone}</span>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-1.5 bg-zinc-50/70 p-4 rounded-2xl border border-zinc-100">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Alamat Lengkap Pengiriman
                </span>
                <div className="flex items-start gap-2 pt-0.5">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-700 leading-relaxed">
                    {DUMMY_FULFILLMENT.shippingAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: ORDER SUMMARY (span 4 or 5)                         */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-32 space-y-4">
            {/* ------------------------------------------------------------ */}
            {/* SUMMARY CARD (bg-zinc-900 text-white rounded-3xl p-8 shadow-xl)*/}
            {/* ------------------------------------------------------------ */}
            <div className="bg-zinc-900 text-white rounded-3xl p-8 shadow-xl border border-zinc-800">
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Ringkasan Pesanan
                  </h3>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {DUMMY_ITEMS.length} Macam Material &amp; Komponen
                  </p>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {orderId}
                </span>
              </div>

              {/* Item List with Sleek Thumbnails */}
              <div className="py-6 space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {DUMMY_ITEMS.map((item) => (
                  <div key={item.id} className="flex items-center gap-3.5 group">
                    {/* Small thumbnail */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg bg-zinc-800 object-cover shrink-0 border border-zinc-700/60"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white leading-snug truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
                        <span>
                          {item.quantity} {item.unit} × {formatRupiah(item.price)}
                        </span>
                        <span className="font-semibold text-white">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-800 my-6" />

              {/* Cost Breakdown */}
              <div className="space-y-2.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal Produk</span>
                  <span className="text-white font-medium">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Pengiriman (J&amp;T)</span>
                  <span className="text-white font-medium">
                    {formatRupiah(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Asuransi Material</span>
                  <span className="text-white font-medium">
                    {formatRupiah(insuranceFee)}
                  </span>
                </div>
              </div>

              {/* Total Row */}
              <div className="border-t border-zinc-800 mt-6 pt-5">
                <div className="flex justify-between items-baseline text-white">
                  <div>
                    <span className="text-xs text-zinc-400 block">Total Tagihan</span>
                    <span className="text-xs text-zinc-500">Termasuk PPN &amp; Ongkir</span>
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-white">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* CONDITIONAL ACTION (Below Summary Card)                       */}
            {/* ------------------------------------------------------------ */}
            {currentStatus === 'PENDING_PAYMENT' ? (
              <div className="space-y-3">
                <button
                  onClick={handleProceedPayment}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 w-full py-4 rounded-full mt-2 font-bold transition-all shadow-lg hover:shadow-amber-500/25 flex items-center justify-center gap-2 group text-sm"
                >
                  <span>Selesaikan Pembayaran</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Batas Pembayaran:</strong> Selesaikan
                    dalam 23 jam 50 menit agar reservasi stok tidak dilepas oleh sistem.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {/* Secondary Helpful Actions */}
                <a
                  href={`https://wa.me/6283876942484?text=Halo%20Admin%20Toko%20Enstein,%20saya%20ingin%20menanyakan%20status%20pesanan%20${encodeURIComponent(orderId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-full border border-zinc-200 text-zinc-700 bg-white hover:border-zinc-900 hover:text-zinc-900 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Hubungi Admin Toko (WhatsApp)</span>
                </a>

                <Link
                  href="/orders"
                  className="w-full py-3 px-4 rounded-full text-zinc-500 hover:text-zinc-900 text-xs font-medium transition-colors text-center block"
                >
                  ← Kembali ke Semua Pesanan
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* =====================================================================
          4. MODERN FOOTER (`bg-white py-16 border-t border-zinc-200`)
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
