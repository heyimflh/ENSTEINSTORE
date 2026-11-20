'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Truck,
  PackageCheck,
  Search,
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  Sparkles,
  ShoppingBag,
  ChevronRight,
  CheckCircle2,
  User,
} from 'lucide-react';
import { formatIDR } from '../../data/products';

// ============================================================================
// DATA TYPES & INTERFACES (PRODUCTION READY)
// ============================================================================

export type UnitType = 'meter' | 'pcs' | 'roll';

export interface CartItem {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  unit: UnitType;
  allowDecimal: boolean;
  stock: number;
  quantity: number;
  imageUrl: string;
}

// ============================================================================
// INITIAL CART DATA (Standard Indonesian Rainwear Accessories)
// ============================================================================

const INITIAL_MOCK_ITEMS: CartItem[] = [
  {
    id: 'cart-item-1',
    code: 'PRD-ALT-003',
    name: 'Resleting Waterproof (Hitam/Putih)',
    category: 'Resleting',
    price: 8500,
    unit: 'pcs',
    allowDecimal: false,
    stock: 800,
    quantity: 2,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
  },
  {
    id: 'cart-item-2',
    code: 'PRD-BHN-001',
    name: 'PVC Super Ketebalan 0.25',
    category: 'Material Jas Hujan',
    price: 35000,
    unit: 'meter',
    allowDecimal: true,
    stock: 150,
    quantity: 2.5,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
  },
  {
    id: 'cart-item-3',
    code: 'PRD-ALT-001',
    name: 'Kancing Snap (Hitam/Putih)',
    category: 'Kancing',
    price: 500,
    unit: 'pcs',
    allowDecimal: false,
    stock: 5000,
    quantity: 10,
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg',
  },
];

