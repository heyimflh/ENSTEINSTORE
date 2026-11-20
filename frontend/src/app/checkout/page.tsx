'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
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
  ShieldCheck,
  Lock,
  Clock,
  PackageCheck,
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Building2,
  BadgeCheck,
  Loader2,
  ShoppingBag,
  Info,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

// ============================================================================
// TYPES & DATA STRUCTURES (PRD & DESIGN SYSTEM COMPLIANT)
// ============================================================================

export type FulfillmentMethod = 'DELIVERY' | 'PICKUP';

export interface CartItem {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  unit: 'meter' | 'pcs' | 'roll';
  quantity: number;
  imageUrl: string;
}

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  deliveryNotes: string;
  pickupNotes: string;
}

export interface FormErrors {
  fullName?: string;
  phone?: string;
  address?: string;
}

export interface OrderReservationResult {
  orderNumber: string;
  reservedAt: string;
  reservationExpiresAt: string;
  fulfillmentMethod: FulfillmentMethod;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  deliveryAddress?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: CartItem[];
}

// ============================================================================
// MOCK CART DATA (STRICT SPECIFICATION)
// Items reflect Toko Enstein rainwear raw materials & accessories
// ============================================================================

const INITIAL_CHECKOUT_ITEMS: CartItem[] = [
  {
    id: 'cart-1',
    code: 'PRD-ALT-003',
    name: 'Resleting Waterproof (Hitam/Putih)',
    category: 'Resleting',
    price: 8500,
    unit: 'pcs',
    quantity: 2,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
  },
  {
    id: 'cart-2',
    code: 'PRD-BHN-001',
    name: 'PVC Super Ketebalan 0.25',
    category: 'Material Jas Hujan',
    price: 35000,
    unit: 'meter',
    quantity: 2.5,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
  },
  {
    id: 'cart-3',
    code: 'PRD-ALT-005',
    name: 'Seam Sealing Tape (Silent Weath)',
    category: 'Aksesori',
    price: 4500,
    unit: 'roll',
    quantity: 1,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SilenMantel.webp',
  },
];

// Profile prefill data (PRD 9.2.5: "prefill dari profil")
const PREFILL_PROFILE_DATA: CheckoutFormData = {
  fullName: 'Bu Rina (Konveksi Barokah)',
  phone: '081298765432',
  email: 'rina.konveksi@gmail.com',
  address: 'Jl. Rancabolang No. 14, RT 02 / RW 05, Kel. Sekejati',
  city: 'Bandung',
  district: 'Buahbatu',
  postalCode: '40286',
  deliveryNotes: 'Paking rapi untuk kain PVC, mohon jangan dilipat terlalu tajam.',
  pickupNotes: 'Akan diambil oleh kurir konveksi kami.',
};

const BLANK_FORM_DATA: CheckoutFormData = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  district: '',
  postalCode: '',
  deliveryNotes: '',
  pickupNotes: '',
};

// Constant delivery fee for dummy calculation (PRD FR-18)
const DELIVERY_FEE_AMOUNT = 15000;

// Format IDR helper
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Generate unique order number according to PRD FR-19: EST-YYYYMMDD-####
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `EST-${year}${month}${day}-${randomSuffix}`;
}

