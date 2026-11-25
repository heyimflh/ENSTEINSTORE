'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdminLayout } from '@/components/admin/AdminShell';
import {
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  getCategories,
  getUnits,
  resolveProductImageUrl,
  PRESET_PRODUCT_IMAGES,
} from '../../../lib/catalog-api';
import { adminGetPayments } from '../../../lib/orders-api';
import { ApiException } from '../../../lib/api';
import type {
  ProductResponse,
  CategoryResponse,
  UnitResponse,
  CreateProductRequest,
  UpdateProductRequest,
} from '../../../types/api';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Boxes,
  Store,
  BarChart3,
  Activity,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Pencil,
  Power,
  RotateCcw,
  Star,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';

function formatIDR(n: number = 0) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Thumbnail with Fallback ─────────────────────────────────────────────────
function ProductThumbnail({
  src,
  alt,
  className = 'w-12 h-12',
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const resolved = resolveProductImageUrl(src);

  if (error || !src) {
    return (
      <div
        className={`${className} rounded-xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-400 shrink-0`}
      >
        <Package className="w-5 h-5" />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      onError={() => setError(true)}
      className={`${className} rounded-xl object-cover border border-zinc-200/80 bg-zinc-100 shrink-0`}
    />
  );
}

interface ProductFormData {
  code: string;
  name: string;
  description: string;
  price: number | '';
  minimumStock: number | '';
  categoryId: string;
  unitId: string;
  image: string;
  isFeatured: boolean;
  isActive: boolean;
}

const INITIAL_FORM: ProductFormData = {
  code: '',
  name: '',
  description: '',
  price: '',
  minimumStock: 10,
  categoryId: '',
  unitId: '',
  image: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
  isFeatured: false,
  isActive: true,
};

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'FEATURED';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAdmin, logout, loading: authLoading } = useAuth();

  // Master Data
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [pendingVerificationCount, setPendingVerificationCount] = useState<number>(0);

  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const { toggleMobile } = useAdminLayout();

  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<string>('terbaru');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 12;

  // Drawer (Create & Edit)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [form, setForm] = useState<ProductFormData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Image preset modal/selector
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  // Status Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    product: ProductResponse | null;
    action: 'deactivate' | 'activate';
  }>({ open: false, product: null, action: 'deactivate' });

  // ─── Fetch All Products & Master Data ──────────────────────────────────────
  const fetchProductsAndMetadata = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [prodRes, catRes, unitRes, payRes] = await Promise.allSettled([
          // activeOnly: false to get BOTH active and inactive products
          adminGetProducts({ activeOnly: false, size: 200, sort: 'terbaru' }),
          getCategories(),
          getUnits(),
          adminGetPayments({ status: 'WAITING_VERIFICATION', size: 1 }),
        ]);

        if (prodRes.status === 'fulfilled') {
          setProducts(prodRes.value.content || []);
        } else {
          setError('Gagal memuat katalog produk dari database.');
        }

        if (catRes.status === 'fulfilled') {
          setCategories(catRes.value || []);
        }

        if (unitRes.status === 'fulfilled') {
          setUnits(unitRes.value || []);
        }

        if (payRes.status === 'fulfilled') {
          setPendingVerificationCount(payRes.value.totalElements || 0);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Terjadi kendala saat menyinkronkan data.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/auth');
      return;
    }
    fetchProductsAndMetadata();
  }, [isAdmin, authLoading, fetchProductsAndMetadata, router]);

  // Auto-hide toast
  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // ─── Computed Stat Metrics (Tier 1) ────────────────────────────────────────
  const stats = useMemo(() => {
    const total = products.length;
    let active = 0;
    let featured = 0;
    let outOfStock = 0;
    let lowStock = 0;

    products.forEach((p) => {
      const isAct = p.isActive !== false;
      if (isAct) active++;
      if (p.isFeatured) featured++;
      const stockVal = p.stockOnHand ?? p.stock ?? 0;
      if (stockVal <= 0) outOfStock++;
      else if (stockVal <= (p.minimumStock || 10)) lowStock++;
    });

    const critical = outOfStock + (total - active);
    return {
      total,
      active,
      featured,
      outOfStock,
      lowStock,
      critical,
      activePct: total > 0 ? Math.round((active / total) * 100) : 0,
    };
  }, [products]);

  // ─── Filtered and Sorted Products (Tier 2 & 3) ─────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Keyword search (Name or SKU)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const nameMatch = p.name?.toLowerCase().includes(q);
        const codeMatch = p.code?.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch) return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && p.isActive === false) return false;
      if (statusFilter === 'INACTIVE' && p.isActive !== false) return false;
      if (statusFilter === 'FEATURED' && !p.isFeatured) return false;

      // Category filter
      if (selectedCategory !== 'ALL') {
        if (p.categoryId !== selectedCategory && p.categorySlug !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [products, search, statusFilter, selectedCategory]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortOption) {
      case 'nama-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'nama-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'harga-tinggi':
        return list.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'harga-rendah':
        return list.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'stok-rendah':
        return list.sort((a, b) => (a.stockOnHand ?? a.stock) - (b.stockOnHand ?? b.stock));
      case 'terbaru':
      default:
        return list.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
    }
  }, [filteredProducts, sortOption]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [search, statusFilter, selectedCategory, sortOption]);

  // ─── Drawer Open / Edit Handlers ───────────────────────────────────────────
  const openCreateDrawer = () => {
    // Generate default SKU recommendation
    const nextCode = `PRD-MAT-${String(products.length + 1).padStart(3, '0')}`;
    setForm({
      ...INITIAL_FORM,
      code: nextCode,
      categoryId: categories[0]?.id || '',
      unitId: units[0]?.id || '',
    });
    setEditingProduct(null);
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEditDrawer = (product: ProductResponse) => {
    // Resolve matching unitId
    let resolvedUnitId = product.unitId || '';
    if (!resolvedUnitId && units.length > 0) {
      const match = units.find(
        (u) =>
          u.unitName.toLowerCase() === product.unit?.toLowerCase() ||
          u.unitSymbol.toLowerCase() === product.unitSymbol?.toLowerCase()
      );
      if (match) resolvedUnitId = match.id;
      else resolvedUnitId = units[0]?.id || '';
    }

    setForm({
      code: product.code,
      name: product.name,
      description: product.description || '',
      price: product.price,
      minimumStock: product.minimumStock,
      categoryId: product.categoryId || categories[0]?.id || '',
      unitId: resolvedUnitId,
      image: product.image || '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
      isFeatured: Boolean(product.isFeatured),
      isActive: product.isActive !== false,
    });
    setEditingProduct(product);
    setFormErrors({});
    setDrawerOpen(true);
  };

  // ─── Image Upload via Local File Reader ─────────────────────────────────────
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2 MB per DECISIONS.md K11)
    if (file.size > 2 * 1024 * 1024) {
      setToastMsg({
        type: 'error',
        text: 'Ukuran berkas gambar maksimal 2 MB (peraturan DECISIONS.md K11).',
      });
      return;
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setToastMsg({
        type: 'error',
        text: 'Format gambar hanya mendukung JPG, PNG, atau WEBP.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm((prev) => ({ ...prev, image: base64 }));
      setToastMsg({
        type: 'success',
        text: 'Gambar berhasil dimuat ke dalam pratinjau.',
      });
    };
    reader.readAsDataURL(file);
  };

  // ─── Submit Form (Create / Update) ─────────────────────────────────────────
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!form.code.trim()) errors.code = 'Kode SKU produk wajib diisi.';
    if (!form.name.trim()) errors.name = 'Nama produk wajib diisi.';
    if (!form.categoryId) errors.categoryId = 'Kategori produk wajib dipilih.';
    if (!form.unitId) errors.unitId = 'Satuan kuantitas wajib dipilih.';
    if (form.price === '' || Number(form.price) < 0) errors.price = 'Harga tidak boleh negatif.';
    if (form.minimumStock === '' || Number(form.minimumStock) < 0) {
      errors.minimumStock = 'Batas minimum stok tidak boleh negatif.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        // UPDATE (PUT /api/admin/products/{id})
        const updatePayload: UpdateProductRequest = {
          name: form.name.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId,
          unitId: form.unitId,
          price: Number(form.price),
          minimumStock: Number(form.minimumStock),
          image: form.image,
          isFeatured: form.isFeatured,
          isActive: form.isActive,
        };

        const updated = await adminUpdateProduct(editingProduct.id, updatePayload);

        // Optimistic update in list
        setProducts((prev) =>
          prev.map((item) => (item.id === editingProduct.id ? { ...item, ...updated } : item))
        );

        setToastMsg({
          type: 'success',
          text: `Produk "${updated.name}" berhasil diperbarui di database.`,
        });
      } else {
        // CREATE (POST /api/admin/products)
        const createPayload: CreateProductRequest = {
          code: form.code.trim(),
          productCode: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId,
          unitId: form.unitId,
          price: Number(form.price),
          minimumStock: Number(form.minimumStock),
          image: form.image,
          isFeatured: form.isFeatured,
          isActive: form.isActive,
        };

        const created = await adminCreateProduct(createPayload);
        setProducts((prev) => [created, ...prev]);

        setToastMsg({
          type: 'success',
          text: `Produk baru "${created.name}" berhasil ditambahkan ke katalog.`,
        });
      }

      setDrawerOpen(false);
      // Background re-fetch to ensure trigger & DB views align
      fetchProductsAndMetadata(true);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.fieldErrors && err.fieldErrors.length > 0) {
          const map: Record<string, string> = {};
          err.fieldErrors.forEach((f) => {
            map[f.field] = f.message;
          });
          setFormErrors(map);
        }
        setToastMsg({ type: 'error', text: err.message });
      } else {
        setToastMsg({ type: 'error', text: 'Gagal menyimpan perubahan ke server.' });
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Real-Time Toggle Featured ─────────────────────────────────────────────
  const handleToggleFeatured = async (product: ProductResponse) => {
    const nextFeatured = !product.isFeatured;

    // Optimistic UI
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isFeatured: nextFeatured } : p))
    );

    try {
      await adminUpdateProduct(product.id, {
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId,
        unitId: product.unitId || units[0]?.id,
        price: product.price,
        minimumStock: product.minimumStock,
        image: product.image,
        isFeatured: nextFeatured,
        isActive: product.isActive !== false,
      });

      setToastMsg({
        type: 'success',
        text: `Status unggulan "${product.name}" berhasil ${
          nextFeatured ? 'diaktifkan' : 'dinonaktifkan'
        }.`,
      });
    } catch (err) {
      // Rollback
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isFeatured: !nextFeatured } : p))
      );
      setToastMsg({
        type: 'error',
        text: err instanceof ApiException ? err.message : 'Gagal memperbarui status unggulan.',
      });
    }
  };

  // ─── Modal Deactivate / Reactivate Handler ─────────────────────────────────
  const handleExecuteStatusChange = async () => {
    const { product, action } = confirmModal;
    if (!product) return;

    const nextActive = action === 'activate';
    setConfirmModal({ open: false, product: null, action: 'deactivate' });

    // Optimistic UI
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isActive: nextActive } : p))
    );

    try {
      if (nextActive) {
        // Reactivate via PUT
        await adminUpdateProduct(product.id, {
          name: product.name,
          description: product.description || '',
          categoryId: product.categoryId,
          unitId: product.unitId || units[0]?.id,
          price: product.price,
          minimumStock: product.minimumStock,
          image: product.image,
          isFeatured: product.isFeatured,
          isActive: true,
        });
      } else {
        // Deactivate via DELETE /api/admin/products/{id} (soft-delete)
        await adminDeleteProduct(product.id);
      }

      setToastMsg({
        type: 'success',
        text: `Produk "${product.name}" berhasil ${
          nextActive ? 'diaktifkan kembali' : 'dinonaktifkan'
        }.`,
      });
    } catch (err) {
      // Rollback
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: !nextActive } : p))
      );
      setToastMsg({
        type: 'error',
        text: err instanceof ApiException ? err.message : 'Gagal mengubah status aktif produk.',
      });
    }
  };

  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
          Memverifikasi Otoritas Admin...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Sticky Executive Topbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 h-16 flex items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span>Admin Panel</span>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-600 font-medium">Manajemen Produk</span>
              </div>
              <h1 className="text-sm lg:text-base font-bold text-zinc-900 truncate">
                Katalog & Inventaris Barang
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Refresh Button */}
            <button
              onClick={() => fetchProductsAndMetadata(true)}
              disabled={loading || refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 px-3 py-2 rounded-2xl transition-colors border border-zinc-200/60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Sinkronkan</span>
            </button>

            {/* + Tambah Produk Primary CTA Button */}
            <button
              onClick={openCreateDrawer}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          </div>
        </header>

        {/* Workspace Container */}
        <main className="p-5 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Toast Notification */}
          {toastMsg && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between text-sm border shadow-sm transition-all ${
                toastMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toastMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="font-medium">{toastMsg.text}</span>
              </div>
              <button
                onClick={() => setToastMsg(null)}
                className="p-1 hover:opacity-75 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchProductsAndMetadata(true)}
                className="underline font-semibold text-rose-700 hover:text-rose-900"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TIER 1: 4 SUMMARY STAT CARDS                                 */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Produk */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Total Katalog</span>
                <div className="w-9 h-9 rounded-2xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">{stats.total}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Seluruh SKU terdaftar</p>
              </div>
            </div>

            {/* Card 2: Produk Aktif */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Produk Aktif Dijual</span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">{stats.active}</p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">
                  {stats.activePct}% dari total katalog
                </p>
              </div>
            </div>

            {/* Card 3: Produk Unggulan */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Produk Unggulan</span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">{stats.featured}</p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">Tampil di etalase beranda</p>
              </div>
            </div>

            {/* Card 4: Perlu Perhatian (Nonaktif / Stok Habis) */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Perlu Perhatian</span>
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                    stats.critical > 0
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">{stats.critical}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {stats.outOfStock} Habis • {stats.total - stats.active} Nonaktif
                </p>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TIER 2: INTERACTIVE FILTER & SEARCH TOOLBAR                   */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-4 lg:p-5 shadow-xs space-y-4">
            {/* Top Row: Search Input + Status Pills + Sort Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama produk atau kode SKU (PRD-...)..."
                  className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-zinc-50/70 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all placeholder:text-zinc-400"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Segmented Switcher */}
                <div className="flex items-center bg-zinc-100 p-1 rounded-2xl border border-zinc-200/60 text-xs">
                  {(
                    [
                      { id: 'ALL', label: 'Semua', count: stats.total },
                      { id: 'ACTIVE', label: 'Aktif', count: stats.active },
                      {
                        id: 'INACTIVE',
                        label: 'Nonaktif',
                        count: stats.total - stats.active,
                      },
                      { id: 'FEATURED', label: 'Unggulan', count: stats.featured },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setStatusFilter(item.id)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                        statusFilter === item.id
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">({item.count})</span>
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 text-xs bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-2xl">
                  <span className="text-zinc-400 font-medium">Urut:</span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-transparent font-semibold text-zinc-800 focus:outline-none cursor-pointer"
                  >
                    <option value="terbaru">Terbaru Ditambahkan</option>
                    <option value="nama-asc">Nama Produk (A–Z)</option>
                    <option value="nama-desc">Nama Produk (Z–A)</option>
                    <option value="harga-tinggi">Harga Tertinggi</option>
                    <option value="harga-rendah">Harga Terendah</option>
                    <option value="stok-rendah">Stok Terendah</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Row: Category Filter Scroll Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs border-t border-zinc-100 pt-3">
              <span className="text-zinc-400 font-medium shrink-0">Kategori:</span>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                }`}
              >
                Semua Kategori
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id || selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TIER 3: UPGRADED INTERACTIVE PRODUCT TABLE                   */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-4 px-5">Produk & SKU</th>
                    <th className="py-4 px-4">Kategori</th>
                    <th className="py-4 px-4">Harga & Satuan</th>
                    <th className="py-4 px-4">Stok Tersedia</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-zinc-300" />
                          <span className="text-xs">Memuat katalog dari database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="max-w-xs mx-auto space-y-2 text-zinc-400">
                          <Package className="w-10 h-10 mx-auto text-zinc-300" />
                          <p className="font-semibold text-zinc-700 text-sm">
                            Tidak ada produk yang sesuai
                          </p>
                          <p className="text-xs">
                            Coba sesuaikan kata kunci pencarian atau bersihkan filter yang aktif.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((p) => {
                      const stockVal = p.stockOnHand ?? p.stock ?? 0;
                      const isOutOfStock = stockVal <= 0;
                      const isLowStock = !isOutOfStock && stockVal <= (p.minimumStock || 10);
                      const isActive = p.isActive !== false;

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-zinc-50/70 transition-colors group"
                        >
                          {/* Produk & SKU */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <ProductThumbnail
                                src={p.image}
                                alt={p.name}
                                className="w-12 h-12"
                              />
                              <div className="min-w-0">
                                <button
                                  onClick={() => openEditDrawer(p)}
                                  className="font-bold text-zinc-900 hover:text-amber-600 transition-colors text-left block truncate max-w-xs"
                                >
                                  {p.name}
                                </button>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono text-[10px] text-zinc-400 font-medium">
                                    {p.code}
                                  </span>
                                  {p.isFeatured && (
                                    <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] px-1.5 py-0.2 rounded-md font-semibold">
                                      ★ Unggulan
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Kategori */}
                          <td className="py-3.5 px-4">
                            <span className="inline-block bg-zinc-100 text-zinc-700 font-medium text-xs px-2.5 py-1 rounded-lg">
                              {p.categoryName || 'Material'}
                            </span>
                          </td>

                          {/* Harga & Satuan */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-zinc-900">
                              {formatIDR(p.price)}
                              <span className="text-zinc-400 text-xs font-normal">
                                {' '}
                                / {p.unitSymbol || p.unit || 'm'}
                              </span>
                            </div>
                            {p.allowDecimal && (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                Mendukung pecahan desimal
                              </span>
                            )}
                          </td>

                          {/* Stok Tersedia */}
                          <td className="py-3.5 px-4">
                            <div>
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
                                  0 • Habis
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                                  {stockVal} • Menipis
                                </span>
                              ) : (
                                <span className="font-semibold text-zinc-800">
                                  {stockVal} {p.unitSymbol || p.unit || 'm'}
                                </span>
                              )}
                              <p className="text-[10px] text-zinc-400 mt-0.5">
                                Min: {p.minimumStock} {p.unitSymbol || p.unit || 'm'}
                              </p>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                Nonaktif
                              </span>
                            )}
                          </td>

                          {/* Aksi Button Group */}
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Toggle Featured */}
                              <button
                                onClick={() => handleToggleFeatured(p)}
                                title={
                                  p.isFeatured
                                    ? 'Batalkan produk unggulan'
                                    : 'Jadikan produk unggulan'
                                }
                                className={`p-2 rounded-xl transition-colors ${
                                  p.isFeatured
                                    ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                                    : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100'
                                }`}
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    p.isFeatured ? 'fill-amber-500' : ''
                                  }`}
                                />
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => openEditDrawer(p)}
                                title="Edit rincian produk"
                                className="p-2 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* Deactivate / Reactivate Button */}
                              {isActive ? (
                                <button
                                  onClick={() =>
                                    setConfirmModal({
                                      open: true,
                                      product: p,
                                      action: 'deactivate',
                                    })
                                  }
                                  title="Nonaktifkan produk"
                                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setConfirmModal({
                                      open: true,
                                      product: p,
                                      action: 'activate',
                                    })
                                  }
                                  title="Aktifkan kembali produk"
                                  className="p-2 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
              <p>
                Menampilkan{' '}
                <strong className="text-zinc-800">
                  {sortedProducts.length === 0 ? 0 : currentPage * pageSize + 1}
                </strong>{' '}
                –{' '}
                <strong className="text-zinc-800">
                  {Math.min((currentPage + 1) * pageSize, sortedProducts.length)}
                </strong>{' '}
                dari <strong className="text-zinc-800">{sortedProducts.length}</strong> produk
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-semibold text-zinc-800">
                    Halaman {currentPage + 1} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="p-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TIER 4: SLIDE-OUT PRODUCT FORM DRAWER (CREATE & EDIT)               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => !saving && setDrawerOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-16 px-6 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="font-bold text-zinc-900 text-base">
                  {editingProduct
                    ? `Edit Produk • ${editingProduct.code}`
                    : 'Tambah Produk Baru'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {editingProduct
                    ? 'Perbarui data katalog produk di PostgreSQL'
                    : 'Daftarkan SKU material baru ke dalam sistem'}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                disabled={saving}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form
              onSubmit={handleSaveProduct}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50"
            >
              {/* IMAGE UPLOAD & PREVIEW CARD */}
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Foto Produk
                </label>
                <div className="flex items-center gap-4">
                  <ProductThumbnail
                    src={form.image}
                    alt={form.name || 'Preview'}
                    className="w-20 h-20 shadow-xs"
                  />
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Local File Upload Button */}
                      <label className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer border border-zinc-200/70 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Unggah Foto</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>

                      {/* Preset Picker Trigger */}
                      <button
                        type="button"
                        onClick={() => setShowPresetPicker(true)}
                        className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-2 rounded-xl border border-amber-200/70 transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Pilih Dari Galeri</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Mendukung format JPG, PNG, WEBP (maks. 2 MB per K11).
                    </p>
                  </div>
                </div>

                {/* Direct Image Path / URL Input */}
                <div>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="/images/DB_GAMBAR_ENSTEINSTORE/... atau https://..."
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              {/* CORE DETAILS */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Informasi Dasar Produk
                </h4>

                {/* SKU Code */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Kode SKU Produk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingProduct)}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: PRD-BHN-001"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl border ${
                      formErrors.code ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'
                    } ${
                      editingProduct ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'bg-white'
                    } focus:outline-none focus:ring-2 focus:ring-zinc-900`}
                  />
                  {editingProduct && (
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Kode SKU bersifat permanen dan tidak dapat diubah setelah produk dibuat.
                    </p>
                  )}
                  {formErrors.code && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.code}</p>
                  )}
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nama Produk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: PVC Super Ketebalan 0.25"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${
                      formErrors.name ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'
                    } focus:outline-none focus:ring-2 focus:ring-zinc-900`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* 2-Column: Kategori & Satuan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Kategori <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.categoryId && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.categoryId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Satuan Kuantitas <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.unitId}
                      onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="">Pilih Satuan</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unitName} ({u.unitSymbol})
                        </option>
                      ))}
                    </select>
                    {formErrors.unitId && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.unitId}</p>
                    )}
                  </div>
                </div>

                {/* 2-Column: Harga & Batas Minimum Stok */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Harga Satuan (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={form.price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          price: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      placeholder="Contoh: 35000"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                    {formErrors.price && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Batas Min. Stok <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={form.minimumStock}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          minimumStock: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      placeholder="Contoh: 10"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                    {formErrors.minimumStock && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.minimumStock}</p>
                    )}
                  </div>
                </div>

                {/* SINGLE CHOKE-POINT STOCK NOTICE (DECISIONS.md D19 & D28) */}
                {editingProduct ? (
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium">Stok Fisik Tersedia:</span>
                      <span className="font-bold text-zinc-900">
                        {editingProduct.stockOnHand ?? editingProduct.stock}{' '}
                        {editingProduct.unitSymbol || editingProduct.unit || 'm'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Sesuai aturan keamanan stok (Rule #7 & D19), mutasi stok tidak dapat diubah
                      manual di form ini.{' '}
                      <Link
                        href="/admin/inventory"
                        className="text-amber-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                      >
                        Buka Manajemen Inventaris →
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900">
                    <p className="font-semibold flex items-center gap-1 mb-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Inisialisasi Stok Produk Baru
                    </p>
                    Produk baru akan dibuat dengan stok awal 0. Untuk menambahkan stok kulakan,
                    gunakan menu <strong>Stok Masuk</strong> di Inventaris setelah produk disimpan.
                  </div>
                )}
              </div>

              {/* CURATION & VISIBILITY TOGGLES */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Visibilitas & Kurasi
                </h4>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-zinc-900">Tampilkan di Katalog (Aktif)</p>
                    <p className="text-[11px] text-zinc-400">
                      Pelanggan dapat melihat dan memesan produk ini di toko online
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                  <div>
                    <p className="text-xs font-bold text-zinc-900">Produk Unggulan (Featured)</p>
                    <p className="text-[11px] text-zinc-400">
                      Disematkan pada carousel utama dan seksi terlaris di beranda
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>
              </div>

              {/* DESCRIPTION TEXTAREA */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Deskripsi Produk
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsikan karakteristik material, ketebalan, dan rekomendasi penggunaan..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
              </div>
            </form>

            {/* Sticky Drawer Footer */}
            <div className="p-4 px-6 border-t border-zinc-200 bg-white flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                disabled={saving}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={saving}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition-colors"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan Produk</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PRESET GALLERY PICKER MODAL                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showPresetPicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowPresetPicker(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 max-w-2xl w-full max-h-[85vh] flex flex-col z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h4 className="font-bold text-zinc-900 text-sm">Pilih Dari Galeri Material</h4>
                <p className="text-xs text-zinc-400">
                  Foto resolusi tinggi resmi dari koleksi DB_GAMBAR_ENSTEINSTORE
                </p>
              </div>
              <button
                onClick={() => setShowPresetPicker(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_PRODUCT_IMAGES.map((preset) => (
                <button
                  key={preset.path}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, image: preset.path }));
                    setShowPresetPicker(false);
                  }}
                  className={`p-2 rounded-2xl border text-left group transition-all ${
                    form.image === preset.path
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                      : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50'
                  }`}
                >
                  <img
                    src={preset.path}
                    alt={preset.label}
                    className="w-full h-24 rounded-xl object-cover mb-2"
                  />
                  <p className="text-[11px] font-semibold text-zinc-800 truncate group-hover:text-amber-600">
                    {preset.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DEACTIVATE / REACTIVATE CONFIRMATION MODAL                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {confirmModal.open && confirmModal.product && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setConfirmModal({ open: false, product: null, action: 'deactivate' })}
          />
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 max-w-md w-full z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModal.action === 'deactivate'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {confirmModal.action === 'deactivate' ? (
                  <Power className="w-5 h-5" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 text-sm">
                  {confirmModal.action === 'deactivate'
                    ? `Nonaktifkan Produk "${confirmModal.product.name}"?`
                    : `Aktifkan Kembali Produk "${confirmModal.product.name}"?`}
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  {confirmModal.action === 'deactivate'
                    ? 'Produk ini akan disembunyikan dari katalog pelanggan dan tidak dapat dibeli untuk sementara waktu. Data stok dan riwayat transaksi tetap aman.'
                    : 'Produk ini akan kembali ditampilkan di katalog online dan dapat dipesan oleh pelanggan jika stok fisik tersedia.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() =>
                  setConfirmModal({ open: false, product: null, action: 'deactivate' })
                }
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteStatusChange}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-full transition-colors shadow-xs ${
                  confirmModal.action === 'deactivate'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmModal.action === 'deactivate' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan Kembali'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
