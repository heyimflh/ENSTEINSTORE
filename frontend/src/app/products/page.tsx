'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Product, PRODUCTS as DUMMY_PRODUCTS, CategoryName, formatIDR } from '../../data/products';
import { ProductDetailModal } from '../../components/store/ProductDetailModal';
import { CartDrawer } from '../../components/store/CartDrawer';
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  ArrowRight,
  User,
  Menu,
  X,
  PackageX,
  Eye,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowUpDown,
  Sparkles,
  ChevronRight,
  Filter,
  Trash2,
  ExternalLink,
  Layers,
  GitCommitHorizontal,
  CircleDot,
  Activity,
  Scissors,
} from 'lucide-react';

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================

export interface CartItem {
  product: Product;
  quantity: number;
}

export type SortOption =
  | 'terbaru'
  | 'harga-rendah'
  | 'harga-tinggi'
  | 'terpopuler';

const CATEGORIES: CategoryName[] = [
  'Semua',
  'Material Jas Hujan',
  'Resleting',
  'Kancing',
  'Karet',
  'Aksesori',
];

// ============================================================================
// MAIN PRODUCT CATALOG PAGE COMPONENT
// ============================================================================

export default function ProductCatalogPage() {
  // Navigation & Interactive States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter & Search & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('Semua');
  const [sortBy, setSortBy] = useState<SortOption>('terbaru');

  // Quick View Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Sync category or search query from URL parameter (e.g., when routed from /categories or search bar)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category');
      const searchParam = params.get('search');
      if (catParam && CATEGORIES.includes(catParam as CategoryName)) {
        setSelectedCategory(catParam as CategoryName);
      }
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, []);

  // Cart State (Initialized with 1 mock item)
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: DUMMY_PRODUCTS[0],
      quantity: 3,
    },
  ]);

  // Toast auto-dismiss helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Cart handlers
  const handleAddToCart = (product: Product, qty: number = 1) => {
    if (product.stock <= 0) return; // Prevent out of stock addition

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prevCart, { product, quantity: qty }];
    });

    triggerToast(`"${product.name.slice(0, 32)}..." berhasil ditambahkan ke keranjang.`);
  };

  const handleUpdateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalCartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const totalCartPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  // Filter and Sort Pipeline (STRICT PRD BUSINESS RULES)
  const filteredProducts = useMemo(() => {
    // Rule 1: Display active products only
    let list = DUMMY_PRODUCTS.filter((p) => p.isActive);

    // Rule 2: Search Bar (by product name)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Rule 3: Category Filter (Material Jas Hujan, Resleting, Kancing, Karet, Aksesori)
    if (selectedCategory !== 'Semua') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Rule 4: Sort Dropdown (Terbaru, Harga: Rendah ke Tinggi, Harga: Tinggi ke Rendah)
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'terbaru':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'harga-rendah':
          return a.price - b.price;
        case 'harga-tinggi':
          return b.price - a.price;
        case 'terpopuler':
          return b.salesCount - a.salesCount;
        default:
          return 0;
      }
    });

    return list;
  }, [searchQuery, selectedCategory, sortBy]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Semua');
    setSortBy('terbaru');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-zinc-800 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-5 h-5 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[2.5]" />
          </div>
          <p className="text-xs font-medium tracking-wide">{toastMessage}</p>
        </div>
      )}

      {/* =====================================================================
          1. REUSABLE NAVBAR (`sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-zinc-200`)
          ===================================================================== */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-lg border-b border-zinc-200 transition-all">
        {/* Subtle Announcement Strip */}
        <div className="bg-zinc-900 text-zinc-300 text-[11px] py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>
            Toko Enstein: Melayani eceran per meter &amp; partai besar untuk konveksi jas hujan seluruh Indonesia.
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-zinc-100 p-1 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0 border border-zinc-200/80 shadow-sm">
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

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-10">
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
                href="/#categories"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                Kategori
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                Tentang Kami
              </Link>
              <button
                type="button"
                onClick={() => alert('Pelacakan Pesanan: Silakan login ke akun pelanggan Anda.')}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                My Orders
              </button>
            </div>

            {/* Right: Actions (Inline Quick Search, Cart Drawer, Account) */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Navbar Search Pill (Quick jumps to page search) */}
              <div className="relative hidden xl:block">
                <input
                  type="text"
                  placeholder="Cari katalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 pl-8 pr-3 py-1.5 text-xs bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white border border-transparent focus:border-zinc-300 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:w-60 transition-all duration-300"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>

              {/* Shopping Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                aria-label="Buka Keranjang Belanja"
                className="relative p-2.5 rounded-full text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors duration-200"
              >
                <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
                {totalCartCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-zinc-900 rounded-full">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Account / Login Button */}
              <button
                type="button"
                onClick={() =>
                  alert('Login Toko Enstein: Tersedia untuk Customer dan Admin Owner.')
                }
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-900 text-zinc-800 text-xs font-medium transition-all duration-200"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account</span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
                aria-label="Toggle menu navigasi"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white/95 backdrop-blur-md px-6 py-6 space-y-4">
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Cari kain, resleting, kancing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-100 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            </div>

            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Home
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-zinc-900"
            >
              Katalog Produk
            </Link>
            <Link
              href="/#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Kategori
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Tentang Toko Enstein
            </Link>

            <div className="pt-4 border-t border-zinc-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsCartOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-zinc-200 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Keranjang Belanja ({totalCartCount} item)</span>
              </button>
              <a
                href="https://wa.me/6283876942484"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-zinc-900 text-white font-medium text-xs uppercase tracking-wider"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Konsultasi WA: +62 838 7694 2484</span>
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* =====================================================================
          2. PAGE HEADER & FILTER BAR (`bg-zinc-50 pt-8 pb-4 px-8`)
          ===================================================================== */}
      <section className="bg-zinc-50 pt-8 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Sleek Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center space-x-2 text-xs text-zinc-500 font-medium">
            <li>
              <Link href="/" className="hover:text-zinc-900 transition-colors">
                Home
              </Link>
            </li>
            <li className="text-zinc-300">/</li>
            <li className="text-zinc-900 font-semibold" aria-current="page">
              Katalog Produk
            </li>
          </ol>
        </nav>

        {/* Page Title & Contextual Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">
              Premium Rainwear Materials &amp; Hardware
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mt-1 font-sans">
              Katalog Produk
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 max-w-2xl font-light leading-relaxed">
              Pilihan lengkap material kain PVC balon, mika transparan, resleting waterproof,
              kancing jepret T5, karet elastik, dan aksesoris konveksi jas hujan berkualitas tinggi.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-200/70 text-zinc-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {filteredProducts.length} Produk Tersedia
            </span>
          </div>
        </div>

        {/* Top Action Bar (Flexbox): Left Search, Center Category Pills, Right Sort */}
        <div className="pt-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Left: Minimalist Search Input Field */}
          <div className="relative w-full lg:w-80 shrink-0">
            <input
              type="text"
              placeholder="Cari berdasarkan nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-white text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-full focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700 p-0.5 rounded-full"
                aria-label="Bersihkan pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Center: Horizontal Scrollable Category "Pills" */}
          <div className="overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center space-x-2 whitespace-nowrap min-w-max">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-900 hover:text-zinc-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Sort Select Dropdown (Minimalist Styling) */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
            <div className="relative flex items-center">
              <span className="text-xs text-zinc-500 font-medium hidden sm:inline mr-2">
                Urutkan:
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-white text-zinc-800 text-xs font-medium pl-3 pr-8 py-2.5 border border-zinc-200 rounded-full focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                >
                  <option value="terbaru">Terbaru</option>
                  <option value="harga-rendah">Harga: Rendah ke Tinggi</option>
                  <option value="harga-tinggi">Harga: Tinggi ke Rendah</option>
                  <option value="terpopuler">Paling Populer</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =====================================================================
          3. PRODUCT GRID (`bg-zinc-50 pb-24 px-8 min-h-[50vh]`)
          ===================================================================== */}
      <main className="bg-zinc-50 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[50vh]">
        
        {/* Active Filters Bar if filtered */}
        {(selectedCategory !== 'Semua' || searchQuery.trim() !== '') && (
          <div className="flex items-center flex-wrap gap-2 mb-8 pt-2">
            <span className="text-xs text-zinc-400">Filter Aktif:</span>
            {selectedCategory !== 'Semua' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-zinc-200 text-zinc-800 font-medium">
                {selectedCategory}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('Semua')}
                  className="hover:text-zinc-950"
                  aria-label="Hapus filter kategori"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-zinc-200 text-zinc-800 font-medium">
                &ldquo;{searchQuery}&rdquo;
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-zinc-950"
                  aria-label="Hapus filter pencarian"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-2 ml-2"
            >
              Reset Semua
            </button>
          </div>
        )}

        {/* 4. CONDITIONAL RENDERING: PRODUCT GRID vs EMPTY STATE */}
        {filteredProducts.length === 0 ? (
          /* =================================================================
             4. EMPTY STATE UI (Centered in Grid Area, Highly Aesthetic)
             ================================================================= */
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mb-5 border border-zinc-200/80 shadow-sm">
              <PackageX className="w-10 h-10 text-zinc-400 stroke-1" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              Produk tidak ditemukan
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto mt-2 leading-relaxed">
              Tidak ada produk yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo; atau
              kategori terpilih. Silakan coba kata kunci lain atau hapus filter untuk melihat semua barang.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="border border-zinc-900 text-zinc-900 px-6 py-2.5 rounded-full mt-6 hover:bg-zinc-900 hover:text-white transition-all duration-300 text-xs font-semibold tracking-wide uppercase cursor-pointer"
            >
              Hapus Filter
            </button>
          </div>
        ) : (
          /* =================================================================
             PRODUCT GRID (grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12)
             ================================================================= */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  {/* Image Wrapper: aspect-[4/5] bg-zinc-200 rounded-2xl overflow-hidden */}
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/5] bg-zinc-200 group">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className={`object-cover w-full h-full transition-transform duration-500 ${
                        isOutOfStock
                          ? 'opacity-80 scale-100'
                          : 'group-hover:scale-110'
                      }`}
                    />

                    {/* Stock Badges / Product Code */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                      {isOutOfStock ? (
                        <span className="bg-zinc-900/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          Habis
                        </span>
                      ) : (
                        <span className="bg-white/80 backdrop-blur-sm text-zinc-900 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                          {product.code}
                        </span>
                      )}

                      {product.isNew && !isOutOfStock && (
                        <span className="bg-amber-400 text-zinc-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Baru
                        </span>
                      )}
                    </div>

                    {/* Quick View Button (Top Right) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                      }}
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm hover:bg-white text-zinc-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                      title="Lihat Detail Cepat"
                      aria-label="Lihat Detail Cepat"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Out of Stock State (If Stock == 0): Dark/gray overlay + static unhidden button */}
                    {isOutOfStock ? (
                      <>
                        <div className="absolute inset-0 bg-black/20 pointer-events-none transition-opacity" />
                        <button
                          disabled
                          type="button"
                          className="bg-zinc-300 text-zinc-500 cursor-not-allowed absolute bottom-4 left-4 right-4 py-3 rounded-xl font-medium text-xs text-center shadow-sm select-none"
                        >
                          Stok habis
                        </button>
                      </>
                    ) : (
                      /* In-Stock Hover Action: Hidden slide-up button */
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product, 1);
                        }}
                        className="opacity-0 translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 bg-white/90 backdrop-blur text-zinc-900 absolute bottom-4 left-4 right-4 py-3 rounded-xl font-medium shadow-lg hover:bg-zinc-900 hover:text-white transition-all duration-300 text-xs flex items-center justify-center gap-1.5 cursor-pointer z-10"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    )}
                  </div>

                  {/* Text Content Below Image */}
                  <div className="mt-3.5 space-y-1">
                    <p className="text-sm text-zinc-500 font-medium">
                      {product.category}
                    </p>
                    <h3 className="font-semibold text-zinc-900 group-hover:text-amber-600 transition-colors line-clamp-2 text-sm leading-snug">
                      {product.name}
                    </h3>
                    <p className="font-medium text-zinc-900 text-sm pt-0.5">
                      {formatIDR(product.price)}{' '}
                      <span className="text-zinc-400 font-normal text-xs">
                        / {product.unit}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* =====================================================================
          5. REUSABLE FOOTER (Exact Consistency with Homepage)
          ===================================================================== */}
      <footer className="bg-white py-16 border-t border-zinc-200 text-zinc-600">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-zinc-100">
            
            {/* Col 1: Brand & Bio */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-100 p-1 flex items-center justify-center shrink-0 border border-zinc-200">
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

              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm font-light">
                Toko Enstein berlokasi di Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01).
                Pusat penyedia bahan baku jas hujan terlengkap: kain PVC balon, mika, taslan, kancing jepret T5,
                resleting waterproof, dan karet elastik bermutu prima.
              </p>

              <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 pt-1">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Standar Bahan Konveksi &amp; Eceran Terpercaya</span>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Navigasi
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li>
                  <Link href="/" className="hover:text-zinc-900 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-zinc-900 transition-colors font-medium text-zinc-900">
                    Katalog Lengkap
                  </Link>
                </li>
                <li>
                  <Link href="/#categories" className="hover:text-zinc-900 transition-colors">
                    5 Kategori Utama
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-zinc-900 transition-colors">
                    Tentang Toko
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Product Categories */}
            <div className="lg:col-span-3 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Kategori Bahan
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                {CATEGORIES.filter((c) => c !== 'Semua').map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(c);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-zinc-900 transition-colors text-left"
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Contact & Hours */}
            <div className="lg:col-span-3 space-y-3">
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
                    className="font-medium text-zinc-900 hover:text-amber-600 transition-colors"
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

          {/* Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
            <p>© 2026 ENSTEINSTORE (Toko Enstein). All rights reserved.</p>
            <p>Tugas Akhir Pemrograman Berorientasi Objek &amp; Basis Data Semester 3</p>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          6. INTERACTIVE SLIDE-OVER CART DRAWER (Unified Professional Component)
          ===================================================================== */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
      />

      {/* =====================================================================
          7. PRODUCT QUICK-VIEW MODAL (Unified Professional Component)
          ===================================================================== */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
