'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  Lock,
  ShieldCheck,
  UploadCloud,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Copy,
  ExternalLink,
  Store,
  CreditCard,
  Smartphone,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  QrCode,
  Info,
  ShoppingBag,
  ShoppingCart,
  User,
  Menu,
  MapPin,
  Phone,
  Mail,
  Search,
  FileText,
  RotateCcw,
  Truck,
  ChevronDown,
  ChevronUp,
  FileCheck,
  RefreshCw,
  BadgeCheck,
  Download,
  CheckCheck,
  Send,
  HelpCircle,
} from 'lucide-react';

// ============================================================================
// TYPES & ENUMS (PRD & DATA SPECIFICATIONS)
// ============================================================================

export type PaymentMethodId = 'bank' | 'ewallet' | 'cod';

export type PaymentStatus =
  | 'PENDING'
  | 'WAITING_VERIFICATION'
  | 'PAID'
  | 'REJECTED'
  | 'FAILED'
  | 'EXPIRED';

export interface BankAccountInfo {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  logoText: string;
  color: string;
  bgColor: string;
}

export interface EWalletInfo {
  provider: string;
  tagline: string;
  accountNumber: string;
  accountHolder: string;
  nmid: string;
}

export interface OrderItemSummary {
  id: string;
  name: string;
  variant: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  imageUrl: string;
}

// ============================================================================
// CONSTANTS & MOCK DATA (PRD ALIGNED)
// ============================================================================

