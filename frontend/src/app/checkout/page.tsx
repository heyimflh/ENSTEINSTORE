'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCart } from '@/lib/cart-api';
import { checkout, getStoreConfig } from '@/lib/orders-api';
import { getMyProfile } from '@/lib/auth-api';
import { ApiException } from '@/lib/api';
import type {
  CartResponse,
  CheckoutRequest,
  StoreConfigResponse,
  FulfillmentMethod,
  PaymentMethod,
  UserProfileResponse,
} from '@/types/api';
import { Navbar } from '@/components/store/Navbar';
import { Footer } from '@/components/store/Footer';
import {
  ShieldCheck,
  Truck,
  Store,
  MapPin,
  Phone,
  Mail,
  User,
  Check,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Lock,
  Clock,
  AlertTriangle,
  Building2,
  Wallet,
  Banknote,
  Sparkles,
  RefreshCw,
  Loader2,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';

function formatIDR(n: number | null | undefined): string {
  const num = typeof n === 'number' && !isNaN(n) ? n : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

// Read saved color variant preferences from localStorage
function getSavedVariants(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('ensteinstore_cart_variants');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  // Core Data States
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfigResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [variantsMap, setVariantsMap] = useState<Record<string, string>>({});

  // Loading & Error States
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ field: string; message: string }[]>([]);

  // Form: Recipient Contact Info
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Form: Fulfillment Method
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('DELIVERY');

  // Form: Delivery Address (when DELIVERY)
  const [addressLine, setAddressLine] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Form: Notes
  const [notes, setNotes] = useState('');

  // Form: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');

  // 1. Fetch Cart, Store Config & Profile Data
  const initializeCheckoutData = useCallback(async () => {
    if (!isLoggedIn) {
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setErrorMessage(null);

    try {
      const [cartRes, configRes] = await Promise.all([
        getCart().catch(() => null),
        getStoreConfig().catch(() => null),
      ]);

      setCart(cartRes);
      setStoreConfig(configRes);

      // Hydrate variant selections from localStorage
      setVariantsMap(getSavedVariants());

      // Fetch Real Profile for auto-fill
      try {
        const profileRes = await getMyProfile();
        setUserProfile(profileRes);
        if (profileRes) {
          setRecipientName((prev) => prev || profileRes.fullName || '');
          setRecipientPhone((prev) => prev || profileRes.phone || '');
          setRecipientEmail((prev) => prev || profileRes.email || '');
        }
      } catch {
        // Fallback to AuthContext user if /api/me fails
        if (user) {
          setRecipientName((prev) => prev || user.name || '');
          setRecipientEmail((prev) => prev || user.email || '');
        }
      }
    } catch {
      setErrorMessage('Terjadi kendala saat memuat data checkout. Silakan coba lagi.');
    } finally {
      setPageLoading(false);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!authLoading) {
      initializeCheckoutData();
    }
  }, [authLoading, initializeCheckoutData]);

  // Handle Auto-fill from Profile
  const handleAutoFillProfile = () => {
    const name = userProfile?.fullName || user?.name || '';
    const phone = userProfile?.phone || '';
    const email = userProfile?.email || user?.email || '';

    setRecipientName(name);
    setRecipientPhone(phone);
    setRecipientEmail(email);
  };

  // Real-time stock validation check
  const cartItems = useMemo(() => cart?.items || [], [cart?.items]);
  const isCartEmpty = cartItems.length === 0;

  const stockIssues = useMemo(() => {
    return cartItems.filter((item) => {
      const stock = Number(item.availableStock ?? item.stockAvailable ?? 0);
      return stock <= 0 || item.quantity > stock;
    });
  }, [cartItems]);

  const hasStockError = stockIssues.length > 0;

  // Dynamic Financial Calculations
  const deliveryFee = useMemo(() => {
    return storeConfig?.deliveryFee ?? 15000;
  }, [storeConfig?.deliveryFee]);

  const activeDeliveryCost = useMemo(() => {
    return fulfillmentMethod === 'DELIVERY' ? deliveryFee : 0;
  }, [fulfillmentMethod, deliveryFee]);

  const subtotal = useMemo(() => {
    return Number(cart?.subtotal ?? 0);
  }, [cart?.subtotal]);

  const grandTotal = useMemo(() => {
    return subtotal + activeDeliveryCost;
  }, [subtotal, activeDeliveryCost]);

  // Simulation status check
  const isSimulationEnabled = storeConfig?.simulationEnabled !== false;

  // Handle Form Submission
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors([]);

    if (!recipientName.trim()) {
      setErrorMessage('Nama lengkap penerima wajib diisi.');
      return;
    }

    if (!recipientPhone.trim()) {
      setErrorMessage('Nomor telepon/WhatsApp penerima wajib diisi.');
      return;
    }

    if (hasStockError) {
      setErrorMessage('Satu atau lebih produk di keranjang melebihi stok tersedia. Perbarui di keranjang.');
      return;
    }

    let fullDeliveryAddress: string | undefined = undefined;

    if (fulfillmentMethod === 'DELIVERY') {
      if (!addressLine.trim()) {
        setErrorMessage('Alamat jalan/rumah pengiriman wajib diisi.');
        return;
      }
      if (!city.trim() || !district.trim()) {
        setErrorMessage('Kota/Kabupaten dan Kecamatan pengiriman wajib diisi.');
        return;
      }

      const parts = [
        addressLine.trim(),
        district.trim() ? `Kec. ${district.trim()}` : null,
        city.trim(),
        postalCode.trim() ? `Kode Pos ${postalCode.trim()}` : null,
      ].filter(Boolean);

      fullDeliveryAddress = parts.join(', ');
    } else {
      fullDeliveryAddress = 'Ambil di Toko Enstein, Jl. Kertanegara Km. 03, Tanahsari, Kebumen';
    }

    // Combine custom customer notes with selected color variants
    const variantNotes = cartItems
      .map((item) => {
        const v = variantsMap[item.productId];
        return v ? `${item.name || item.productCode}: ${v}` : null;
      })
      .filter(Boolean)
      .join(', ');

    const combinedNotes = [
      notes.trim(),
      variantNotes ? `[Pilihan Warna: ${variantNotes}]` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    const payload: CheckoutRequest = {
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      fulfillmentMethod,
      paymentMethod,
      deliveryAddress: fullDeliveryAddress,
      notes: combinedNotes || undefined,
    };

    setIsSubmitting(true);

    try {
      const order = await checkout(payload);

      // Clean up cart variant choices on successful checkout
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ensteinstore_cart_variants');
      }

      // If CASH pickup, order is created and ready
      if (paymentMethod === 'CASH') {
        router.push(`/orders/${order.orderNumber}`);
      } else {
        router.push(`/orders/${order.orderNumber}/payment`);
      }
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.fieldErrors?.length) {
          setFieldErrors(err.fieldErrors);
        } else {
          setErrorMessage(err.message || 'Gagal memproses checkout. Silakan periksa formulir.');
        }
      } else {
        setErrorMessage('Terjadi kesalahan pada sistem saat membuat pesanan. Silakan coba kembali.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Unauthenticated View Guard
  if (!authLoading && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/checkout" />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/70 mx-auto flex items-center justify-center mb-5 text-amber-600">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              Masuk untuk Melanjutkan Checkout
            </h1>
            <p className="text-zinc-600 text-sm leading-relaxed mb-8">
              Akun pelanggan diperlukan agar stok pesanan bahan konveksi Anda dapat direservasi secara aman di sistem.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth?mode=login"
                className="w-full sm:w-auto px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-sm font-semibold shadow-md transition-all active:scale-95"
              >
                Masuk ke Akun
              </Link>
              <Link
                href="/cart"
                className="w-full sm:w-auto px-7 py-3.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-full text-sm font-semibold transition-all"
              >
                Kembali ke Keranjang
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // 2. Initial Loading Skeleton
  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/checkout" />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-6 w-48 bg-zinc-200/80 rounded-full animate-pulse mb-6" />
          <div className="h-10 w-64 bg-zinc-200/80 rounded-2xl animate-pulse mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 bg-zinc-200/60 rounded-3xl animate-pulse" />
              ))}
            </div>
            <div className="lg:col-span-5">
              <div className="h-96 bg-zinc-200/60 rounded-3xl animate-pulse" />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // 3. Empty Cart Guard View
  if (isCartEmpty) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/checkout" />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-20 h-20 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              Keranjang Belanja Anda Kosong
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8">
              Tidak ada produk aktif di keranjang belanja. Silakan pilih bahan jas hujan atau aksesori konveksi terlebih dahulu sebelum checkout.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/products"
                className="w-full sm:w-auto px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-sm font-semibold shadow-md transition-all inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Jelajahi Katalog Produk</span>
              </Link>
              <Link
                href="/cart"
                className="w-full sm:w-auto px-7 py-3.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-full text-sm font-semibold transition-all"
              >
                Lihat Keranjang
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
      <Navbar cartItemCount={cart?.totalItems ?? 0} activeRoute="/checkout" />

      {/* 2. Main Checkout Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        
        {/* Top Stepper & Breadcrumb Header */}
        <div className="pb-8 border-b border-zinc-200/80">
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex items-center gap-2 text-xs text-zinc-500">
              <li>
                <Link href="/" className="hover:text-zinc-900 transition-colors">
                  Beranda
                </Link>
              </li>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <li>
                <Link href="/cart" className="hover:text-zinc-900 transition-colors">
                  Keranjang
                </Link>
              </li>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <li className="font-semibold text-zinc-900">
                Checkout
              </li>
            </ol>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight">
                Checkout
              </h1>
              <p className="text-zinc-600 text-sm mt-1 max-w-2xl leading-relaxed">
                Lengkapi identitas penerima, alamat pengiriman, dan metode pembayaran untuk mengunci reservasi stok bahan secara otomatis.
              </p>
            </div>

            {/* 3-Step Progress Indicator */}
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-zinc-200/80 shadow-2xs self-start lg:self-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>1. Keranjang</span>
              </div>
              <span className="text-zinc-300">/</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-900 px-3 py-1 rounded-full shadow-xs">
                <span>2. Pengiriman &amp; Checkout</span>
              </div>
              <span className="text-zinc-300">/</span>
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                <span>3. Pembayaran</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Stock Warning Banner */}
        {hasStockError && (
          <div className="mt-6 p-4 rounded-3xl bg-amber-50 border border-amber-200/90 text-amber-900 text-sm flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-bold">Perhatian: Kuantitas Melebihi Stok Gudang</p>
              <p className="mt-0.5 text-amber-800">
                Satu atau lebih produk di keranjang Anda melebihi ketersediaan stok riil di gudang Toko Enstein. Silakan sesuaikan kuantitas di keranjang terlebih dahulu.
              </p>
              <Link
                href="/cart"
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-900 underline underline-offset-2"
              >
                <span>Buka Keranjang Belanja</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* General Error Alert */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              {fieldErrors.length > 0 && (
                <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs text-rose-700">
                  {fieldErrors.map((fe, i) => (
                    <li key={i}>{fe.message}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* 3. Main Form Grid */}
        <form onSubmit={handleSubmitOrder} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (7 cols): Checkout Form */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CARD 1: INFORMASI KONTAK PENERIMA */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200/60">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                      Informasi Kontak Penerima
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Identitas untuk konfirmasi order dan nomor resi pengiriman
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoFillProfile}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                  title="Isi otomatis dengan data profil akun Anda"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Isi dari Profil</span>
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Nama Lengkap Penerima <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Masukkan nama lengkap penerima pesanan"
                      className="w-full bg-zinc-50/70 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Nomor Telepon & Email Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50/70 border border-zinc-200 rounded-2xl text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Alamat Email (Akun)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="email"
                        value={recipientEmail}
                        readOnly
                        placeholder="email@pelanggan.com"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-100/70 border border-zinc-200 rounded-2xl text-sm text-zinc-600 cursor-not-allowed select-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: METODE PENGAMBILAN */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs">
              <div className="pb-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                    Metode Pemenuhan Pesanan
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Pilih bagaimana Anda ingin menerima bahan dan komponen pesanan
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: DELIVERY */}
                <div
                  onClick={() => setFulfillmentMethod('DELIVERY')}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    fulfillmentMethod === 'DELIVERY'
                      ? 'border-zinc-900 bg-zinc-900/[0.02] shadow-xs'
                      : 'border-zinc-200/80 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          fulfillmentMethod === 'DELIVERY'
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-300'
                        }`}
                      >
                        {fulfillmentMethod === 'DELIVERY' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <h3 className="font-bold text-zinc-900 text-sm">Pengiriman Kurir / Ekspedisi</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Dikirim langsung ke alamat workshop/rumah Anda dengan aman dan rapi.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-500">Tarif Pengiriman:</span>
                    <span className="text-zinc-900 font-bold">
                      +{formatIDR(deliveryFee)}
                    </span>
                  </div>
                </div>

                {/* Option 2: PICKUP */}
                <div
                  onClick={() => {
                    setFulfillmentMethod('PICKUP');
                  }}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    fulfillmentMethod === 'PICKUP'
                      ? 'border-zinc-900 bg-zinc-900/[0.02] shadow-xs'
                      : 'border-zinc-200/80 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200/60">
                        <Store className="w-5 h-5" />
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          fulfillmentMethod === 'PICKUP'
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-300'
                        }`}
                      >
                        {fulfillmentMethod === 'PICKUP' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <h3 className="font-bold text-zinc-900 text-sm">Ambil Langsung di Toko</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Ambil pesanan Anda di outlet fisik Toko Enstein, Tanahsari, Kebumen.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-500">Biaya Pengambilan:</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      GRATIS (Rp 0)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: ALAMAT PENGIRIMAN & CATATAN */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs">
              {fulfillmentMethod === 'DELIVERY' ? (
                <>
                  <div className="pb-4 border-b border-zinc-100">
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                      Alamat Pengiriman
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Pastikan alamat dan rincian jalan ditulis lengkap agar kurir tidak tersesat
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    {/* Alamat Lengkap */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                        Alamat Jalan / Bangunan <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="Nama jalan, nomor rumah/workshop, RT/RW, patokan lokasi"
                        className="w-full bg-zinc-50/70 border border-zinc-200 rounded-2xl p-4 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                        required={fulfillmentMethod === 'DELIVERY'}
                      />
                    </div>

                    {/* 3-Column Region Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                          Kota / Kabupaten <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Contoh: Kebumen"
                          className="w-full bg-zinc-50/70 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                          required={fulfillmentMethod === 'DELIVERY'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                          Kecamatan <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="Contoh: Kebumen"
                          className="w-full bg-zinc-50/70 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                          required={fulfillmentMethod === 'DELIVERY'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                          Kode Pos
                        </label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="54311"
                          className="w-full bg-zinc-50/70 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Pickup Location Notice */
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 mb-4">
                  <div className="flex items-start gap-3">
                    <Store className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-zinc-700 space-y-1">
                      <p className="font-bold text-zinc-900">
                        Lokasi Pengambilan: Outlet Resmi Toko Enstein
                      </p>
                      <p className="text-zinc-600">
                        Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01), Jawa Tengah.
                      </p>
                      <p className="text-zinc-500 pt-1">
                        Jam Operasional: Senin – Sabtu, 08.00 – 17.00 WIB. Tunjukkan nomor pesanan saat pengambilan.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Catatan Tambahan Pesanan */}
              <div className="mt-5 pt-4 border-t border-zinc-100">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Catatan Pesanan &amp; Permintaan Khusus (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Packing gulung rapi tanpa tekukan, sertakan potongan sampel warna lain, dll."
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-2xl p-4 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                />
              </div>
            </div>

            {/* CARD 4: METODE PEMBAYARAN */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-xs">
              <div className="pb-4 border-b border-zinc-100">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                  Metode Pembayaran
                </h2>
                <p className="text-xs text-zinc-500">
                  Pilih cara pelunasan pesanan untuk mengonfirmasi transaksi
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Method 1: BANK_TRANSFER */}
                <div
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-zinc-900 bg-zinc-900/[0.02]'
                      : 'border-zinc-200/80 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'BANK_TRANSFER'
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300'
                      }`}
                    >
                      {paymentMethod === 'BANK_TRANSFER' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">Transfer Bank Manual</h4>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                    BCA, Mandiri, atau BRI Toko Enstein dengan unggah bukti transfer.
                  </p>
                </div>

                {/* Method 2: E_WALLET */}
                <div
                  onClick={() => setPaymentMethod('E_WALLET')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    paymentMethod === 'E_WALLET'
                      ? 'border-zinc-900 bg-zinc-900/[0.02]'
                      : 'border-zinc-200/80 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'E_WALLET'
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300'
                      }`}
                    >
                      {paymentMethod === 'E_WALLET' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">E-Wallet / QRIS</h4>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                    Dana, OVO, GoPay, atau QRIS instan dengan unggah bukti bayar.
                  </p>
                </div>

                {/* Method 3: CASH (Enabled if PICKUP) */}
                <div
                  onClick={() => {
                    if (fulfillmentMethod === 'PICKUP') setPaymentMethod('CASH');
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all relative flex flex-col justify-between ${
                    fulfillmentMethod !== 'PICKUP'
                      ? 'border-zinc-100 bg-zinc-50 opacity-50 cursor-not-allowed'
                      : paymentMethod === 'CASH'
                      ? 'border-zinc-900 bg-zinc-900/[0.02] cursor-pointer'
                      : 'border-zinc-200/80 hover:border-zinc-300 bg-white cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'CASH'
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300'
                      }`}
                    >
                      {paymentMethod === 'CASH' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">Bayar Tunai di Toko</h4>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                    Bayar langsung saat mengambil barang di kasir Toko Enstein Kebumen.
                  </p>
                </div>

                {/* Method 4: SIMULATED (Demo Mode) */}
                {isSimulationEnabled && (
                  <div
                    onClick={() => setPaymentMethod('SIMULATED')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      paymentMethod === 'SIMULATED'
                        ? 'border-zinc-900 bg-zinc-900/[0.02]'
                        : 'border-zinc-200/80 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                        Mode Demo
                      </span>
                    </div>
                    <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">Simulasi Pembayaran</h4>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                      Simulasi verifikasi otomatis 1-klik untuk pengujian tanpa rekening nyata.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column (5 cols): Sticky Order Summary */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-sm">
              
              {/* Summary Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                  Ringkasan Pesanan
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full">
                  {cartItems.length} Produk
                </span>
              </div>

              {/* Real Cart Items List */}
              <div className="py-4 divide-y divide-zinc-100 max-h-72 overflow-y-auto pr-1">
                {cartItems.map((item) => {
                  const unitPrice = Number(item.price ?? item.priceAtAdd ?? 0);
                  const sub = Number(item.subtotal ?? (unitPrice * item.quantity));
                  const variant = variantsMap[item.productId];
                  const unitLabel = item.unit || item.unitSymbol || item.unitName || 'pcs';

                  return (
                    <div key={item.id} className="py-3 flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-zinc-100 border border-zinc-100 overflow-hidden shrink-0">
                        <img
                          src={item.image || '/images/placeholder-product.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">
                          {item.name || item.productCode}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {item.productCode}
                          </span>
                          {variant && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 font-medium">
                              Varian: {variant}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span className="text-zinc-500 font-medium">
                            {item.quantity} {unitLabel} × {formatIDR(unitPrice)}
                          </span>
                          <span className="font-bold text-zinc-900">
                            {formatIDR(sub)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="py-4 border-t border-zinc-100 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Subtotal Produk</span>
                  <span className="font-semibold text-zinc-900">{formatIDR(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-zinc-600">
                  <div>
                    <span>Biaya Pengiriman</span>
                    <span className="text-[10px] text-zinc-400 block">
                      {fulfillmentMethod === 'DELIVERY' ? 'Kurir Toko / Ekspedisi' : 'Ambil di Toko Kebumen'}
                    </span>
                  </div>
                  <span className={`font-semibold ${fulfillmentMethod === 'DELIVERY' ? 'text-zinc-900' : 'text-emerald-700'}`}>
                    {fulfillmentMethod === 'DELIVERY' ? formatIDR(deliveryFee) : 'Gratis'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-zinc-600">
                  <span>Reservasi Stok Gudang</span>
                  <span className="font-semibold text-emerald-700">Gratis (24 Jam)</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-4 pb-6 border-t border-zinc-200 flex justify-between items-baseline">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-zinc-500 block">
                    Total Pembayaran
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Termasuk seluruh rincian pesanan
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                  {formatIDR(grandTotal)}
                </span>
              </div>

              {/* Primary Place Order CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting || hasStockError || isCartEmpty}
                className="w-full py-4 rounded-full bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Reservasi Stok...</span>
                  </>
                ) : (
                  <>
                    <span>Buat Pesanan &amp; Lanjut Bayar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Navigation Back */}
              <div className="mt-4 text-center">
                <Link
                  href="/cart"
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 underline underline-offset-2 transition-colors"
                >
                  ← Kembali dan Ubah Isi Keranjang
                </Link>
              </div>

              {/* Security Reassurance Box */}
              <div className="bg-zinc-50 rounded-2xl p-4 mt-6 space-y-2 border border-zinc-100 text-[11px] text-zinc-600">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong>Reservasi Stok Otomatis:</strong> Stok produk langsung diamankan 24 jam setelah checkout terbit.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Store className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong>Penyedia Resmi Kebumen:</strong> Toko Enstein, Jl. Kertanegara Km. 03, Tanahsari.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </form>

      </main>

      {/* 3. Global Standardized Footer */}
      <Footer />
    </div>
  );
}
