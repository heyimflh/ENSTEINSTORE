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
  Search,
  Eye,
  X,
  Filter,
  Calendar,
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
  XCircle,
  ZoomIn,
  Download,
  FileText,
  User,
  Phone,
  Mail,
  Building2,
  Receipt,
  RefreshCw,
  Ban,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

// ============================================================================
// DATA MODELS & TYPES (PRD SECTION 9.3.5, 11.2, FR-22 & BR-06)
// ============================================================================

export type PaymentStatus =
  | 'PENDING'
  | 'WAITING_VERIFICATION'
  | 'PAID'
  | 'REJECTED'
  | 'EXPIRED';

export type PaymentMethodType =
  | 'Bank Transfer (BCA)'
  | 'Bank Transfer (Mandiri)'
  | 'Bank Transfer (BRI)'
  | 'QRIS Midtrans'
  | 'Virtual Account BCA'
  | 'Tunai Kasir (In-Store)'
  | 'Simulasi';

export interface PaymentTransaction {
  id: string;
  orderRef: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  method: PaymentMethodType | string;
  bankName?: string;
  senderAccountName?: string;
  destinationAccount: string;
  amount: number;
  date: string;
  status: PaymentStatus;
  proofUrl?: string | null;
  notes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

// ============================================================================
// INITIAL ROBUST MOCK DATA (PRD SECTION 9.3.5)
// ============================================================================

const INITIAL_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'PAY-20261116-0042',
    orderRef: 'EST-20261116-0042',
    customerName: 'Bu Rina (Konveksi Barokah Kebumen)',
    customerPhone: '0812-9876-5432',
    customerEmail: 'rina.barokah@gmail.com',
    method: 'Bank Transfer (BCA)',
    bankName: 'BCA',
    senderAccountName: 'Rina Sulistyaningsih',
    destinationAccount: 'BCA - 8020-8899-1234 a/n CV Enstein Store',
    amount: 1450000,
    date: '16 Nov 2026, 14:22',
    status: 'WAITING_VERIFICATION',
    proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    notes: 'Transfer via BCA Mobile m-Transfer, pas Rp 1.450.000 untuk order bahan jas hujan PVC & resleting.',
  },
  {
    id: 'PAY-20261116-0043',
    orderRef: 'EST-20261116-0043',
    customerName: 'Pak Wahyu (UD Hujan Berkah)',
    customerPhone: '0813-2211-7788',
    customerEmail: 'wahyu.hujanberkah@gmail.com',
    method: 'Bank Transfer (Mandiri)',
    bankName: 'Bank Mandiri',
    senderAccountName: 'Wahyu Nugroho',
    destinationAccount: 'Mandiri - 136-00-112233-4 a/n CV Enstein Store',
    amount: 2750000,
    date: '16 Nov 2026, 13:45',
    status: 'WAITING_VERIFICATION',
    proofUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    notes: 'Pembayaran lunas untuk 1 roll Mika 0.20mm dan aksesoris kancing snap metal.',
  },
  {
    id: 'PAY-20261116-0039',
    orderRef: 'EST-20261116-0039',
    customerName: 'Pak Hadi (Sentosa Tailor)',
    customerPhone: '0857-3344-9988',
    customerEmail: 'hadi.sentosa@yahoo.com',
    method: 'QRIS Midtrans',
    bankName: 'QRIS Gopay/ShopeePay',
    senderAccountName: 'Sentosa Tailor Account',
    destinationAccount: 'Midtrans Payment Gateway (Enstein Store)',
    amount: 1330000,
    date: '16 Nov 2026, 11:32',
    status: 'PAID',
    proofUrl: null,
    verifiedAt: '16 Nov 2026, 11:32',
    verifiedBy: 'Sistem Midtrans (Instant Webhook)',
    notes: 'Pembayaran instan QRIS terverifikasi otomatis via Webhook Midtrans.',
  },
  {
    id: 'PAY-20261116-0038',
    orderRef: 'EST-20261116-0038',
    customerName: 'Budi Santoso',
    customerPhone: '0878-1122-3344',
    customerEmail: 'budi.santoso@gmail.com',
    method: 'Bank Transfer (BCA)',
    bankName: 'BCA',
    senderAccountName: 'Budi Santoso',
    destinationAccount: 'BCA - 8020-8899-1234 a/n CV Enstein Store',
    amount: 840000,
    date: '16 Nov 2026, 10:15',
    status: 'PAID',
    proofUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
    verifiedAt: '16 Nov 2026, 10:20',
    verifiedBy: 'Pak Enstein (Admin)',
    notes: 'Bukti transfer valid, mutasi rekening BCA telah masuk sesuai nominal.',
  },
  {
    id: 'PAY-20261116-0037',
    orderRef: 'EST-20261116-0037',
    customerName: 'Dewi Sartika (Pelanggan Toko)',
    customerPhone: '0813-2211-4455',
    customerEmail: 'dewi.sartika@gmail.com',
    method: 'Tunai Kasir (In-Store)',
    bankName: 'Tunai Fisik',
    senderAccountName: '-',
    destinationAccount: 'Laci Kasir Toko Enstein Kebumen',
    amount: 320000,
    date: '16 Nov 2026, 09:45',
    status: 'PAID',
    proofUrl: null,
    verifiedAt: '16 Nov 2026, 09:45',
    verifiedBy: 'Kasir Toko (Offline POS)',
    notes: 'Pembayaran tunai langsung diterima di kasir toko fisik Jl. Kertanegara.',
  },
  {
    id: 'PAY-20261116-0035',
    orderRef: 'EST-20261116-0035',
    customerName: 'Surya Pratama',
    customerPhone: '0821-4433-2211',
    customerEmail: 'surya.pratama@outlook.com',
    method: 'Bank Transfer (BRI)',
    bankName: 'BRI',
    senderAccountName: 'Surya Pratama',
    destinationAccount: 'BRI - 0123-01-001234-50-8 a/n CV Enstein Store',
    amount: 520000,
    date: '16 Nov 2026, 08:30',
    status: 'REJECTED',
    proofUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
    rejectedAt: '16 Nov 2026, 08:50',
    rejectionReason: 'Nominal transfer tidak sesuai (struk Rp 350.000, seharusnya Rp 520.000) dan mutasi rekening belum ditemukan.',
    notes: 'Pelanggan telah dihubungi via WhatsApp untuk mengunggah bukti transfer yang valid.',
  },
  {
    id: 'PAY-20261116-0044',
    orderRef: 'EST-20261116-0044',
    customerName: 'Anisa Rahma',
    customerPhone: '0895-6677-8899',
    customerEmail: 'anisa.rahma99@gmail.com',
    method: 'Virtual Account BCA',
    bankName: 'BCA Virtual Account',
    senderAccountName: 'Anisa Rahma',
    destinationAccount: 'Midtrans VA: 8020-8009-2218-910',
    amount: 675000,
    date: '16 Nov 2026, 14:50',
    status: 'PENDING',
    proofUrl: null,
    notes: 'Menunggu transfer virtual account pelanggan sebelum batas waktu 24 jam.',
  },
  {
    id: 'PAY-20261115-0031',
    orderRef: 'EST-20261115-0031',
    customerName: 'Toko Abadi Makmur',
    customerPhone: '0812-4455-6677',
    customerEmail: 'abadimakmur.kbm@gmail.com',
    method: 'QRIS Midtrans',
    bankName: 'QRIS',
    senderAccountName: '-',
    destinationAccount: 'Midtrans Payment Gateway (Enstein Store)',
    amount: 3100000,
    date: '15 Nov 2026, 12:00',
    status: 'EXPIRED',
    proofUrl: null,
    notes: 'Pembayaran tidak diselesaikan dalam batas waktu 24 jam. Pesanan otomatis dibatalkan sistem.',
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

export default function AdminPaymentsPage() {
  // Navigation & UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Payments State
  const [payments, setPayments] = useState<PaymentTransaction[]>(INITIAL_PAYMENTS);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  // Slide-out Drawer State (FR-22 & BR-06)
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('Nominal transfer tidak sesuai dengan tagihan.');

  // Fullscreen Proof Image Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Metric Computations
  const stats = useMemo(() => {
    const totalTransactions = payments.length;
    const waitingVerificationCount = payments.filter((p) => p.status === 'WAITING_VERIFICATION').length;
    const paidCount = payments.filter((p) => p.status === 'PAID').length;
    const rejectedOrExpiredCount = payments.filter((p) => p.status === 'REJECTED' || p.status === 'EXPIRED').length;

    const totalVerifiedRevenue = payments
      .filter((p) => p.status === 'PAID')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const pendingRevenue = payments
      .filter((p) => p.status === 'WAITING_VERIFICATION')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      totalTransactions,
      waitingVerificationCount,
      paidCount,
      rejectedOrExpiredCount,
      totalVerifiedRevenue,
      pendingRevenue,
    };
  }, [payments]);

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // 1. Search Query (Pay ID, Order Ref, Customer Name, Phone)
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        payment.id.toLowerCase().includes(q) ||
        payment.orderRef.toLowerCase().includes(q) ||
        payment.customerName.toLowerCase().includes(q) ||
        payment.customerPhone.toLowerCase().includes(q);

      // 2. Status Filter
      const matchStatus = statusFilter === 'ALL' || payment.status === statusFilter;

      // 3. Method Filter
      const matchMethod =
        methodFilter === 'ALL' ||
        payment.method.toLowerCase().includes(methodFilter.toLowerCase());

      // 4. Date Filter
      let matchDate = true;
      if (dateFilter === 'TODAY') {
        matchDate = payment.date.includes('16 Nov');
      } else if (dateFilter === '7DAYS') {
        matchDate = payment.date.includes('Nov');
      }

      return matchSearch && matchStatus && matchMethod && matchDate;
    });
  }, [payments, searchQuery, statusFilter, methodFilter, dateFilter]);

  // Handle Approve Payment (FR-22 & BR-06: WAITING_VERIFICATION -> PAID)
  const handleApprovePayment = () => {
    if (!selectedPayment) return;

    const updatedPayment: PaymentTransaction = {
      ...selectedPayment,
      status: 'PAID',
      verifiedAt: 'Baru Saja (16 Nov 2026, 14:35)',
      verifiedBy: 'Pak Enstein (Admin)',
      rejectionReason: undefined,
    };

    setPayments((prev) =>
      prev.map((p) => (p.id === selectedPayment.id ? updatedPayment : p))
    );
    setSelectedPayment(updatedPayment);

    setToastMessage({
      title: 'Pembayaran Disetujui (PAID)',
      desc: `Pembayaran ${selectedPayment.id} senilai ${formatRupiah(selectedPayment.amount)} berhasil diverifikasi. Pesanan ${selectedPayment.orderRef} otomatis siap diproses.`,
      type: 'success',
    });
  };

  // Handle Reject Payment (FR-22 & BR-06: WAITING_VERIFICATION -> REJECTED)
  const handleConfirmReject = () => {
    if (!selectedPayment) return;

    const updatedPayment: PaymentTransaction = {
      ...selectedPayment,
      status: 'REJECTED',
      rejectedAt: 'Baru Saja (16 Nov 2026, 14:35)',
      rejectionReason: rejectionNote.trim() || 'Bukti transfer tidak valid atau dana tidak ditemukan di mutasi.',
    };

    setPayments((prev) =>
      prev.map((p) => (p.id === selectedPayment.id ? updatedPayment : p))
    );
    setSelectedPayment(updatedPayment);
    setIsRejecting(false);

    setToastMessage({
      title: 'Pembayaran Ditolak (REJECTED)',
      desc: `Pembayaran ${selectedPayment.id} ditolak. Notifikasi penolakan telah diteruskan ke status order pelanggan.`,
      type: 'error',
    });
  };

  // Render Status Badge (PRD 11.2)
  const renderStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'WAITING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Menunggu Verifikasi
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Lunas (PAID)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Ditolak (REJECTED)
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" />
            Menunggu Transfer
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            <Ban className="w-3 h-3 text-zinc-400" />
            Kedaluwarsa
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
          (Red geometric 'E', dual font brand, sleek glass ADMIN badge)
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

            {/* Payments (ACTIVE) */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl bg-zinc-900 text-white shadow-xs transition-all"
            >
              <CreditCard className="w-4 h-4 text-zinc-200" />
              <span>Pembayaran</span>
              <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {stats.waitingVerificationCount} Perlu Cek
              </span>
            </button>

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
              <span className="text-zinc-900 font-semibold">Pembayaran</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-4 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Gateway Aktif (Midtrans &amp; Manual BCA)
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-600 border border-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Senin, 16 Nov 2026</span>
            </div>

            <button
              onClick={() => {
                setToastMessage({
                  title: 'Sinkronisasi Pembayaran',
                  desc: 'Mutasi rekening bank dan status gateway Midtrans diperbarui secara real-time.',
                  type: 'info',
                });
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sinkronisasi</span>
            </button>

            <button className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg relative">
              <Bell className="w-4 h-4" />
              {stats.waitingVerificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
              )}
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
            {toastMessage.type === 'error' && (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            {toastMessage.type === 'info' && (
              <RefreshCw className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
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

        {/* PAGE CONTENT */}
        <div className="p-8 pt-6 space-y-6 flex-1">
          {/* PAGE HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Manajemen Pembayaran
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Terdapat{' '}
                <span className="font-semibold text-amber-600">
                  {stats.waitingVerificationCount} pembayaran manual
                </span>{' '}
                menunggu verifikasi bukti transfer dari total {stats.totalTransactions} transaksi aktif.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setStatusFilter('WAITING_VERIFICATION');
                  setToastMessage({
                    title: 'Filter Diaktifkan',
                    desc: 'Menampilkan transaksi yang memerlukan verifikasi bukti transfer.',
                    type: 'info',
                  });
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  statusFilter === 'WAITING_VERIFICATION'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Perlu Cek ({stats.waitingVerificationCount})</span>
              </button>

              <button
                onClick={() => {
                  setToastMessage({
                    title: 'Ekspor Data Pembayaran',
                    desc: 'Laporan rekonsiliasi pembayaran dan mutasi siap diunduh (CSV).',
                    type: 'info',
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* QUICK METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Verified Revenue */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Dana Masuk (PAID)
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-zinc-900">
                  {formatRupiah(stats.totalVerifiedRevenue)}
                </div>
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  {stats.paidCount} transaksi berhasil diverifikasi
                </p>
              </div>
            </div>

            {/* Card 2: Menunggu Verifikasi */}
            <div
              onClick={() => setStatusFilter('WAITING_VERIFICATION')}
              className="p-5 rounded-2xl bg-white border border-amber-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-300 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Perlu Verifikasi
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-zinc-900">
                  {stats.waitingVerificationCount} Bukti
                </div>
                <p className="text-[11px] text-amber-600 font-medium mt-1">
                  Tertunda: {formatRupiah(stats.pendingRevenue)}
                </p>
              </div>
            </div>

            {/* Card 3: Menunggu Transfer (Pending) */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Menunggu Transfer
                </span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-zinc-900">
                  {payments.filter((p) => p.status === 'PENDING').length} Transaksi
                </div>
                <p className="text-[11px] text-zinc-500 font-medium mt-1">
                  Batas waktu transfer 24 jam
                </p>
              </div>
            </div>

            {/* Card 4: Ditolak / Kedaluwarsa */}
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Ditolak / Kedaluwarsa
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-zinc-900">
                  {stats.rejectedOrExpiredCount} Transaksi
                </div>
                <p className="text-[11px] text-rose-600 font-medium mt-1">
                  Memerlukan tindakan lanjutan
                </p>
              </div>
            </div>
          </div>

          {/* ===================================================================
              3. DATA TABLE SECTION (p-8 pt-6 / Table with filter bar)
          =================================================================== */}
          <div className="space-y-4">
            {/* FILTER BAR */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              {/* Left: Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari ID Transaksi / Order / Pelanggan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400 shadow-xs"
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

              {/* Right: Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 transition-colors shadow-xs cursor-pointer"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="WAITING_VERIFICATION">Menunggu Verifikasi (2)</option>
                    <option value="PAID">Lunas (PAID)</option>
                    <option value="PENDING">Menunggu Transfer</option>
                    <option value="REJECTED">Ditolak (REJECTED)</option>
                    <option value="EXPIRED">Kedaluwarsa</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Method Filter */}
                <div className="relative">
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="appearance-none bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 transition-colors shadow-xs cursor-pointer"
                  >
                    <option value="ALL">Semua Metode</option>
                    <option value="Bank Transfer">Transfer Bank</option>
                    <option value="QRIS">QRIS Midtrans</option>
                    <option value="Virtual Account">Virtual Account</option>
                    <option value="Tunai">Tunai Kasir</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Date Filter */}
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="appearance-none bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 transition-colors shadow-xs cursor-pointer"
                  >
                    <option value="ALL">Semua Tanggal</option>
                    <option value="TODAY">Hari Ini (16 Nov 2026)</option>
                    <option value="7DAYS">Bulan Ini (Nov 2026)</option>
                  </select>
                  <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Reset Filter Button */}
                {(searchQuery || statusFilter !== 'ALL' || methodFilter !== 'ALL' || dateFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                      setMethodFilter('ALL');
                      setDateFilter('ALL');
                    }}
                    className="p-2.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl border border-zinc-200 transition-colors text-xs font-medium flex items-center gap-1.5"
                    title="Reset Filter"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* THE DATA TABLE (PRD SECTION 9.3.5) */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-6">PAY ID</th>
                      <th className="py-3.5 px-6">ORDER REF</th>
                      <th className="py-3.5 px-6">PELANGGAN</th>
                      <th className="py-3.5 px-6">METODE</th>
                      <th className="py-3.5 px-6">TOTAL</th>
                      <th className="py-3.5 px-6">STATUS</th>
                      <th className="py-3.5 px-6 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 text-xs">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-zinc-400">
                          <CreditCard className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                          <p className="font-medium text-zinc-600">Tidak ada transaksi pembayaran ditemukan</p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            Coba ubah kata kunci pencarian atau sesuaikan opsi filter status.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => {
                        const isWaiting = payment.status === 'WAITING_VERIFICATION';
                        return (
                          <tr
                            key={payment.id}
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsRejecting(false);
                            }}
                            className={`hover:bg-zinc-50/80 transition-colors cursor-pointer group ${
                              isWaiting ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            {/* PAY ID */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-zinc-900 group-hover:text-amber-600 transition-colors">
                                  {payment.id}
                                </span>
                                {payment.proofUrl && (
                                  <span
                                    title="Memiliki bukti transfer terlampir"
                                    className="p-1 rounded bg-amber-100 text-amber-700"
                                  >
                                    <FileText className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-400 block mt-0.5">
                                {payment.date}
                              </span>
                            </td>

                            {/* ORDER REF */}
                            <td className="py-4 px-6">
                              <span className="font-mono font-semibold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                                {payment.orderRef}
                              </span>
                            </td>

                            {/* PELANGGAN */}
                            <td className="py-4 px-6">
                              <div className="font-medium text-zinc-900 truncate max-w-[180px]">
                                {payment.customerName}
                              </div>
                              <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                <span>{payment.customerPhone}</span>
                              </div>
                            </td>

                            {/* METODE */}
                            <td className="py-4 px-6">
                              <div className="font-medium text-zinc-800 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{payment.method}</span>
                              </div>
                              <span className="text-[11px] text-zinc-400 block mt-0.5 truncate max-w-[160px]">
                                {payment.destinationAccount.split('a/n')[0]}
                              </span>
                            </td>

                            {/* TOTAL */}
                            <td className="py-4 px-6">
                              <span className="font-bold text-zinc-900 font-mono">
                                {formatRupiah(payment.amount)}
                              </span>
                            </td>

                            {/* STATUS */}
                            <td className="py-4 px-6">{renderStatusBadge(payment.status)}</td>

                            {/* AKSI */}
                            <td className="py-4 px-6 text-right">
                              {isWaiting ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPayment(payment);
                                    setIsRejecting(false);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-xs"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Verifikasi</span>
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPayment(payment);
                                    setIsRejecting(false);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Lihat</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* TABLE FOOTER SUMMARY */}
              <div className="px-6 py-4 bg-zinc-50/60 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-500 gap-2">
                <span>
                  Menampilkan <span className="font-semibold text-zinc-700">{filteredPayments.length}</span> dari{' '}
                  <span className="font-semibold text-zinc-700">{payments.length}</span> total transaksi pembayaran
                </span>
                <span className="text-[11px] text-zinc-400">
                  Sinkron otomatis dengan Midtrans Snap &amp; Mutasi Bank Terdaftar
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =====================================================================
          4. PAYMENT VERIFICATION DRAWER (Slide-out panel)
          (Slide-out panel emerging from right side with backdrop)
      ===================================================================== */}
      {selectedPayment && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedPayment(null)}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Shell */}
          <aside className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl border-l border-zinc-200 z-50 transform transition-transform duration-300 flex flex-col">
            {/* Drawer Header */}
            <div className="h-20 px-8 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
                  <CreditCard className="w-5 h-5 text-zinc-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-mono font-bold text-zinc-900 text-sm">
                      {selectedPayment.id}
                    </h2>
                    {renderStatusBadge(selectedPayment.status)}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Order Ref:{' '}
                    <span className="font-mono font-semibold text-zinc-700">
                      {selectedPayment.orderRef}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                title="Tutup Panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-8 bg-zinc-50 space-y-6">
              {/* SECTION 1: TRANSACTION SUMMARY */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Ringkasan Transaksi
                  </span>
                  <span className="text-xs text-zinc-400">{selectedPayment.date}</span>
                </div>

                {/* Nominal Besar */}
                <div className="py-2">
                  <span className="text-xs text-zinc-500 block mb-1">Total Nominal Pembayaran</span>
                  <div className="text-3xl font-extrabold text-zinc-900 font-mono tracking-tight">
                    {formatRupiah(selectedPayment.amount)}
                  </div>
                </div>

                {/* Rincian Pelanggan & Rekening */}
                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex items-start justify-between py-1.5 border-t border-zinc-50">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" /> Pelanggan
                    </span>
                    <span className="font-semibold text-zinc-800 text-right">
                      {selectedPayment.customerName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-t border-zinc-50">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" /> No. Telepon
                    </span>
                    <span className="font-mono text-zinc-700">{selectedPayment.customerPhone}</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-t border-zinc-50">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" /> Email
                    </span>
                    <span className="text-zinc-700">{selectedPayment.customerEmail}</span>
                  </div>

                  <div className="flex items-start justify-between py-1.5 border-t border-zinc-50">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-zinc-400" /> Metode
                    </span>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-800">{selectedPayment.method}</p>
                      {selectedPayment.senderAccountName && selectedPayment.senderAccountName !== '-' && (
                        <p className="text-[11px] text-zinc-500">
                          a/n {selectedPayment.senderAccountName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start justify-between py-1.5 border-t border-zinc-50">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-zinc-400" /> Rekening Tujuan
                    </span>
                    <span className="text-zinc-700 text-right font-medium max-w-[240px]">
                      {selectedPayment.destinationAccount}
                    </span>
                  </div>
                </div>

                {/* Catatan Pelanggan */}
                {selectedPayment.notes && (
                  <div className="mt-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs">
                    <p className="font-semibold text-zinc-700 text-[11px] uppercase tracking-wide mb-1">
                      Catatan Pembeli:
                    </p>
                    <p className="text-zinc-600 italic">&ldquo;{selectedPayment.notes}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* SECTION 2: PROOF OF TRANSFER (FR-22 & BR-06) */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Bukti Transfer Pembeli
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Periksa kesesuaian nominal, nama pengirim, dan tanggal transfer.
                    </p>
                  </div>

                  {selectedPayment.proofUrl && (
                    <button
                      onClick={() => setLightboxImage(selectedPayment.proofUrl || null)}
                      className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Perbesar</span>
                    </button>
                  )}
                </div>

                {selectedPayment.proofUrl ? (
                  <div className="space-y-3">
                    <div
                      onClick={() => setLightboxImage(selectedPayment.proofUrl || null)}
                      className="group relative w-full h-80 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 flex items-center justify-center cursor-zoom-in hover:border-amber-400 transition-all shadow-inner"
                    >
                      <img
                        src={selectedPayment.proofUrl}
                        alt={`Bukti transfer ${selectedPayment.id}`}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-2">
                        <ZoomIn className="w-4 h-4" />
                        <span>Klik untuk Melihat Gambar Penuh</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                      <span>Format: JPG / PNG (Terverifikasi Aman)</span>
                      <a
                        href={selectedPayment.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Buka di Tab Baru
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-zinc-50 border border-zinc-200/80 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-zinc-400 mx-auto" />
                    <p className="text-xs font-semibold text-zinc-700">
                      Tidak Memerlukan Bukti Transfer Manual
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      Metode ini ({selectedPayment.method}) diverifikasi otomatis oleh payment gateway atau merupakan transaksi kasir tunai fisik di toko.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 3: AUDIT TRAIL / VERIFICATION STATUS */}
              {selectedPayment.verifiedAt && (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Telah Diverifikasi</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Waktu: <span className="font-medium">{selectedPayment.verifiedAt}</span>
                  </p>
                  {selectedPayment.verifiedBy && (
                    <p className="text-[11px] text-emerald-700">
                      Oleh: <span className="font-medium">{selectedPayment.verifiedBy}</span>
                    </p>
                  )}
                </div>
              )}

              {selectedPayment.rejectedAt && (
                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-800">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Pembayaran Ditolak</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Waktu: <span className="font-medium">{selectedPayment.rejectedAt}</span>
                  </p>
                  {selectedPayment.rejectionReason && (
                    <p className="text-[11px] text-rose-800 font-medium bg-rose-100/50 p-2 rounded-lg border border-rose-200">
                      Alasan: &ldquo;{selectedPayment.rejectionReason}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* FORM PENOLAKAN JIKA ADMIN MEMILIH TOLAK */}
              {isRejecting && selectedPayment.status === 'WAITING_VERIFICATION' && (
                <div className="bg-white p-5 rounded-2xl border-2 border-rose-300 shadow-md space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Konfirmasi Penolakan Pembayaran
                    </p>
                    <button
                      onClick={() => setIsRejecting(false)}
                      className="text-zinc-400 hover:text-zinc-600 text-xs"
                    >
                      Batal
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Pilih atau tulis alasan penolakan agar pembeli dapat mengunggah bukti yang valid:
                  </p>

                  <select
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 bg-zinc-50 font-medium text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="Nominal transfer tidak sesuai dengan tagihan.">
                      Nominal transfer tidak sesuai dengan tagihan
                    </option>
                    <option value="Bukti transfer buram atau tidak terbaca jelas.">
                      Bukti transfer buram atau tidak terbaca jelas
                    </option>
                    <option value="Mutasi dana belum masuk ke rekening bank toko.">
                      Mutasi dana belum masuk ke rekening bank toko
                    </option>
                    <option value="Rekening tujuan transfer salah.">
                      Rekening tujuan transfer salah
                    </option>
                    <option value="Bukti transfer terindikasi editan / palsu.">
                      Bukti transfer terindikasi editan / palsu
                    </option>
                  </select>

                  <textarea
                    rows={2}
                    placeholder="Catatan tambahan untuk pelanggan (opsional)..."
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setIsRejecting(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors w-1/3"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleConfirmReject}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors w-2/3 shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Yakin Tolak Pembayaran
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer (Action Area) */}
            <div className="p-6 border-t border-zinc-200 bg-white shrink-0">
              {selectedPayment.status === 'WAITING_VERIFICATION' ? (
                !isRejecting ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsRejecting(true)}
                      className="border border-red-200 text-red-600 hover:bg-red-50 bg-white px-6 py-3 rounded-xl font-semibold text-xs w-1/2 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tolak Pembayaran</span>
                    </button>

                    <button
                      onClick={handleApprovePayment}
                      className="bg-zinc-900 text-white hover:bg-zinc-800 px-6 py-3 rounded-xl font-semibold text-xs w-1/2 transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Setujui Pembayaran</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-xs text-zinc-400">
                    Selesaikan form alasan di atas untuk menyelesaikan penolakan.
                  </p>
                )
              ) : selectedPayment.status === 'PAID' ? (
                <div className="w-full py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pembayaran Selesai &amp; Terverifikasi (PAID)</span>
                </div>
              ) : selectedPayment.status === 'REJECTED' ? (
                <div className="w-full py-3 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Pembayaran Ditolak (REJECTED)</span>
                </div>
              ) : (
                <div className="w-full py-3 px-4 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>Status Transaksi: {selectedPayment.status}</span>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* =====================================================================
          5. FULLSCREEN IMAGE LIGHTBOX MODAL
      ===================================================================== */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="h-14 px-6 border-b border-zinc-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Pratinjau Bukti Transfer Pembeli</span>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center overflow-auto max-h-[calc(90vh-56px)] bg-zinc-900/50">
              <img
                src={lightboxImage}
                alt="Bukti Transfer Penuh"
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