const BANK_ACCOUNTS: BankAccountInfo[] = [
  {
    bankName: 'BCA (Bank Central Asia)',
    bankCode: 'BCA',
    accountNumber: '883019283391',
    accountHolder: 'TOKO ENSTEIN KEBUMEN',
    logoText: 'BCA',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  {
    bankName: 'Bank Mandiri',
    bankCode: 'MANDIRI',
    accountNumber: '1370029381029',
    accountHolder: 'TOKO ENSTEIN KEBUMEN',
    logoText: 'MANDIRI',
    color: 'text-amber-800',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  {
    bankName: 'BRI (Bank Rakyat Indonesia)',
    bankCode: 'BRI',
    accountNumber: '012301002938501',
    accountHolder: 'TOKO ENSTEIN KEBUMEN',
    logoText: 'BRI',
    color: 'text-blue-900',
    bgColor: 'bg-sky-50 border-sky-200',
  },
];

const EWALLET_OPTIONS: EWalletInfo = {
  provider: 'QRIS & E-Wallet Nasional',
  tagline: 'Mendukung GoPay, OVO, DANA, ShopeePay, LinkAja & BCA Mobile',
  accountNumber: '0812-3456-7890',
  accountHolder: 'TOKO ENSTEIN STORE',
  nmid: 'ID1020039281920',
};

const ORDER_ITEMS_MOCK: OrderItemSummary[] = [
  {
    id: 'item-1',
    name: 'Resleting Waterproof 70cm Hitam Heavy-Duty',
    variant: 'Hitam Matte / Gigi Rapat Seal TPU',
    quantity: 2,
    unit: 'pcs',
    unitPrice: 8500,
    subtotal: 17000,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
  },
  {
    id: 'item-2',
    name: 'Kain Taslan Milky Balon Waterproof Navy',
    variant: 'Navy Premium / Coating Balon Anti Rembes',
    quantity: 3,
    unit: 'meter',
    unitPrice: 42500,
    subtotal: 127500,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCNavy.jpeg',
  },
];

// Delivery fee and price calculation
const SUBTOTAL_AMOUNT = 144500;
const DELIVERY_FEE = 15500;
const TOTAL_AMOUNT = SUBTOTAL_AMOUNT + DELIVERY_FEE; // Exactly Rp 160.000

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
}

// ============================================================================
// MAIN PAYMENT PAGE COMPONENT
// ============================================================================

export default function OrderPaymentPage() {
  const params = useParams();
  const router = useRouter();

  // Extract order ID from params or provide standard default PRD ID
  const rawId = params?.id;
  const orderId = useMemo(() => {
    if (typeof rawId === 'string' && rawId.trim()) return rawId.trim();
    if (Array.isArray(rawId) && rawId[0]) return rawId[0].trim();
    return 'EST-20261111-0001';
  }, [rawId]);

  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  // Default selected payment method is 'bank'
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('bank');
  const [selectedBankIndex, setSelectedBankIndex] = useState<number>(0);
  
  // Real-time Countdown Timer (PRD 12.5 - Default 24 hours reservation duration)
  // 23 hours, 59 minutes, 59 seconds = 86399 seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(86399);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // File Upload State (FR-21)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Processing & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [modalType, setModalType] = useState<
    'SUCCESS_PAID' | 'WAITING_VERIFICATION' | null
  >(null);

  // UI helpers & Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchNavQuery, setSearchNavQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // COUNTDOWN TIMER EFFECT (PRD 12.5)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isTimerPaused || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPaymentStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerPaused, secondsRemaining]);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl);
      }
    };
  }, [uploadPreviewUrl]);

  // Show temporary toast feedback
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`${label} berhasil disalin ke clipboard!`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  // --------------------------------------------------------------------------
  // FILE UPLOAD HANDLERS (FR-21 Manual Upload & 2MB Limit)
  // --------------------------------------------------------------------------
  const validateAndSetFile = (file: File) => {
    setUploadError(null);

    // Validate MIME types (JPG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Format berkas tidak didukung. Harap unggah foto berekstensi JPG atau PNG.');
      showToast('Gagal: Format file harus JPG atau PNG');
      return;
    }

    // Validate 2MB size limit (2 * 1024 * 1024 bytes)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('Ukuran berkas melebihi batas 2MB. Silakan kompres atau pilih berkas lain.');
      showToast('Gagal: Ukuran bukti transfer melebihi batas 2MB');
      return;
    }

    // Valid file
    setUploadedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setUploadPreviewUrl(objectUrl);
    showToast('Bukti transfer berhasil dipilih!');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (uploadPreviewUrl) {
      URL.revokeObjectURL(uploadPreviewUrl);
    }
    setUploadedFile(null);
    setUploadPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Bukti transfer dihapus.');
  };

  // --------------------------------------------------------------------------
  // SUBMISSION & SIMULATION ACTIONS (FR-21, FR-23, PRD 7.4)
  // --------------------------------------------------------------------------

  // Action for Bank Transfer & E-Wallet: Upload & Confirm (FR-21)
  const handleSubmitManualProof = (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile) {
      setUploadError('Harap lampirkan foto bukti transfer pembayaran sebelum melanjutkan.');
      showToast('Harap unggah bukti transfer terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setPaymentStatus('WAITING_VERIFICATION');
      setModalType('WAITING_VERIFICATION');
      showToast('Bukti berhasil dikirim! Menunggu verifikasi admin.');
    }, 1200);
  };



  // Action for Cash on Pickup confirmation
  const handleConfirmPickup = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setPaymentStatus('PENDING');
      setModalType('WAITING_VERIFICATION');
      showToast('Pesanan pickup dikonfirmasi! Bayar tunai saat pengambilan.');
    }, 1000);
  };

  const activeBank = BANK_ACCOUNTS[selectedBankIndex];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      {/* =================================================================== */}
      {/* 1. STANDARDIZED GLOBAL NAVBAR (Consistent with All Pages)           */}
      {/* =================================================================== */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-lg border-b border-zinc-200 transition-all">
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
                  2
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
              Shopping Cart (2)
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
      {/* pt-12 pb-8 px-4 md:px-12 xl:px-24 text-center                       */}
      {/* =================================================================== */}
      <section className="pt-12 pb-8 px-4 md:px-12 xl:px-24 text-center max-w-4xl mx-auto">
        {/* Navigation Breadcrumb Back */}
        <div className="inline-flex items-center gap-2 mb-4 text-xs text-zinc-500">
          <Link href="/checkout" className="hover:text-zinc-900 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Checkout</span>
          </Link>
          <span>/</span>
          <span className="text-zinc-900 font-semibold">Instruksi Pembayaran</span>
        </div>

        {/* Order ID with Copy Action */}
        <div className="flex items-center justify-center gap-2 text-zinc-500 font-medium tracking-wide">
          <span className="font-mono text-sm sm:text-base">Order #{orderId}</span>
          <button
            type="button"
            onClick={() => handleCopy(orderId, 'Nomor Pesanan', 'orderId')}
            title="Salin Nomor Pesanan"
            className="p-1 text-zinc-400 hover:text-zinc-800 rounded-md transition-colors cursor-pointer"
          >
            {copiedKey === 'orderId' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mt-2 tracking-tight">
          Pilih Metode Pembayaran
        </h1>

        <p className="text-sm text-zinc-500 mt-2 max-w-lg mx-auto">
          Silakan selesaikan pembayaran untuk mengonfirmasi pesanan kain dan aksesoris Anda.
        </p>

        {/* Timer Badge: PRD 12.5 Countdown Timer */}
        <div className="mt-4 flex flex-col items-center">
          <div
            className={`border rounded-full px-4 py-2 inline-flex items-center gap-2 font-medium shadow-xs transition-colors duration-300 ${
              secondsRemaining < 3600
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                : 'bg-red-50 text-red-600 border-red-100'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0 text-red-500 animate-spin-slow" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide">
              Selesaikan pembayaran dalam{' '}
              <span className="font-mono font-bold text-red-700 bg-red-100/70 px-1.5 py-0.5 rounded-md">
                {formatCountdown(secondsRemaining)}
              </span>
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Masa berlaku reservasi stok material pesanan Anda</span>
          </p>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. MAIN LAYOUT (px-4 md:px-12 xl:px-24 pb-24 grid...)               */}
      {/* =================================================================== */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-12 xl:px-24 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mt-8 items-start">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: PAYMENT METHODS (span 7 or 8)                        */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Section Heading */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span>Daftar Metode Pembayaran</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                  3 Pilihan Metode
                </span>
              </h2>
              <span className="text-xs text-zinc-400 hidden sm:inline">Pilih salah satu metode</span>
            </div>

            {/* Vertical List of Selectable Payment Methods (Radio-card style) */}
            <div className="space-y-4">
              
              {/* ------------------------------------------------------------- */}
              {/* METHOD 1: BANK TRANSFER (MANUAL)                              */}
              {/* ------------------------------------------------------------- */}
              <div
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  selectedMethod === 'bank'
                    ? 'border-zinc-900 bg-white shadow-md ring-1 ring-zinc-900/5'
                    : 'border-zinc-200 bg-transparent text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50/50'
                }`}
              >
                {/* Clickable Header Card */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('bank')}
                  className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    {/* Radio Indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedMethod === 'bank'
                          ? 'border-zinc-900 bg-zinc-900'
                          : 'border-zinc-300 bg-transparent'
                      }`}
                    >
                      {selectedMethod === 'bank' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        selectedMethod === 'bank'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>

                    {/* Label */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 text-base sm:text-lg">
                          Transfer Bank Manual
                        </span>
                        <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Verifikasi Manual
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                        Transfer via BCA, Mandiri, atau BRI lalu unggah bukti transfer.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Arrow */}
                  <div className="text-zinc-400 shrink-0 mt-1 sm:mt-0">
                    {selectedMethod === 'bank' ? (
                      <ChevronUp className="w-5 h-5 text-zinc-900" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Expanded Accordion Content */}
                {selectedMethod === 'bank' && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-zinc-100 space-y-6 animate-in fade-in duration-200">
                    
                    {/* Bank Selection Tabs */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                        Pilih Rekening Tujuan:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {BANK_ACCOUNTS.map((bank, idx) => (
                          <button
                            key={bank.bankCode}
                            type="button"
                            onClick={() => setSelectedBankIndex(idx)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              selectedBankIndex === idx
                                ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                                : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            <span className="text-xs font-black tracking-wider uppercase">
                              {bank.logoText}
                            </span>
                            <span className="text-[11px] font-mono mt-1 opacity-90 truncate">
                              {bank.accountNumber}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bank Account Details Card */}
                    <div className="bg-zinc-100/70 border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                        <span className="text-xs text-zinc-500 font-medium">Bank Tujuan</span>
                        <span className="text-sm font-bold text-zinc-900">{activeBank.bankName}</span>
                      </div>

                      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                        <div>
                          <span className="text-xs text-zinc-500 font-medium block">Nomor Rekening</span>
                          <span className="text-base sm:text-lg font-mono font-bold text-zinc-900 tracking-wider">
                            {activeBank.accountNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              activeBank.accountNumber,
                              `Nomor Rekening ${activeBank.logoText}`,
                              'bankAcc'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          {copiedKey === 'bankAcc' ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Salin No. Rek</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                        <span className="text-xs text-zinc-500 font-medium">Atas Nama (A.N)</span>
                        <span className="text-sm font-bold text-zinc-900 uppercase">
                          {activeBank.accountHolder}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-zinc-500 font-medium block">Nominal Transfer Tepat</span>
                          <span className="text-base sm:text-lg font-mono font-bold text-zinc-900">
                            {formatRupiah(TOTAL_AMOUNT)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(TOTAL_AMOUNT.toString(), 'Nominal Transfer', 'amount')
                          }
                          className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          {copiedKey === 'amount' ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Salin Jumlah</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Modern Drag & Drop File Upload Zone */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                          Unggah Bukti Transfer:
                        </label>
                        <span className="text-[11px] text-zinc-400">Maks. 2MB (JPG/PNG)</span>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />

                      {/* Drop Zone Box */}
                      {!uploadedFile ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer text-center group ${
                            isDragging
                              ? 'border-zinc-900 bg-zinc-100 ring-2 ring-zinc-900/10'
                              : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-zinc-200 flex items-center justify-center text-zinc-600 group-hover:scale-110 group-hover:text-zinc-900 transition-transform">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-zinc-800">
                            Tarik &amp; Lepas bukti transfer atau{' '}
                            <span className="text-amber-600 underline underline-offset-2">
                              Klik di sini
                            </span>
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Format JPG, JPEG, atau PNG (Maks. 2MB)
                          </p>
                        </div>
                      ) : (
                        /* Uploaded File Preview Card */
                        <div className="border border-zinc-200 bg-white rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {uploadPreviewUrl ? (
                              <img
                                src={uploadPreviewUrl}
                                alt="Preview Bukti Transfer"
                                className="w-14 h-14 rounded-xl object-cover border border-zinc-200 shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                                <FileCheck className="w-6 h-6 text-emerald-600" />
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-zinc-900 truncate">
                                {uploadedFile.name}
                              </p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {(uploadedFile.size / 1024).toFixed(1)} KB • Siap diunggah
                              </p>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                                <Check className="w-3 h-3" /> Berkas valid
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
                            >
                              Ganti
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus berkas"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Error message */}
                      {uploadError && (
                        <div className="mt-2.5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{uploadError}</span>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSubmitManualProof}
                      className="bg-zinc-900 text-white w-full py-4 rounded-full mt-6 font-semibold hover:bg-zinc-800 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mengunggah Bukti Pembayaran...</span>
                        </>
                      ) : (
                        <>
                          <span>Unggah &amp; Konfirmasi Pembayaran</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* METHOD 2: E-WALLET / QRIS (MANUAL)                            */}
              {/* ------------------------------------------------------------- */}
              <div
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  selectedMethod === 'ewallet'
                    ? 'border-zinc-900 bg-white shadow-md ring-1 ring-zinc-900/5'
                    : 'border-zinc-200 bg-transparent text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50/50'
                }`}
              >
                {/* Clickable Header Card */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('ewallet')}
                  className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    {/* Radio Indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedMethod === 'ewallet'
                          ? 'border-zinc-900 bg-zinc-900'
                          : 'border-zinc-300 bg-transparent'
                      }`}
                    >
                      {selectedMethod === 'ewallet' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        selectedMethod === 'ewallet'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      <QrCode className="w-5 h-5" />
                    </div>

                    {/* Label */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 text-base sm:text-lg">
                          E-Wallet / QRIS
                        </span>
                        <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                          QRIS &amp; Dompet Digital
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                        Scan QRIS via GoPay, OVO, DANA, ShopeePay, atau BCA Mobile.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Arrow */}
                  <div className="text-zinc-400 shrink-0 mt-1 sm:mt-0">
                    {selectedMethod === 'ewallet' ? (
                      <ChevronUp className="w-5 h-5 text-zinc-900" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Expanded Accordion Content */}
                {selectedMethod === 'ewallet' && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-zinc-100 space-y-6 animate-in fade-in duration-200">
                    
                    {/* QRIS Graphic & Instructions */}
                    <div className="bg-zinc-100/70 border border-zinc-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
                      {/* Stylized QR Code Frame */}
                      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center shrink-0">
                        <div className="w-40 h-40 bg-zinc-900 rounded-xl p-2 flex items-center justify-center relative overflow-hidden">
                          {/* Inner Mock QR Matrix Pattern */}
                          <div className="w-full h-full bg-white rounded-lg p-2 grid grid-cols-6 grid-rows-6 gap-1 relative">
                            {/* Corner squares */}
                            <div className="col-span-2 row-span-2 border-4 border-zinc-900 rounded-xs flex items-center justify-center p-0.5">
                              <div className="w-full h-full bg-zinc-900 rounded-xs" />
                            </div>
                            <div className="col-span-2 col-start-5 row-span-2 border-4 border-zinc-900 rounded-xs flex items-center justify-center p-0.5">
                              <div className="w-full h-full bg-zinc-900 rounded-xs" />
                            </div>
                            <div className="col-span-2 row-span-2 row-start-5 border-4 border-zinc-900 rounded-xs flex items-center justify-center p-0.5">
                              <div className="w-full h-full bg-zinc-900 rounded-xs" />
                            </div>
                            
                            {/* Random-like pixel matrix */}
                            <div className="col-start-3 row-start-2 bg-zinc-900 rounded-xs" />
                            <div className="col-start-4 row-start-2 bg-zinc-900 rounded-xs" />
                            <div className="col-start-3 row-start-3 bg-zinc-900 rounded-xs" />
                            <div className="col-start-4 row-start-4 bg-zinc-900 rounded-xs" />
                            <div className="col-start-5 row-start-3 bg-zinc-900 rounded-xs" />
                            <div className="col-start-5 row-start-4 bg-zinc-900 rounded-xs" />
                            <div className="col-start-6 row-start-4 bg-zinc-900 rounded-xs" />
                            <div className="col-start-3 row-start-5 bg-zinc-900 rounded-xs" />
                            <div className="col-start-4 row-start-5 bg-zinc-900 rounded-xs" />

                            {/* Center brand dot */}
                            <div className="absolute inset-0 m-auto w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                              E
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-center">
                          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase block">
                            NMID: {EWALLET_OPTIONS.nmid}
                          </span>
                          <span className="text-xs font-bold text-zinc-900 block mt-0.5">
                            TOKO ENSTEIN KEBUMEN
                          </span>
                        </div>
                      </div>

                      {/* Instruction Steps */}
                      <div className="space-y-3 text-left w-full">
                        <h4 className="text-sm font-bold text-zinc-900">
                          Cara Pembayaran via QRIS:
                        </h4>
                        <ol className="text-xs text-zinc-600 space-y-2 list-decimal list-inside leading-relaxed">
                          <li>Buka aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay) atau Mobile Banking.</li>
                          <li>Pilih menu <strong>Pindai / Scan QRIS</strong>.</li>
                          <li>Arahkan kamera ke kode QR di samping.</li>
                          <li>
                            Pastikan nominal pembayaran adalah{' '}
                            <strong className="text-zinc-900 font-mono">{formatRupiah(TOTAL_AMOUNT)}</strong>.
                          </li>
                          <li>Simpan tangkapan layar (screenshot) bukti pembayaran yang sukses.</li>
                        </ol>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => showToast('Kode QRIS Toko Enstein diunduh!')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh Kode QR</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Drag & Drop Upload Zone for E-Wallet Proof */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                          Unggah Tangkapan Layar Bukti QRIS:
                        </label>
                        <span className="text-[11px] text-zinc-400">Maks. 2MB (JPG/PNG)</span>
                      </div>

                      {!uploadedFile ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer text-center group ${
                            isDragging
                              ? 'border-zinc-900 bg-zinc-100 ring-2 ring-zinc-900/10'
                              : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-zinc-200 flex items-center justify-center text-zinc-600 group-hover:scale-110 group-hover:text-zinc-900 transition-transform">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-zinc-800">
                            Tarik &amp; Lepas screenshot bukti transfer atau{' '}
                            <span className="text-amber-600 underline underline-offset-2">
                              Klik di sini
                            </span>
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Format JPG, JPEG, atau PNG (Maks. 2MB)
                          </p>
                        </div>
                      ) : (
                        <div className="border border-zinc-200 bg-white rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {uploadPreviewUrl ? (
                              <img
                                src={uploadPreviewUrl}
                                alt="Preview Bukti E-Wallet"
                                className="w-14 h-14 rounded-xl object-cover border border-zinc-200 shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                                <FileCheck className="w-6 h-6 text-emerald-600" />
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-zinc-900 truncate">
                                {uploadedFile.name}
                              </p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {(uploadedFile.size / 1024).toFixed(1)} KB • Siap dikonfirmasi
                              </p>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                                <Check className="w-3 h-3" /> Berkas valid
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
                            >
                              Ganti
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus berkas"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {uploadError && (
                        <div className="mt-2.5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{uploadError}</span>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSubmitManualProof}
                      className="bg-zinc-900 text-white w-full py-4 rounded-full mt-6 font-semibold hover:bg-zinc-800 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mengunggah Bukti Pembayaran...</span>
                        </>
                      ) : (
                        <>
                          <span>Unggah &amp; Konfirmasi Pembayaran</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* METHOD 3: CASH ON PICKUP (FR-20)                              */}
              {/* ------------------------------------------------------------- */}
              <div
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  selectedMethod === 'cod'
                    ? 'border-zinc-900 bg-white shadow-md ring-1 ring-zinc-900/5'
                    : 'border-zinc-200 bg-transparent text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50/50'
                }`}
              >
                {/* Clickable Header Card */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('cod')}
                  className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    {/* Radio Indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedMethod === 'cod'
                          ? 'border-zinc-900 bg-zinc-900'
                          : 'border-zinc-300 bg-transparent'
                      }`}
                    >
                      {selectedMethod === 'cod' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        selectedMethod === 'cod'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      <Store className="w-5 h-5" />
                    </div>

                    {/* Label */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 text-base sm:text-lg">
                          Cash on Pickup (Bayar Tunai di Toko)
                        </span>
                        <span className="text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded-full">
                          Ambil di Toko
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                        Bayar langsung dengan uang pas saat mengambil pesanan di Toko Enstein Kebumen.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Arrow */}
                  <div className="text-zinc-400 shrink-0 mt-1 sm:mt-0">
                    {selectedMethod === 'cod' ? (
                      <ChevronUp className="w-5 h-5 text-zinc-900" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Expanded Accordion Content */}
                {selectedMethod === 'cod' && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-zinc-100 space-y-5 animate-in fade-in duration-200">
                    {/* Info Text Box */}
                    <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-zinc-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-zinc-600 leading-relaxed space-y-2">
                          <p className="font-semibold text-zinc-900 text-sm">
                            Ketentuan Pembayaran Cash on Pickup:
                          </p>
                          <p>
                            Pesanan Anda akan disiapkan dan stok tetap direservasi. Silakan datang langsung ke toko fisik kami untuk melakukan pembayaran tunai di kasir dan mengambil barang pesanan:
                          </p>
                          <div className="p-3 bg-white rounded-xl border border-zinc-200 text-zinc-800 space-y-1 font-medium">
                            <p className="font-bold text-zinc-900">📍 Lokasi Toko Enstein Kebumen</p>
                            <p className="text-zinc-600">Jl. Kusuma No. 42, Kebumen, Jawa Tengah</p>
                            <p className="text-zinc-500 text-[11px]">Jam Operasional: Senin – Sabtu, 08:00 – 17:00 WIB</p>
                          </div>
                          <p className="text-zinc-500 italic">
                            *Tunjukkan Nomor Pesanan (<strong>#{orderId}</strong>) kepada staf toko kami saat pengambilan. Harap siapkan uang pas sebesar <strong>{formatRupiah(TOTAL_AMOUNT)}</strong>.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Single Confirmation Button */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirmPickup}
                      className="bg-zinc-900 text-white w-full py-4 rounded-full font-semibold hover:bg-zinc-800 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mengonfirmasi Pesanan...</span>
                        </>
                      ) : (
                        <>
                          <span>Konfirmasi Pesanan</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>



            </div>

            {/* Security & Customer Guarantee Notice */}
            <div className="p-4 rounded-2xl bg-zinc-100/60 border border-zinc-200 flex items-center gap-3 text-xs text-zinc-600">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Setiap pembayaran yang masuk diverifikasi langsung oleh Admin Toko Enstein. Stok pesanan Anda dijamin aman hingga status pesanan siap kirim atau siap diambil.
              </span>
            </div>

          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: PAYMENT SUMMARY (span 4 or 5)                       */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-32 bg-zinc-900 text-white rounded-3xl p-8 shadow-xl border border-zinc-800">
              
              {/* Badge & Order No */}
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold uppercase tracking-wider">Ringkasan Tagihan</span>
                <span className="font-mono text-zinc-300">#{orderId}</span>
              </div>

              {/* Title & Value */}
              <div className="mt-4">
                <span className="text-zinc-400 text-xs uppercase tracking-wider block font-medium">
                  Total Tagihan
                </span>
                <p className="text-3xl sm:text-4xl font-bold mt-1 tracking-tight text-white font-mono">
                  {formatRupiah(TOTAL_AMOUNT)}
                </p>
              </div>

              {/* Status Badge */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : paymentStatus === 'WAITING_VERIFICATION'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : paymentStatus === 'FAILED'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {paymentStatus === 'PAID'
                    ? 'Lunas (PAID)'
                    : paymentStatus === 'WAITING_VERIFICATION'
                    ? 'Menunggu Verifikasi Admin'
                    : paymentStatus === 'FAILED'
                    ? 'Pembayaran Gagal'
                    : 'Menunggu Pembayaran'}
                </span>
              </div>

              {/* Divider */}
              <hr className="border-zinc-800 my-6" />

              {/* Brief Order Summary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  <span>Daftar Produk ({ORDER_ITEMS_MOCK.length} Item)</span>
                  <span>Subtotal</span>
                </div>

                <div className="space-y-3">
                  {ORDER_ITEMS_MOCK.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5 flex-1 pr-2">
                        <p className="text-zinc-200 font-medium leading-snug line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-zinc-400 text-[11px]">
                          {item.quantity} {item.unit} × {formatRupiah(item.unitPrice)}
                        </p>
                      </div>
                      <span className="font-mono text-zinc-200 font-semibold shrink-0">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotals & Fees */}
                <div className="pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Subtotal Produk</span>
                    <span className="font-mono text-zinc-200">{formatRupiah(SUBTOTAL_AMOUNT)}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Biaya Pengiriman</span>
                    </span>
                    <span className="font-mono text-zinc-200">{formatRupiah(DELIVERY_FEE)}</span>
                  </div>
                </div>

                {/* Total Row */}
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-sm">
                  <span className="font-bold text-white">Total Pembayaran</span>
                  <span className="font-mono font-bold text-base text-amber-400">
                    {formatRupiah(TOTAL_AMOUNT)}
                  </span>
                </div>
              </div>

              {/* Secure Wording Box (PRD Spec) */}
              <div className="mt-8 pt-6 border-t border-zinc-800">
                <div className="flex items-start gap-3 bg-zinc-800/60 rounded-2xl p-4 border border-zinc-700/50">
                  <div className="w-8 h-8 rounded-xl bg-zinc-700/60 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-zinc-200">
                      Pembayaran Anda diproses secara aman. Stok saat ini sedang direservasi.
                    </p>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Sistem mengunci stok fisik material jas hujan Anda agar tidak dibeli pelanggan lain selama batas waktu berlangsung.
                    </p>
                  </div>
                </div>
              </div>

              {/* Help contact */}
              <div className="mt-4 text-center">
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Admin%20Toko%20Enstein,%20saya%20ingin%20konfirmasi%20pembayaran%20pesanan%20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Butuh bantuan pembayaran? Hubungi CS Toko</span>
                </a>
              </div>

            </div>
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

      {/* =================================================================== */}
      {/* CONFIRMATION MODAL: WAITING VERIFICATION                            */}
      {/* =================================================================== */}
      {modalType === 'WAITING_VERIFICATION' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 mx-auto">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            <div className="text-center">
              <span className="text-xs uppercase tracking-widest font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                {selectedMethod === 'cod' ? 'Pesanan Siap Diambil' : 'Menunggu Verifikasi Admin'}
              </span>
              <h3 className="text-2xl font-bold text-zinc-900 mt-3">
                {selectedMethod === 'cod' ? 'Pesanan Pickup Dikonfirmasi!' : 'Bukti Pembayaran Terkirim!'}
              </h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                {selectedMethod === 'cod'
                  ? `Pesanan #${orderId} telah kami catat. Silakan kunjungi Toko Enstein di Kebumen untuk melunasi secara tunai dan mengambil pesanan Anda.`
                  : `Bukti transfer Anda untuk pesanan #${orderId} telah berhasil kami terima. Admin Toko Enstein akan memeriksa mutasi rekening dan memvalidasi pembayaran Anda dalam waktu 1x24 jam kerja.`}
              </p>
            </div>

            {/* Proof Snapshot if uploaded */}
            {uploadPreviewUrl && (
              <div className="mt-4 p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
                <img
                  src={uploadPreviewUrl}
                  alt="Bukti Transfer"
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-200"
                />
                <div className="text-xs text-left overflow-hidden">
                  <p className="font-bold text-zinc-900 truncate">{uploadedFile?.name}</p>
                  <p className="text-zinc-400">Tersimpan dalam database pembayaran aktif</p>
                </div>
              </div>
            )}

            {/* Status notice */}
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2 text-left">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Stok Tetap Aman:</strong> Selama status menunggu verifikasi, reservasi stok barang tetap terjaga dan tidak akan dilepas ke pelanggan lain.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="w-full sm:w-1/2 py-3 px-4 rounded-full text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 text-center transition-colors cursor-pointer"
              >
                Tutup Jendela
              </button>
              <Link
                href={`/orders/${orderId}`}
                className="w-full sm:w-1/2 py-3 px-4 rounded-full text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 text-center transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Lihat Status Pesanan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING FEEDBACK TOAST                                             */}
      {/* =================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-900 text-white text-xs font-medium shadow-2xl animate-in slide-in-from-bottom-5 duration-300 border border-zinc-700">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
