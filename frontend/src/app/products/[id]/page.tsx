'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProductById, getProducts } from '@/lib/catalog-api';
import { getCart, addToCart } from '@/lib/cart-api';
import { ApiException } from '@/lib/api';
import type { ProductResponse, CartResponse } from '@/types/api';
import { Navbar } from '@/components/store/Navbar';
import { Footer } from '@/components/store/Footer';
import {
  ChevronRight,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  Phone,
  MessageCircle,
  Layers,
  MapPin,
  Clock,
  Package,
} from 'lucide-react';

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);
}

interface ColorVariant {
  name: string;
  image: string;
  colorDot?: string;
}

// Map real local assets from DB_GAMBAR_ENSTEINSTORE based on product category & keywords
function getVariantOptions(product: ProductResponse): ColorVariant[] {
  const code = (product.code || '').toUpperCase();
  const catSlug = (product.categorySlug || '').toLowerCase();
  const name = (product.name || '').toLowerCase();

  // 1. Bahan PVC (Material Jas Hujan / PRD-BHN-*)
  if (catSlug.includes('material') || catSlug.includes('jas-hujan') || code.startsWith('PRD-BHN') || name.includes('pvc')) {
    return [
      {
        name: 'Semua Warna (Seri)',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
        colorDot: 'bg-gradient-to-r from-emerald-600 via-sky-600 to-amber-600',
      },
      {
        name: 'Hijau Army',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHijauArmy.jpeg',
        colorDot: 'bg-[#48533e]',
      },
      {
        name: 'Navy',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCNavy.jpeg',
        colorDot: 'bg-[#1c2c48]',
      },
      {
        name: 'Hitam',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHitam.jpeg',
        colorDot: 'bg-[#1a1a1a]',
      },
      {
        name: 'Blue Sky',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCBluesky.jpg',
        colorDot: 'bg-[#649ecb]',
      },
      {
        name: 'Cream',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCCream.jpeg',
        colorDot: 'bg-[#dfd3c3]',
      },
      {
        name: 'Hijau Olive',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHijauOlive.jpg',
        colorDot: 'bg-[#656d4a]',
      },
      {
        name: 'Sage',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSage.jpg',
        colorDot: 'bg-[#9caf88]',
      },
      {
        name: 'Salem',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSalem.jpeg',
        colorDot: 'bg-[#e3a89a]',
      },
    ];
  }

  // 2. Kancing Snap (PRD-ALT / Kancing)
  if (catSlug.includes('kancing') || name.includes('kancing')) {
    return [
      {
        name: 'Seri Hitam & Putih',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingALL.jpeg',
        colorDot: 'bg-gradient-to-r from-zinc-900 to-zinc-200',
      },
      {
        name: 'Hitam',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingHitam.jpeg',
        colorDot: 'bg-zinc-900',
      },
      {
        name: 'Putih',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingPutih.jpeg',
        colorDot: 'bg-zinc-100 border border-zinc-300',
      },
    ];
  }

  // 3. Resleting (PRD-ALT / Resleting)
  if (catSlug.includes('resleting') || name.includes('resleting')) {
    return [
      {
        name: 'Seri Hitam & Putih',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
        colorDot: 'bg-gradient-to-r from-zinc-900 to-zinc-200',
      },
      {
        name: 'Hitam',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ResletingHitam.jpg',
        colorDot: 'bg-zinc-900',
      },
      {
        name: 'Putih',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ResletingPutih.jpg',
        colorDot: 'bg-zinc-100 border border-zinc-300',
      },
    ];
  }

  // 4. Karet Elastik (PRD-ALT / Karet)
  if (catSlug.includes('karet') || name.includes('karet') || name.includes('elastik')) {
    return [
      {
        name: 'Seri Hitam & Putih',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikALL.jpeg',
        colorDot: 'bg-gradient-to-r from-zinc-900 to-zinc-200',
      },
      {
        name: 'Hitam',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikHitam.jpeg',
        colorDot: 'bg-zinc-900',
      },
      {
        name: 'Putih',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikPutih.jpeg',
        colorDot: 'bg-zinc-100 border border-zinc-300',
      },
    ];
  }

  // 5. Stopper / Lobi-Lobi
  if (name.includes('lobi') || name.includes('stopper')) {
    return [
      {
        name: 'Seri Hitam & Putih',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/LobiLobiALL.jpg',
        colorDot: 'bg-gradient-to-r from-zinc-900 to-zinc-200',
      },
      {
        name: 'Hitam',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/LobiLobiHitam.jpg',
        colorDot: 'bg-zinc-900',
      },
      {
        name: 'Putih',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/LobiLobiPutih.jpg',
        colorDot: 'bg-zinc-100 border border-zinc-300',
      },
    ];
  }

  // 6. Tali Kur / Hoodie
  if (name.includes('tali') || name.includes('kur') || name.includes('hoodie') || name.includes('hoddie')) {
    return [
      {
        name: 'Seri Hitam & Putih',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/TaliHoddieALL.jpeg',
        colorDot: 'bg-gradient-to-r from-zinc-900 to-zinc-200',
      },
      {
        name: 'Hitam',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/TaliHoddieHitam.jpeg',
        colorDot: 'bg-zinc-900',
      },
      {
        name: 'Putih',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/TaliHoddiePutih.jpeg',
        colorDot: 'bg-zinc-100 border border-zinc-300',
      },
    ];
  }

  // 7. Skotlet Reflektor
  if (name.includes('skotlet') || name.includes('reflektor')) {
    return [
      {
        name: 'Plastik Seri',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg',
        colorDot: 'bg-gradient-to-r from-yellow-400 to-zinc-200',
      },
      {
        name: 'Plastik Kuning',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikKuning.jpg',
        colorDot: 'bg-yellow-400',
      },
      {
        name: 'Plastik Putih',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikPutih.jpg',
        colorDot: 'bg-zinc-100 border border-zinc-300',
      },
      {
        name: 'Skotlet Kain',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletKain.jpg',
        colorDot: 'bg-zinc-400',
      },
    ];
  }

  // 8. Seam Sealing Tape / Silen
  if (name.includes('seam') || name.includes('sealing') || name.includes('silen') || name.includes('tape')) {
    return [
      {
        name: 'Standar Roll',
        image: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SilenMantel.webp',
        colorDot: 'bg-zinc-300',
      },
    ];
  }

  // Fallback default
  return [
    {
      name: 'Standar Toko',
      image: product.image || '/placeholder-product.jpg',
      colorDot: 'bg-zinc-800',
    },
  ];
}

