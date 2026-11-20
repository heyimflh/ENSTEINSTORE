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
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Check,
  MessageSquare,
  Store,
} from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();

  // Navigation & Interactive States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cart State (Synchronized with store items)
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

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
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                Categories
              </Link>
              <Link
                href="/about"
                className="text-sm font-semibold text-zinc-900 hover:text-amber-600 transition-colors duration-200"
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
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
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
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Categories
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-zinc-900"
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
            2. HERO SECTION
            Exact styling: `relative w-full min-h-[85vh] flex items-center`
            ===================================================================== */}
        <section className="relative w-full min-h-[85vh] flex items-center overflow-hidden bg-zinc-950">
          
          {/* Background High-res Material Image */}
          <img
            src="/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg"
            alt="Atelier & Fabric Rolls Toko Enstein"
            className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 animate-in fade-in duration-1000"
          />

          {/* Gradient Overlay for Editorial Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30" />

          {/* Content Container (Left Aligned, Max-W-2xl) */}
          <div className="relative z-10 px-4 md:px-12 xl:px-24 py-28 max-w-2xl text-white">
            
            {/* Eyebrow Badge */}
            <div className="border border-zinc-500 text-zinc-300 text-xs tracking-widest uppercase px-3.5 py-1.5 rounded-full w-fit mb-6 flex items-center gap-2 backdrop-blur-md bg-zinc-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>ATELIER &amp; MATERIAL SUPPLIER • KEBUMEN</span>
            </div>

            {/* Main Title: "ENSTEIN" + "STORE" (Amber) */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 tracking-tight">
              ENSTEIN<span className="text-amber-500 font-black">STORE</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-zinc-300 mb-6 font-light leading-snug">
              Your Trusted Store for Rainwear Materials and Accessories.
            </p>

            {/* Description Paragraph */}
            <p className="text-sm md:text-base text-zinc-300 font-normal leading-relaxed mb-8 max-w-xl">
              Berpusat di Kebumen, Jawa Tengah, Toko Enstein memadukan pasokan bahan jas hujan unggulan (kain PVC balon, taslan waterproof, mika transparan) serta komponen pendukung lengkap untuk skala retail maupun konveksi pabrikan di seluruh penjuru Indonesia.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 border border-white/40 hover:border-white bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-6 py-3 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
              >
                <span>Lihat Katalog Produk</span>
                <ArrowRight size={15} />
              </Link>

              <a
                href="https://wa.me/6283876942484"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-full flex items-center gap-2 text-xs font-semibold tracking-wide border border-zinc-700 transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
              >
                <MessageSquare size={15} className="text-emerald-400" />
                <span>Hubungi via WhatsApp</span>
              </a>
            </div>

          </div>

          {/* Bottom Trust Badges (Absolute bottom of hero) */}
          <div className="absolute bottom-0 left-0 z-10 w-full border-t border-zinc-800 bg-zinc-900/60 backdrop-blur-md py-6 px-4 md:px-12 xl:px-24 flex flex-wrap items-center justify-between gap-6 text-zinc-300">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" strokeWidth={1.75} />
              <span className="text-xs sm:text-sm font-medium tracking-wide">100% Waterproof Standard</span>
            </div>

            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-amber-400 shrink-0" strokeWidth={1.75} />
              <span className="text-xs sm:text-sm font-medium tracking-wide">Eceran &amp; Roll Partai Besar</span>
            </div>

            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-amber-400 shrink-0" strokeWidth={1.75} />
              <span className="text-xs sm:text-sm font-medium tracking-wide">Pengiriman Cepat Nasional</span>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Store className="w-5 h-5 text-amber-400 shrink-0" strokeWidth={1.75} />
              <span className="text-xs sm:text-sm font-medium tracking-wide">Outlet Fisik Tanahsari, Kebumen</span>
            </div>
          </div>

        </section>

        {/* =====================================================================
            3. OUR STORY SECTION
            Exact styling: `bg-zinc-50 py-24 px-4 md:px-12 xl:px-40 text-center`
            ===================================================================== */}
        <section className="bg-zinc-50 py-24 px-4 md:px-12 xl:px-40 text-center">
          
          <span className="text-xs font-semibold tracking-widest uppercase text-amber-600 bg-amber-50 border border-amber-200/60 px-3.5 py-1.5 rounded-full inline-block mb-4">
            FILOSOFI &amp; KOMITMEN
          </span>

          <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-8 tracking-tight">
            Dedikasi untuk Kualitas Konveksi
          </h2>

          <div className="text-base md:text-lg text-zinc-600 leading-relaxed max-w-4xl mx-auto space-y-6 font-normal">
            <p>
              Toko Enstein lahir dari komitmen mendalam untuk menghadirkan suplai bahan jas hujan paling tangguh, teruji, dan konsisten bagi para pelaku industri konveksi, garmen, maupun pengrajin mandiri di seluruh Indonesia. Berawal dari workshop material di Kabupaten Kebumen, kami secara konsisten menjawab kendala industri seperti kebocoran jahitan, kain yang getas di cuaca dingin, hingga ketidaksesuaian resleting anti air.
            </p>
            <p>
              Setiap gulungan kain PVC balon, lembaran taslan milky coating mikro, kancing snap T5, hingga karet elastis tenun yang kami sediakan melalui seleksi spesifikasi teknis yang ketat. Kami memastikan bahwa perlengkapan hujan buatan konveksi mitra kami tidak hanya melindungi pemakainya dari badai terderas, namun juga memiliki daya tahan bertahun-tahun.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-6 border-t border-zinc-200">
            <div className="p-4">
              <p className="text-3xl md:text-4xl font-extrabold text-zinc-900 font-mono">100%</p>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Uji Hydrophobic</p>
            </div>
            <div className="p-4">
              <p className="text-3xl md:text-4xl font-extrabold text-zinc-900 font-mono">5</p>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Kategori PRD Lengkap</p>
            </div>
            <div className="p-4">
              <p className="text-3xl md:text-4xl font-extrabold text-zinc-900 font-mono">24/7</p>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Katalog Online Terpadu</p>
            </div>
            <div className="p-4">
              <p className="text-3xl md:text-4xl font-extrabold text-zinc-900 font-mono">1</p>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Pusat Outlet Kebumen</p>
            </div>
          </div>

        </section>

        {/* =====================================================================
            4. OMNICHANNEL / PHYSICAL STORE SPLIT SECTION
            Exact styling: `bg-white` & `flex flex-col md:flex-row w-full`
            ===================================================================== */}
        <section className="bg-white flex flex-col md:flex-row w-full border-t border-b border-zinc-200 overflow-hidden">
          
          {/* Left Half: High-res Aesthetic Warehouse / Storefront Image */}
          <div className="w-full md:w-1/2 h-[420px] md:h-auto min-h-[460px] relative overflow-hidden group">
            <img
              src="/images/foto-toko-enstein.jpeg"
              alt="Outlet Fisik Toko Enstein Kebumen"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/30" />
            
            {/* Floating Tag */}
            <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/60">
              <p className="text-xs font-bold text-zinc-900">Outlet Fisik Kebumen</p>
              <p className="text-[11px] text-zinc-500">Jl. Kertanegara Km. 03 Tanahsari</p>
            </div>
          </div>

          {/* Right Half: Clean Content Card */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 md:p-16 lg:p-24 flex flex-col justify-center bg-zinc-100">
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">
              FLEKSIBILITAS PEMESANAN
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-6 tracking-tight">
              Melayani Online &amp; Offline
            </h2>

            <p className="text-sm md:text-base text-zinc-600 leading-relaxed mb-8">
              Kami memadukan kemudahan pemesanan digital di platform ini dengan kehadiran outlet fisik langsung di Kebumen. Pelanggan dapat memesan dari mana saja dengan perhitungan stok dan ongkos kirim transparan, atau datang langsung untuk meraba fisik bahan kain dan memilih opsi ambil sendiri tanpa biaya pengiriman.
            </p>

            {/* Feature Checklist */}
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Sistem keranjang &amp; checkout otomatis</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Kalkulasi item per meter dan rol secara instan.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Ambil di toko tanpa antre</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Pesanan disiapkan oleh staf counter sebelum Anda tiba.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Konsultasi material langsung dengan ahli</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Bantuan penentuan gramasi kain PVC dan tipe seal resleting.</p>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="mt-10">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-all duration-200 shadow-md"
              >
                <span>Jelajahi Produk Sekarang</span>
                <ArrowRight size={14} />
              </Link>
            </div>

          </div>

        </section>

        {/* =====================================================================
            5. UPGRADED "KUNJUNGI TOKO KAMI" SECTION (The Island Card)
            Eliminates harsh full-bleed clash by wrapping inside a massive rounded
            island card on the light bg-zinc-50 canvas.
            Uses real store photo "/images/foto-toko-enstein.jpeg" as background
            and live Google Maps embed.
            ===================================================================== */}
        <section className="relative mx-4 md:mx-12 xl:mx-24 my-24 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]">
          
          {/* Background Image: Real Local Store Photo */}
          <img
            src="/images/foto-toko-enstein.jpeg"
            alt="Foto Fisik Toko Enstein Kebumen"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Gradient Overlay & Subtle Blur for crisp text readability */}
          <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-[2px]" />

          {/* Content Container */}
          <div className="relative z-10 w-full flex flex-col md:flex-row">
            
            {/* LEFT COLUMN (Text Content) */}
            <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center text-white">
              <span className="text-amber-500 text-sm tracking-widest uppercase font-semibold mb-4">
                LOKASI OUTLET FISIK
              </span>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Kunjungi Toko Kami
              </h2>

              <p className="text-zinc-300 mb-8 leading-relaxed text-sm md:text-base">
                Kunjungi outlet kami untuk melihat langsung sampel bahan, mendiskusikan kebutuhan konveksi skala besar, atau mengambil pesanan yang sudah Anda checkout secara online.
              </p>

              {/* Address Grid: Icons + text for Alamat, Jam Operasional, and WhatsApp */}
              <div className="space-y-5 text-sm text-zinc-200">
                <div className="flex items-start gap-3.5">
                  <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Alamat Outlet:</p>
                    <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                      Jl. Kertanegara Km. 03, Tanahsari, Kec. Kebumen, Kabupaten Kebumen (selatan SD Tanahsari 01), Jawa Tengah 54317
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Jam Operasional:</p>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Senin - Sabtu: 08.00 - 17.00 WIB (Minggu &amp; Libur Nasional Tutup)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Customer Service / WhatsApp:</p>
                    <a
                      href="https://wa.me/6283876942484"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-400 hover:text-amber-300 font-mono underline inline-block mt-0.5"
                    >
                      +62 838 7694 2484 (Respon Cepat)
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (The Map Embed) */}
            <div className="w-full md:w-1/2 p-6 md:p-10 lg:p-12 flex items-center">
              <div className="w-full h-full min-h-[320px] md:min-h-[400px] rounded-3xl overflow-hidden shadow-inner border border-zinc-700/50 relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3954.0954846716913!2d109.7055486!3d-7.672883499999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7ac992acddf7b5%3A0x8938e7ea1cacb21c!2sTOKO%20ENSTEIN!5e0!3m2!1sen!2sid!4v1794824378320!5m2!1sen!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* =====================================================================
          6. STANDARDIZED FOOTER (Exact Consistency with Homepage & Image 3)
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
