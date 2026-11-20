'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PRODUCTS, CartItem } from '../../data/products';
import { CartDrawer } from '../../components/store/CartDrawer';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Package,
  Truck,
  Headphones,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
} from 'lucide-react';

// ============================================================================
// DATA & CATEGORY DEFINITIONS
// ============================================================================

interface CategoryItem {
  id: string;
  name: string;
  queryParam: string;
  count: string;
  imageUrl: string;
  gridSpan: string;
}

export default function CategoriesPage() {
  const router = useRouter();

  // Navigation & Interactive States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cart State (Synchronized with Homepage standard items)
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: PRODUCTS[0],
      quantity: 5,
    },
    {
      product: PRODUCTS[4],
      quantity: 2,
    },
  ]);

  // Cart Computations
  const totalCartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const handleUpdateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(newQty, item.product.stock) }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  // ============================================================================
  // 5 STRICT PRD CATEGORIES (Visual-First Bento Grid Setup)
  // ============================================================================
  const categories: CategoryItem[] = [
    {
      id: 'cat-1',
      name: 'Material Jas Hujan',
      queryParam: 'Material Jas Hujan',
      count: '4 Produk',
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
      gridSpan: 'md:col-span-8 md:row-span-2 min-h-[380px] md:min-h-[570px]',
    },
    {
      id: 'cat-2',
      name: 'Resleting',
      queryParam: 'Resleting',
      count: '1 Produk',
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
      gridSpan: 'md:col-span-4 md:row-span-1 min-h-[280px]',
    },
    {
      id: 'cat-3',
      name: 'Kancing',
      queryParam: 'Kancing',
      count: '1 Produk',
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg',
      gridSpan: 'md:col-span-4 md:row-span-1 min-h-[280px]',
    },
    {
      id: 'cat-4',
      name: 'Karet',
      queryParam: 'Karet',
      count: '1 Produk',
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikAll.jpeg',
      gridSpan: 'md:col-span-6 md:row-span-1 min-h-[320px] md:min-h-[360px]',
    },
    {
      id: 'cat-5',
      name: 'Aksesori',
      queryParam: 'Aksesori',
      count: '4 Produk',
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg',
      gridSpan: 'md:col-span-6 md:row-span-1 min-h-[320px] md:min-h-[360px]',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-zinc-50 antialiased flex flex-col justify-between">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 text-zinc-50 px-5 py-3 rounded-full shadow-2xl border border-zinc-700/60 transition-all duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          1. STANDARDIZED NAVBAR (Exact Consistency with Homepage & Image 3)
          ===================================================================== */}
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
                href="/categories"
                className="text-sm font-semibold text-zinc-900 hover:text-amber-600 transition-colors duration-200"
              >
                Categories
              </Link>
              <Link
                href="/about"
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
              <form onSubmit={handleSearchSubmit} className="relative hidden lg:block">
                <input
                  type="text"
                  placeholder="Search fabric, zipper, snap..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 pl-9 pr-4 py-2 text-xs bg-zinc-100 hover:bg-zinc-200/60 focus:bg-white border border-transparent focus:border-zinc-300 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:w-64 transition-all duration-300"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              </form>

              {/* Cart Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                aria-label="Keranjang Belanja"
                className="relative p-2.5 rounded-full text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors duration-200"
              >
                <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
                {totalCartCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-zinc-900 rounded-full">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Profile / Account Button */}
              <Link
                href="/profile"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-900 text-zinc-800 text-xs font-medium transition-all duration-200"
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
            <form onSubmit={handleSearchSubmit} className="relative mb-4">
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-100 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
            </form>
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
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Catalog
            </Link>
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-zinc-900"
            >
              Categories
            </Link>
            <Link
              href="/about"
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
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900 pt-2 border-t border-zinc-100"
            >
              Account
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* =====================================================================
            2. PAGE HEADER
            Exact styling: `pt-16 pb-10 px-4 md:px-12 xl:px-24 text-center`
            Clean, airy, magazine lookbook aesthetic (NO filter tabs)
            ===================================================================== */}
        <header className="pt-16 pb-10 px-4 md:px-12 xl:px-24 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight">
            Kategori Produk
          </h1>
          <p className="text-zinc-500 mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Eksplorasi koleksi material dan aksesori berkualitas tinggi untuk kebutuhan produksi Anda.
          </p>
        </header>

        {/* =====================================================================
            3. THE PREMIUM BENTO GRID
            Exact styling: `px-4 md:px-12 xl:px-24 pb-20`
            Layout: `grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[75vh]`
            ===================================================================== */}
        <section className="px-4 md:px-12 xl:px-24 pb-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[75vh]">
            {categories.map((category) => {
              const productUrl = `/products?category=${encodeURIComponent(category.queryParam)}`;

              return (
                <Link
                  key={category.id}
                  href={productUrl}
                  className={`group relative overflow-hidden rounded-3xl cursor-pointer w-full h-full min-h-[300px] ${category.gridSpan}`}
                >
                  {/* Full bleed image */}
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                  />

                  {/* Elegant dark gradient overlay from bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Content positioned at bottom left */}
                  <div className="absolute bottom-0 left-0 p-8 md:p-10 flex flex-col justify-end w-full">
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      {category.name}
                    </h3>
                    <div className="flex items-center gap-4 text-zinc-300 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75">
                      <span className="text-sm font-medium tracking-wider uppercase">
                        {category.count}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-sm font-medium flex items-center gap-1">
                        Eksplorasi{' '}
                        <ArrowRight
                          className="group-hover:translate-x-1 transition-transform"
                          size={16}
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            4. TRUST BADGES SECTION
            Exact styling: `bg-zinc-50 py-16 border-t border-zinc-200`
            Clean 4-column grid using thin Lucide icons
            ===================================================================== */}
        <section className="bg-zinc-50 py-16 border-t border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white border border-zinc-200/80 flex items-center justify-center shrink-0 shadow-sm text-zinc-900">
                  <ShieldCheck size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">100% Standar Konveksi</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Material lolos uji ketahanan air dan beban tarik jahitan konveksi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white border border-zinc-200/80 flex items-center justify-center shrink-0 shadow-sm text-zinc-900">
                  <Package size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Eceran &amp; Rol Partai</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Melayani pembelian per meter hingga partai rol besar untuk pabrik konveksi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white border border-zinc-200/80 flex items-center justify-center shrink-0 shadow-sm text-zinc-900">
                  <Truck size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Pengiriman Nasional</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Pengemasan gulungan rapi dan protektif langsung dari Kebumen ke seluruh Indonesia.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white border border-zinc-200/80 flex items-center justify-center shrink-0 shadow-sm text-zinc-900">
                  <Headphones size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Konsultasi Ahli</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Panduan teknis pemilihan gramasi material &amp; spesifikasi komponen via WhatsApp.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* =====================================================================
          5. STANDARDIZED FOOTER (Exact Consistency with Homepage & Image 3)
          ===================================================================== */}
      <footer className="bg-white py-16 border-t border-zinc-200 text-zinc-600">
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

            {/* Col 2: Navigation */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Navigation</p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li><Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link></li>
                <li><Link href="/products" className="hover:text-zinc-900 transition-colors">Catalog</Link></li>
                <li><Link href="/categories" className="hover:text-zinc-900 transition-colors">5 Main Categories</Link></li>
                <li><Link href="/about" className="hover:text-zinc-900 transition-colors">About Store</Link></li>
                <li><Link href="/orders" className="hover:text-zinc-900 transition-colors">My Orders</Link></li>
              </ul>
            </div>

            {/* Col 3: Product Categories */}
            <div className="lg:col-span-3 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Product Categories</p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li>
                  <Link href="/products?category=Material%20Jas%20Hujan" className="hover:text-zinc-900 transition-colors">
                    Material Jas Hujan
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=Resleting" className="hover:text-zinc-900 transition-colors">
                    Resleting
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=Kancing" className="hover:text-zinc-900 transition-colors">
                    Kancing
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=Karet" className="hover:text-zinc-900 transition-colors">
                    Karet
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=Aksesori" className="hover:text-zinc-900 transition-colors">
                    Aksesori
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Visit & Contact */}
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

      {/* =====================================================================
          INTERACTIVE CART DRAWER
          ===================================================================== */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
      />

    </div>
  );
}
