'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProducts, getCategories } from '@/lib/catalog-api';
import { getCart, addToCart } from '@/lib/cart-api';
import { ApiException } from '@/lib/api';
import type { ProductResponse, CategoryResponse, CartResponse } from '@/types/api';
import { Navbar } from '@/components/store/Navbar';
import { Footer } from '@/components/store/Footer';
import {
  Search, ShoppingCart, Layers, GitCommitHorizontal, CircleDot,
  Activity, Scissors, Plus, Check, AlertCircle, Loader2,
  PackageX, X, RotateCcw, Sparkles,
} from 'lucide-react';

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'material-jas-hujan': <Layers className="w-4 h-4 text-amber-500" strokeWidth={1.5} />,
  'resleting': <GitCommitHorizontal className="w-4 h-4 text-amber-500" strokeWidth={1.5} />,
  'kancing': <CircleDot className="w-4 h-4 text-amber-500" strokeWidth={1.5} />,
  'karet': <Activity className="w-4 h-4 text-amber-500" strokeWidth={1.5} />,
  'aksesori': <Scissors className="w-4 h-4 text-amber-500" strokeWidth={1.5} />,
};

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();

  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | number | null>(null);
  const [addedId, setAddedId] = useState<string | number | null>(null);

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState('terbaru');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load categories and initial cart
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});

    if (isLoggedIn) {
      getCart().then(setCart).catch(() => {});
    }
  }, [isLoggedIn]);

  // Synchronize category from URL query parameters
  useEffect(() => {
    if (!categoryParam) {
      setSelectedCategoryId(undefined);
      return;
    }

    if (categories.length > 0) {
      const match = categories.find(
        (c) =>
          c.id === categoryParam ||
          c.slug.toLowerCase() === categoryParam.toLowerCase() ||
          c.name.toLowerCase() === categoryParam.toLowerCase()
      );
      if (match) {
        setSelectedCategoryId(match.id);
      } else {
        setSelectedCategoryId(categoryParam);
      }
      setPage(0);
    }
  }, [categoryParam, categories]);

  // Synchronize search query from URL query parameters
  useEffect(() => {
    setSearchQuery(searchParam);
    setPage(0);
  }, [searchParam]);

  // Fetch products from backend API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sortParam =
        sort === 'harga-rendah'
          ? 'price,asc'
          : sort === 'harga-tinggi'
          ? 'price,desc'
          : 'createdAt,desc';

      const res = await getProducts({
        query: searchQuery.trim() || undefined,
        categoryId: selectedCategoryId,
        sort: sortParam,
        page,
        size: 12,
      });

      setProducts(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      if (err instanceof ApiException) setError(err.message);
      else setError('Gagal memuat produk.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategoryId, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle category sidebar selection and URL sync
  const handleSelectCategory = (category?: CategoryResponse) => {
    if (!category) {
      setSelectedCategoryId(undefined);
      setPage(0);
      router.push('/products', { scroll: false });
    } else {
      setSelectedCategoryId(category.id);
      setPage(0);
      router.push(`/products?category=${encodeURIComponent(category.slug)}`, { scroll: false });
    }
  };

  // Handle search changes and submission
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setPage(0);
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`, { scroll: false });
    } else {
      router.push('/products', { scroll: false });
    }
  };

  // Reset all filters and search query
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategoryId(undefined);
    setSort('terbaru');
    setPage(0);
    router.push('/products', { scroll: false });
  };

  // Add to cart with backend integration
  const handleAddToCart = async (product: ProductResponse) => {
    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }
    if (!product.available) return;

    setAddingId(product.id);
    try {
      const updated = await addToCart({
        productId: product.id,
        quantity: product.allowDecimal ? 0.5 : 1,
      });
      setCart(updated);
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1500);
    } catch (err) {
      if (err instanceof ApiException) alert(err.message);
    } finally {
      setAddingId(null);
    }
  };

  const cartCount = cart?.totalItems ?? 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      {/* 1. Global Standardized Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        cartItemCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 2. Main Catalog Body Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar: Categories & Sort Filters */}
          <aside className="lg:w-56 shrink-0">
            <div className="sticky top-28 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Kategori
                </h3>
                <ul className="space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(undefined)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        !selectedCategoryId
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      Semua Produk
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          selectedCategoryId === cat.id
                            ? 'bg-zinc-900 text-white font-semibold'
                            : 'text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {CATEGORY_ICONS[cat.slug] ?? <Layers className="w-4 h-4 text-amber-500" />}
                        <span className="truncate">{cat.name}</span>
                        <span className="ml-auto text-[10px] opacity-60">({cat.productCount})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Urutkan
                </h3>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(0);
                  }}
                  className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                >
                  <option value="terbaru">Terbaru</option>
                  <option value="harga-rendah">Harga Terendah</option>
                  <option value="harga-tinggi">Harga Tertinggi</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Right: Product Grid & Pagination */}
          <main className="flex-1">
            {/* Mobile search input */}
            <div className="md:hidden mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-full border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
                <p className="text-zinc-600 font-medium">{error}</p>
                <button
                  type="button"
                  onClick={fetchProducts}
                  className="mt-3 text-sm text-zinc-700 underline font-medium hover:text-zinc-900"
                >
                  Coba lagi
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center my-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 mb-5 shadow-inner">
                  <Search className="w-8 h-8 stroke-[1.5]" />
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
                  {searchQuery.trim()
                    ? `Tidak ada produk yang cocok dengan "${searchQuery.trim()}"`
                    : 'Belum ada produk pada filter ini'}
                </h3>
                
                <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed mb-6">
                  {searchQuery.trim()
                    ? 'Periksa kembali ejaan kata kunci Anda, atau coba gunakan istilah material yang lebih umum seperti PVC, taslan, resleting, atau kancing.'
                    : 'Kategori atau kriteria filter yang Anda pilih saat ini tidak memuat produk aktif. Silakan pilih kategori lain atau reset filter.'}
                </p>

                {/* Reset Filters Primary Button */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-7 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer mb-6"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Semua Filter</span>
                </button>

                {/* Quick Category Shortcut Pills */}
                <div className="pt-6 border-t border-zinc-100 w-full max-w-lg">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-3">
                    Pilih Kategori Cepat
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(undefined)}
                      className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                        !selectedCategoryId
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700'
                      }`}
                    >
                      Semua Produk
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                          selectedCategoryId === cat.id
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <Link
                          href={`/products/${product.code}`}
                          className="block aspect-square overflow-hidden bg-zinc-50 relative"
                        >
                          <img
                            src={product.image || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                            }}
                          />
                          {product.isNew && (
                            <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              BARU
                            </span>
                          )}
                          {!product.available && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                              <span className="text-xs font-bold text-zinc-500 bg-white px-2 py-1 rounded-full border border-zinc-200 shadow-sm">
                                Stok Habis
                              </span>
                            </div>
                          )}
                        </Link>
                        <div className="p-3 pb-1">
                          <p className="text-[10px] text-zinc-400 mb-0.5">{product.categoryName}</p>
                          <p className="text-sm font-semibold text-zinc-900 leading-tight line-clamp-2 mb-2">
                            {product.name}
                          </p>
                          <p className="text-sm font-bold text-amber-600">
                            {formatIDR(product.price)}
                            <span className="text-xs text-zinc-400 font-normal">/{product.unitSymbol}</span>
                          </p>
                        </div>
                      </div>

                      <div className="p-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.available || addingId === product.id}
                          className={`w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            addedId === product.id
                              ? 'bg-emerald-500 text-white'
                              : product.available
                              ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                              : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          }`}
                        >
                          {addingId === product.id ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : addedId === product.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Ditambahkan
                            </>
                          ) : product.available ? (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Tambah ke Keranjang
                            </>
                          ) : (
                            'Stok Habis'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 disabled:opacity-40 hover:bg-zinc-100 transition-colors bg-white"
                    >
                      ← Sebelumnya
                    </button>
                    <span className="text-sm text-zinc-500">
                      Halaman {page + 1} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 disabled:opacity-40 hover:bg-zinc-100 transition-colors bg-white"
                    >
                      Berikutnya →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* 3. Global Standardized Footer */}
      <Footer />

      {/* Slide-out Cart Sidebar */}
      {isCartOpen && cart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">Keranjang ({cartCount})</h2>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.items.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-10">Keranjang kosong</p>
              ) : (
                cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.image || '/placeholder-product.jpg'}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-xl border border-zinc-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 line-clamp-1">{item.productName}</p>
                      <p className="text-xs text-zinc-500">
                        {item.quantity} {item.unitName}
                      </p>
                      <p className="text-sm font-bold text-amber-600">{formatIDR(item.subtotal)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-5 border-t border-zinc-100 bg-zinc-50/50">
              <div className="flex justify-between text-sm font-bold mb-4 text-zinc-900">
                <span>Total</span>
                <span>{formatIDR(cart.subtotal)}</span>
              </div>
              <Link
                href="/cart"
                onClick={() => setIsCartOpen(false)}
                className="block w-full text-center bg-zinc-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-sm"
              >
                Lihat Keranjang &amp; Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
