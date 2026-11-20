'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Minus,
  Plus,
  ShoppingCart,
  ShoppingBag,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Share2,
  Heart,
  ChevronRight,
  Menu,
  X,
  Search,
  User,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  Trash2,
  PackageCheck,
  SlidersHorizontal,
  Info,
} from 'lucide-react';

// ============================================================================
// DATA TYPES & INTERFACES (PRD COMPLIANT)
// ============================================================================

export type UnitType = 'meter' | 'pcs' | 'roll';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductDetail {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  unit: UnitType;
  allowDecimal: boolean;
  stock: number; // Available stock (stock_on_hand - reserved_quantity)
  description: string;
  imageUrl: string;
  gallery: string[];
  specs: ProductSpec[];
  badge?: string;
}

export interface CartItem {
  id: string;
  name: string;
  code: string;
  price: number;
  unit: UnitType;
  quantity: number;
  imageUrl: string;
}

// ============================================================================
// ROBUST MOCK PRODUCT DATA (PRD: Kain PVC Merah, 25.000/meter, Stock: 125)
// ============================================================================
// [TESTING INSTRUCTION]:
// To test the "Stok habis" state directly in code, change stock from 125 to 0.
// Alternatively, use the interactive "Simulasi Stok Habis" toggle button in the UI.
const INITIAL_MOCK_PRODUCT: ProductDetail = {
  id: 'PRD-BHN-001',
  code: 'PRD-BHN-001',
  name: 'PVC Super Ketebalan 0.25',
  category: 'Material Jas Hujan',
  price: 35000,
  unit: 'meter',
  allowDecimal: true,
  stock: 150,
  description:
    'Kain PVC super tebal 0.25mm lentur waterproof premium untuk jas hujan setelan dan mantel berkualitas tinggi tahan badai ekstrem. Memiliki daya lentur optimal, tidak kaku atau getas pada suhu dingin, serta memiliki ketahanan rekat luar biasa saat diproses menggunakan mesin hot air seam sealing press. Pilihan utama para pengrajin konveksi jas hujan setelan, ponco kelelawar, dan mantel outdoor profesional.',
  imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
  gallery: [
    '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
    '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCNavy.jpeg',
    '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHijauArmy.jpeg',
    '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSage.jpg',
  ],
  specs: [
    { label: 'Ketebalan', value: '0.25 mm (Super Lentur Grade A)' },
    { label: 'Lebar Kain', value: '140 cm (Efektif)' },
    { label: 'Daya Tahan Air', value: '100% Hydrostatic Waterproof' },
    { label: 'Sifat Material', value: 'Anti-Bocor, Tahan Tekanan, Seam-Press Friendly' },
    { label: 'Satuan Jual', value: 'Per meter (Mendukung pesanan desimal eceran)' },
    { label: 'Gudang Pengiriman', value: 'Toko Enstein, Tanahsari, Kebumen' },
  ],
  badge: 'Premium Konveksi',
};

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Format numeric value to Indonesian Rupiah standard (e.g. Rp 25.000)
 */
const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// ============================================================================
// MAIN PRODUCT DETAIL PAGE COMPONENT
// ============================================================================

