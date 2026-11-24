'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCart, updateCartItem, removeCartItem, clearCart, addToCart } from '@/lib/cart-api';
import { getProducts, getFeaturedProducts } from '@/lib/catalog-api';
import { ApiException } from '@/lib/api';
import type { CartResponse, CartItemResponse, ProductResponse } from '@/types/api';
import { Navbar } from '@/components/store/Navbar';
import { Footer } from '@/components/store/Footer';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Truck,
  Store,
  Check,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  X,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Info,
} from 'lucide-react';

function formatIDR(n: number | null | undefined): string {
  const num = typeof n === 'number' && !isNaN(n) ? n : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

// Read saved color variant preference from localStorage (keyed by productId)
function getSavedVariant(productId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ensteinstore_cart_variants');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed[productId] || null;
  } catch {
    return null;
  }
}

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-item loading states (avoids full-page loading flash)
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<ProductResponse[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [addingRecId, setAddingRecId] = useState<string | null>(null);
  const [addedRecSuccess, setAddedRecSuccess] = useState<string | null>(null);

  // Variants map state for active items
  const [variantsMap, setVariantsMap] = useState<Record<string, string>>({});

  // 1. Fetch Cart Data
  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await getCart();
      setCart(res);
      setError(null);

      // Hydrate variant preferences from localStorage for items
      if (res?.items && typeof window !== 'undefined') {
        const vMap: Record<string, string> = {};
        res.items.forEach((item) => {
          const v = getSavedVariant(item.productId);
          if (v) vMap[item.productId] = v;
        });
        setVariantsMap(vMap);
      }
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('Gagal memuat keranjang belanja. Silakan periksa koneksi Anda.');
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 2. Fetch Live Recommendations
  const fetchRecommendations = useCallback(async () => {
    setLoadingRecs(true);
    try {
      const paged = await getProducts({ size: 12, sort: 'terpopuler' });
      if (paged?.content?.length) {
        setRecommendations(paged.content);
      } else {
        const featured = await getFeaturedProducts();
        setRecommendations(featured || []);
      }
    } catch {
      // Fallback silent failure for recommendations
    } finally {
      setLoadingRecs(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // 3. Update Item Quantity (with smooth inline feedback)
  const handleUpdateQty = async (item: CartItemResponse, newQty: number) => {
    const step = item.allowDecimal ? 0.5 : 1;
    const minQty = item.allowDecimal ? 0.5 : 1;
    const availableStock = Number(item.availableStock ?? item.stockAvailable ?? 0);

    // If new quantity is below minimum, confirm removal
    if (newQty < minQty) {
      handleRemoveItem(item.id);
      return;
    }

    // Clamp to available stock if exceeds
    const safeQty = availableStock > 0 ? Math.min(newQty, availableStock) : newQty;
    const finalQty = Number(safeQty.toFixed(2));

    setUpdatingId(item.id);
    try {
      const updated = await updateCartItem(item.id, { quantity: finalQty });
      setCart(updated);
    } catch (err) {
      if (err instanceof ApiException) {
        alert(err.message);
      } else {
        alert('Gagal memperbarui kuantitas produk.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // 4. Remove Item from Cart
  const handleRemoveItem = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      const updated = await removeCartItem(itemId);
      setCart(updated);
    } catch (err) {
      if (err instanceof ApiException) {
        alert(err.message);
      } else {
        alert('Gagal menghapus item dari keranjang.');
      }
    } finally {
      setRemovingId(null);
    }
  };

  // 5. Clear Entire Cart
  const handleClearCart = async () => {
    setClearing(true);
    try {
      await clearCart();
      setCart(null);
      setShowClearConfirm(false);
    } catch (err) {
      if (err instanceof ApiException) {
        alert(err.message);
      } else {
        alert('Gagal mengosongkan keranjang belanja.');
      }
    } finally {
      setClearing(false);
    }
  };

  // 6. Add Recommendation to Cart
  const handleAddRecommendation = async (product: ProductResponse) => {
    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }
    const availableStock = Number(product.stockOnHand ?? product.stock ?? 0) - Number(product.reservedQuantity ?? 0);
    if (availableStock <= 0 || !product.available) return;

    setAddingRecId(product.id);
    try {
      const defaultQty = product.allowDecimal ? 1 : 1;
      const updated = await addToCart({ productId: product.id, quantity: defaultQty });
      setCart(updated);
      setAddedRecSuccess(product.id);
      setTimeout(() => setAddedRecSuccess(null), 3000);
    } catch (err) {
      if (err instanceof ApiException) {
        alert(err.message);
      } else {
        alert('Gagal menambahkan produk rekomendasi ke keranjang.');
      }
    } finally {
      setAddingRecId(null);
    }
  };

  // Derived properties
  const items = useMemo(() => cart?.items || [], [cart?.items]);
  const totalItemTypes = items.length;
  const isCartEmpty = totalItemTypes === 0;

  // Calculate total volume / units
  const totalQuantity = useMemo(() => {
    return items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  }, [items]);

  // Real-time stock validation check
  const stockIssues = useMemo(() => {
    return items.filter((item) => {
      const stock = Number(item.availableStock ?? item.stockAvailable ?? 0);
      return stock <= 0 || item.quantity > stock;
    });
  }, [items]);

  const hasStockError = stockIssues.length > 0;

  // Filter recommendations: exclude products already in the cart
  const cartProductIds = useMemo(() => {
    const ids = new Set<string>();
    items.forEach((item) => {
      if (item.productId) ids.add(item.productId);
      if (item.productCode) ids.add(item.productCode);
    });
    return ids;
  }, [items]);

  const displayedRecommendations = useMemo(() => {
    return recommendations
      .filter((p) => !cartProductIds.has(p.id) && !cartProductIds.has(p.code))
      .slice(0, 4);
  }, [recommendations, cartProductIds]);

  // Unauthenticated State View
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/cart" />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="w-full bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-12 text-center shadow-sm max-w-lg">
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-amber-600 border border-amber-100">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              Keranjang Belanja
            </h1>
            <p className="text-zinc-600 text-sm leading-relaxed mb-8">
              Silakan masuk ke akun Anda untuk melihat produk pilihan, mengelola kuantitas bahan, dan melanjutkan pemesanan ke checkout.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth?mode=login"
                className="w-full sm:w-auto px-7 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-sm font-semibold shadow-md transition-all active:scale-95"
              >
                Masuk ke Akun
              </Link>
              <Link
                href="/products"
                className="w-full sm:w-auto px-7 py-3.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-full text-sm font-semibold transition-all"
              >
                Jelajahi Katalog
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Initial Full Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar cartItemCount={0} activeRoute="/cart" />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-6 w-56 bg-zinc-200/80 rounded-full animate-pulse mb-6" />
          <div className="h-10 w-72 bg-zinc-200/80 rounded-2xl animate-pulse mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 bg-zinc-200/60 rounded-3xl animate-pulse" />
              ))}
            </div>
            <div className="lg:col-span-4">
              <div className="h-80 bg-zinc-200/60 rounded-3xl animate-pulse" />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      {/* 1. STANDARDIZED GLOBAL NAVBAR */}
      <Navbar cartItemCount={cart?.totalItems ?? 0} activeRoute="/cart" />

      {/* 2. MAIN CART WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center gap-2 text-xs text-zinc-500">
            <li>
              <Link href="/" className="hover:text-zinc-900 transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <li>
              <Link href="/products" className="hover:text-zinc-900 transition-colors">
                Katalog Produk
              </Link>
            </li>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <li className="font-semibold text-zinc-900">
              Keranjang Belanja
            </li>
          </ol>
        </nav>

        {/* Editorial Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-zinc-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 mb-2">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
              <span>{totalItemTypes} Jenis Produk Terpilih</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Keranjang Belanja
            </h1>
            <p className="text-zinc-600 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
              Periksa kembali pilihan material jas hujan, warna, dan kuantitas meteran/eceran sebelum melanjutkan ke proses pembayaran.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 transition-colors group self-start md:self-auto"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:-translate-x-1 transition-transform" />
            <span>Lanjut Belanja Material Lain</span>
          </Link>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <p>{error}</p>
            </div>
            <button
              onClick={fetchCart}
              className="text-xs font-semibold underline text-rose-700 hover:text-rose-900 shrink-0"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* 3. CART CONTENT OR EMPTY STATE */}
        {isCartEmpty ? (
          /* Empty Cart State */
          <div className="mt-12 bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-16 text-center shadow-xs flex flex-col items-center justify-center max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-5">
              <ShoppingCart className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              Keranjang Belanja Anda Kosong
            </h2>
            <p className="text-zinc-500 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
              Anda belum menambahkan bahan jas hujan atau aksesori konveksi ke dalam keranjang. Mulai temukan material terbaik sekarang!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-semibold text-sm shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Jelajahi Katalog Produk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* 2-Column Cart Workspace */
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (8 cols): Items List */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Items List Top Action Bar */}
              <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-zinc-200/80 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900">
                    Daftar Item ({totalItemTypes})
                  </span>
                  <span className="text-xs text-zinc-500">
                    • Total Volume: {totalQuantity} unit
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={clearing}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{clearing ? 'Mengosongkan...' : 'Kosongkan Keranjang'}</span>
                </button>
              </div>

              {/* Clear Confirmation Inline Modal */}
              {showClearConfirm && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Yakin ingin menghapus seluruh produk dari keranjang belanja?</span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCart}
                      disabled={clearing}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                    >
                      {clearing ? 'Memproses...' : 'Ya, Kosongkan'}
                    </button>
                  </div>
                </div>
              )}

              {/* Cart Item Cards */}
              <div className="space-y-4">
                {items.map((item) => {
                  const productName = item.name || item.productName || item.productCode || 'Material Jas Hujan';
                  const unitPrice = Number(item.price ?? item.priceAtAdd ?? item.unitPrice ?? 0);
                  const unitLabel = item.unit || item.unitSymbol || item.unitName || 'pcs';
                  const subtotal = Number(item.subtotal ?? (unitPrice * item.quantity));
                  const availableStock = Number(item.availableStock ?? item.stockAvailable ?? 0);
                  const isOutOfStock = availableStock <= 0;
                  const isQuantityExceeded = item.quantity > availableStock;
                  const step = item.allowDecimal ? 0.5 : 1;
                  const minQty = item.allowDecimal ? 0.5 : 1;
                  const variant = variantsMap[item.productId];
                  const isUpdating = updatingId === item.id;
                  const isRemoving = removingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`relative bg-white rounded-3xl border transition-all duration-200 p-5 sm:p-6 shadow-xs ${
                        isQuantityExceeded
                          ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200'
                          : 'border-zinc-200/80 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                        
                        {/* Product Image Thumbnail */}
                        <Link
                          href={`/products/${item.productCode || item.productId}`}
                          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-100 shrink-0 group"
                        >
                          <img
                            src={item.image || '/images/placeholder-product.jpg'}
                            alt={productName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-1">
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider text-center">
                                Stok Habis
                              </span>
                            </div>
                          )}
                        </Link>

                        {/* Middle: Product Details */}
                        <div className="flex-1 min-w-0">
                          
                          {/* Badges: Category & SKU */}
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500">
                              {item.productCode}
                            </span>
                            {variant && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Varian: {variant}
                              </span>
                            )}
                          </div>

                          {/* Product Title */}
                          <Link
                            href={`/products/${item.productCode || item.productId}`}
                            className="block group"
                          >
                            <h3 className="text-base sm:text-lg font-bold text-zinc-900 group-hover:text-amber-600 transition-colors leading-snug line-clamp-2">
                              {productName}
                            </h3>
                          </Link>

                          {/* Unit Price */}
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold text-zinc-800">
                              {formatIDR(unitPrice)}
                            </span>
                            <span className="text-xs text-zinc-400">
                              / {unitLabel}
                            </span>
                          </div>

                          {/* Real Stock Status */}
                          <div className="mt-2 text-xs">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Stok habis di gudang
                              </span>
                            ) : isQuantityExceeded ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Melebihi stok! Tersedia: {availableStock} {unitLabel}
                              </span>
                            ) : (
                              <span className="text-zinc-500 font-medium">
                                Stok tersedia: <strong className="text-zinc-800">{availableStock} {unitLabel}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Top-Right Delete Action (Mobile & Desktop) */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isRemoving}
                          title="Hapus dari keranjang"
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all self-start sm:self-auto disabled:opacity-40"
                          aria-label={`Hapus ${productName}`}
                        >
                          {isRemoving ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Bottom Controls Row: Stepper & Line Subtotal */}
                      <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
                        
                        {/* Stepper Control */}
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center border border-zinc-200/90 rounded-2xl bg-zinc-50/60 p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item, Number((item.quantity - step).toFixed(2)))}
                              disabled={isUpdating || item.quantity <= minQty}
                              className="w-8 h-8 rounded-xl bg-white hover:bg-zinc-100 active:scale-90 text-zinc-700 flex items-center justify-center border border-zinc-200/60 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              aria-label="Kurangi kuantitas"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <div className="min-w-14 px-2 text-center flex items-center justify-center">
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                              ) : (
                                <span className="text-sm font-bold text-zinc-900">
                                  {item.quantity}{' '}
                                  <span className="text-[11px] font-normal text-zinc-500">
                                    {unitLabel}
                                  </span>
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item, Number((item.quantity + step).toFixed(2)))}
                              disabled={isUpdating || item.quantity >= availableStock}
                              className="w-8 h-8 rounded-xl bg-white hover:bg-zinc-100 active:scale-90 text-zinc-700 flex items-center justify-center border border-zinc-200/60 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              aria-label="Tambah kuantitas"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {item.allowDecimal && (
                            <span className="text-[11px] text-zinc-400 hidden sm:inline">
                              (Kelipatan 0.5 m)
                            </span>
                          )}
                        </div>

                        {/* Line Subtotal */}
                        <div className="text-right">
                          <span className="text-xs text-zinc-400 block">Subtotal</span>
                          <span className="text-base sm:text-lg font-extrabold text-zinc-900 tracking-tight">
                            {formatIDR(subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (4 cols): Sticky Order Summary */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 shadow-sm">
                <h2 className="text-lg font-bold text-zinc-900 tracking-tight pb-4 border-b border-zinc-100">
                  Ringkasan Pesanan
                </h2>

                {/* Itemized Rows */}
                <div className="py-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center text-zinc-600">
                    <span>Total Jenis Produk</span>
                    <span className="font-semibold text-zinc-900">{totalItemTypes} Item</span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-600">
                    <span>Total Kuantitas / Volume</span>
                    <span className="font-semibold text-zinc-900">{totalQuantity} unit</span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-600">
                    <span>Subtotal Produk</span>
                    <span className="font-semibold text-zinc-900">
                      {formatIDR(cart?.subtotal)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-dashed border-zinc-200">
                    <div className="flex justify-between items-start text-zinc-600">
                      <div>
                        <span className="block font-medium">Biaya Pengiriman</span>
                        <span className="text-[11px] text-zinc-400 leading-tight block">
                          Tersedia Ambil di Toko Kebumen (Gratis) &amp; Kurir
                        </span>
                      </div>
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-right">
                        Dihitung saat checkout
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Line */}
                <div className="pt-4 pb-6 border-t border-zinc-200/90 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-zinc-500 block">
                      Total Sementara
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Belum termasuk ongkir pengiriman
                    </span>
                  </div>
                  <span className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                    {formatIDR(cart?.subtotal)}
                  </span>
                </div>

                {/* Stock Warning Box if any item exceeds available stock */}
                {hasStockError && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Satu atau lebih produk melebihi batas stok gudang yang tersedia. Silakan kurangi kuantitas produk terkait untuk melanjutkan ke checkout.
                    </p>
                  </div>
                )}

                {/* Primary CTA Button -> /checkout */}
                <button
                  type="button"
                  onClick={() => router.push('/checkout')}
                  disabled={hasStockError || isCartEmpty || updatingId !== null}
                  className="w-full py-4 rounded-full bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Lanjut ke Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Secondary link */}
                <div className="mt-4 text-center">
                  <Link
                    href="/products"
                    className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 underline underline-offset-2 transition-colors"
                  >
                    ← Lanjut Belanja Material Lain
                  </Link>
                </div>

                {/* Compact Trust Reassurance Box */}
                <div className="bg-zinc-50 rounded-2xl p-4 mt-6 space-y-2.5 border border-zinc-100 text-xs text-zinc-600">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      <strong>Reservasi Stok Otomatis:</strong> Stok dikunci 24 jam setelah checkout dibuat.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Store className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      <strong>Ambil Langsung di Toko:</strong> Tanpa biaya kirim di Jl. Kertanegara Km. 03, Tanahsari, Kebumen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. LIVE BACKEND RECOMMENDATIONS: "Produk yang Mungkin Kamu Suka" */}
        <section className="mt-20 pt-12 border-t border-zinc-200/80">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-amber-600 text-xs font-extrabold tracking-wider uppercase block mb-1">
                REKOMENDASI UNTUKMU
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Produk yang Mungkin Kamu Suka
              </h2>
              <p className="text-zinc-600 text-sm mt-1">
                Lengkapi kebutuhan produksi jas hujan Anda dengan material dan aksesori pilihan berkualitas.
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 transition-colors group shrink-0"
            >
              <span>Lihat Semua Katalog</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Recommendations Grid */}
          {loadingRecs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-zinc-200/80 p-4 space-y-3 animate-pulse">
                  <div className="aspect-square bg-zinc-200/70 rounded-xl" />
                  <div className="h-4 bg-zinc-200/70 rounded w-1/3" />
                  <div className="h-5 bg-zinc-200/70 rounded w-3/4" />
                  <div className="h-5 bg-zinc-200/70 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : displayedRecommendations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {displayedRecommendations.map((prod) => {
                const stockAvail = Number(prod.stockOnHand ?? prod.stock ?? 0) - Number(prod.reservedQuantity ?? 0);
                const isOutOfStock = stockAvail <= 0 || !prod.available;
                const isAdding = addingRecId === prod.id;
                const isSuccess = addedRecSuccess === prod.id;

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden group hover:shadow-md hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-square bg-zinc-100 overflow-hidden">
                      <Link href={`/products/${prod.code || prod.id}`}>
                        <img
                          src={prod.image || '/images/placeholder-product.jpg'}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </Link>

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider bg-black/60 px-3 py-1 rounded-full">
                            Stok Habis
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                          {prod.categoryName || 'Material Jas Hujan'}
                        </span>
                        <Link
                          href={`/products/${prod.code || prod.id}`}
                          className="block font-bold text-zinc-900 group-hover:text-amber-600 transition-colors line-clamp-2 text-sm leading-snug mb-2"
                        >
                          {prod.name}
                        </Link>
                      </div>

                      <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs text-zinc-400 block leading-none">Harga</span>
                          <span className="text-sm font-extrabold text-zinc-900">
                            {formatIDR(prod.price)}
                            <span className="text-[11px] font-normal text-zinc-500 ml-0.5">
                              /{prod.unitSymbol || prod.unit || 'pcs'}
                            </span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddRecommendation(prod)}
                          disabled={isOutOfStock || isAdding}
                          className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            isSuccess
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-white active:scale-95'
                          }`}
                          aria-label={`Tambah ${prod.name} ke keranjang`}
                        >
                          {isAdding ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Ditambahkan!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Keranjang</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm italic">
              Tidak ada rekomendasi tambahan saat ini.
            </p>
          )}
        </section>

      </main>

      {/* 5. STANDARDIZED GLOBAL FOOTER */}
      <Footer />
    </div>
  );
}