export default function CheckoutPage() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [cartItems] = useState<CartItem[]>(INITIAL_CHECKOUT_ITEMS);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('DELIVERY');
  const [formData, setFormData] = useState<CheckoutFormData>(PREFILL_PROFILE_DATA);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderResult, setOrderResult] = useState<OrderReservationResult | null>(null);
  const [searchNavQuery, setSearchNavQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Temporary feedback toast
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // --------------------------------------------------------------------------
  // DYNAMIC TOTALS CALCULATION
  // Subtotal = Sum(item.price * item.quantity)
  // Delivery Fee = Rp 15.000 (if DELIVERY) | Rp 0 (if PICKUP)
  // Final Total = Subtotal + Delivery Fee
  // --------------------------------------------------------------------------
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  const deliveryFee = useMemo(() => {
    return fulfillmentMethod === 'DELIVERY' ? DELIVERY_FEE_AMOUNT : 0;
  }, [fulfillmentMethod]);

  const finalTotal = useMemo(() => {
    return subtotal + deliveryFee;
  }, [subtotal, deliveryFee]);

  const totalItemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  // --------------------------------------------------------------------------
  // FORM HANDLING & CONDITIONAL VALIDATION (PRD 9.2.5)
  // - Nama Lengkap: Required
  // - Nomor Telepon: Required & must look like a valid phone (min 9 digits)
  // - Alamat Lengkap: REQUIRED ONLY IF fulfillmentMethod === 'DELIVERY'
  // --------------------------------------------------------------------------
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for field once edited
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Nama lengkap wajib diisi.';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Nomor telepon wajib diisi.';
    } else if (formData.phone.trim().replace(/\D/g, '').length < 9) {
      errors.phone = 'Nomor telepon tidak valid (minimal 9 digit).';
    }

    // PRD 9.2.5: Alamat wajib HANYA jika Delivery dipilih
    if (fulfillmentMethod === 'DELIVERY') {
      if (!formData.address.trim()) {
        errors.address = 'Alamat pengiriman lengkap wajib diisi untuk metode Delivery.';
      } else if (formData.address.trim().length < 10) {
        errors.address = 'Mohon masukkan alamat lebih lengkap (nama jalan, nomor/RT, kelurahan).';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --------------------------------------------------------------------------
  // PLACE ORDER ACTION (Simulated Stock Reservation Process)
  // Backend BR-08, BR-09: Stock is reserved on checkout creation.
  // --------------------------------------------------------------------------
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Mohon lengkapi formulir dengan data yang valid.');
      // Scroll smoothly to the first error
      const firstErrorKey = Object.keys(formErrors)[0];
      if (firstErrorKey) {
        const el = document.getElementById(firstErrorKey);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Begin simulated backend Stock Reservation process
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const newOrder: OrderReservationResult = {
        orderNumber: generateOrderNumber(),
        reservedAt: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        reservationExpiresAt: '24 Jam ke depan',
        fulfillmentMethod,
        recipientName: formData.fullName,
        recipientPhone: formData.phone,
        recipientEmail: formData.email,
        deliveryAddress:
          fulfillmentMethod === 'DELIVERY'
            ? `${formData.address}, ${formData.district ? formData.district + ', ' : ''}${formData.city ? formData.city + ' ' : ''}${formData.postalCode}`
            : undefined,
        subtotal,
        deliveryFee,
        total: finalTotal,
        items: cartItems,
      };

      setOrderResult(newOrder);
      showToast('Order berhasil dibuat! Stok telah direservasi secara aman.');
    }, 1800);
  };

  // --------------------------------------------------------------------------
  // REVIEWER / DEMO QUICK TOGGLES
  // --------------------------------------------------------------------------
  const handleAutofillProfile = () => {
    setFormData(PREFILL_PROFILE_DATA);
    setFormErrors({});
    showToast('Form diisi otomatis dengan data profil customer terdaftar.');
  };

  const handleClearForm = () => {
    setFormData(BLANK_FORM_DATA);
    setFormErrors({});
    showToast('Form dikosongkan (Simulasi pengguna baru/tamu).');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans flex flex-col">
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
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
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
                {cartItems.length > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-zinc-900 rounded-full">
                    {cartItems.length}
                  </span>
                )}
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
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              My Orders
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-zinc-900"
            >
              Shopping Cart ({cartItems.length})
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
      {/* pt-12 pb-8 px-4 md:px-12 xl:px-24                                   */}
      {/* =================================================================== */}
      <section className="pt-10 pb-8 px-4 md:px-12 xl:px-24 max-w-7xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-xs text-zinc-400 mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-zinc-800 transition-colors">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/cart" className="hover:text-zinc-800 transition-colors">
            Keranjang
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-900 font-semibold" aria-current="page">
            Checkout
          </span>
        </nav>

        {/* Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight">
              Checkout
            </h1>
            <p className="text-zinc-500 mt-2 text-sm md:text-base">
              Selesaikan pesanan Anda.
            </p>
          </div>

          {/* Checkout Process Stepper */}
          <div className="flex items-center space-x-2 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Keranjang</span>
            </span>
            <span className="text-zinc-300">—</span>
            <span className="flex items-center gap-1.5 text-zinc-900 font-bold bg-zinc-200/70 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
              <span>2. Pengiriman &amp; Checkout</span>
            </span>
            <span className="text-zinc-300">—</span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span>3. Pembayaran</span>
            </span>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. MAIN CHECKOUT LAYOUT                                             */}
      {/* px-4 md:px-12 xl:px-24 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 */}
      {/* =================================================================== */}
      <main className="flex-1 px-4 md:px-12 xl:px-24 pb-24 max-w-7xl mx-auto w-full">
        <form onSubmit={handlePlaceOrder} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* =============================================================== */}
            {/* LEFT COLUMN: SHIPPING & CONTACT FORM (span 7)                   */}
            {/* =============================================================== */}
            <div className="lg:col-span-7 space-y-10">
              {/* ------------------------------------------------------------- */}
              {/* SECTION: INFORMASI KONTAK                                     */}
              {/* ------------------------------------------------------------- */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-800">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900">Informasi Kontak</h2>
                      <p className="text-xs text-zinc-400">Identitas pemesan untuk konfirmasi pesanan</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutofillProfile}
                    className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                    title="Gunakan data tersimpan di profil"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pakai Profil Bu Rina</span>
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  {/* Nama Lengkap (Full width) */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                    >
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Contoh: Rina Wahyuni / Konveksi Barokah"
                      className={`w-full px-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 border rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all ${
                        formErrors.fullName ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-300' : 'border-zinc-200'
                      }`}
                      aria-required="true"
                    />
                    {formErrors.fullName && (
                      <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.fullName}</span>
                      </p>
                    )}
                  </div>

                  {/* Nomor Telepon (Full width) */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                    >
                      Nomor Telepon (WhatsApp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Contoh: 081298765432"
                        className={`w-full px-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 border rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all ${
                          formErrors.phone ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-300' : 'border-zinc-200'
                        }`}
                        aria-required="true"
                      />
                      <Phone className="w-4 h-4 text-zinc-400 absolute right-4 top-3.5 pointer-events-none" />
                    </div>
                    {formErrors.phone ? (
                      <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.phone}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-400 mt-1.5">
                        Digunakan oleh admin Toko Enstein &amp; kurir untuk konfirmasi order dan nomor resi.
                      </p>
                    )}
                  </div>

                  {/* Alamat Email (Opsional) */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                    >
                      Alamat Email <span className="text-zinc-400 lowercase font-normal">(opsional untuk invoice digital)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="nama@perusahaan.com"
                        className="w-full px-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                      />
                      <Mail className="w-4 h-4 text-zinc-400 absolute right-4 top-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION: METODE PENGAMBILAN (FR-18 SLEEK RADIO CARDS)          */}
              {/* ------------------------------------------------------------- */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-xs">
                <div className="pb-4 border-b border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-800">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900">Metode Pengambilan</h2>
                      <p className="text-xs text-zinc-400">Pilih bagaimana Anda ingin menerima bahan belanjaan</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full">
                    PRD FR-18
                  </span>
                </div>

                {/* Modern Sleek Radio Cards */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Delivery Card */}
                  <label
                    htmlFor="fulfillment-delivery"
                    className={`relative flex flex-col justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                      fulfillmentMethod === 'DELIVERY'
                        ? 'border-zinc-900 bg-zinc-900/5 shadow-md ring-1 ring-zinc-900/10'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:shadow-xs'
                    }`}
                  >
                    <input
                      type="radio"
                      id="fulfillment-delivery"
                      name="fulfillmentMethod"
                      value="DELIVERY"
                      checked={fulfillmentMethod === 'DELIVERY'}
                      onChange={() => {
                        setFulfillmentMethod('DELIVERY');
                        showToast('Metode: Delivery dipilih. Biaya pengiriman Rp 15.000 ditambahkan.');
                      }}
                      className="sr-only"
                    />

                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                              fulfillmentMethod === 'DELIVERY'
                                ? 'bg-zinc-900 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            <Truck className="w-5 h-5" />
                          </span>
                          <span className="font-bold text-base text-zinc-900">
                            Delivery
                          </span>
                        </div>

                        {/* Aesthetic Radio indicator dot */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            fulfillmentMethod === 'DELIVERY'
                              ? 'border-zinc-900 bg-zinc-900'
                              : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {fulfillmentMethod === 'DELIVERY' && (
                            <span className="w-2 h-2 rounded-full bg-white"></span>
                          )}
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
                        Kirim langsung ke workshop / alamat Anda melalui kurir ekspedisi rekanan Toko Enstein.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Estimasi 1-3 hari</span>
                      <span
                        className={`font-bold ${
                          fulfillmentMethod === 'DELIVERY' ? 'text-zinc-900' : 'text-zinc-600'
                        }`}
                      >
                        + Rp 15.000
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Pickup Card */}
                  <label
                    htmlFor="fulfillment-pickup"
                    className={`relative flex flex-col justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                      fulfillmentMethod === 'PICKUP'
                        ? 'border-zinc-900 bg-zinc-900/5 shadow-md ring-1 ring-zinc-900/10'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:shadow-xs'
                    }`}
                  >
                    <input
                      type="radio"
                      id="fulfillment-pickup"
                      name="fulfillmentMethod"
                      value="PICKUP"
                      checked={fulfillmentMethod === 'PICKUP'}
                      onChange={() => {
                        setFulfillmentMethod('PICKUP');
                        showToast('Metode: Pickup di Toko dipilih. Bebas biaya pengiriman (Rp 0).');
                      }}
                      className="sr-only"
                    />

                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                              fulfillmentMethod === 'PICKUP'
                                ? 'bg-zinc-900 text-white shadow-xs'
                                : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            <Store className="w-5 h-5" />
                          </span>
                          <span className="font-bold text-base text-zinc-900">
                            Pickup di Toko
                          </span>
                        </div>

                        {/* Aesthetic Radio indicator dot */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            fulfillmentMethod === 'PICKUP'
                              ? 'border-zinc-900 bg-zinc-900'
                              : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {fulfillmentMethod === 'PICKUP' && (
                            <span className="w-2 h-2 rounded-full bg-white"></span>
                          )}
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
                        Ambil sendiri langsung di gudang/outlet fisik Toko Enstein (Tanahsari, Kebumen).
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Siap jam operasional</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        GRATIS (Rp 0)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION: ALAMAT PENGIRIMAN (PRD 9.2.5 CONDITIONAL VALIDATION)  */}
              {/* Rendered conditionally based on Delivery selection           */}
              {/* ------------------------------------------------------------- */}
              {fulfillmentMethod === 'DELIVERY' ? (
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-xs animate-in fade-in slide-in-from-top-3 duration-300">
                  <div className="pb-4 border-b border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-800">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-zinc-900">Alamat Pengiriman</h2>
                        <p className="text-xs text-zinc-400">Pastikan alamat jelas agar kurir tidak tersesat</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                      * Wajib Diisi
                    </span>
                  </div>

                  <div className="mt-6 space-y-5">
                    {/* Alamat Lengkap (Textarea 4 rows) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label
                          htmlFor="address"
                          className="text-xs font-semibold uppercase tracking-wider text-zinc-700"
                        >
                          Alamat Lengkap <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-zinc-400">Nama jalan, nomor rumah, RT/RW, gang</span>
                      </div>
                      <textarea
                        id="address"
                        name="address"
                        rows={4}
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Contoh: Jl. Rancabolang No. 14, RT 02 / RW 05, samping Masjid Al-Hidayah, Kel. Sekejati"
                        className={`w-full px-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 border rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-y ${
                          formErrors.address
                            ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-300'
                            : 'border-zinc-200'
                        }`}
                        aria-required="true"
                      />
                      {formErrors.address && (
                        <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.address}</span>
                        </p>
                      )}
                    </div>

                    {/* Kota / Kabupaten & Kecamatan */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1">
                        <label
                          htmlFor="city"
                          className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                        >
                          Kota / Kabupaten
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Bandung"
                          className="w-full px-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label
                          htmlFor="district"
                          className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                        >
                          Kecamatan
                        </label>
                        <input
                          type="text"
                          id="district"
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          placeholder="Buahbatu"
                          className="w-full px-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label
                          htmlFor="postalCode"
                          className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                        >
                          Kode Pos
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          placeholder="40286"
                          className="w-full px-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Catatan untuk Kurir Pengiriman */}
                    <div>
                      <label
                        htmlFor="deliveryNotes"
                        className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                      >
                        Catatan Pengiriman &amp; Patokan Lokasi <span className="text-zinc-400 lowercase font-normal">(opsional)</span>
                      </label>
                      <input
                        type="text"
                        id="deliveryNotes"
                        name="deliveryNotes"
                        value={formData.deliveryNotes}
                        onChange={handleInputChange}
                        placeholder="Contoh: Titipkan di satpam konveksi / rumah pagar hitam"
                        className="w-full px-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* PICKUP INFO CARD (When Pickup is selected, Address textarea is hidden/optional) */
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-xs animate-in fade-in slide-in-from-top-3 duration-300">
                  <div className="pb-4 border-b border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-zinc-900">Lokasi Pengambilan Barang</h2>
                        <p className="text-xs text-zinc-400">Ambil langsung pesanan Anda di gerai fisik kami</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      Bebas Ongkir
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    {/* Toko Address Banner */}
                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-zinc-900 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-zinc-900">Outlet Utama Toko Enstein Kebumen</p>
                          <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                            Jl. Kertanegara Km. 03, Tanahsari, Kec. Kebumen, Kabupaten Kebumen (selatan SD Tanahsari 01), Jawa Tengah 54317
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-200/60 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-700" />
                          <span>Senin – Sabtu: 08.00 – 17.00 WIB</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-700" />
                          <span>+62 838 7694 2484</span>
                        </span>
                      </div>
                    </div>

                    {/* Notice for pickup verification */}
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
                      <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong>Instruksi Pengambilan:</strong> Setelah menekan tombol <em>PLACE ORDER</em>, nomor pesanan unik (EST-...) akan diterbitkan dan stok pesanan Anda akan langsung dipisahkan di gudang. Tunjukkan nomor pesanan tersebut saat berkunjung ke outlet.
                      </div>
                    </div>

                    {/* Optional Note for Pickup Person */}
                    <div>
                      <label
                        htmlFor="pickupNotes"
                        className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                      >
                        Nama Pengambil / Catatan Khusus <span className="text-zinc-400 lowercase font-normal">(opsional)</span>
                      </label>
                      <input
                        type="text"
                        id="pickupNotes"
                        name="pickupNotes"
                        value={formData.pickupNotes}
                        onChange={handleInputChange}
                        placeholder="Contoh: Akan diambil oleh staf konveksi kami atas nama Pak Budi"
                        className="w-full px-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =============================================================== */}
            {/* RIGHT COLUMN: ORDER SUMMARY (span 5)                            */}
            {/* =============================================================== */}
            <div className="lg:col-span-5">
              <div className="sticky top-28 space-y-6">
                {/* Order Summary Card: bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                    <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                      Ringkasan Pesanan
                    </h2>
                    <span className="text-xs font-semibold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full">
                      {cartItems.length} Produk
                    </span>
                  </div>

                  {/* Compact Item List: Image, Name, Qty, Subtotal */}
                  <div className="mt-6 divide-y divide-zinc-100 max-h-[320px] overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-3.5">
                        {/* Thumbnail: w-16 h-16 rounded-lg object-cover */}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200/80 shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>

                        {/* Title & Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 truncate leading-snug" title={item.name}>
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                            <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-mono">
                              {item.code}
                            </span>
                            <span>
                              {item.quantity} {item.unit} × {formatRupiah(item.price)}
                            </span>
                          </div>
                        </div>

                        {/* Item Subtotal */}
                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-zinc-900">
                            {formatRupiah(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cost Breakdown (mt-6 pt-6 border-t border-zinc-200 space-y-3) */}
                  <div className="mt-6 pt-6 border-t border-zinc-200 space-y-3 text-sm">
                    {/* Subtotal Produk */}
                    <div className="flex items-center justify-between text-zinc-600">
                      <span>Subtotal Produk ({totalItemCount} unit/meter)</span>
                      <span className="font-semibold text-zinc-900">{formatRupiah(subtotal)}</span>
                    </div>

                    {/* Biaya Pengiriman (Dynamic) */}
                    <div className="flex items-center justify-between text-zinc-600">
                      <div className="flex items-center gap-1.5">
                        <span>Biaya Pengiriman</span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                          {fulfillmentMethod === 'DELIVERY' ? 'Kurir Toko' : 'Pickup'}
                        </span>
                      </div>
                      <span
                        className={`font-semibold ${
                          fulfillmentMethod === 'DELIVERY' ? 'text-zinc-900' : 'text-emerald-600'
                        }`}
                      >
                        {fulfillmentMethod === 'DELIVERY' ? formatRupiah(DELIVERY_FEE_AMOUNT) : 'Rp 0 (Gratis)'}
                      </span>
                    </div>

                    {/* Biaya Reservasi & Admin */}
                    <div className="flex items-center justify-between text-zinc-600 text-xs">
                      <span>Biaya Reservasi Gudang</span>
                      <span className="text-emerald-600 font-medium">Gratis</span>
                    </div>
                  </div>

                  {/* Final Total (mt-6 pt-6 border-t border-zinc-200 flex justify-between items-center) */}
                  <div className="mt-6 pt-6 border-t border-zinc-200 flex justify-between items-center">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold text-zinc-500 block">
                        Total Pembayaran
                      </span>
                      <span className="text-[10px] text-zinc-400">Sudah termasuk PPN &amp; seluruh rincian</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-zinc-900 block leading-tight">
                        {formatRupiah(finalTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button: PLACE ORDER with simulated loading state isSubmitting */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-zinc-900 text-white rounded-full py-4 mt-8 font-bold tracking-wide hover:bg-zinc-800 active:scale-[0.99] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
                        <span>MEMPROSES RESERVASI STOK...</span>
                      </>
                    ) : (
                      <>
                        <span>PLACE ORDER</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Sleek lock icon or secure text below button */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 mt-4 text-center">
                    <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Stok akan direservasi setelah pemesanan.</span>
                  </div>

                  {/* Assurance guarantee badges */}
                  <div className="mt-6 pt-6 border-t border-zinc-100 grid grid-cols-2 gap-3 text-[11px] text-zinc-500">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Jaminan Bahan Asli</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-zinc-800 shrink-0" />
                      <span>Stok Tersedia Real-Time</span>
                    </div>
                  </div>
                </div>

                {/* Back to Cart Quick Link */}
                <div className="text-center">
                  <Link
                    href="/cart"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali dan ubah isi keranjang</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
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
      {/* ORDER PLACED SUCCESS MODAL (POST-CHECKOUT STOCK RESERVED VIEW)       */}
      {/* =================================================================== */}
      {orderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center">
              <span className="text-xs uppercase tracking-widest font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Pesanan Berhasil Dibuat
              </span>
              <h2 className="text-2xl font-bold text-zinc-900 mt-3">
                Stok Telah Direservasi!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1.5">
                Stok barang aman dan telah direservasi secara otomatis untuk pesanan Anda.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="mt-6 bg-zinc-50 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 space-y-3.5 text-xs text-zinc-700">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <span className="text-zinc-500">Nomor Pesanan (Order ID)</span>
                <span className="font-mono font-bold text-sm text-zinc-900 bg-white px-2.5 py-1 rounded-lg border border-zinc-200">
                  {orderResult.orderNumber}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Waktu Pemesanan</span>
                <span className="font-medium text-zinc-900">{orderResult.reservedAt} WIB</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Batas Waktu Reservasi</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {orderResult.reservationExpiresAt}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Metode Penyerahan</span>
                <span className="font-semibold text-zinc-900 uppercase">
                  {orderResult.fulfillmentMethod === 'DELIVERY' ? '🚚 Delivery Kurir' : '🏬 Pickup di Toko'}
                </span>
              </div>

              {orderResult.deliveryAddress && (
                <div className="pt-2 border-t border-zinc-200 text-left">
                  <span className="text-zinc-500 block mb-1">Alamat Tujuan:</span>
                  <span className="font-medium text-zinc-800 leading-relaxed block">
                    {orderResult.deliveryAddress}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-sm">
                <span className="font-bold text-zinc-900">Total Harus Dibayar</span>
                <span className="font-extrabold text-base text-zinc-900">
                  {formatRupiah(orderResult.total)}
                </span>
              </div>
            </div>

            {/* Next steps notice */}
            <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Langkah berikutnya: Selesaikan pembayaran melalui transfer bank, e-wallet, atau cash saat pickup sebelum masa reservasi berakhir.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/products"
                onClick={() => setOrderResult(null)}
                className="w-full sm:w-1/2 py-3 px-4 rounded-full text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 text-center transition-colors cursor-pointer"
              >
                Belanja Lagi
              </Link>

              <Link
                href={`/orders/${orderResult.orderNumber}/payment`}
                onClick={() => setOrderResult(null)}
                className="w-full sm:w-1/2 py-3 px-4 rounded-full text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 text-center transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Bayar Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING SUCCESS NOTIFICATION TOAST                                 */}
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
