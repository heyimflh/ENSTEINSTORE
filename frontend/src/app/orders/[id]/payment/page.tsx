'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getOrderDetail, getPayment, uploadPaymentProof, simulatePayment, getStoreConfig } from '@/lib/orders-api';
import { ApiException, getToken } from '@/lib/api';
import type { OrderDetailResponse, PaymentResponse, StoreConfigResponse, BankAccountInfo, EWalletInfo } from '@/types/api';
import { Navbar } from '@/components/store/Navbar';
import { Footer } from '@/components/store/Footer';
import {
  Clock,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Store,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  Wallet,
  Banknote,
  UploadCloud,
  ChevronRight,
  RefreshCw,
  Loader2,
  Lock,
  MessageCircle,
  CheckCheck,
  XCircle,
  ZoomIn,
  ZoomOut,
  X,
  FileCheck2,
  Receipt,
} from 'lucide-react';

function formatIDR(n: number | null | undefined): string {
  const num = typeof n === 'number' && !isNaN(n) ? n : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

function formatDate(iso: string | null | undefined): string {
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

/**
 * Resolves proof of payment URL:
 * - If full URL (http/https/blob/data), returns as is.
 * - If leading slash (/uploads/...), prefixes backend origin.
 * - If bare filename (c6c9ff8a-...jpeg), maps to backend uploads/payments path.
 */
function resolveProofImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');
  if (url.startsWith('/')) {
    return `${backendBase}${url}`;
  }
  return `${backendBase}/uploads/payments/${url}`;
}

// Fallback bank accounts if store config returns empty
const DEFAULT_BANKS: BankAccountInfo[] = [
  {
    bankName: 'BCA (Bank Central Asia)',
    bankCode: 'BCA',
    accountNumber: '883019283391',
    accountHolder: 'TOKO ENSTEIN KEBUMEN',
  },
  {
    bankName: 'Bank Mandiri',
    bankCode: 'MANDIRI',
    accountNumber: '1370029381029',
    accountHolder: 'TOKO ENSTEIN KEBUMEN',
  },
  {
    bankName: 'BRI (Bank Rakyat Indonesia)',
    bankCode: 'BRI',
    accountNumber: '012301002938501',
    accountHolder: 'TOKO ENSTEIN KEBUMEN',
  },
];

const DEFAULT_EWALLETS: EWalletInfo[] = [
  {
    walletName: 'QRIS & E-Wallet Nasional',
    walletCode: 'QRIS',
    accountNumber: '0838-7694-2484',
    accountHolder: 'TOKO ENSTEIN KEBUMEN',
  },
  {
    walletName: 'DANA / GoPay / OVO',
    walletCode: 'DANA',
    accountNumber: '0838-7694-2484',
    accountHolder: 'TOKO ENSTEIN KEBUMEN',
  },
];

export default function OrderPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const orderIdOrNumber = (params?.id as string) || '';

  const { isLoggedIn, loading: authLoading } = useAuth();

  // Core Data States
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active payment method selection
  const [selectedMethod, setSelectedMethod] = useState<'BANK_TRANSFER' | 'E_WALLET' | 'CASH' | 'SIMULATED'>('BANK_TRANSFER');
  const [selectedBankIdx, setSelectedBankIdx] = useState(0);
  const [selectedWalletIdx, setSelectedWalletIdx] = useState(0);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Authenticated proof blob URL
  const [proofBlobUrl, setProofBlobUrl] = useState<string | null>(null);

  // Lightbox Zoom Modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string>('');
  const [lightboxZoomLevel, setLightboxZoomLevel] = useState<number>(1);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{ success: boolean; message: string } | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 24,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  // 1. Fetch Order and Payment Data
  const fetchData = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderRes = await getOrderDetail(orderIdOrNumber);
      setOrder(orderRes);

      // Fetch payment details
      if (orderRes.id) {
        try {
          const payRes = await getPayment(orderRes.id);
          setPayment(payRes);
        } catch {
          if (orderRes.payment) setPayment(orderRes.payment);
        }
      }

      // Fetch dynamic store configuration
      try {
        const cfg = await getStoreConfig();
        setStoreConfig(cfg);
      } catch {
        // silent fallback to default store config
      }

      // Pre-select payment method based on order
      const initialMethod = (orderRes.payment?.paymentMethod || (orderRes as any).paymentMethod) as string;
      if (initialMethod === 'E_WALLET') setSelectedMethod('E_WALLET');
      else if (initialMethod === 'CASH') setSelectedMethod('CASH');
      else if (initialMethod === 'SIMULATED') setSelectedMethod('SIMULATED');
      else setSelectedMethod('BANK_TRANSFER');
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('Gagal memuat rincian pembayaran. Pesanan mungkin tidak ditemukan.');
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, orderIdOrNumber]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  // 2. Countdown Timer Calculation
  useEffect(() => {
    if (!order?.paymentDeadline) return;

    const deadlineTime = new Date(order.paymentDeadline).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = deadlineTime - now;

      if (diff <= 0 || order.orderStatus === 'CANCELLED' || payment?.status === 'EXPIRED') {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [order?.paymentDeadline, order?.orderStatus, payment?.status]);

  // 3. Authenticated Proof Blob Loading Fallback
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    const currentProofUrl = payment?.proofOfPaymentUrl;

    if (!currentProofUrl) {
      setProofBlobUrl(null);
      return;
    }

    const loadAuthenticatedImage = async () => {
      const rawUrl = currentProofUrl;
      const filename = rawUrl.split('/').pop() || rawUrl;
      const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');

      const candidates = [
        resolveProofImageUrl(rawUrl),
        `${backendBase}/api/payments/proofs/${filename}`,
        `${backendBase}/uploads/payments/${filename}`,
        `${backendBase}/uploads/proofs/${filename}`,
        `${backendBase}/uploads/${filename}`,
        `/uploads/payments/${filename}`,
        `/uploads/proofs/${filename}`,
        `/uploads/${filename}`,
      ];

      const token = getToken();

      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const blob = await res.blob();
            if (active && blob.size > 0) {
              objectUrl = URL.createObjectURL(blob);
              setProofBlobUrl(objectUrl);
              return;
            }
          }
        } catch {
          // continue searching next candidate
        }
      }
    };

    loadAuthenticatedImage();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [payment?.proofOfPaymentUrl]);

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxOpen) {
        setLightboxOpen(false);
        setLightboxZoomLevel(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // 4. Handle Clipboard Copy
  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // 5. Handle File Selection & Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Format berkas harus JPG, PNG, atau WEBP.');
      return;
    }

    // Validate size (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Ukuran gambar maksimal adalah 2 MB.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // 6. Handle Proof Upload Submission
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order?.id || !selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const updatedPayment = await uploadPaymentProof(order.id, selectedFile);
      setPayment(updatedPayment);

      // Re-fetch order to update orderStatus if changed
      const updatedOrder = await getOrderDetail(orderIdOrNumber);
      setOrder(updatedOrder);

      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      if (err instanceof ApiException) {
        setUploadError(err.message);
      } else {
        setUploadError('Gagal mengunggah bukti pembayaran. Silakan coba lagi.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // 7. Handle Payment Simulation (Demo Mode)
  const handleSimulate = async (outcome: 'SUCCESS' | 'FAILED') => {
    if (!order?.id) return;

    setIsSimulating(true);
    setSimulationResult(null);

    try {
      const updatedPayment = await simulatePayment(order.id, outcome);
      setPayment(updatedPayment);

      const updatedOrder = await getOrderDetail(orderIdOrNumber);
      setOrder(updatedOrder);

      if (outcome === 'SUCCESS') {
        setSimulationResult({
          success: true,
          message: 'Simulasi pembayaran berhasil! Pesanan telah diverifikasi lunas.',
        });
      } else {
        setSimulationResult({
          success: false,
          message: 'Simulasi kegagalan diproses. Status tetap menunggu pembayaran dan stok tetap direservasi.',
        });
      }
    } catch (err) {
      if (err instanceof ApiException) {
        setSimulationResult({ success: false, message: err.message });
      } else {
        setSimulationResult({ success: false, message: 'Gagal menjalankan simulasi pembayaran.' });
      }
    } finally {
      setIsSimulating(false);
    }
  };

  // Open Lightbox Modal
  const openLightboxModal = (src: string) => {
    if (!src) return;
    setLightboxSrc(src);
    setLightboxZoomLevel(1);
    setLightboxOpen(true);
  };

  const closeLightboxModal = () => {
    setLightboxOpen(false);
    setLightboxZoomLevel(1);
  };

  // Derived bank & wallet lists
  const bankAccounts = useMemo(() => {
    return storeConfig?.bankAccounts?.length ? storeConfig.bankAccounts : DEFAULT_BANKS;
  }, [storeConfig?.bankAccounts]);

  const activeBank = bankAccounts[selectedBankIdx] || bankAccounts[0];

  const ewallets = useMemo(() => {
    return storeConfig?.ewallets?.length ? storeConfig.ewallets : DEFAULT_EWALLETS;
  }, [storeConfig?.ewallets]);

  const activeWallet = ewallets[selectedWalletIdx] || ewallets[0];

  const currentPaymentStatus = payment?.status || 'PENDING';
  const isSimulationAllowed = storeConfig?.simulationEnabled !== false;

  // Active Proof Display URL (prefer authenticated blob URL, fallback to resolved direct URL)
  const activeProofUrl = useMemo(() => {
    if (proofBlobUrl) return proofBlobUrl;
    if (payment?.proofOfPaymentUrl) return resolveProofImageUrl(payment.proofOfPaymentUrl);
    return null;
  }, [proofBlobUrl, payment?.proofOfPaymentUrl]);

  // Unauthenticated Guard
  if (!authLoading && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/orders" />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-10 text-center shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/70 mx-auto flex items-center justify-center mb-5 text-amber-600">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Masuk ke Akun Anda</h1>
            <p className="text-zinc-600 text-sm mb-8 leading-relaxed">
              Silakan login untuk mengakses halaman instruksi dan konfirmasi pembayaran pesanan ini.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-semibold shadow-md transition-all"
            >
              <span>Login Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading State
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/orders" />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-zinc-800">Menyiapkan Instruksi Pembayaran</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Memuat data pesanan, tagihan, dan rekening resmi Toko Enstein...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // Error State
  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/orders" />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-rose-200 p-8 sm:p-10 text-center shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 mx-auto flex items-center justify-center mb-5 text-rose-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 mb-2">Gagal Memuat Pembayaran</h1>
            <p className="text-zinc-600 text-xs sm:text-sm mb-6 leading-relaxed">
              {error || 'Data pesanan atau tagihan tidak dapat ditemukan di sistem.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={fetchData}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Muat Ulang</span>
              </button>
              <Link
                href="/orders"
                className="px-6 py-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-full text-xs font-semibold"
              >
                Lihat Daftar Pesanan
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Global Standardized Navbar */}
      <Navbar cartItemCount={0} activeRoute="/orders" />

      {/* 2. Main Payment Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-xs text-zinc-500">
              <li>
                <Link href="/" className="hover:text-zinc-900 transition-colors">
                  Beranda
                </Link>
              </li>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <li>
                <Link href="/orders" className="hover:text-zinc-900 transition-colors">
                  Pesanan Saya
                </Link>
              </li>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <li className="font-semibold text-zinc-900">
                Instruksi Pembayaran
              </li>
            </ol>
          </nav>

          <Link
            href={`/orders/${order.orderNumber}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lihat Rincian Pesanan #{order.orderNumber}</span>
          </Link>
        </div>

        {/* Header Title Row */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                #{order.orderNumber}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(order.orderNumber, 'orderNumber')}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md transition-colors"
                title="Salin nomor pesanan"
              >
                {copiedKey === 'orderNumber' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1.5">
              Selesaikan Pembayaran
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-0.5">
              Silakan lakukan pembayaran untuk mengonfirmasi pesanan bahan jas hujan dan komponen konveksi Anda.
            </p>
          </div>

          {/* Countdown Pill Badge */}
          {currentPaymentStatus === 'PENDING' && !timeLeft.isExpired && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-800 shadow-2xs self-start sm:self-auto">
              <Clock className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>
                Selesaikan pembayaran dalam:{' '}
                <strong className="font-mono text-sm font-bold text-rose-700">
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* 3. Main 2-Column Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (7 cols): Payment Method & Actions */}
          <div className="lg:col-span-7 space-y-6">

            {/* STATE 1: EXPIRED / CANCELLED */}
            {timeLeft.isExpired || currentPaymentStatus === 'EXPIRED' || order.orderStatus === 'CANCELLED' ? (
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-10 text-center shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-5">
                  <XCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Batas Waktu Pembayaran Berakhir</h3>
                <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                  Pesanan #{order.orderNumber} telah otomatis dibatalkan karena melewati batas waktu 24 jam. Stok bahan yang direservasi telah dikembalikan ke katalog.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/products"
                    className="px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-semibold shadow-md transition-all"
                  >
                    Mulai Belanja Kembali
                  </Link>
                  <Link
                    href="/orders"
                    className="px-6 py-3.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-full text-xs font-semibold transition-all"
                  >
                    Daftar Pesanan Saya
                  </Link>
                </div>
              </div>
            ) : currentPaymentStatus === 'WAITING_VERIFICATION' ? (
              /* STATE 2: UPGRADED WAITING VERIFICATION CONFIRMATION (REAL IMAGE - NO SYNTHETIC CARD) */
              <div className="bg-white rounded-3xl border border-amber-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                
                {/* Top Status Banner */}
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/90 border border-amber-300/80 flex items-center justify-center text-amber-700 shrink-0">
                    <CheckCheck className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Menunggu Verifikasi Admin
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDate(payment?.submittedAt || order?.orderDate || new Date().toISOString())}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 tracking-tight">
                      Bukti Pembayaran Sedang Diverifikasi
                    </h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Admin Toko Enstein memverifikasi mutasi bank pada jam operasional kerja (Senin–Sabtu, 08.00–17.00 WIB). Pesanan akan otomatis diproses setelah dana tervalidasi.
                    </p>
                  </div>
                </div>

                {/* Transaction Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50/80 rounded-2xl p-4 border border-zinc-200/70 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400 font-medium block">Metode Pembayaran</span>
                    <strong className="text-zinc-900 font-bold block truncate">
                      {payment?.paymentMethod === 'E_WALLET'
                        ? 'E-Wallet / QRIS'
                        : payment?.paymentMethod === 'CASH'
                        ? 'Tunai di Kasir'
                        : payment?.paymentMethod === 'SIMULATED'
                        ? 'Simulasi Sistem'
                        : 'Transfer Bank Manual'}
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400 font-medium block">Status Tagihan</span>
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Sedang Diverifikasi</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400 font-medium block">Total Ditransfer</span>
                    <strong className="text-zinc-900 font-extrabold text-sm block">
                      {formatIDR(order.totalAmount)}
                    </strong>
                  </div>
                </div>

                {/* Real Proof Image Preview Box with Lightbox Zoom (NO SYNTHETIC VOUCHER CARD) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Tangkapan Layar Bukti Transfer</span>
                    </p>
                    {activeProofUrl && (
                      <button
                        type="button"
                        onClick={() => openLightboxModal(activeProofUrl)}
                        className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Perbesar Gambar</span>
                      </button>
                    )}
                  </div>

                  {!activeProofUrl ? (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 text-center text-zinc-500 text-xs">
                      <p>Belum ada berkas bukti transfer yang tersimpan.</p>
                    </div>
                  ) : (
                    /* Clean, Bright Real Image Preview Container */
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 relative group">
                      <div
                        onClick={() => openLightboxModal(activeProofUrl)}
                        className="relative max-h-[420px] w-full flex items-center justify-center bg-white rounded-xl overflow-hidden cursor-zoom-in border border-zinc-100 shadow-2xs"
                      >
                        <img
                          src={activeProofUrl}
                          alt="Bukti Transfer Pembayaran Asli"
                          className="w-full max-h-[420px] object-contain rounded-xl bg-white"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const filename = payment?.proofOfPaymentUrl?.split('/').pop();
                            if (filename && !target.src.includes(`/uploads/payments/${filename}`)) {
                              target.src = `/uploads/payments/${filename}`;
                            }
                          }}
                        />

                        {/* Hover Overlay Toolbar */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-2 backdrop-blur-[2px]">
                          <div className="bg-zinc-900/90 px-4 py-2 rounded-full border border-zinc-700 shadow-lg flex items-center gap-1.5">
                            <ZoomIn className="w-4 h-4 text-amber-400" />
                            <span>Klik gambar untuk memperbesar</span>
                          </div>
                        </div>
                      </div>

                      {/* Persistent Caption Bar */}
                      <div className="mt-2.5 px-2 flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Klik gambar untuk memperbesar</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => openLightboxModal(activeProofUrl)}
                          className="text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Perbesar Gambar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Row */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href={`/orders/${order.orderNumber}`}
                    className="w-full sm:flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Pantau Status Pesanan</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href={`https://wa.me/6283876942484?text=Halo%20Admin%20Toko%20Enstein,%20saya%20sudah%20mengunggah%20bukti%20transfer%20untuk%20pesanan%20%23${order.orderNumber}.%20Mohon%20bantuannya%20untuk%20diverifikasi.%20Terima%20kasih!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3.5 border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-700" />
                    <span>Konfirmasi Cepat via WhatsApp</span>
                  </a>
                </div>

              </div>
            ) : currentPaymentStatus === 'PAID' ? (
              /* STATE 3: PAID CONFIRMATION CARD (REAL IMAGE) */
              <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Lunas &amp; Terverifikasi
                  </span>
                  <h3 className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-3">
                    Pembayaran Berhasil Dikonfirmasi
                  </h3>
                  <p className="text-zinc-600 text-xs sm:text-sm max-w-md mx-auto mt-1 leading-relaxed">
                    Pesanan Anda telah lunas sebesar <strong>{formatIDR(order.totalAmount)}</strong>. Bahan konveksi Anda kini siap diproses dan dikemas oleh staf Toko Enstein.
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 rounded-2xl p-4 border border-zinc-200/70 text-xs">
                  <div>
                    <span className="text-[11px] text-zinc-400 font-medium block">Nomor Pesanan</span>
                    <strong className="text-zinc-900 font-mono font-bold block">#{order.orderNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-medium block">Waktu Verifikasi</span>
                    <span className="text-zinc-800 font-medium block">{formatDate(payment?.verifiedAt || order.orderDate)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-medium block">Status Transaksi</span>
                    <strong className="text-emerald-700 font-extrabold block">LUNAS (PAID)</strong>
                  </div>
                </div>

                {/* Real Proof Preview if available */}
                {activeProofUrl && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 relative group">
                    <div
                      onClick={() => openLightboxModal(activeProofUrl)}
                      className="relative max-h-[380px] w-full flex items-center justify-center bg-white rounded-xl overflow-hidden cursor-zoom-in"
                    >
                      <img
                        src={activeProofUrl}
                        alt="Bukti Transfer Lunas Asli"
                        className="max-h-[380px] w-full object-contain rounded-xl"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={() => openLightboxModal(activeProofUrl)}
                        className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Lihat Bukti Transfer Penuh</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <Link
                    href={`/orders/${order.orderNumber}`}
                    className="px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-semibold shadow-md inline-flex items-center gap-1.5"
                  >
                    <span>Pantau Proses Pesanan</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/products"
                    className="px-6 py-3.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-full text-xs font-semibold"
                  >
                    Kembali Belanja
                  </Link>
                </div>
              </div>
            ) : (
              /* STATE 4: PENDING / REJECTED (ACTIVE PAYMENT FORMS) */
              <>
                {/* Rejection Alert Banner if previous proof rejected */}
                {currentPaymentStatus === 'REJECTED' && (
                  <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm space-y-3 shadow-xs">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Bukti Pembayaran Sebelumnya Ditolak Admin</p>
                        <p className="mt-0.5 text-rose-700 leading-relaxed">
                          Alasan penolakan: &ldquo;{payment?.rejectionReason || 'Bukti transfer tidak terbaca, struk terpotong, atau nominal tidak sesuai.'}&rdquo;
                        </p>
                        <p className="text-[11px] text-rose-600 mt-1">
                          Silakan tinjau kembali rekening tujuan di bawah ini dan unggah foto/struk transfer yang jelas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Method Switcher Tabs */}
                <div className="bg-white rounded-3xl border border-zinc-200/80 p-2 flex flex-wrap gap-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('BANK_TRANSFER')}
                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedMethod === 'BANK_TRANSFER'
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Transfer Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('E_WALLET')}
                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedMethod === 'E_WALLET'
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>E-Wallet / QRIS</span>
                  </button>

                  {order.fulfillmentMethod === 'PICKUP' && (
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('CASH')}
                      className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedMethod === 'CASH'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Bayar Tunai</span>
                    </button>
                  )}

                  {isSimulationAllowed && (
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('SIMULATED')}
                      className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedMethod === 'SIMULATED'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Mode Demo</span>
                    </button>
                  )}
                </div>

                {/* TAB 1: TRANSFER BANK */}
                {selectedMethod === 'BANK_TRANSFER' && (
                  <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                        Transfer Bank Manual
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Pilih salah satu rekening tujuan Toko Enstein, lakukan transfer, lalu unggah foto/tangkapan layar bukti transfer.
                      </p>
                    </div>

                    {/* Bank Selection Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {bankAccounts.map((b, idx) => (
                        <div
                          key={b.bankCode || idx}
                          onClick={() => setSelectedBankIdx(idx)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            selectedBankIdx === idx
                              ? 'border-zinc-900 bg-zinc-900/[0.02] shadow-xs'
                              : 'border-zinc-200/80 hover:border-zinc-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-zinc-900">{b.bankCode}</span>
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                selectedBankIdx === idx ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300'
                              }`}
                            >
                              {selectedBankIdx === idx && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono mt-2 truncate">
                            {b.accountNumber}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Selected Bank Details Card */}
                    <div className="bg-zinc-50 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 space-y-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-medium">Bank Tujuan:</span>
                        <strong className="text-zinc-900">{activeBank.bankName}</strong>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60">
                        <span className="text-zinc-500 font-medium">Nomor Rekening:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-zinc-900">
                            {activeBank.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeBank.accountNumber, 'bankAcc')}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          >
                            {copiedKey === 'bankAcc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'bankAcc' ? 'Tersalin' : 'Salin Rekening'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60">
                        <span className="text-zinc-500 font-medium">Atas Nama (A/N):</span>
                        <strong className="text-zinc-900 font-bold">{activeBank.accountHolder}</strong>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60">
                        <span className="text-zinc-500 font-medium">Nominal Transfer Tepat:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-base font-extrabold text-zinc-900">
                            {formatIDR(order.totalAmount)}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleCopy(String(order.totalAmount), 'amount')}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          >
                            {copiedKey === 'amount' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'amount' ? 'Tersalin' : 'Salin Jumlah'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Proof Upload Form */}
                    <form onSubmit={handleUploadProof} className="pt-2 border-t border-zinc-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                          Unggah Bukti Transfer <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-zinc-400">Maksimal 2 MB (JPG, PNG, WEBP)</span>
                      </div>

                      {uploadError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-zinc-300 hover:border-zinc-400 rounded-3xl p-6 sm:p-7 text-center cursor-pointer transition-all bg-zinc-50/50 hover:bg-zinc-50"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />

                        {previewUrl ? (
                          <div className="flex flex-col items-center">
                            <div className="relative max-h-52 w-full max-w-sm rounded-xl overflow-hidden border border-zinc-300 shadow-xs mb-3 group bg-white">
                              <img src={previewUrl} alt="Preview Bukti" className="max-h-52 w-full object-contain" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openLightboxModal(previewUrl);
                                }}
                                className="absolute bottom-2 right-2 bg-zinc-900/85 hover:bg-zinc-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md"
                              >
                                <ZoomIn className="w-3 h-3 text-amber-400" />
                                <span>Perbesar</span>
                              </button>
                            </div>
                            <p className="text-xs font-semibold text-zinc-800">{selectedFile?.name}</p>
                            <p className="text-[11px] text-amber-700 font-medium mt-1">Klik area ini jika ingin mengganti gambar</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 mb-3 shadow-2xs">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-zinc-800">
                              Tarik &amp; lepas berkas bukti transfer, atau <span className="text-amber-700 underline">klik di sini</span>
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-1">Pastikan nama rekening pengirim dan nominal terbaca jelas</p>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedFile || isUploading}
                        className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white rounded-full text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Mengunggah Bukti Pembayaran...</span>
                          </>
                        ) : (
                          <>
                            <span>Unggah &amp; Konfirmasi Pembayaran</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 2: E-WALLET / QRIS */}
                {selectedMethod === 'E_WALLET' && (
                  <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                        E-Wallet &amp; QRIS
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Scan QRIS atau transfer ke akun E-Wallet resmi Toko Enstein Kebumen.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ewallets.map((w, idx) => (
                        <div
                          key={w.walletCode || idx}
                          onClick={() => setSelectedWalletIdx(idx)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            selectedWalletIdx === idx
                              ? 'border-zinc-900 bg-zinc-900/[0.02] shadow-xs'
                              : 'border-zinc-200/80 hover:border-zinc-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-zinc-900">{w.walletName}</span>
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                selectedWalletIdx === idx ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300'
                              }`}
                            >
                              {selectedWalletIdx === idx && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono mt-2 truncate">
                            {w.accountNumber}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 space-y-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-medium">Pilihan E-Wallet:</span>
                        <strong className="text-zinc-900">{activeWallet.walletName}</strong>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60">
                        <span className="text-zinc-500 font-medium">Nomor Akun / ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-zinc-900">
                            {activeWallet.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeWallet.accountNumber, 'walletAcc')}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md cursor-pointer"
                          >
                            {copiedKey === 'walletAcc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'walletAcc' ? 'Tersalin' : 'Salin Nomor'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60">
                        <span className="text-zinc-500 font-medium">Atas Nama (A/N):</span>
                        <strong className="text-zinc-900 font-bold">{activeWallet.accountHolder}</strong>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60">
                        <span className="text-zinc-500 font-medium">Nominal Tepat:</span>
                        <strong className="text-base font-extrabold text-zinc-900">{formatIDR(order.totalAmount)}</strong>
                      </div>
                    </div>

                    {/* Upload Proof for E-Wallet */}
                    <form onSubmit={handleUploadProof} className="pt-2 border-t border-zinc-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                          Unggah Tangkapan Layar Pembayaran <span className="text-rose-500">*</span>
                        </label>
                      </div>

                      {uploadError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-zinc-300 hover:border-zinc-400 rounded-3xl p-6 text-center cursor-pointer transition-all bg-zinc-50/50 hover:bg-zinc-50"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />
                        {previewUrl ? (
                          <div className="flex flex-col items-center">
                            <div className="relative max-h-52 w-full max-w-sm rounded-xl overflow-hidden border border-zinc-300 shadow-xs mb-2 group bg-white">
                              <img src={previewUrl} alt="Preview Bukti" className="max-h-52 w-full object-contain" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openLightboxModal(previewUrl);
                                }}
                                className="absolute bottom-2 right-2 bg-zinc-900/85 hover:bg-zinc-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md"
                              >
                                <ZoomIn className="w-3 h-3 text-amber-400" />
                                <span>Perbesar</span>
                              </button>
                            </div>
                            <p className="text-xs font-semibold text-zinc-800">{selectedFile?.name}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <UploadCloud className="w-6 h-6 text-zinc-400 mb-2" />
                            <p className="text-xs font-semibold text-zinc-800">Klik untuk memilih bukti transfer e-wallet</p>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedFile || isUploading}
                        className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white rounded-full text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Mengunggah...</span>
                          </>
                        ) : (
                          <>
                            <span>Kirim Bukti Pembayaran</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 3: CASH (PICKUP DI TOKO) */}
                {selectedMethod === 'CASH' && (
                  <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs space-y-5">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                        Bayar Tunai di Kasir Toko
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Lakukan pembayaran tunai saat mengambil barang langsung di outlet fisik Toko Enstein.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs text-zinc-700">
                      <div className="flex items-start gap-2.5">
                        <Store className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-zinc-900">Alamat Outlet Fisik Toko Enstein:</p>
                          <p className="text-zinc-600 mt-0.5">
                            Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01), Jawa Tengah.
                          </p>
                          <p className="text-zinc-500 mt-1">Jam Buka: Senin – Sabtu, 08.00 – 17.00 WIB.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Nomor Pesanan:</span>
                        <strong className="font-mono text-zinc-900 text-sm">#{order.orderNumber}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Jumlah yang Harus Dibayar:</span>
                        <strong className="text-zinc-900 text-sm font-extrabold">{formatIDR(order.totalAmount)}</strong>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={`/orders/${order.orderNumber}`}
                        className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
                      >
                        <span>Lihat Detail Pesanan</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* TAB 4: SIMULASI PEMBAYARAN (MODE DEMO) */}
                {selectedMethod === 'SIMULATED' && isSimulationAllowed && (
                  <div className="bg-white rounded-3xl border border-violet-200 p-6 sm:p-7 shadow-xs space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200">
                          Pengujian &amp; Demo Sistem
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight mt-1.5">
                          Simulasi Verifikasi Pembayaran Instan
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Uji alur konfirmasi pembayaran dan pelepasan status pesanan secara langsung tanpa gateway eksternal riil.
                        </p>
                      </div>
                    </div>

                    {simulationResult && (
                      <div
                        className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                          simulationResult.success
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        {simulationResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold">{simulationResult.success ? 'Berhasil' : 'Peringatan'}</p>
                          <p className="mt-0.5 leading-relaxed">{simulationResult.message}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleSimulate('SUCCESS')}
                        disabled={isSimulating}
                        className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSimulating ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Simulasi Bayar Berhasil</span>
                            <span className="text-[10px] font-normal opacity-85">Status menjadi LUNAS</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSimulate('FAILED')}
                        disabled={isSimulating}
                        className="p-4 rounded-2xl border-2 border-rose-300 hover:bg-rose-50 active:scale-[0.99] text-rose-700 font-semibold text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSimulating ? (
                          <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                        ) : (
                          <>
                            <XCircle className="w-5 h-5" />
                            <span>Simulasi Bayar Gagal</span>
                            <span className="text-[10px] font-normal opacity-85">Stok tetap aman direservasi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          {/* Right Column (5 cols): Signature Dark Invoice Summary Card (ZERO INTERNAL SCROLLBAR) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="bg-zinc-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-zinc-800">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">
                    RINGKASAN TAGIHAN
                  </span>
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    #{order.orderNumber}
                  </span>
                </div>
                
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    currentPaymentStatus === 'PAID'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : currentPaymentStatus === 'WAITING_VERIFICATION'
                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                      : currentPaymentStatus === 'REJECTED'
                      ? 'bg-rose-950 text-rose-400 border-rose-800'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {currentPaymentStatus === 'PAID'
                    ? 'Lunas'
                    : currentPaymentStatus === 'WAITING_VERIFICATION'
                    ? 'Menunggu Verifikasi'
                    : currentPaymentStatus === 'REJECTED'
                    ? 'Bukti Ditolak'
                    : 'Menunggu Pembayaran'}
                </span>
              </div>

              {/* Total Tagihan Banner */}
              <div className="py-5 border-b border-zinc-800">
                <span className="text-xs uppercase tracking-wider text-zinc-400 block">
                  Total Tagihan Pembayaran
                </span>
                <span className="text-3xl font-extrabold text-white tracking-tight mt-1 block">
                  {formatIDR(order.totalAmount)}
                </span>
              </div>

              {/* Real Itemized List (Step 2: ZERO INTERNAL SCROLLBAR - No max-h or overflow) */}
              <div className="py-4 divide-y divide-zinc-800/80">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Daftar Produk ({order.items.length} Item)
                </span>
                {order.items.map((item) => {
                  const productName = item.productName || item.name || item.productCode || 'Bahan Konveksi';
                  const quantity = Number(item.quantity ?? 1);
                  const subtotal = Number(item.subtotal ?? 0);
                  let unitPrice = Number(item.unitPrice ?? item.priceAtOrder ?? item.price ?? 0);
                  if (unitPrice === 0 && subtotal > 0 && quantity > 0) {
                    unitPrice = Math.round(subtotal / quantity);
                  }
                  const unitSymbol = item.unitSymbol || item.unit || item.unitName || 'pcs';

                  return (
                    <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-xs sm:text-sm line-clamp-1">
                          {productName}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {quantity} {unitSymbol} × {formatIDR(unitPrice)}
                        </p>
                      </div>
                      <span className="font-bold text-zinc-200 shrink-0">
                        {formatIDR(subtotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="py-4 border-t border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal Produk</span>
                  <span className="text-zinc-200 font-semibold">{formatIDR(order.subtotal)}</span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span>Biaya Pengiriman</span>
                  <span className={order.deliveryFee > 0 ? 'text-zinc-200 font-semibold' : 'text-emerald-400 font-semibold'}>
                    {order.deliveryFee > 0 ? formatIDR(order.deliveryFee) : 'Gratis (Ambil di Toko)'}
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline">
                  <span className="font-bold text-zinc-200">Total Pembayaran</span>
                  <span className="text-xl font-extrabold text-amber-400">
                    {formatIDR(order.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Stock Reservation & Support Reassurance */}
              <div className="mt-4 pt-4 border-t border-zinc-800 bg-white/5 rounded-2xl p-4 space-y-2 text-[11px] text-zinc-300">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    Stok material Anda aman direservasi hingga batas waktu berakhir.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    Butuh bantuan verifikasi? Hubungi WhatsApp{' '}
                    <a
                      href="https://wa.me/6283876942484"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-300 underline font-semibold"
                    >
                      +62 838 7694 2484
                    </a>
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* 4. Fullscreen Interactive Lightbox Modal */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeLightboxModal}
        >
          {/* Floating Controls Bar at top */}
          <div
            className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/80 rounded-full px-3.5 py-1.5 shadow-xl text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxZoomLevel((prev) => (prev === 1 ? 1.5 : 1))}
              className="px-3 py-1 rounded-full text-xs font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Toggle Zoom"
            >
              {lightboxZoomLevel === 1 ? (
                <>
                  <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                  <span>Perbesar 150%</span>
                </>
              ) : (
                <>
                  <ZoomOut className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ukuran Normal 100%</span>
                </>
              )}
            </button>

            <div className="h-4 w-px bg-zinc-700" />

            <a
              href={lightboxSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-full text-xs font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
              <span>Buka di Tab Baru</span>
            </a>

            <div className="h-4 w-px bg-zinc-700" />

            <button
              type="button"
              onClick={closeLightboxModal}
              className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Center Image Container */}
          <div
            className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center overflow-auto p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxSrc}
              alt="Bukti Transfer Resolusi Tinggi"
              style={{ transform: `scale(${lightboxZoomLevel})`, transformOrigin: 'center center' }}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-200 bg-zinc-950/40"
            />
          </div>

          <p className="text-zinc-400 text-xs mt-3 select-none">
            Klik area luar gambar atau tekan <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono text-[10px]">Esc</kbd> untuk menutup
          </p>
        </div>
      )}

      {/* 5. Global Standardized Footer */}
      <Footer />
    </div>
  );
}
