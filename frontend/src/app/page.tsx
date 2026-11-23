'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Product, PRODUCTS, FEATURED_PRODUCTS, NEW_PRODUCTS, formatIDR, CartItem } from '../data/products';
import { ProductDetailModal } from '../components/store/ProductDetailModal';
import { CartDrawer } from '../components/store/CartDrawer';
import { useAuth } from '../context/AuthContext';
import { getCategories, getFeaturedProducts, getProducts } from '../lib/catalog-api';
import { addToCart as addToCartApi, getCart } from '../lib/cart-api';
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  User,
  Layers,
  GitCommitHorizontal,
  CircleDot,
  Activity,
  Scissors,
  Check,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
  ArrowRight,
  Truck,
  Banknote,
  RefreshCw,
  Award,
  Eye,
  Plus,
  Minus,
  Store,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================
interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: string;
  icon: React.ReactNode;
  imageUrl: string;
}

type ProductItem = Product;
type CartEntry = CartItem;

export default function HomePage() {
  const { isLoggedIn, isAdmin, user } = useAuth();

  // Navigation & Interactive States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedNotification, setAddedNotification] = useState<string | null>(null);

  // Quick View / Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Initial Cart State
  const [cart, setCart] = useState<CartEntry[]>([
    {
      product: PRODUCTS[0],
      quantity: 5,
    },
    {
      product: PRODUCTS[4],
      quantity: 2,
    },
  ]);

  // 5 PRD Categories
  const initialCategories: CategoryItem[] = [
    {
      id: 'cat-1',
      slug: 'material-jas-hujan',
      name: 'Material Jas Hujan',
      description: 'Kain PVC super tebal, PVC New Fantastik, PVC Idola, dan PVC Elite',
      count: '4 Produk',
      icon: <Layers className="w-6 h-6 text-amber-500" strokeWidth={1.5} />,
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
    },
    {
      id: 'cat-2',
      slug: 'resleting',
      name: 'Resleting',
      description: 'Resleting waterproof zipper, tarikan halus, dan kedap air',
      count: '1 Produk',
      icon: <GitCommitHorizontal className="w-6 h-6 text-amber-500" strokeWidth={1.5} />,
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
    },
    {
      id: 'cat-3',
      slug: 'kancing',
      name: 'Kancing',
      description: 'Kancing snap button jepret hitam dan putih tahan karat',
      count: '1 Produk',
      icon: <CircleDot className="w-6 h-6 text-amber-500" strokeWidth={1.5} />,
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg',
    },
    {
      id: 'cat-4',
      slug: 'karet',
      name: 'Karet',
      description: 'Karet elastis tenun kuat untuk ban pinggang dan manset pergelangan',
      count: '1 Produk',
      icon: <Activity className="w-6 h-6 text-amber-500" strokeWidth={1.5} />,
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikAll.jpeg',
    },
    {
      id: 'cat-5',
      slug: 'aksesori',
      name: 'Aksesori',
      description: 'Seam sealing tape, tali kur hoodie, stopper lobi-lobi, dan skotlet reflektor',
      count: '4 Produk',
      icon: <Scissors className="w-6 h-6 text-amber-500" strokeWidth={1.5} />,
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg',
    },
  ];

  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(FEATURED_PRODUCTS);
  const [newProducts, setNewProducts] = useState<Product[]>(NEW_PRODUCTS);

  useEffect(() => {
    // 1. Fetch live categories from backend
    getCategories()
      .then((backendCats) => {
        if (backendCats && backendCats.length > 0) {
          setCategories((prev) =>
            prev.map((cat) => {
              const found = backendCats.find(
                (b) => b.slug === cat.slug || b.name.toLowerCase() === cat.name.toLowerCase()
              );
              return found ? { ...cat, count: `${found.productCount} Produk` } : cat;
            })
          );
        }
      })
      .catch(() => {});

    // 2. Fetch live featured products from backend
    getFeaturedProducts()
      .then((backendProducts) => {
        if (backendProducts && backendProducts.length > 0) {
          const mapped: Product[] = backendProducts.map((p) => ({
            id: p.code || String(p.id),
            code: p.code,
            name: p.name,
            categoryId: String(p.categoryId),
            category: (p.categoryName as any) || 'Material Jas Hujan',
            categoryName: p.categoryName,
            price: p.price,
            unit: (p.unitSymbol as any) || 'meter',
            allowDecimal: p.allowDecimal,
            stock: p.stockOnHand,
            stockOnHand: p.stockOnHand,
            reservedQuantity: p.reservedQuantity,
            minimumStock: p.minimumStock,
            description: p.description,
            image: p.image || '/placeholder-product.jpg',
            imageUrl: p.image || '/placeholder-product.jpg',
            isActive: p.available,
            isFeatured: p.isFeatured,
            isNew: p.isNew,
            createdAt: p.createdAt,
            salesCount: p.salesCount,
          }));
          const feat = mapped.filter((p) => p.isFeatured);
          const nw = mapped.filter((p) => p.isNew);
          if (feat.length > 0) setFeaturedProducts(feat);
          if (nw.length > 0) setNewProducts(nw);
        }
      })
      .catch(() => {});
  }, []);

  // Price Formatter (IDR)
  const formatRupiah = formatIDR;

  // Cart Computations
  const totalCartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const totalCartPrice = useMemo(
    () => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [cart]
  );

  // Cart Actions
  const handleAddToCart = (product: ProductItem, qty: number = 1) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + qty, product.stock) }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });

    if (isLoggedIn) {
      getProducts({ query: product.code, size: 1 })
        .then((r) => {
          if (r.content.length > 0) {
            addToCartApi({ productId: r.content[0].id, quantity: qty }).catch(() => {});
          }
        })
        .catch(() => {});
    }

    setAddedNotification(`"${product.name}" ditambahkan ke keranjang.`);
    setTimeout(() => {
      setAddedNotification(null);
    }, 2500);
  };

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

  // Filter products by selected category and search
  const filterList = (list: ProductItem[]) => {
    return list.filter((p) => {
      const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  };

  const filteredFeatured = filterList(featuredProducts);
  const filteredNew = filterList(newProducts);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-zinc-50 antialiased">
      
      {/* Toast Notification */}
      {addedNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 text-zinc-50 px-5 py-3 rounded-full shadow-2xl border border-zinc-700/60 transition-all duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium tracking-wide">{addedNotification}</span>
        </div>
      )}

      {/* =====================================================================
          1. NAVBAR (Sticky, Minimalist & Airy with Glassmorphism)
          ===================================================================== */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-zinc-200 transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-3">
              <a href="#" className="flex items-center gap-3 group">
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
              </a>
            </div>

            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center space-x-10">
              <a
                href="#"
                className="text-sm font-medium text-zinc-900 hover:text-amber-600 transition-colors duration-200"
              >
                Home
              </a>
              <a
                href="/products"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
              >
                Catalog
              </a>
              <Link
                href="/categories"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
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
              <div className="relative hidden lg:block">
                <input
                  type="text"
                  placeholder="Search fabric, zipper, snap..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 pl-9 pr-4 py-2 text-xs bg-zinc-100 hover:bg-zinc-200/60 focus:bg-white border border-transparent focus:border-zinc-300 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:w-64 transition-all duration-300"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>

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
                href={isLoggedIn ? (isAdmin ? '/admin/dashboard' : '/profile') : '/auth'}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-900 text-zinc-800 text-xs font-medium transition-all duration-200"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isLoggedIn ? (user?.name ? user.name.split(' ')[0] : 'Account') : 'Account'}</span>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-100 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            </div>
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-900"
            >
              Home
            </a>
            <a
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Catalog
            </a>
            <a
              href="#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              Categories
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              About Toko Enstein
            </a>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-zinc-600 hover:text-zinc-900"
            >
              My Orders
            </Link>
            <Link
              href={isLoggedIn ? (isAdmin ? '/admin/dashboard' : '/profile') : '/auth'}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-zinc-900"
            >
              {isLoggedIn ? `Account (${user?.name?.split(' ')[0] || 'User'})` : 'Login / Register'}
            </Link>
            <div className="pt-4 border-t border-zinc-100">
              <a
                href="https://wa.me/6283876942484"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-zinc-900 text-white font-medium text-xs tracking-wider uppercase"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>WhatsApp: +62 838 7694 2484</span>
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* =====================================================================
          2. HERO SECTION (High-Aesthetic Editorial Photo & Linear Gradient)
          ===================================================================== */}
      <header className="relative w-full h-[85vh] min-h-[600px] flex items-center overflow-hidden bg-zinc-900">
        
        {/* High-res Clean Aesthetic Material Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg"
            alt="Editorial Premium Rainwear Fabrics & Minimalist Textiles"
            className="w-full h-full object-cover object-center scale-100 transform motion-safe:transition-transform motion-safe:duration-1000 motion-safe:hover:scale-105"
          />
          {/* Subtle Linear Gradient Overlay (so the image shines through cleanly) */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-900/60 to-transparent" />
          <div className="absolute inset-0 bg-zinc-950/20" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          <div className="max-w-2xl space-y-6 text-left">
            
            {/* Pill Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-zinc-100 text-xs font-medium tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>Atelier &amp; Material Supplier • Kebumen</span>
            </div>

            {/* Typography */}
            <div className="space-y-3">
              <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.05]">
                ENSTEIN<span className="text-amber-400">STORE</span>
              </h1>
              <p className="text-xl sm:text-2xl text-zinc-200 font-light tracking-wide leading-snug">
                Your Trusted Store for Rainwear Materials and Accessories.
              </p>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed max-w-xl">
              Toko Enstein berlokasi di Jl. Kertanegara Km. 03, Tanahsari, Kebumen. Menyediakan bahan jas hujan (kain/material PVC, taslan, mika) beserta komponen pendukung seperti kancing, resleting, dan karet elastis untuk retail maupun konveksi.
            </p>

            {/* Sleek Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-8 py-3.5 text-xs font-semibold tracking-wider uppercase border border-zinc-700/80 shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                <span>Lihat Katalog Produk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://wa.me/6283876942484?text=Halo%20Toko%20Enstein,%20saya%20ingin%20berkonsultasi%20mengenai%20bahan%20jas%20hujan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full px-6 py-3.5 text-xs font-medium tracking-wide border border-white/20 transition-all duration-300"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>+62 838 7694 2484</span>
              </a>
            </div>

            {/* Minimal Stat Line */}
            <div className="pt-8 flex items-center gap-8 border-t border-white/10 text-zinc-300 text-xs">
              <div>
                <p className="font-semibold text-white text-sm">100% Waterproof</p>
                <p className="text-zinc-400 text-[11px]">Material Teruji Mutu</p>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div>
                <p className="font-semibold text-white text-sm">Eceran &amp; Roll</p>
                <p className="text-zinc-400 text-[11px]">Fleksibel Sesuai Kebutuhan</p>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div>
                <p className="font-semibold text-white text-sm">Pengiriman Nasional</p>
                <p className="text-zinc-400 text-[11px]">Packing Aman Bergaransi</p>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* =====================================================================
          3. USP / WHY CHOOSE US (Minimalist Grid, Thin Icons, Whitespace)
          ===================================================================== */}
      <section className="bg-zinc-50 py-20 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <p className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Our Values</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Mengapa Memilih Toko Enstein?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-normal">
              Dedikasi menghadirkan suplai bahan jas hujan paling andal untuk para produsen dan pengrajin.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            
            {/* USP 1 */}
            <div className="space-y-3 group">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-800 transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-white">
                <ShieldCheck className="w-5 h-5" strokeWidth={1.25} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
                Kualitas Premium
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                Material PVC balon dan aksesoris bersertifikasi tahan air, kedap cuaca, dan tidak mudah getas.
              </p>
            </div>

            {/* USP 2 */}
            <div className="space-y-3 group">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-800 transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-white">
                <Banknote className="w-5 h-5" strokeWidth={1.25} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
                Harga Grosir &amp; Eceran
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                Skema harga transparan mulai dari kebutuhan meteran satuan hingga partai roll untuk konveksi.
              </p>
            </div>

            {/* USP 3 */}
            <div className="space-y-3 group">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-800 transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-white">
                <RefreshCw className="w-5 h-5" strokeWidth={1.25} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
                Stok Akurat &amp; Update
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                Sistem inventaris real-time menjamin ketersediaan fisik barang selalu terverifikasi sebelum kirim.
              </p>
            </div>

            {/* USP 4 */}
            <div className="space-y-3 group">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-800 transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-white">
                <Truck className="w-5 h-5" strokeWidth={1.25} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
                Pengiriman Cepat
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                Diproses setiap hari kerja dengan kemasan waterproof protektif langsung dari Kebumen ke seluruh Indonesia.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
          4. CATEGORY SLIDER/GRID (`bg-zinc-900 text-zinc-50 py-20 px-8 rounded-t-[3rem] -mt-10 relative z-10`)
          ===================================================================== */}
      <section
        id="categories"
        className="bg-zinc-900 text-zinc-50 py-24 px-6 sm:px-8 rounded-t-[3rem] -mt-10 relative z-10 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-4 md:space-y-0">
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Collections</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">
                Jual Berbagai Macam Kebutuhan Jas Hujan
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md font-light">
              Pilih dari 5 kategori bahan baku utama dengan standar kekuatan industri garmen teruji.
            </p>
          </div>

          {/* Sleek Category Cards with Hover Transitions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 lg:gap-6">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id);
                    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`group relative rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-800 ring-2 ring-amber-400 -translate-y-1'
                      : 'bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/40 hover:border-zinc-600'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900/80 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 font-light">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-zinc-700/50 flex items-center justify-between text-xs text-zinc-400">
                    <span className="text-[11px] font-medium text-amber-400/90">{cat.count}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>

          {selectedCategory !== 'all' && (
            <div className="text-center mt-8">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-zinc-800 text-xs text-amber-400 border border-zinc-700 hover:bg-zinc-700 transition-colors"
              >
                <span>Reset Filter (Tampilkan Semua)</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      </section>

      {/* =====================================================================
          5. FEATURED PRODUCTS (Modern E-Commerce Cards with Hover Add to Cart)
          ===================================================================== */}
      <section id="products" className="bg-zinc-50 py-24 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-zinc-200 pb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Featured Selection</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mt-1">
                Produk Unggulan Kami
              </h2>
            </div>
            <a
              href="#new-arrivals"
              className="mt-3 sm:mt-0 text-xs font-semibold text-zinc-900 hover:text-amber-600 transition-colors flex items-center gap-1"
            >
              <span>Explore New Arrivals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Grid: grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {filteredFeatured.map((p) => {
              const isOutOfStock = p.stock <= 0;

              return (
                <div
                  key={p.id}
                  className="group cursor-pointer"
                  onClick={() => setSelectedProduct(p)}
                >
                  
                  {/* Portrait Image Container aspect-[4/5] */}
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/5] bg-zinc-200">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 ${
                        isOutOfStock ? 'grayscale opacity-60' : ''
                      }`}
                    />

                    {/* Stock status badge */}
                    {isOutOfStock ? (
                      <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                        Stok Habis
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-zinc-900 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                        {p.code}
                      </div>
                    )}

                    {/* Quick View trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(p);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-zinc-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                      title="Quick View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Smooth Hover "Add to Cart" Button */}
                    <div className="absolute bottom-4 left-4 right-4 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="w-full bg-zinc-300/90 text-zinc-500 font-medium py-3 rounded-xl text-xs cursor-not-allowed"
                        >
                          Stok Habis
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(p, 1);
                          }}
                          className="w-full bg-white/95 backdrop-blur text-zinc-900 font-semibold py-3 rounded-xl shadow-lg hover:bg-zinc-900 hover:text-white transition-colors duration-200 text-xs flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Clean Minimalist Typography */}
                  <div className="mt-4 space-y-1">
                    <p className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                      {p.category}
                    </p>
                    <h3 className="font-semibold text-sm text-zinc-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="font-semibold text-sm text-zinc-900">
                      {formatRupiah(p.price)}{' '}
                      <span className="text-zinc-400 text-xs font-normal">/ {p.unit}</span>
                    </p>
                  </div>

                </div>
              );
            })}
          </div>

          {filteredFeatured.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl p-8 border border-zinc-200">
              <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-700">Tidak ada produk ditemukan</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-3 px-4 py-1.5 bg-zinc-900 text-white rounded-full text-xs font-medium"
              >
                Reset Filter
              </button>
            </div>
          )}

        </div>
      </section>

      {/* =====================================================================
          6. SPLIT "ABOUT STORE" (`flex flex-col md:flex-row w-full bg-zinc-900`)
          ===================================================================== */}
      <section id="about" className="flex flex-col md:flex-row w-full bg-zinc-900 text-white overflow-hidden">
        
        {/* Left Side: Aesthetic Editorial Image taking full height */}
        <div className="w-full md:w-1/2 relative min-h-[460px] lg:min-h-[640px] bg-zinc-800">
          <img
            src="/images/foto-toko-enstein.jpeg"
            alt="Atelier Toko Enstein Kebumen"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-zinc-900/60" />
          
          {/* Subtle Store Location Pill */}
          <div className="absolute bottom-8 left-8 right-8 sm:right-auto bg-zinc-950/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shrink-0">
                <img
                  src="/ensteinlogo.png"
                  alt="Logo Toko Enstein"
                  width={32}
                  height={32}
                  style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Toko Fisik Kebumen</p>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  Jl. Kertanegara Km. 03, Tanahsari (selatan SD Tanahsari 01)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Spacious Padding (p-16 lg:p-24) & Elegant Typography */}
        <div className="w-full md:w-1/2 p-12 sm:p-16 lg:p-24 flex flex-col justify-center space-y-8">
          
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Online &amp; Offline Experience</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Melayani Penjualan Online &amp; Offline
            </h2>
          </div>

          <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed">
            Toko Enstein berlokasi di <strong>Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01)</strong>. Kami memadukan kemudahan berbelanja material jas hujan dan komponen pendukung (kancing snap, resleting tahan air, karet elastis) secara terpadu. Datang langsung ke toko kami untuk meraba gramasi kain fisik, atau pesan online dari mana saja dengan perhitungan ongkos kirim dan stok yang selalu sinkron.
          </p>

          <div className="space-y-4 pt-2 text-xs sm:text-sm text-zinc-300">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <p>Konsultasi spesifikasi ketebalan PVC balon dan bahan taslan sesuai kebutuhan produksi.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <p>Pemotongan meteran akurat serta pengiriman roll aman tanpa lipatan merusak lapisan anti-air.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <p>Satu basis data persediaan terpusat untuk menjamin ketersediaan barang real-time.</p>
            </div>
          </div>

          {/* Amber Ghost / Outline Button for Elegance */}
          <div className="pt-4">
            <a
              href="https://wa.me/6283876942484?text=Halo%20Toko%20Enstein,%20saya%20ingin%20berkonsultasi%20mengenai%20bahan%20jas%20hujan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 border border-amber-500/80 text-amber-400 hover:bg-amber-500 hover:text-zinc-950 px-8 py-3.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Hubungi Kami via WhatsApp</span>
            </a>
          </div>

        </div>
      </section>

      {/* =====================================================================
          7. NEW ARRIVALS (`bg-zinc-50 py-24 px-8`)
          ===================================================================== */}
      <section id="new-arrivals" className="bg-zinc-50 py-24 px-6 sm:px-8 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-zinc-200 pb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Latest Release</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mt-1">
                Terbaru Tahun 2026
              </h2>
            </div>
            <a
              href="#products"
              className="mt-3 sm:mt-0 text-xs font-semibold text-zinc-900 hover:text-amber-600 transition-colors flex items-center gap-1"
            >
              <span>View All Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Same Modern Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {filteredNew.map((p) => {
              const isOutOfStock = p.stock <= 0;

              return (
                <div
                  key={p.id}
                  className="group cursor-pointer"
                  onClick={() => setSelectedProduct(p)}
                >
                  
                  {/* Portrait aspect-[4/5] */}
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/5] bg-zinc-200">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 ${
                        isOutOfStock ? 'grayscale opacity-60' : ''
                      }`}
                    />

                    {/* NEW Badge Absolute on top left */}
                    {p.isNew && !isOutOfStock && (
                      <div className="absolute top-3 left-3 bg-zinc-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        NEW
                      </div>
                    )}

                    {isOutOfStock && (
                      <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                        Stok Habis
                      </div>
                    )}

                    {/* Quick View trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(p);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-zinc-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                      title="Quick View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Hover Add to Cart Button */}
                    <div className="absolute bottom-4 left-4 right-4 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="w-full bg-zinc-300/90 text-zinc-500 font-medium py-3 rounded-xl text-xs cursor-not-allowed"
                        >
                          Stok Habis
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(p, 1);
                          }}
                          className="w-full bg-white/95 backdrop-blur text-zinc-900 font-semibold py-3 rounded-xl shadow-lg hover:bg-zinc-900 hover:text-white transition-colors duration-200 text-xs flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Minimalist Details */}
                  <div className="mt-4 space-y-1">
                    <p className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                      {p.category}
                    </p>
                    <h3 className="font-semibold text-sm text-zinc-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="font-semibold text-sm text-zinc-900">
                      {formatRupiah(p.price)}{' '}
                      <span className="text-zinc-400 text-xs font-normal">/ {p.unit}</span>
                    </p>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* =====================================================================
          8. MODERN FOOTER (`bg-white py-16 border-t border-zinc-200`)
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

            {/* Col 2: Quick Links */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Navigation</p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Home</a></li>
                <li><a href="#products" className="hover:text-zinc-900 transition-colors">Featured Products</a></li>
                <li><a href="#new-arrivals" className="hover:text-zinc-900 transition-colors">New Arrivals 2026</a></li>
                <li><Link href="/categories" className="hover:text-zinc-900 transition-colors">5 Main Categories</Link></li>
                <li><Link href="/about" className="hover:text-zinc-900 transition-colors">About Store</Link></li>
              </ul>
            </div>

            {/* Col 3: Categories */}
            <div className="lg:col-span-3 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Product Categories</p>
              <ul className="space-y-2.5 text-xs text-zinc-500">
                {categories.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(c.id);
                        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-zinc-900 transition-colors text-left"
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
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

      {/* =====================================================================
          INTERACTIVE CART DRAWER (Unified Professional Component)
          ===================================================================== */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
      />

      {/* =====================================================================
          PRODUCT DETAIL / QUICK VIEW MODAL (Unified Professional Component)
          ===================================================================== */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

    </div>
  );
}