export default function CartPage() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_MOCK_ITEMS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchNavQuery, setSearchNavQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<CartItem | null>(null);

  // Helper toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // --------------------------------------------------------------------------
  // COMPUTED VALUES
  // --------------------------------------------------------------------------
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  const totalItemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  // Natural real-time stock check
  const itemsWithStockError = useMemo(() => {
    return cartItems.filter((item) => item.quantity > item.stock);
  }, [cartItems]);

  const hasStockError = itemsWithStockError.length > 0;

  // --------------------------------------------------------------------------
  // QUANTITY HANDLERS (Real E-Commerce Interaction)
  // --------------------------------------------------------------------------
  const handleStepQuantity = (id: string, delta: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;

        const step = item.allowDecimal ? 0.5 : 1;
        const minQty = item.allowDecimal ? 0.5 : 1;
        const rawNewQty = item.quantity + delta * step;
        const newQty = Math.round(rawNewQty * 10) / 10;

        return {
          ...item,
          quantity: Math.max(minQty, newQty),
        };
      })
    );
  };

  const handleInputQuantityChange = (id: string, rawValue: string) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    if (rawValue.trim() === '') {
      setCartItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: 0 } : i))
      );
      return;
    }

    const parsed = parseFloat(rawValue);
    if (isNaN(parsed)) return;

    const cleanQty = item.allowDecimal
      ? Math.round(parsed * 10) / 10
      : Math.floor(parsed);

    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, cleanQty) } : i))
    );
  };

  const handleInputBlur = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const minQty = item.allowDecimal ? 0.5 : 1;
        if (item.quantity <= 0) {
          return { ...item, quantity: minQty };
        }
        return item;
      })
    );
  };

  // Quick fix: Set item quantity directly to maximum available stock
  const handleSetMaxStock = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: item.stock };
        }
        return item;
      })
    );
    showToast('Kuantitas berhasil disesuaikan dengan stok gudang.');
  };

  // --------------------------------------------------------------------------
  // ITEM REMOVAL HANDLER
  // --------------------------------------------------------------------------
  const handleConfirmRemove = () => {
    if (!deleteConfirmItem) return;
    const removedName = deleteConfirmItem.name;
    setCartItems((prev) => prev.filter((item) => item.id !== deleteConfirmItem.id));
    setDeleteConfirmItem(null);
    showToast(`"${removedName}" telah dihapus dari keranjang.`);
  };

  const handleClearCart = () => {
    setCartItems([]);
    showToast('Keranjang belanja telah dikosongkan.');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white flex flex-col justify-between">
      
      {/* =================================================================== */}
      {/* 1. STANDARDIZED GLOBAL NAVBAR (Consistent with Homepage)            */}
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
              <a
                href="#orders"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Pelacakan Pesanan: Masukkan kode transaksi Anda di akun pengguna.');
                }}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200 cursor-pointer"
              >
                My Orders
              </a>
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
                {totalItemCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-zinc-900 rounded-full">
                    {totalItemCount}
                  </span>
                )}
              </Link>

              {/* Profile / Account Button */}
              <button
                type="button"
                onClick={() => alert('Panel Akun Toko Enstein: Customer & Admin Login')}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-900 text-zinc-800 text-xs font-medium transition-all duration-200 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account</span>
              </button>

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
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-zinc-900"
            >
              Shopping Cart ({totalItemCount})
            </Link>
          </div>
        )}
      </nav>

      {/* =================================================================== */}
      {/* 2. PAGE HEADER                                                      */}
      {/* =================================================================== */}
      <section className="pt-10 pb-6 px-4 md:px-12 xl:px-24 max-w-7xl mx-auto w-full">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <Link href="/products" className="hover:text-zinc-900 transition-colors">
            Products
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-zinc-900">Keranjang Belanja</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium mb-3">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              <span>Toko Enstein • E-Commerce Bahan Jas Hujan</span>
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mt-1">
              Keranjang Belanja
            </h1>
            <p className="text-sm text-zinc-500 mt-2 max-w-xl leading-relaxed">
              Periksa daftar pesanan bahan jas hujan, atur meteran atau kuantitas, dan pastikan stok
              mencukupi sebelum melanjutkan ke tahap pembayaran.
            </p>
          </div>

          {cartItems.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 bg-white border border-zinc-200 px-3.5 py-1.5 rounded-full shadow-xs font-medium">
                Total item:{' '}
                <strong className="text-zinc-900">
                  {cartItems.length} macam ({totalItemCount}{' '}
                  {cartItems.some((i) => i.allowDecimal) ? 'satuan' : 'pcs'})
                </strong>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. MAIN CART LAYOUT (Span 8 Items, Span 4 Summary)                  */}
      {/* =================================================================== */}
      <main className="flex-1 px-4 md:px-12 xl:px-24 pb-24 max-w-7xl mx-auto w-full">
        {cartItems.length === 0 ? (
          /* Empty State UI */
          <div className="bg-white border border-zinc-200 rounded-3xl p-12 md:p-16 text-center max-w-2xl mx-auto shadow-sm my-8">
            <div className="relative w-24 h-24 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto mb-6 text-zinc-400 border border-zinc-200/80 shadow-inner">
              <ShoppingBag className="w-12 h-12 stroke-[1.5] text-zinc-400" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center text-xs font-black border-2 border-white shadow-xs">
                0
              </div>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Keranjang Anda kosong</h2>
            <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto leading-relaxed">
              Belum ada material jas hujan, resleting, kancing, atau karet yang ditambahkan. Silakan
              jelajahi katalog produk Toko Enstein untuk memilih kebutuhan konveksi Anda.
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold transition-all shadow-md active:scale-95 group cursor-pointer"
              >
                <span>Mulai Belanja</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Quick links to categories */}
            <div className="mt-12 pt-8 border-t border-zinc-100">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Kategori Terpopuler Toko Enstein
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  'Material Jas Hujan',
                  'Resleting Waterproof',
                  'Kancing Jepret',
                  'Karet Elastis',
                  'Aksesori Sealing',
                ].map((cat) => (
                  <Link
                    key={cat}
                    href="/products"
                    className="px-3 py-1.5 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs text-zinc-600 transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* -------------------------------------------------------------- */}
            {/* LEFT COLUMN: CART ITEMS (span 8)                               */}
            {/* -------------------------------------------------------------- */}
            <section className="lg:col-span-8 space-y-4">
              
              {/* Natural Stock Exceeded Alert Banner */}
              {hasStockError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-red-700 animate-in fade-in duration-300">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-red-900">
                      Terdapat {itemsWithStockError.length} item dengan jumlah melebihi stok yang
                      tersedia di gudang.
                    </p>
                    <p className="text-red-700 text-xs mt-1">
                      Silakan kurangi jumlah pesanan sesuai batas persediaan gudang untuk melanjutkan proses checkout.
                    </p>
                  </div>
                </div>
              )}

              {/* Items Card List */}
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const isItemOverStock = item.quantity > item.stock;
                  const itemSubtotal = item.price * item.quantity;

                  return (
                    <article
                      key={item.id}
                      className={`relative bg-white border transition-all duration-300 rounded-2xl p-4 sm:p-6 shadow-xs ${
                        isItemOverStock
                          ? 'border-red-300 ring-1 ring-red-200'
                          : 'border border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        
                        {/* Thumbnail Image */}
                        <div className="relative shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="aspect-square w-24 sm:w-28 md:w-32 rounded-xl bg-zinc-100 object-cover shadow-2xs border border-zinc-100"
                          />
                          {item.allowDecimal && (
                            <span className="absolute bottom-2 left-2 bg-zinc-900/85 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                              Eceran Meteran
                            </span>
                          )}
                        </div>

                        {/* Product Information */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="inline-block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                                {item.category} • Kode: {item.code}
                              </span>

                              {/* Sleek Trash Icon */}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmItem(item)}
                                className="text-zinc-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                                title={`Hapus ${item.name}`}
                                aria-label={`Hapus ${item.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <h3 className="text-base font-bold text-zinc-900 mt-1 leading-snug">
                              {item.name}
                            </h3>

                            <p className="text-sm text-zinc-500 mt-1 font-medium">
                              Harga Satuan:{' '}
                              <span className="text-zinc-900 font-semibold">
                                {formatIDR(item.price)}
                              </span>{' '}
                              / {item.unit}
                            </p>

                            <p className="text-xs text-zinc-400 mt-0.5">
                              Stok Gudang:{' '}
                              <strong
                                className={
                                  item.stock <= 5
                                    ? 'text-amber-600 font-semibold'
                                    : 'text-zinc-700 font-semibold'
                                }
                              >
                                {item.stock} {item.unit}
                              </strong>
                            </p>
                          </div>

                          {/* Quantity Selector & Subtotal Controls */}
                          <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
                            
                            {/* Quantity Stepper */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400 font-medium mr-1 hidden sm:inline">
                                Jumlah ({item.unit}):
                              </span>
                              <div className="inline-flex items-center border border-zinc-200 rounded-xl bg-zinc-50 p-1 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleStepQuantity(item.id, -1)}
                                  className="w-8 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition-colors cursor-pointer"
                                  title="Kurangi Kuantitas"
                                  aria-label="Kurangi Kuantitas"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>

                                <input
                                  type="number"
                                  step={item.allowDecimal ? '0.5' : '1'}
                                  min={item.allowDecimal ? '0.5' : '1'}
                                  value={item.quantity === 0 ? '' : item.quantity}
                                  onChange={(e) =>
                                    handleInputQuantityChange(item.id, e.target.value)
                                  }
                                  onBlur={() => handleInputBlur(item.id)}
                                  className="w-16 text-center bg-transparent text-sm font-bold text-zinc-900 focus:outline-none"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleStepQuantity(item.id, 1)}
                                  className="w-8 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition-colors cursor-pointer"
                                  title="Tambah Kuantitas"
                                  aria-label="Tambah Kuantitas"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <span className="text-xs font-semibold text-zinc-600">
                                {item.unit}
                              </span>
                            </div>

                            {/* Item Subtotal */}
                            <div className="text-right">
                              <span className="block text-[11px] text-zinc-400 uppercase font-medium">
                                Subtotal
                              </span>
                              <span className="font-bold text-zinc-900 text-lg md:text-xl">
                                {formatIDR(itemSubtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Natural Inline Stock Warning */}
                      {isItemOverStock && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm px-4 py-2.5 rounded-xl mt-4 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-200">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                            <span>
                              Jumlah melebihi stok gudang (Tersedia: <strong>{item.stock} {item.unit}</strong>).
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSetMaxStock(item.id)}
                            className="text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            Set ke {item.stock} {item.unit}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* Bottom Actions: Continue Shopping & Clear All */}
              <div className="pt-4 flex items-center justify-between">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Lanjutkan Belanja Material Lain</span>
                </Link>

                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Kosongkan Semua
                </button>
              </div>
            </section>

            {/* -------------------------------------------------------------- */}
            {/* RIGHT COLUMN: ORDER SUMMARY (span 4)                           */}
            {/* -------------------------------------------------------------- */}
            <aside className="lg:col-span-4 lg:sticky lg:top-32">
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                
                <h2 className="font-bold text-xl text-zinc-900 mb-6 flex items-center justify-between">
                  <span>Ringkasan Pesanan</span>
                  <span className="text-xs font-normal text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
                    {cartItems.length} Produk
                  </span>
                </h2>

                <div className="space-y-4 text-sm">
                  {/* Subtotal Produk */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Subtotal Produk</span>
                    <span className="font-semibold text-zinc-900">{formatIDR(subtotal)}</span>
                  </div>

                  {/* Biaya Pengiriman */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Biaya Pengiriman</span>
                    <span className="text-xs text-zinc-500 italic">Dihitung saat checkout</span>
                  </div>

                  {/* Delivery Info Note */}
                  <div className="bg-zinc-50 rounded-2xl p-3.5 text-xs text-zinc-600 flex items-start gap-2.5 border border-zinc-100">
                    <Truck className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      Mendukung <strong>Ambil di Toko (Tanahsari, Kebumen)</strong> gratis atau{' '}
                      <strong>Pengiriman Delivery</strong> saat checkout.
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-200 my-6" />

                {/* Total */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-base font-bold text-zinc-900 block">Total</span>
                    <span className="text-[11px] text-zinc-400">Termasuk pajak &amp; penyesuaian</span>
                  </div>
                  <span className="text-2xl font-bold text-zinc-900">{formatIDR(subtotal)}</span>
                </div>

                {/* Warning in summary if error exists */}
                {hasStockError && (
                  <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Perbaiki item yang melebihi stok agar dapat melanjutkan pesanan.</span>
                  </div>
                )}

                {/* Checkout Button */}
                {hasStockError ? (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-full py-4 mt-6 font-bold text-sm bg-zinc-900 text-white opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Lanjut ke Checkout</span>
                  </button>
                ) : (
                  <Link
                    href="/checkout"
                    className="w-full rounded-full py-4 mt-6 font-bold text-sm bg-zinc-900 text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Lanjut ke Checkout</span>
                  </Link>
                )}

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-zinc-100 space-y-2.5 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Verifikasi stok real-time &amp; snapshot harga pesanan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Pembayaran transfer bank manual aman &amp; tervalidasi</span>
                  </div>
                </div>

              </div>
            </aside>
          </div>
        )}
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
      {/* CONFIRMATION DIALOG MODAL (Delete Item)                            */}
      {/* =================================================================== */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Hapus Item dari Keranjang?</h3>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus{' '}
              <strong className="text-zinc-800">{deleteConfirmItem.name}</strong> dari keranjang
              belanja Anda?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm cursor-pointer"
              >
                Ya, Hapus Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING SUCCESS TOAST NOTIFICATION                                 */}
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
