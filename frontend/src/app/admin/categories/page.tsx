'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdminLayout } from '@/components/admin/AdminShell';
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  getAdminUnits,
  createUnit,
  updateUnit,
} from '../../../lib/admin-api';
import { adminGetPayments } from '../../../lib/orders-api';
import { ApiException } from '../../../lib/api';
import type {
  CategoryResponse,
  CategoryRequest,
  UnitResponse,
  UnitRequest,
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
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Ruler,
  Sliders,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

function formatIndonesianFullDate(date: Date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// Initial badge color mapping for categories
const INITIAL_COLORS = [
  'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  'bg-blue-50 text-blue-700 border-blue-200/80',
  'bg-amber-50 text-amber-700 border-amber-200/80',
  'bg-violet-50 text-violet-700 border-violet-200/80',
  'bg-rose-50 text-rose-700 border-rose-200/80',
  'bg-cyan-50 text-cyan-700 border-cyan-200/80',
];

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

interface UnitFormData {
  unitName: string;
  unitSymbol: string;
  allowDecimal: boolean;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, isAdmin, logout, loading: authLoading } = useAuth();

  // Active Tab: 'categories' vs 'units'
  const [activeTab, setActiveTab] = useState<'categories' | 'units'>('categories');

  // Master Data from PostgreSQL
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [pendingVerificationCount, setPendingVerificationCount] = useState<number>(0);

  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const { toggleMobile } = useAdminLayout();

  // Filter & Search
  const [search, setSearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>(
    'ALL'
  );
  const [unitTypeFilter, setUnitTypeFilter] = useState<'ALL' | 'DECIMAL' | 'INTEGER'>('ALL');

  // Drawer (Create & Edit)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [editingUnit, setEditingUnit] = useState<UnitResponse | null>(null);

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  });

  const [unitForm, setUnitForm] = useState<UnitFormData>({
    unitName: '',
    unitSymbol: '',
    allowDecimal: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Status Change Confirmation Modal (Categories)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    category: CategoryResponse | null;
    action: 'deactivate' | 'activate';
  }>({ open: false, category: null, action: 'deactivate' });

  // ─── Fetch Categories & Units from Database ────────────────────────────────
  const fetchAllData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [catRes, unitRes, payRes] = await Promise.allSettled([
          getAdminCategories(),
          getAdminUnits(),
          adminGetPayments({ status: 'WAITING_VERIFICATION', size: 1 }),
        ]);

        let success = true;

        if (catRes.status === 'fulfilled') {
          setCategories(catRes.value || []);
        } else {
          success = false;
          console.error('Error fetching categories:', catRes.reason);
        }

        if (unitRes.status === 'fulfilled') {
          setUnits(unitRes.value || []);
        } else {
          success = false;
          console.error('Error fetching units:', unitRes.reason);
        }

        if (payRes.status === 'fulfilled') {
          setPendingVerificationCount(payRes.value.totalElements || 0);
        }

        setDbConnected(success);
        if (!success) {
          setError('Gagal menghubungkan atau memuat data dari database PostgreSQL.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setDbConnected(false);
        setError('Terjadi kendala saat menyinkronkan data dengan server.');
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
    fetchAllData();
  }, [isAdmin, authLoading, fetchAllData, router]);

  // Auto-hide toast notification
  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // ─── Tier 1: Summary Statistics (Real DB Counts) ───────────────────────────
  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const activeCategories = categories.filter((c) => c.isActive !== false).length;
    const totalUnits = units.length;
    const decimalUnits = units.filter((u) => Boolean(u.allowDecimal)).length;

    return {
      totalCategories,
      activeCategories,
      totalUnits,
      decimalUnits,
    };
  }, [categories, units]);

  // ─── Filtered Data ─────────────────────────────────────────────────────────
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const nameMatch = c.name?.toLowerCase().includes(q);
        const descMatch = c.description?.toLowerCase().includes(q);
        const slugMatch = c.slug?.toLowerCase().includes(q);
        if (!nameMatch && !descMatch && !slugMatch) return false;
      }
      if (categoryStatusFilter === 'ACTIVE' && c.isActive === false) return false;
      if (categoryStatusFilter === 'INACTIVE' && c.isActive !== false) return false;
      return true;
    });
  }, [categories, search, categoryStatusFilter]);

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const nameMatch = u.unitName?.toLowerCase().includes(q);
        const symbolMatch = u.unitSymbol?.toLowerCase().includes(q);
        if (!nameMatch && !symbolMatch) return false;
      }
      if (unitTypeFilter === 'DECIMAL' && !u.allowDecimal) return false;
      if (unitTypeFilter === 'INTEGER' && u.allowDecimal) return false;
      return true;
    });
  }, [units, search, unitTypeFilter]);

  // ─── Drawer Handlers ───────────────────────────────────────────────────────
  const openCreateDrawer = () => {
    setFormErrors({});
    if (activeTab === 'categories') {
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        isActive: true,
      });
      setEditingCategory(null);
    } else {
      setUnitForm({
        unitName: '',
        unitSymbol: '',
        allowDecimal: false,
      });
      setEditingUnit(null);
    }
    setDrawerOpen(true);
  };

  const openEditCategoryDrawer = (cat: CategoryResponse) => {
    setFormErrors({});
    setCategoryForm({
      name: cat.name,
      slug: cat.slug || '',
      description: cat.description || '',
      isActive: cat.isActive !== false,
    });
    setEditingCategory(cat);
    setDrawerOpen(true);
  };

  const openEditUnitDrawer = (unit: UnitResponse) => {
    setFormErrors({});
    setUnitForm({
      unitName: unit.unitName,
      unitSymbol: unit.unitSymbol,
      allowDecimal: Boolean(unit.allowDecimal),
    });
    setEditingUnit(unit);
    setDrawerOpen(true);
  };

  // ─── Save Category / Unit ──────────────────────────────────────────────────
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!categoryForm.name.trim()) errors.name = 'Nama kategori wajib diisi.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload: CategoryRequest = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim() || undefined,
        description: categoryForm.description.trim() || undefined,
        isActive: categoryForm.isActive,
      };

      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, payload);
        setCategories((prev) =>
          prev.map((item) => (item.id === editingCategory.id ? { ...item, ...updated } : item))
        );
        setToastMsg({
          type: 'success',
          text: `Kategori "${updated.name}" berhasil diperbarui di PostgreSQL.`,
        });
      } else {
        const created = await createCategory(payload);
        setCategories((prev) => [...prev, created]);
        setToastMsg({
          type: 'success',
          text: `Kategori "${created.name}" berhasil disimpan ke PostgreSQL.`,
        });
      }

      setDrawerOpen(false);
      fetchAllData(true);
    } catch (err) {
      if (err instanceof ApiException) {
        setToastMsg({ type: 'error', text: err.message });
      } else {
        setToastMsg({ type: 'error', text: 'Gagal menyimpan kategori ke server.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!unitForm.unitName.trim()) errors.unitName = 'Nama satuan wajib diisi.';
    if (!unitForm.unitSymbol.trim()) errors.unitSymbol = 'Simbol satuan wajib diisi.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload: UnitRequest = {
        unitName: unitForm.unitName.trim(),
        unitSymbol: unitForm.unitSymbol.trim(),
        allowDecimal: unitForm.allowDecimal,
      };

      if (editingUnit) {
        const updated = await updateUnit(editingUnit.id, payload);
        setUnits((prev) =>
          prev.map((item) => (item.id === editingUnit.id ? { ...item, ...updated } : item))
        );
        setToastMsg({
          type: 'success',
          text: `Satuan "${updated.unitName}" berhasil diperbarui di PostgreSQL.`,
        });
      } else {
        const created = await createUnit(payload);
        setUnits((prev) => [...prev, created]);
        setToastMsg({
          type: 'success',
          text: `Satuan "${created.unitName}" berhasil disimpan ke PostgreSQL.`,
        });
      }

      setDrawerOpen(false);
      fetchAllData(true);
    } catch (err) {
      if (err instanceof ApiException) {
        setToastMsg({ type: 'error', text: err.message });
      } else {
        setToastMsg({ type: 'error', text: 'Gagal menyimpan satuan ke server.' });
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Modal Deactivate / Reactivate Category ────────────────────────────────
  const handleExecuteCategoryStatusChange = async () => {
    const { category, action } = confirmModal;
    if (!category) return;

    const nextActive = action === 'activate';
    setConfirmModal({ open: false, category: null, action: 'deactivate' });

    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, isActive: nextActive } : c))
    );

    try {
      await toggleCategoryStatus(category.id, nextActive);
      setToastMsg({
        type: 'success',
        text: `Kategori "${category.name}" berhasil ${
          nextActive ? 'diaktifkan kembali' : 'dinonaktifkan'
        }.`,
      });
      fetchAllData(true);
    } catch (err) {
      // Rollback
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, isActive: !nextActive } : c))
      );
      setToastMsg({
        type: 'error',
        text: err instanceof ApiException ? err.message : 'Gagal memperbarui status kategori.',
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
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-400">Manajemen</span>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-600 font-medium">Kategori & Satuan</span>
                {dbConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Database Terhubung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Terputus
                  </span>
                )}
              </div>
              <h1 className="text-sm lg:text-base font-bold text-zinc-900 truncate">
                {formatIndonesianFullDate()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Refresh Button */}
            <button
              onClick={() => fetchAllData(true)}
              disabled={loading || refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 px-3 py-2 rounded-2xl transition-colors border border-zinc-200/60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Sinkronkan</span>
            </button>

            {/* Primary CTA Button */}
            <button
              onClick={openCreateDrawer}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === 'categories' ? 'Tambah Kategori' : 'Tambah Satuan'}</span>
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
                onClick={() => fetchAllData(true)}
                className="underline font-semibold text-rose-700 hover:text-rose-900"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TIER 1: 4 LIVE SUMMARY STAT CARDS                            */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Kategori */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Total Kategori</span>
                <div className="w-9 h-9 rounded-2xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">
                  {stats.totalCategories}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">Klasifikasi material toko</p>
              </div>
            </div>

            {/* Card 2: Kategori Aktif */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Kategori Aktif</span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">
                  {stats.activeCategories}
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">
                  Tampil pada etalase toko
                </p>
              </div>
            </div>

            {/* Card 3: Total Satuan Ukur */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Total Satuan Ukur</span>
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Ruler className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">
                  {stats.totalUnits}
                </p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">Master satuan unit</p>
              </div>
            </div>

            {/* Card 4: Mendukung Desimal */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500">Mendukung Desimal</span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-900">
                  {stats.decimalUnits}
                </p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  Contoh: Meter (0.5 m, 2.5 m)
                </p>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TIER 2: TAB SWITCHER & FILTER/SEARCH TOOLBAR                 */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-4 lg:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Segmented Tabs */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-2xl border border-zinc-200/60 w-full md:w-auto">
              <button
                onClick={() => {
                  setActiveTab('categories');
                  setSearch('');
                }}
                className={`flex-1 md:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'categories'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Kategori Produk</span>
                <span className="bg-zinc-200 text-zinc-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {stats.totalCategories}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('units');
                  setSearch('');
                }}
                className={`flex-1 md:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'units'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Ruler className="w-4 h-4" />
                <span>Satuan Ukur</span>
                <span className="bg-zinc-200 text-zinc-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {stats.totalUnits}
                </span>
              </button>
            </div>

            {/* Right: Search Input + Status/Type Filter */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    activeTab === 'categories'
                      ? 'Cari nama atau deskripsi kategori...'
                      : 'Cari nama satuan atau simbol...'
                  }
                  className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white placeholder:text-zinc-400"
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

              {/* Status/Type Filter Dropdown */}
              {activeTab === 'categories' ? (
                <div className="text-xs bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-2xl shrink-0">
                  <select
                    value={categoryStatusFilter}
                    onChange={(e) =>
                      setCategoryStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
                    }
                    className="bg-transparent font-semibold text-zinc-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">Hanya Aktif</option>
                    <option value="INACTIVE">Hanya Nonaktif</option>
                  </select>
                </div>
              ) : (
                <div className="text-xs bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-2xl shrink-0">
                  <select
                    value={unitTypeFilter}
                    onChange={(e) =>
                      setUnitTypeFilter(e.target.value as 'ALL' | 'DECIMAL' | 'INTEGER')
                    }
                    className="bg-transparent font-semibold text-zinc-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Satuan</option>
                    <option value="DECIMAL">Bisa Desimal</option>
                    <option value="INTEGER">Hanya Bilangan Bulat</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TIER 3A: CATEGORIES DATA TABLE (WHEN TAB === CATEGORIES)      */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-4 px-5">Nama Kategori</th>
                      <th className="py-4 px-5">Deskripsi</th>
                      <th className="py-4 px-4 text-center">Total Produk</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-zinc-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-zinc-300" />
                            <span className="text-xs">Memuat kategori dari database...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="max-w-xs mx-auto space-y-2 text-zinc-400">
                            <Layers className="w-10 h-10 mx-auto text-zinc-300" />
                            <p className="font-semibold text-zinc-700 text-sm">
                              Tidak ada kategori yang cocok
                            </p>
                            <p className="text-xs">
                              Coba sesuaikan kata kunci pencarian atau buat kategori baru.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat, idx) => {
                        const initialChar = cat.name ? cat.name.charAt(0).toUpperCase() : 'K';
                        const colorClass = INITIAL_COLORS[idx % INITIAL_COLORS.length];
                        const isActive = cat.isActive !== false;

                        return (
                          <tr
                            key={cat.id}
                            className="hover:bg-zinc-50/70 transition-colors group"
                          >
                            {/* Nama Kategori */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm border shrink-0 ${colorClass}`}
                                >
                                  {initialChar}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-zinc-900 group-hover:text-amber-600 transition-colors truncate">
                                    {cat.name}
                                  </p>
                                  <p className="text-[10px] text-zinc-400 font-mono">
                                    Slug: {cat.slug}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Deskripsi */}
                            <td className="py-4 px-5 text-zinc-600 max-w-md">
                              <p className="truncate text-xs">
                                {cat.description || (
                                  <span className="text-zinc-300 italic">
                                    Belum ada deskripsi kategori.
                                  </span>
                                )}
                              </p>
                            </td>

                            {/* Total Produk */}
                            <td className="py-4 px-4 text-center">
                              <span className="inline-block bg-zinc-100 text-zinc-800 font-semibold text-xs px-2.5 py-1 rounded-full">
                                {cat.productCount} Produk
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4 text-center">
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

                            {/* Aksi */}
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditCategoryDrawer(cat)}
                                  title="Edit Kategori"
                                  className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>

                                {isActive ? (
                                  <button
                                    onClick={() =>
                                      setConfirmModal({
                                        open: true,
                                        category: cat,
                                        action: 'deactivate',
                                      })
                                    }
                                    title="Nonaktifkan Kategori"
                                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  >
                                    <Power className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setConfirmModal({
                                        open: true,
                                        category: cat,
                                        action: 'activate',
                                      })
                                    }
                                    title="Aktifkan Kembali Kategori"
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

              {/* Table Footer */}
              <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
                <p>
                  Menampilkan{' '}
                  <strong className="text-zinc-800">{filteredCategories.length}</strong> dari{' '}
                  <strong className="text-zinc-800">{categories.length}</strong> kategori
                </p>
                <span className="text-[11px] text-zinc-400">
                  Data kategori tersinkronisasi 100% dengan tabel `categories` di PostgreSQL.
                </span>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TIER 3B: UNITS DATA TABLE (WHEN TAB === UNITS)                */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'units' && (
            <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-4 px-5">Nama Satuan</th>
                      <th className="py-4 px-5">Simbol Satuan</th>
                      <th className="py-4 px-5">Format Kuantitas (Desimal)</th>
                      <th className="py-4 px-4 text-center">Produk Terkait</th>
                      <th className="py-4 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-zinc-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-zinc-300" />
                            <span className="text-xs">Memuat satuan ukuran...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUnits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="max-w-xs mx-auto space-y-2 text-zinc-400">
                            <Ruler className="w-10 h-10 mx-auto text-zinc-300" />
                            <p className="font-semibold text-zinc-700 text-sm">
                              Tidak ada satuan yang cocok
                            </p>
                            <p className="text-xs">
                              Coba sesuaikan kata kunci pencarian atau daftarkan satuan baru.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUnits.map((unit) => (
                        <tr
                          key={unit.id}
                          className="hover:bg-zinc-50/70 transition-colors group"
                        >
                          {/* Nama Satuan */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-bold text-sm shrink-0">
                                {unit.unitSymbol || 'U'}
                              </div>
                              <span className="font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                                {unit.unitName}
                              </span>
                            </div>
                          </td>

                          {/* Simbol Satuan */}
                          <td className="py-4 px-5">
                            <span className="font-mono font-bold text-xs bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200/70">
                              {unit.unitSymbol}
                            </span>
                          </td>

                          {/* Format Kuantitas (Desimal) */}
                          <td className="py-4 px-5">
                            {unit.allowDecimal ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-full">
                                <Check className="w-3.5 h-3.5 text-blue-600" />
                                Mendukung Desimal (contoh: 0.5 m, 2.5 m)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-full">
                                Bilangan Bulat (contoh: 1, 2, 10)
                              </span>
                            )}
                          </td>

                          {/* Produk Terkait */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-block bg-zinc-100 text-zinc-800 font-semibold text-xs px-2.5 py-1 rounded-full">
                              {unit.productCount || 0} Produk
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditUnitDrawer(unit)}
                                title="Edit Satuan"
                                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
                <p>
                  Menampilkan <strong className="text-zinc-800">{filteredUnits.length}</strong> dari{' '}
                  <strong className="text-zinc-800">{units.length}</strong> satuan ukuran
                </p>
                <span className="text-[11px] text-zinc-400">
                  Data satuan tersinkronisasi 100% dengan tabel `units` di PostgreSQL.
                </span>
              </div>
            </div>
          )}
        </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TIER 4: SLIDE-OUT DRAWER (CREATE & EDIT CATEGORY / UNIT)            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => !saving && setDrawerOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-16 px-6 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="font-bold text-zinc-900 text-base">
                  {activeTab === 'categories'
                    ? editingCategory
                      ? `Edit Kategori • ${editingCategory.name}`
                      : 'Tambah Kategori Baru'
                    : editingUnit
                    ? `Edit Satuan • ${editingUnit.unitName}`
                    : 'Tambah Satuan Ukur'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {activeTab === 'categories'
                    ? 'Kelola struktur klasifikasi material Toko Enstein'
                    : 'Konfigurasi master satuan ukuran & desimal kuantitas'}
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

            {/* Form Body: Category Mode */}
            {activeTab === 'categories' ? (
              <form
                onSubmit={handleSaveCategory}
                className="flex-1 overflow-y-auto p-6 space-y-5 bg-zinc-50/50"
              >
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
                  {/* Category Name */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Nama Kategori <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, name: e.target.value })
                      }
                      placeholder="Contoh: Material Jas Hujan"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${
                        formErrors.name ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'
                      } focus:outline-none focus:ring-2 focus:ring-zinc-900`}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Slug (Optional / Auto-generated) */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Slug URL <span className="text-zinc-400 text-[10px]">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={categoryForm.slug}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase() })
                      }
                      placeholder="material-jas-hujan (otomatis dibuat jika kosong)"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Deskripsi Kategori
                    </label>
                    <textarea
                      rows={3}
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, description: e.target.value })
                      }
                      placeholder="Deskripsikan material atau perlengkapan yang masuk dalam kategori ini..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                    />
                  </div>

                  {/* Active Switch */}
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">
                        Status Kategori (Aktif di Katalog)
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Kategori aktif akan tampil di filter beranda dan menu navigasi
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={categoryForm.isActive}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, isActive: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>
                </div>
              </form>
            ) : (
              /* Form Body: Unit Mode */
              <form
                onSubmit={handleSaveUnit}
                className="flex-1 overflow-y-auto p-6 space-y-5 bg-zinc-50/50"
              >
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
                  {/* Unit Name */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Nama Satuan Ukur <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={unitForm.unitName}
                      onChange={(e) =>
                        setUnitForm({ ...unitForm, unitName: e.target.value })
                      }
                      placeholder="Contoh: Meter, Roll, Pcs, Kilogram"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${
                        formErrors.unitName ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'
                      } focus:outline-none focus:ring-2 focus:ring-zinc-900`}
                    />
                    {formErrors.unitName && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.unitName}</p>
                    )}
                  </div>

                  {/* Unit Symbol */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Simbol Satuan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={unitForm.unitSymbol}
                      onChange={(e) =>
                        setUnitForm({ ...unitForm, unitSymbol: e.target.value })
                      }
                      placeholder="Contoh: m, roll, pcs, kg"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl border ${
                        formErrors.unitSymbol ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'
                      } focus:outline-none focus:ring-2 focus:ring-zinc-900`}
                    />
                    {formErrors.unitSymbol && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.unitSymbol}</p>
                    )}
                  </div>

                  {/* Decimal Allow Switch with Informational Card */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-blue-950">
                          Izinkan Kuantitas Desimal (allow_decimal)
                        </p>
                        <p className="text-[11px] text-blue-700 mt-0.5">
                          Mengizinkan pelanggan membeli kuantitas pecahan
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={unitForm.allowDecimal}
                          onChange={(e) =>
                            setUnitForm({ ...unitForm, allowDecimal: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                    </div>

                    <p className="text-[11px] text-blue-800 leading-relaxed border-t border-blue-200/60 pt-2">
                      💡 <strong>Petunjuk:</strong> Aktifkan untuk bahan yang dijual per meteran atau
                      pecahan (misal: 0.5 m, 2.5 m). Matikan untuk barang berwujud satuan utuh seperti
                      kancing, resleting, atau stopper tali.
                    </p>
                  </div>
                </div>
              </form>
            )}

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
                onClick={activeTab === 'categories' ? handleSaveCategory : handleSaveUnit}
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
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DEACTIVATE / REACTIVATE CATEGORY CONFIRMATION MODAL                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {confirmModal.open && confirmModal.category && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setConfirmModal({ open: false, category: null, action: 'deactivate' })}
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
                    ? `Nonaktifkan Kategori "${confirmModal.category.name}"?`
                    : `Aktifkan Kembali Kategori "${confirmModal.category.name}"?`}
                </h4>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  {confirmModal.action === 'deactivate' ? (
                    <>
                      Kategori ini akan disembunyikan dari navigasi toko online.{' '}
                      {confirmModal.category.productCount > 0 && (
                        <strong className="text-amber-700 block mt-1">
                          ⚠️ Peringatan: Terdapat {confirmModal.category.productCount} produk aktif
                          terkait dalam kategori ini.
                        </strong>
                      )}
                    </>
                  ) : (
                    'Kategori ini akan kembali aktif dan ditampilkan pada navigasi katalog pelanggan.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() =>
                  setConfirmModal({ open: false, category: null, action: 'deactivate' })
                }
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteCategoryStatusChange}
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