export default function ProductDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const id = (routeParams?.id as string) || '';
  const { isLoggedIn } = useAuth();

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  // Gallery & Variant state
  const [selectedVariant, setSelectedVariant] = useState<ColorVariant | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');

  // Info Tab state
  const [activeTab, setActiveTab] = useState<'deskripsi' | 'spesifikasi' | 'pengiriman'>('deskripsi');

  // Load product details
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getProductById(id)
      .then((data) => {
        setProduct(data);
        const variants = getVariantOptions(data);
        
        // Check localStorage for previously selected variant preference
        let initialVar = variants[0];
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('ensteinstore_cart_variants');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed[data.id]) {
                const found = variants.find((v) => v.name === parsed[data.id]);
                if (found) initialVar = found;
              }
            }
          } catch {}
        }

        setSelectedVariant(initialVar);
        // Start with backend primary image, or matched variant image
        setActiveImage(data.image || initialVar.image);
        setQuantity(data.allowDecimal ? 1 : 1);

        // Fetch related products from the same category
        if (data.categoryId) {
          getProducts({ categoryId: data.categoryId, size: 5 })
            .then((res) => {
              const filtered = res.content.filter((p) => p.id !== data.id && p.code !== data.code).slice(0, 4);
              setRelatedProducts(filtered);
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        setError(err instanceof ApiException ? err.message : 'Produk tidak ditemukan atau gagal dimuat.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Load cart count on login
  useEffect(() => {
    if (isLoggedIn) {
      getCart().then(setCart).catch(() => {});
    }
  }, [isLoggedIn]);

  // Save selected color variant to localStorage
  const saveVariantPreference = useCallback((productId: string, variantName: string) => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('ensteinstore_cart_variants');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[productId] = variantName;
      localStorage.setItem('ensteinstore_cart_variants', JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to save variant in localStorage:', e);
    }
  }, []);

  const variantOptions = useMemo(() => {
    return product ? getVariantOptions(product) : [];
  }, [product]);

  // Handle color swatch click
  const handleSelectVariant = (variant: ColorVariant) => {
    setSelectedVariant(variant);
    setActiveImage(variant.image);
    if (product) {
      saveVariantPreference(product.id, variant.name);
    }
  };

  // Available stock calculation
  const availableStock = useMemo(() => {
    if (!product) return 0;
    const total = product.stockOnHand ?? product.stock ?? 0;
    const reserved = product.reservedQuantity ?? 0;
    return Math.max(0, total - reserved);
  }, [product]);

  const step = product?.allowDecimal ? 0.5 : 1;
  const minQty = product?.allowDecimal ? 0.5 : 1;
  const isOutOfStock = !product?.available || availableStock <= 0;
  const isLowStock = !isOutOfStock && availableStock <= (product?.minimumStock || 10);

  // Quick preset chips
  const presetChips = useMemo(() => {
    if (product?.allowDecimal) {
      return [1, 2.5, 5, 10, 25];
    }
    return [1, 10, 50, 100];
  }, [product?.allowDecimal]);

  // Add to cart handler
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }
    if (!product || isOutOfStock) return;

    setAdding(true);
    try {
      const updated = await addToCart({ productId: product.id, quantity });
      setCart(updated);
      if (selectedVariant) {
        saveVariantPreference(product.id, selectedVariant.name);
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 5000);
    } catch (err) {
      if (err instanceof ApiException) alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  // Buy now handler
  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }
    if (!product || isOutOfStock) return;

    setBuyingNow(true);
    try {
      await addToCart({ productId: product.id, quantity });
      if (selectedVariant) {
        saveVariantPreference(product.id, selectedVariant.name);
      }
      router.push('/cart');
    } catch (err) {
      if (err instanceof ApiException) alert(err.message);
    } finally {
      setBuyingNow(false);
    }
  };

  const cartCount = cart?.totalItems ?? 0;

  // WhatsApp inquiry URL generator
  const waInquiryUrl = useMemo(() => {
    if (!product) return 'https://wa.me/6283876942484';
    const text = `Halo Toko Enstein, saya ingin menanyakan ketersediaan stok partai/roll untuk:\n\n• Produk: ${product.name}\n• Kode SKU: ${product.code}\n• Pilihan Varian: ${selectedVariant?.name || 'Standar'}\n• Rencana Kuantitas: ${quantity} ${product.unitSymbol}\n\nApakah stok siap kirim atau bisa diambil di toko? Terima kasih!`;
    return `https://wa.me/6283876942484?text=${encodeURIComponent(text)}`;
  }, [product, selectedVariant, quantity]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={cartCount} />
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-6 w-64 bg-zinc-200/70 rounded-full animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-6 space-y-4">
              <div className="aspect-square bg-zinc-200/70 rounded-3xl animate-pulse" />
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-16 h-16 bg-zinc-200/70 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-6 space-y-6">
              <div className="h-4 w-32 bg-zinc-200/70 rounded animate-pulse" />
              <div className="h-8 w-3/4 bg-zinc-200/70 rounded animate-pulse" />
              <div className="h-10 w-48 bg-zinc-200/70 rounded animate-pulse" />
              <div className="h-24 bg-zinc-200/70 rounded-2xl animate-pulse" />
              <div className="h-14 bg-zinc-200/70 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 404 / Error State
  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={cartCount} />
        <div className="flex-1 max-w-md mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-500 mb-4 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Produk Tidak Ditemukan</h1>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            {error || 'Maaf, produk dengan kode atau ID tersebut tidak tersedia di katalog kami.'}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Katalog Produk
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      {/* 1. Standardized Global Navbar */}
      <Navbar cartItemCount={cartCount} />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 2. Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500 mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <Link href="/products" className="hover:text-zinc-900 transition-colors">
            Katalog Produk
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <Link
            href={`/products?category=${encodeURIComponent(product.categorySlug || '')}`}
            className="hover:text-zinc-900 transition-colors font-medium"
          >
            {product.categoryName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-zinc-900 font-semibold truncate max-w-[220px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* 3. 2-Column Main Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
          
          {/* Left Column: Interactive Image Gallery */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Featured Photo Card */}
            <div className="aspect-square rounded-3xl bg-white border border-zinc-200/80 overflow-hidden relative group shadow-sm flex items-center justify-center">
              <img
                src={activeImage || product.image || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                }}
              />

              {/* Status Stock Badge */}
              <div className="absolute top-4 right-4 z-10">
                {isOutOfStock ? (
                  <span className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    Stok Habis
                  </span>
                ) : isLowStock ? (
                  <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    Stok Menipis ({availableStock} {product.unitSymbol})
                  </span>
                ) : (
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Stok Tersedia
                  </span>
                )}
              </div>

              {/* Active Color Label Badge */}
              {selectedVariant && (
                <div className="absolute bottom-4 left-4 z-10 bg-zinc-900/85 backdrop-blur-md text-white text-xs font-medium px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-2 border border-white/10">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      selectedVariant.colorDot || 'bg-amber-400'
                    }`}
                  />
                  <span>Varian: {selectedVariant.name}</span>
                </div>
              )}
            </div>

            {/* Scrollable Gallery Thumbnails */}
            {variantOptions.length > 1 && (
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Pilihan Foto Warna &amp; Rol:
                </p>
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                  {variantOptions.map((variant) => {
                    const isSelected = selectedVariant?.name === variant.name;
                    return (
                      <button
                        key={variant.name}
                        type="button"
                        onClick={() => handleSelectVariant(variant)}
                        className={`relative w-16 h-16 rounded-2xl overflow-hidden bg-white shrink-0 border-2 transition-all ${
                          isSelected
                            ? 'border-zinc-900 shadow-md scale-105'
                            : 'border-zinc-200 hover:border-zinc-400 opacity-80 hover:opacity-100'
                        }`}
                        title={variant.name}
                      >
                        <img
                          src={variant.image}
                          alt={variant.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                          }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-zinc-900/20 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Rich Product Info & Purchase Box */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            
            {/* Product Meta & Title */}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.categoryName}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  SKU: {product.code}
                </span>
                <span className="text-xs text-zinc-300">•</span>
                <span className={`text-xs font-semibold ${isOutOfStock ? 'text-rose-600' : 'text-emerald-700'}`}>
                  Stok: {availableStock} {product.unitSymbol}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Price Display */}
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
                  {formatIDR(product.price)}
                </span>
                <span className="text-sm font-semibold text-zinc-400">
                  / {product.unitSymbol}
                </span>
              </div>
            </div>

            {/* Interactive Color Variant Selector */}
            {variantOptions.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-500">
                    Pilih Varian Warna:{' '}
                    <span className="font-bold text-zinc-900">
                      {selectedVariant?.name || 'Pilih salah satu'}
                    </span>
                  </p>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {variantOptions.length} Opsi Tersedia
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {variantOptions.map((variant) => {
                    const isSelected = selectedVariant?.name === variant.name;
                    return (
                      <button
                        key={variant.name}
                        type="button"
                        onClick={() => handleSelectVariant(variant)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all ${
                          isSelected
                            ? 'bg-zinc-900 text-white font-semibold shadow-sm ring-2 ring-zinc-900 ring-offset-1'
                            : 'bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-400'
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full shrink-0 ${
                            variant.colorDot || 'bg-amber-400'
                          }`}
                        />
                        <span>{variant.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Quick-Select Presets */}
            <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  Kuantitas Pembelian
                </p>
                <span className="text-xs text-zinc-500">
                  {product.allowDecimal ? 'Mendukung eceran per 0.5 meter' : 'Kuantitas bulat'}
                </span>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-400 mr-1">Preset Cepat:</span>
                {presetChips.map((preset) => {
                  const isCurrent = quantity === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => setQuantity(Math.min(preset, availableStock))}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        isCurrent
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {preset} {product.allowDecimal ? 'm' : product.unitSymbol}
                    </button>
                  );
                })}
              </div>

              {/* Stepper paired with Live Subtotal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 border-t border-zinc-100">
                <div className="flex items-center border border-zinc-200 rounded-full bg-zinc-50 overflow-hidden w-fit">
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity <= minQty}
                    onClick={() =>
                      setQuantity((q) => Math.max(minQty, parseFloat((q - step).toFixed(1))))
                    }
                    className="p-2.5 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    aria-label="Kurangi kuantitas"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    step={step}
                    min={minQty}
                    max={availableStock}
                    value={quantity}
                    disabled={isOutOfStock}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setQuantity(Math.min(availableStock, Math.max(minQty, val)));
                      }
                    }}
                    className="w-16 text-center text-sm font-bold text-zinc-900 bg-transparent focus:outline-none"
                  />

                  <button
                    type="button"
                    disabled={isOutOfStock || quantity >= availableStock}
                    onClick={() =>
                      setQuantity((q) => Math.min(availableStock, parseFloat((q + step).toFixed(1))))
                    }
                    className="p-2.5 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    aria-label="Tambah kuantitas"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-zinc-400">Total Harga Estimasi</p>
                  <p className="text-xl font-bold text-amber-600">
                    = {formatIDR(product.price * quantity)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Success Notification Banner */}
              {added && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2.5 text-emerald-800 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      Berhasil ditambahkan ke keranjang! ({quantity} {product.unitSymbol} - {selectedVariant?.name})
                    </span>
                  </div>
                  <Link
                    href="/cart"
                    className="text-emerald-900 font-bold hover:underline shrink-0 text-xs uppercase tracking-wide flex items-center gap-1"
                  >
                    Lihat Keranjang →
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Primary CTA: Tambah ke Keranjang */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || adding}
                  className={`w-full py-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : isOutOfStock
                      ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  {adding ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : added ? (
                    <>
                      <Check className="w-4 h-4" />
                      Ditambahkan ke Keranjang
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      {isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}
                    </>
                  )}
                </button>

                {/* Secondary CTA: Beli Sekarang */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || buyingNow}
                  className="w-full py-4 rounded-full text-sm font-semibold border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {buyingNow ? (
                    <span className="w-5 h-5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                  ) : (
                    'Beli Sekarang'
                  )}
                </button>
              </div>

              {/* WhatsApp Inquiry Button */}
              <a
                href={waInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Tanya Stok Partai / Rol Besar via WhatsApp (+62 838 7694 2484)</span>
              </a>
            </div>

            {/* Store Trust Highlights (Compact 3-item strip) */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200/80 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-zinc-200/60">
                <ShieldCheck className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-zinc-900">100% Material Teruji</p>
                <p className="text-[10px] text-zinc-400">Standar Konveksi Jas Hujan</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-zinc-200/60">
                <Package className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-zinc-900">Bisa Eceran &amp; Rol</p>
                <p className="text-[10px] text-zinc-400">Mulai dari 0.5 meter</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-zinc-200/60">
                <Truck className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-zinc-900">Ambil di Toko / Kirim</p>
                <p className="text-[10px] text-zinc-400">Gratis Pickup di Kebumen</p>
              </div>
            </div>

          </div>
        </div>

        {/* 4. Detailed Information Tabs */}
        <div className="mt-16 bg-white rounded-3xl border border-zinc-200/80 p-6 md:p-8 shadow-sm">
          {/* Tab Switcher */}
          <div className="flex border-b border-zinc-200 space-x-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('deskripsi')}
              className={`pb-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                activeTab === 'deskripsi'
                  ? 'text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              Deskripsi &amp; Kegunaan
              {activeTab === 'deskripsi' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spesifikasi')}
              className={`pb-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                activeTab === 'spesifikasi'
                  ? 'text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              Spesifikasi Material
              {activeTab === 'spesifikasi' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pengiriman')}
              className={`pb-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                activeTab === 'pengiriman'
                  ? 'text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              Info Pengiriman &amp; Pengambilan
              {activeTab === 'pengiriman' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 rounded-full" />
              )}
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="pt-6">
            {/* Tab 1: Deskripsi & Kegunaan */}
            {activeTab === 'deskripsi' && (
              <div className="space-y-5 text-sm text-zinc-600 leading-relaxed max-w-4xl">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 mb-2">
                    Tentang Produk Ini
                  </h3>
                  <p>{product.description || 'Material berkualitas premium standar pabrik konveksi jas hujan Toko Enstein.'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-zinc-900 mb-2">
                    Aplikasi &amp; Rekomendasi Penggunaan Konveksi:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                    <li>Jas hujan setelan jaket &amp; celana kerja lapangan atau tambang.</li>
                    <li>Mantel ponco kelelawar multifungsi untuk pengendara motor.</li>
                    <li>Tas cover bag ransel anti air dan pelindung peralatan luar ruang.</li>
                    <li>Komponen penunjang konveksi garmen waterproof dengan daya rekat seal tinggi.</li>
                  </ul>
                </div>

                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-amber-900 text-xs">
                  <p className="font-semibold mb-1">💡 Tips Pemotongan &amp; Penyimpanan dari Toko Enstein:</p>
                  <p>
                    Simpan gulungan bahan di tempat teduh dan sejuk. Gunakan gunting tajam atau rotary cutter untuk hasil potongan lurus dan presisi.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Spesifikasi Material */}
            {activeTab === 'spesifikasi' && (
              <div className="max-w-3xl">
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    <tr className="border-b border-zinc-100">
                      <td className="py-3 px-4 font-semibold text-zinc-500 w-1/3">Kode SKU</td>
                      <td className="py-3 px-4 text-zinc-900 font-mono">{product.code}</td>
                    </tr>
                    <tr className="border-b border-zinc-100">
                      <td className="py-3 px-4 font-semibold text-zinc-500">Kategori Produk</td>
                      <td className="py-3 px-4 text-zinc-900">{product.categoryName}</td>
                    </tr>
                    <tr className="border-b border-zinc-100">
                      <td className="py-3 px-4 font-semibold text-zinc-500">Satuan Penjualan</td>
                      <td className="py-3 px-4 text-zinc-900">{product.unit} ({product.unitSymbol})</td>
                    </tr>
                    <tr className="border-b border-zinc-100">
                      <td className="py-3 px-4 font-semibold text-zinc-500">Aturan Desimal</td>
                      <td className="py-3 px-4 text-zinc-900">
                        {product.allowDecimal ? 'Mendukung eceran pecahan (kelipatan 0.5 meter)' : 'Kuantitas bulat (Pcs / Roll)'}
                      </td>
                    </tr>
                    <tr className="border-b border-zinc-100">
                      <td className="py-3 px-4 font-semibold text-zinc-500">Ketahanan Air</td>
                      <td className="py-3 px-4 text-emerald-700 font-medium">100% Kedap Air (Waterproof)</td>
                    </tr>
                    <tr className="border-b border-zinc-100">
                      <td className="py-3 px-4 font-semibold text-zinc-500">Minimal Order</td>
                      <td className="py-3 px-4 text-zinc-900">
                        {product.allowDecimal ? '0.5 meter' : `1 ${product.unitSymbol}`}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-zinc-500">Lokasi Pengiriman</td>
                      <td className="py-3 px-4 text-zinc-900">Gudang Toko Enstein, Tanahsari, Kebumen</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Info Pengiriman & Pengambilan */}
            {activeTab === 'pengiriman' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-zinc-600">
                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 space-y-2">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span>Ambil Langsung di Toko (Gratis / Free)</span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Pelanggan dapat mengambil pesanan secara langsung di toko fisik kami tanpa biaya ongkos kirim.
                  </p>
                  <p className="text-xs font-medium text-zinc-700 pt-1">
                    📍 Alamat: Jl. Kertanegara Km. 03, Tanahsari, Kebumen (selatan SD Tanahsari 01).
                  </p>
                  <p className="text-xs text-zinc-500">
                    🕒 Jam Buka: Senin – Sabtu, 08.00 – 17.00 WIB.
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 space-y-2">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold">
                    <Truck className="w-4 h-4 text-amber-500" />
                    <span>Pengiriman Ekspedisi / Kurir</span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Kami melayani pengiriman rol bahan dan aksesoris ke seluruh wilayah Indonesia. Pengemasan kain PVC dilakukan dalam bentuk gulungan rapi agar bahan tidak berkerut atau rusak saat perjalanan.
                  </p>
                  <p className="text-xs text-zinc-700 pt-1">
                    📦 Ongkir flat hemat atau penyesuaian kargo untuk partai besar.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  Produk Serupa dalam Kategori Ini
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pilihan bahan dan komponen pendukung terkait di Toko Enstein
                </p>
              </div>
              <Link
                href={`/products?category=${encodeURIComponent(product.categorySlug || '')}`}
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 flex items-center gap-1 transition-colors"
              >
                Lihat Semua ({product.categoryName}) →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  className="group bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <Link
                      href={`/products/${rel.code}`}
                      className="block aspect-square overflow-hidden bg-zinc-50 relative"
                    >
                      <img
                        src={rel.image || '/placeholder-product.jpg'}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                        }}
                      />
                      {rel.isNew && (
                        <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          BARU
                        </span>
                      )}
                      {!rel.available && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <span className="text-xs font-bold text-zinc-500 bg-white px-2 py-1 rounded-full border border-zinc-200">
                            Stok Habis
                          </span>
                        </div>
                      )}
                    </Link>
                    <div className="p-3 pb-1">
                      <p className="text-[10px] text-zinc-400 mb-0.5">{rel.categoryName}</p>
                      <Link
                        href={`/products/${rel.code}`}
                        className="text-sm font-semibold text-zinc-900 leading-tight line-clamp-2 hover:text-amber-600 transition-colors"
                      >
                        {rel.name}
                      </Link>
                      <p className="text-sm font-bold text-amber-600 mt-2">
                        {formatIDR(rel.price)}
                        <span className="text-xs text-zinc-400 font-normal">/{rel.unitSymbol}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3 pt-2">
                    <Link
                      href={`/products/${rel.code}`}
                      className="block w-full text-center py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-800 transition-colors"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Standardized Global Footer */}
      <Footer />
    </div>
  );
}