export default function ProductDetailPage() {
  // 1. PRODUCT & STOCK STATE (Supports interactive testing)
  const [product, setProduct] = useState<ProductDetail>(INITIAL_MOCK_PRODUCT);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);

  // 2. QUANTITY & DYNAMIC SUBTOTAL STATE (PRD 9.2.3)
  // Default step: 0.5 for 'meter', 1 for 'pcs'/'roll'
  const step = product.unit === 'meter' && product.allowDecimal ? 0.5 : 1;
  const minQuantity = step;
  const isOutOfStock = product.stock <= 0;

  const [quantity, setQuantity] = useState<number>(() => (isOutOfStock ? 0 : 1));

  // Dynamic Subtotal calculation: quantity * price
  const subtotal = useMemo(() => {
    if (isOutOfStock) return 0;
    // Round to 2 decimal places to avoid IEEE floating point inaccuracies before multiplying
    const cleanQty = Math.round(quantity * 10) / 10;
    return cleanQty * product.price;
  }, [quantity, product.price, isOutOfStock]);

  // 3. ACCORDION EXPANSION STATE
  const [openAccordion, setOpenAccordion] = useState<string | null>('shipping');

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  // 4. NAVBAR & CART DRAWER STATES
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulated Cart with 1 default mock item
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'PRD-ALT-003',
      name: 'Resleting Waterproof (Hitam/Putih)',
      code: 'PRD-ALT-003',
      price: 8500,
      unit: 'pcs',
      quantity: 2,
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
    },
  ]);

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const totalCartAmount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
  }, [cartItems]);

  // 5. QUANTITY SELECTOR HANDLERS (Handles decimal steps, stock limit, edge cases)
  const handleIncreaseQuantity = () => {
    if (isOutOfStock) return;
    setQuantity((prev) => {
      const next = Math.round((prev + step) * 10) / 10;
      if (next > product.stock) return product.stock;
      return next;
    });
  };

  const handleDecreaseQuantity = () => {
    if (isOutOfStock) return;
    setQuantity((prev) => {
      const next = Math.round((prev - step) * 10) / 10;
      if (next < minQuantity) return minQuantity;
      return next;
    });
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isOutOfStock) return;
    const val = parseFloat(e.target.value);
    if (isNaN(val)) {
      setQuantity(minQuantity);
      return;
    }
    if (val > product.stock) {
      setQuantity(product.stock);
    } else if (val < minQuantity) {
      setQuantity(minQuantity);
    } else {
      setQuantity(Math.round(val * 10) / 10);
    }
  };

  // 6. ADD TO CART HANDLER
  const handleAddToCart = () => {
    if (isOutOfStock || quantity <= 0) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.round((item.quantity + quantity) * 10) / 10 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          code: product.code,
          price: product.price,
          unit: product.unit,
          quantity: quantity,
          imageUrl: product.imageUrl,
        },
      ];
    });

    // Trigger Notification Toast
    setToastMessage(`Berhasil menambahkan ${quantity} ${product.unit} ke keranjang!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);

    // Open Cart Drawer
    setIsCartOpen(true);
  };

  // 7. STOCK TESTING TOGGLE (Demonstrates PRD Rule 10: stock = 0 vs stock = 125)
  const toggleStockSimulation = () => {
    setProduct((prev) => {
      const newStock = prev.stock === 0 ? 125 : 0;
      if (newStock === 0) {
        setQuantity(0);
      } else {
        setQuantity(1);
      }
      return { ...prev, stock: newStock };
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* =================================================================== */}
      {/* 1. REUSABLE NAVBAR                                                  */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-zinc-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-12 xl:px-24 h-20 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center border border-zinc-200 shadow-sm group-hover:scale-105 transition-transform duration-300">
              <img
                src="/ensteinlogo.png"
                alt="Logo Toko Enstein"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback icon if logo image not found
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-zinc-900 font-black text-lg tracking-tighter">E</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-zinc-900 uppercase leading-none">
                ENSTEIN<span className="text-amber-500 font-black">STORE</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-zinc-400 mt-1">
                Kebumen • Jawa Tengah
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 lg:space-x-10">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/products"
              className="text-sm font-semibold text-zinc-900 border-b-2 border-zinc-900 pb-0.5 transition-colors duration-200"
            >
              Katalog Produk
            </Link>
            <Link
              href="/products"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
            >
              Material Jas Hujan
            </Link>
            <Link
              href="/#about"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
            >
              Tentang Toko
            </Link>
          </nav>

          {/* Right Header Utilities: Quick Search, Cart, Account */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative hidden lg:block">
              <input
                type="text"
                placeholder="Cari material..."
                className="w-44 pl-9 pr-4 py-2 text-xs bg-zinc-100 hover:bg-zinc-100/80 focus:bg-white border border-transparent focus:border-zinc-300 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:w-56 transition-all duration-300"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label="Keranjang Belanja"
              className="relative p-2.5 rounded-full text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors duration-200 cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
              {totalCartCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-zinc-900 rounded-full animate-in zoom-in-50">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Customer Profile / Login */}
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-900 text-zinc-800 text-xs font-medium transition-all duration-200 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Masuk / Akun</span>
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-700 hover:text-zinc-900"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-zinc-200 px-6 py-4 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-zinc-700 hover:text-zinc-900 py-1"
            >
              Home
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-zinc-900 py-1"
            >
              Katalog Produk
            </Link>
            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-zinc-700 hover:text-zinc-900 py-1"
            >
              Tentang Toko
            </Link>
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Toko Enstein Kebumen</span>
              <button
                type="button"
                className="text-xs font-semibold text-zinc-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Masuk Akun
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =================================================================== */}
      {/* 2. BREADCRUMBS                                                      */}
      {/* =================================================================== */}
      <nav aria-label="Breadcrumb" className="pt-8 px-4 md:px-12 xl:px-24 max-w-7xl mx-auto">
        <ol className="flex items-center flex-wrap gap-2 text-xs md:text-sm text-zinc-400">
          <li>
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              Home
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight className="w-3.5 h-3.5 mx-1 text-zinc-300" />
            <Link href="/products" className="hover:text-zinc-900 transition-colors">
              Katalog Produk
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight className="w-3.5 h-3.5 mx-1 text-zinc-300" />
            <Link
              href="/products?category=material-jas-hujan"
              className="hover:text-zinc-900 transition-colors"
            >
              {product.category}
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight className="w-3.5 h-3.5 mx-1 text-zinc-300" />
            <span className="font-medium text-zinc-900 line-clamp-1">{product.name}</span>
          </li>
        </ol>
      </nav>

      {/* =================================================================== */}
      {/* 3. MAIN PRODUCT SECTION (Modern 2-Column Split Layout)              */}
      {/* =================================================================== */}
      <main className="py-8 px-4 md:px-12 xl:px-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* =============================================================== */}
          {/* LEFT COLUMN: Image Gallery                                      */}
          {/* =============================================================== */}
          <section aria-label="Foto & Galeri Produk" className="md:sticky md:top-32 space-y-4">
            {/* Primary Large Image */}
            <div className="relative aspect-[4/5] bg-zinc-200 rounded-2xl overflow-hidden border border-zinc-200/80 group">
              <img
                src={product.gallery[activeImageIndex] || product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.badge && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/95 text-zinc-900 backdrop-blur-md shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {product.badge}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-zinc-900/80 text-white backdrop-blur-md">
                  100% Waterproof
                </span>
              </div>

              {/* Wishlist & Share Floating Buttons */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  aria-label="Simpan ke Wishlist"
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-zinc-700 hover:text-red-500 flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-105"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isWishlisted ? 'fill-red-500 text-red-500' : 'stroke-current'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    setToastMessage('Tautan produk berhasil disalin!');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  aria-label="Bagikan Tautan Produk"
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-zinc-700 hover:text-zinc-900 flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-105"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Out of stock watermark overlay if stock == 0 */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="px-6 py-3 rounded-full bg-zinc-900 text-white text-sm font-semibold tracking-wider uppercase shadow-xl">
                    Stok Habis
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            <div className="grid grid-cols-4 gap-3">
              {product.gallery.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 bg-zinc-100 ${
                    activeImageIndex === idx
                      ? 'border-zinc-900 ring-2 ring-zinc-900/10'
                      : 'border-transparent hover:border-zinc-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Authenticity Guarantee Card */}
            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-3 text-xs text-zinc-600">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Jaminan Kualitas Toko Enstein:</strong> Material lolos uji kedap air dan
                tersedia potongan eceran presisi dari roll utama pabrik.
              </span>
            </div>
          </section>

          {/* =============================================================== */}
          {/* RIGHT COLUMN: Product Details & Dynamic Action Area             */}
          {/* =============================================================== */}
          <section aria-label="Informasi & Pembelian Produk" className="flex flex-col">
            {/* Category Tag */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-sm font-semibold tracking-widest uppercase">
                {product.category}
              </span>
              <span className="text-xs font-mono text-zinc-400">SKU: {product.code}</span>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mt-2 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Price & Unit (Satuan) */}
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-semibold text-zinc-900 tracking-tight">
                {formatRupiah(product.price)}
              </span>
              <span className="text-base font-normal text-zinc-500">/ {product.unit}</span>
            </div>

            {/* Available Stock Badge (PRD FR-10 & Section 10) */}
            <div className="mt-4">
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Stok Habis (0 {product.unit})</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>
                    Tersedia: {product.stock} {product.unit}
                  </span>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Deskripsi Material
              </h2>
              <p className="text-zinc-600 leading-relaxed mt-2 text-sm md:text-base">
                {product.description}
              </p>
            </div>

            {/* Quick Specs Highlight Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              {product.specs.slice(0, 3).map((spec, index) => (
                <div key={index} className="p-3 bg-zinc-100/70 rounded-xl border border-zinc-200/50">
                  <div className="text-[11px] font-medium text-zinc-400">{spec.label}</div>
                  <div className="text-xs font-semibold text-zinc-800 mt-0.5 truncate">
                    {spec.value}
                  </div>
                </div>
              ))}
            </div>

            {/* ============================================================= */}
            {/* INTERACTIVE ACTION AREA: Quantity, Subtotal, Add to Cart      */}
            {/* ============================================================= */}
            <div className="mt-8 p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm transition-all duration-300">
              {/* Kuantitas Label & Step Guidance */}
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="quantity-input" className="text-sm font-semibold text-zinc-900">
                  Kuantitas Pembelian
                </label>
                <span className="text-xs text-zinc-500">
                  {product.unit === 'meter'
                    ? 'Kelipatan 0.5 meter (Mendukung eceran)'
                    : `Satuan per ${product.unit}`}
                </span>
              </div>

              {/* Sleek Quantity Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div
                  className={`flex items-center border rounded-full w-fit bg-zinc-50/50 transition-colors ${
                    isOutOfStock
                      ? 'border-zinc-200 bg-zinc-100 opacity-60'
                      : 'border-zinc-300 hover:border-zinc-400 focus-within:border-zinc-900'
                  }`}
                >
                  {/* Minus Button */}
                  <button
                    type="button"
                    onClick={handleDecreaseQuantity}
                    disabled={isOutOfStock || quantity <= minQuantity}
                    aria-label="Kurangi Jumlah"
                    className="w-11 h-11 flex items-center justify-center text-zinc-600 hover:text-zinc-900 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  {/* Number Input (No spinner arrows, center-aligned) */}
                  <div className="relative">
                    <input
                      id="quantity-input"
                      type="number"
                      value={isOutOfStock ? 0 : quantity}
                      onChange={handleQuantityInputChange}
                      step={step}
                      min={minQuantity}
                      max={product.stock}
                      disabled={isOutOfStock}
                      aria-label="Jumlah yang dibeli"
                      className="w-16 text-center text-sm font-semibold text-zinc-900 bg-transparent focus:outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Plus Button */}
                  <button
                    type="button"
                    onClick={handleIncreaseQuantity}
                    disabled={isOutOfStock || quantity >= product.stock}
                    aria-label="Tambah Jumlah"
                    className="w-11 h-11 flex items-center justify-center text-zinc-600 hover:text-zinc-900 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Units text label */}
                <div className="text-xs text-zinc-500">
                  {isOutOfStock ? (
                    <span className="text-rose-500 font-medium">Barang tidak tersedia</span>
                  ) : (
                    <span>
                      Maksimal order saat ini:{' '}
                      <strong className="text-zinc-800">
                        {product.stock} {product.unit}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              {/* DYNAMIC SUBTOTAL (PRD 9.2.3: "Total Harga: Rp {price * quantity}") */}
              <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium block">
                    Perkiraan Subtotal
                  </span>
                  <span className="text-xs text-zinc-500">
                    {quantity} {product.unit} × {formatRupiah(product.price)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
              </div>

              {/* ADD TO CART BUTTON (PRD 10: Grayed out & "Stok habis" if stock == 0) */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full py-4 mt-6 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 shadow-sm ${
                  isOutOfStock
                    ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99] cursor-pointer'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isOutOfStock ? 'Stok habis' : 'Tambah ke Keranjang'}</span>
              </button>

              {/* Fast Fulfillment Micro-Badges */}
              <div className="mt-4 pt-4 border-t border-zinc-50 grid grid-cols-2 gap-2 text-[11px] text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Ambil di Toko (Pickup Free)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pengiriman Kurir Kebumen</span>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* 4. ADDITIONAL DETAILS ACCORDION                                */}
            {/* ============================================================= */}
            <div className="mt-10 border-t border-zinc-200 divide-y divide-zinc-200">
              {/* Accordion 1: Rincian Pengiriman */}
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-zinc-900 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 transition-colors" />
                    <span>Rincian Pengiriman &amp; Pengambilan</span>
                  </div>
                  {openAccordion === 'shipping' ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </button>
                {openAccordion === 'shipping' && (
                  <div className="mt-3 text-xs md:text-sm text-zinc-600 leading-relaxed space-y-2 pl-6 animate-in fade-in-50 duration-200">
                    <p>
                      <strong>1. Ambil Sendiri di Toko (Pickup):</strong> Gratis biaya layanan. Pesanan
                      dapat diambil langsung di Toko Enstein, Jl. Kertanegara Km. 03, Tanahsari,
                      Kebumen (Senin - Sabtu: 08.00 - 17.00 WIB) setelah status pesanan dinyatakan
                      siap.
                    </p>
                    <p>
                      <strong>2. Delivery Khusus Toko:</strong> Diantar langsung oleh kurir internal
                      Toko Enstein untuk area Kabupaten Kebumen dan sekitarnya sesuai jadwal konveksi.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 2: Kebijakan Retur */}
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('returns')}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-zinc-900 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 transition-colors" />
                    <span>Kebijakan Retur &amp; Garansi Bahan</span>
                  </div>
                  {openAccordion === 'returns' ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </button>
                {openAccordion === 'returns' && (
                  <div className="mt-3 text-xs md:text-sm text-zinc-600 leading-relaxed space-y-2 pl-6 animate-in fade-in-50 duration-200">
                    <p>
                      Klaim retur dapat diajukan dalam waktu maksimal <strong>2x24 jam</strong> setelah
                      material diterima, dengan syarat menyertakan video <em>unboxing</em> utuh tanpa
                      terputus.
                    </p>
                    <p>
                      Garansi penggantian berlaku jika ditemukan cacat pabrik seperti bolong/robek
                      pada kain atau ukuran potongan tidak sesuai pesanan. Kain yang sudah dipotong
                      atau dijahit oleh pembeli tidak dapat diretur.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 3: Spesifikasi Teknis Lengkap */}
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('specs')}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-zinc-900 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 transition-colors" />
                    <span>Spesifikasi Teknis Material</span>
                  </div>
                  {openAccordion === 'specs' ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </button>
                {openAccordion === 'specs' && (
                  <div className="mt-3 text-xs md:text-sm pl-6 space-y-2 animate-in fade-in-50 duration-200">
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        {product.specs.map((item, i) => (
                          <tr key={i} className="border-b border-zinc-100">
                            <td className="py-2 text-zinc-400 font-medium w-1/3">{item.label}</td>
                            <td className="py-2 text-zinc-800 font-semibold">{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* =================================================================== */}
      {/* 5. REUSABLE FOOTER                                                  */}
      {/* =================================================================== */}
      <footer className="mt-24 border-t border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-12 xl:px-24 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Column 1 & 2: Brand Information */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-bold tracking-tight text-zinc-900 uppercase">
                  ENSTEIN<span className="text-amber-500 font-black">STORE</span>
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                Pusat penyedia bahan baku jas hujan, kain PVC balon, taslan, kancing jepret,
                resleting waterproof, dan aksesoris konveksi berkualitas tinggi untuk mitra konveksi
                dan kebutuhan eceran seluruh Indonesia.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Toko Bahan Jas Hujan Terpercaya Sejak 2020</span>
              </div>
            </div>

            {/* Column 3: Quick Navigation */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Navigasi
              </p>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li>
                  <Link href="/" className="hover:text-zinc-900 transition-colors">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors font-medium">
                    Katalog Lengkap
                  </Link>
                </li>
                <li>
                  <Link href="/#about" className="hover:text-zinc-900 transition-colors">
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link href="/#faq" className="hover:text-zinc-900 transition-colors">
                    Tanya Jawab (FAQ)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Categories */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Kategori Bahan
              </p>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Material Jas Hujan
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Resleting Waterproof
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Kancing Jepret Plastik
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors">
                    Karet Elastik Konveksi
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 5: Store Location & Contact */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Alamat &amp; Kontak
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-700 shrink-0 mt-0.5" />
                  <span>
                    Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01), Jawa Tengah
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                  <a
                    href="https://wa.me/6283876942484"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-zinc-900 transition-colors"
                  >
                    +62 838 7694 2484 (WhatsApp)
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

          <div className="mt-12 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
            <p>© {new Date().getFullYear()} ENSTEINSTORE. All rights reserved.</p>
            <p className="flex items-center gap-3">
              <span>Sistem E-Commerce &amp; Manajemen Toko Bahan Jas Hujan</span>
            </p>
          </div>
        </div>
      </footer>

      {/* =================================================================== */}
      {/* SLIDE-OVER SHOPPING CART DRAWER                                      */}
      {/* =================================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-zinc-900" />
                  <h2 className="text-base font-bold text-zinc-900">
                    Keranjang Belanja ({totalCartCount})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 py-16">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200/80 shadow-inner">
                        <ShoppingBag className="w-10 h-10 stroke-[1.5] text-zinc-400" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center text-[11px] font-black border-2 border-white shadow-xs">
                        0
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-zinc-900 font-serif">
                      Keranjang Anda kosong
                    </h4>
                    <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
                      Belum ada material jas hujan, resleting, kancing, atau karet yang ditambahkan.
                    </p>
                    <Link
                      href="/products"
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold transition-all shadow-md active:scale-95 group cursor-pointer"
                    >
                      <span>Mulai Belanja</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover shrink-0 bg-zinc-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold text-zinc-900 truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {formatRupiah(item.price)} / {item.unit}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium text-zinc-700">
                            Jumlah: <strong>{item.quantity} {item.unit}</strong>
                          </span>
                          <span className="text-xs font-bold text-zinc-900">
                            {formatRupiah(item.quantity * item.price)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCartItems((prev) => prev.filter((i) => i.id !== item.id))
                        }
                        className="text-zinc-400 hover:text-rose-600 transition-colors self-start p-1"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer & Checkout */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-zinc-200 bg-zinc-50/50 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Estimasi Total Belanja</span>
                    <span className="text-lg font-bold text-zinc-900">
                      {formatRupiah(totalCartAmount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      alert(
                        'Menuju Formulir Checkout: Anda dapat memilih metode Ambil di Toko (Pickup) atau Pengiriman (Delivery).'
                      );
                    }}
                    className="w-full py-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Lanjut ke Checkout</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="w-full text-center text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
                  >
                    Lanjut Belanja Material Lain
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING SUCCESS TOAST NOTIFICATION                                 */}
      {/* =================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 text-white text-xs font-medium shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
