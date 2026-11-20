'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Boxes,
  Store,
  BarChart3,
  Search,
  Plus,
  Pencil,
  PowerOff,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Filter,
  ChevronRight,
  ExternalLink,
  LogOut,
  Bell,
  Calendar,
  Menu,
  Eye,
  RefreshCw,
  Info,
  Ruler,
  FolderTree,
} from 'lucide-react';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  productCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface UnitItem {
  id: string;
  name: string;
  symbol: string;
  allowDecimal: boolean; // PRD 13.4.5 & 6.3: allow fractional inputs like 2.5
  productCount: number;
  exampleUsage: string;
  createdAt: string;
}

// Mock Categories tailored to Toko Enstein rainwear business (PRD 9.3.3 & 13.4.4)
const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    name: 'Material Jas Hujan',
    description: 'Kain PVC balon, mika transparan, taslan balon, dan oxford waterproof untuk konveksi jas hujan.',
    productCount: 24,
    isActive: true,
    createdAt: '11 Nov 2026',
  },
  {
    id: 'cat-2',
    name: 'Resleting',
    description: 'Resleting waterproof zipper, vislon heavy-duty, dan coil halus berbagai ukuran panjang.',
    productCount: 18,
    isActive: true,
    createdAt: '11 Nov 2026',
  },
  {
    id: 'cat-3',
    name: 'Kancing',
    description: 'Kancing jepret / snap button plastik polyacetal dan kancing cetik besi anti karat.',
    productCount: 16,
    isActive: true,
    createdAt: '11 Nov 2026',
  },
  {
    id: 'cat-4',
    name: 'Karet',
    description: 'Karet elastis elastomeric untuk pinggang celana, pergelangan tangan, dan tudung jas hujan.',
    productCount: 12,
    isActive: true,
    createdAt: '11 Nov 2026',
  },
  {
    id: 'cat-5',
    name: 'Aksesori',
    description: 'Seam sealing tape panas, stopper tali, mata ayam / eyelet, dan tali kur elastis.',
    productCount: 20,
    isActive: true,
    createdAt: '11 Nov 2026',
  },
  {
    id: 'cat-6',
    name: 'Perlengkapan Jahit',
    description: 'Benang nilon waterproof, jarum jahit tebal nomor 16-18, dan gunting bahan PVC.',
    productCount: 6,
    isActive: false, // Inactive example to test status toggling
    createdAt: '12 Nov 2026',
  },
];

// Mock Units (PRD 13.4.5 & 6.3)
const INITIAL_UNITS: UnitItem[] = [
  {
    id: 'unit-1',
    name: 'Meter',
    symbol: 'm',
    allowDecimal: true, // Decimal allowed (e.g. 2.5 m, 10.75 m)
    productCount: 42,
    exampleUsage: 'Kain PVC Balon, Karet Elastis, Seam Sealing Tape',
    createdAt: '11 Nov 2026',
  },
  {
    id: 'unit-2',
    name: 'Piece',
    symbol: 'pcs',
    allowDecimal: false, // Integer only (e.g. 1 pcs, 10 pcs)
    productCount: 38,
    exampleUsage: 'Resleting Waterproof, Kancing Snap Besi, Stopper Tali',
    createdAt: '11 Nov 2026',
  },
  {
    id: 'unit-3',
    name: 'Roll',
    symbol: 'roll',
    allowDecimal: false,
    productCount: 14,
    exampleUsage: 'Roll Seam Sealing Tape 100m, Roll Karet Elastis',
    createdAt: '11 Nov 2026',
  },
  {
    id: 'unit-4',
    name: 'Pack',
    symbol: 'pack',
    allowDecimal: false,
    productCount: 19,
    exampleUsage: 'Kancing Snap Plastik Putih (100 pcs/pack), Eyelet pack',
    createdAt: '11 Nov 2026',
  },
  {
    id: 'unit-5',
    name: 'Kilogram',
    symbol: 'kg',
    allowDecimal: true, // Decimal allowed (e.g. 1.5 kg lem PVC)
    productCount: 5,
    exampleUsage: 'Lem PVC Khusus Tambal Jas Hujan, Cairan Sealant',
    createdAt: '12 Nov 2026',
  },
  {
    id: 'unit-6',
    name: 'Yard',
    symbol: 'yd',
    allowDecimal: true,
    productCount: 3,
    exampleUsage: 'Kain Taslan Impor Balon (Satuan Konveksi Ekspor)',
    createdAt: '14 Nov 2026',
  },
];

// ============================================================================
// MAIN COMPONENT: ADMIN CATEGORIES & UNITS
// ============================================================================

export default function AdminCategoriesPage() {
  // Navigation & UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Tab State: 'categories' | 'units'
  const [activeTab, setActiveTab] = useState<'categories' | 'units'>('categories');

  // Datasets
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [units, setUnits] = useState<UnitItem[]>(INITIAL_UNITS);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [unitDecimalFilter, setUnitDecimalFilter] = useState<'ALL' | 'DECIMAL' | 'INTEGER'>('ALL');

  // Slide-out Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'CATEGORY' | 'UNIT'>('CATEGORY');
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);

  // Form State: Category
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Form State: Unit
  const [unitFormData, setUnitFormData] = useState({
    name: '',
    symbol: '',
    allowDecimal: false,
    exampleUsage: '',
  });

  // Soft Deactivate Modal State
  const [deactivatingCategory, setDeactivatingCategory] = useState<CategoryItem | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Open Drawer: Add Category
  const handleOpenAddCategory = () => {
    setDrawerMode('CATEGORY');
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      isActive: true,
    });
    setIsDrawerOpen(true);
  };

  // Open Drawer: Edit Category
  const handleOpenEditCategory = (cat: CategoryItem) => {
    setDrawerMode('CATEGORY');
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name,
      description: cat.description,
      isActive: cat.isActive,
    });
    setIsDrawerOpen(true);
  };

  // Open Drawer: Add Unit
  const handleOpenAddUnit = () => {
    setDrawerMode('UNIT');
    setEditingUnit(null);
    setUnitFormData({
      name: '',
      symbol: '',
      allowDecimal: false,
      exampleUsage: '',
    });
    setIsDrawerOpen(true);
  };

  // Open Drawer: Edit Unit
  const handleOpenEditUnit = (unit: UnitItem) => {
    setDrawerMode('UNIT');
    setEditingUnit(unit);
    setUnitFormData({
      name: unit.name,
      symbol: unit.symbol,
      allowDecimal: unit.allowDecimal,
      exampleUsage: unit.exampleUsage,
    });
    setIsDrawerOpen(true);
  };

  // Save Category Handler
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      setToastMessage({
        title: 'Nama Kategori Wajib Diisi',
        desc: 'Mohon masukkan nama kategori sebelum menyimpan.',
        type: 'warning',
      });
      return;
    }

    if (editingCategory) {
      // Update
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: categoryFormData.name,
                description: categoryFormData.description,
                isActive: categoryFormData.isActive,
              }
            : c
        )
      );
      setToastMessage({
        title: 'Kategori Diperbarui',
        desc: `Kategori "${categoryFormData.name}" berhasil disimpan.`,
        type: 'success',
      });
    } else {
      // Create new
      const newCat: CategoryItem = {
        id: `cat-${Date.now().toString().slice(-4)}`,
        name: categoryFormData.name,
        description: categoryFormData.description,
        productCount: 0,
        isActive: categoryFormData.isActive,
        createdAt: '17 Nov 2026',
      };
      setCategories((prev) => [newCat, ...prev]);
      setToastMessage({
        title: 'Kategori Ditambahkan',
        desc: `Kategori baru "${categoryFormData.name}" berhasil dibuat.`,
        type: 'success',
      });
    }
    setIsDrawerOpen(false);
  };

  // Save Unit Handler
  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitFormData.name.trim() || !unitFormData.symbol.trim()) {
      setToastMessage({
        title: 'Formulir Belum Lengkap',
        desc: 'Nama satuan dan simbol satuan wajib diisi.',
        type: 'warning',
      });
      return;
    }

    if (editingUnit) {
      // Update
      setUnits((prev) =>
        prev.map((u) =>
          u.id === editingUnit.id
            ? {
                ...u,
                name: unitFormData.name,
                symbol: unitFormData.symbol,
                allowDecimal: unitFormData.allowDecimal,
                exampleUsage: unitFormData.exampleUsage,
              }
            : u
        )
      );
      setToastMessage({
        title: 'Satuan Ukur Diperbarui',
        desc: `Satuan "${unitFormData.name} (${unitFormData.symbol})" berhasil disimpan. Aturan desimal diperbarui.`,
        type: 'success',
      });
    } else {
      // Create new
      const newUnit: UnitItem = {
        id: `unit-${Date.now().toString().slice(-4)}`,
        name: unitFormData.name,
        symbol: unitFormData.symbol,
        allowDecimal: unitFormData.allowDecimal,
        productCount: 0,
        exampleUsage: unitFormData.exampleUsage || 'Produk Baru',
        createdAt: '17 Nov 2026',
      };
      setUnits((prev) => [newUnit, ...prev]);
      setToastMessage({
        title: 'Satuan Ukur Ditambahkan',
        desc: `Satuan "${unitFormData.name} (${unitFormData.symbol})" berhasil didaftarkan ke sistem.`,
        type: 'success',
      });
    }
    setIsDrawerOpen(false);
  };

  // Toggle Category Active Status
  const handleConfirmToggleCategory = () => {
    if (!deactivatingCategory) return;
    const nextStatus = !deactivatingCategory.isActive;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === deactivatingCategory.id ? { ...c, isActive: nextStatus } : c
      )
    );
    setToastMessage({
      title: nextStatus ? 'Kategori Diaktifkan' : 'Kategori Dinonaktifkan',
      desc: nextStatus
        ? `Kategori "${deactivatingCategory.name}" kini dapat dipilih kembali untuk produk baru.`
        : `Kategori "${deactivatingCategory.name}" dinonaktifkan tanpa menghapus produk terkait.`,
      type: nextStatus ? 'success' : 'warning',
    });
    setDeactivatingCategory(null);
  };

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesStatus = true;
      if (categoryStatusFilter === 'ACTIVE') matchesStatus = c.isActive;
      if (categoryStatusFilter === 'INACTIVE') matchesStatus = !c.isActive;
      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, categoryStatusFilter]);

  // Filtered Units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.exampleUsage.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesDecimal = true;
      if (unitDecimalFilter === 'DECIMAL') matchesDecimal = u.allowDecimal;
      if (unitDecimalFilter === 'INTEGER') matchesDecimal = !u.allowDecimal;
      return matchesSearch && matchesDecimal;
    });
  }, [units, searchQuery, unitDecimalFilter]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased flex flex-col">
      {/* =====================================================================
          1. THE STANDARDIZED ADMIN SIDEBAR
          (Strictly using established brand header & obsidian palette)
      ===================================================================== */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`w-64 fixed inset-y-0 left-0 h-screen bg-zinc-950 text-zinc-300 border-r border-zinc-900 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* TOP BRAND HEADER (h-20 px-6 flex items-center border-b border-zinc-900/50) */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-zinc-900/50 shrink-0">
          <div className="flex items-center">
            {/* Red Geometric Logo */}
            <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center text-white font-black text-sm mr-3 transform -skew-x-6 shadow-sm">
              E
            </div>

            {/* Brand Name */}
            <div className="flex items-center">
              <span className="text-white font-bold tracking-tight text-lg">ENSTEIN</span>
              <span className="text-amber-500 font-bold tracking-tight text-lg">STORE</span>
            </div>

            {/* Sleek Admin Badge */}
            <span className="ml-3 bg-white/10 text-white border border-white/20 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded uppercase backdrop-blur-sm">
              ADMIN
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MIDDLE NAV LINKS */}
        <div className="px-4 py-6 space-y-1 overflow-y-auto flex-1">
          <p className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-3 px-2">
            MENU UTAMA
          </p>
          <nav className="space-y-1">
            {/* Dashboard */}
            <Link
              href="/admin/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            {/* Products */}
            <Link
              href="/admin/products"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Produk</span>
              <span className="text-[11px] text-zinc-500 font-mono ml-auto">48</span>
            </Link>

            {/* Categories (ACTIVE) */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl bg-zinc-900 text-white shadow-xs transition-all"
            >
              <Layers className="w-4 h-4 text-zinc-200" />
              <span>Kategori &amp; Satuan</span>
              <span className="text-[11px] text-zinc-400 font-mono ml-auto">
                {categories.length + units.length}
              </span>
            </button>

            {/* Orders */}
            <Link
              href="/admin/orders"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pesanan</span>
              <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                4 Baru
              </span>
            </Link>

            {/* Inventory */}
            <Link
              href="/admin/inventory"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <Boxes className="w-4 h-4" />
              <span>Inventaris</span>
              <span className="ml-auto bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                5 Kritis
              </span>
            </Link>
          </nav>

          {/* Section: OPERASIONAL TOKO */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-3 px-2">
              OPERASIONAL TOKO
            </p>
            <nav className="space-y-1">
              <Link
                href="/admin/offline"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
              >
                <Store className="w-4 h-4" />
                <span>Penjualan Offline</span>
                <span className="ml-auto bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase">
                  POS
                </span>
              </Link>

              <Link
                href="/admin/reports"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Laporan</span>
                <span className="ml-auto text-[11px] text-zinc-500 font-mono">CSV</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* BOTTOM PROFILE */}
        <div className="p-4 border-t border-zinc-900/50 space-y-3 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/60 rounded-xl transition-all group"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
              Lihat Toko Publik
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-2xl hover:bg-zinc-800 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-xs ring-1 ring-zinc-700">
                  PE
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-zinc-950"></span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Pak Enstein</p>
                <p className="text-[11px] text-zinc-400 truncate">Owner &amp; Admin</p>
              </div>
            </div>

            <button
              onClick={() => {
                setToastMessage({
                  title: 'Logout Admin',
                  desc: 'Sesi admin aman. Anda dapat masuk kembali kapan saja.',
                  type: 'info',
                });
              }}
              title="Keluar dari Panel Admin"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          2. MAIN CONTENT AREA (Offset by sidebar width: ml-64)
      ===================================================================== */}
      <div className="md:ml-64 flex-1 min-h-screen bg-zinc-50 flex flex-col">
        {/* TOPBAR */}
        <header className="h-20 bg-white border-b border-zinc-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-400 font-medium">Manajemen</span>
              <span className="text-zinc-300">/</span>
              <span className="text-zinc-900 font-semibold tracking-tight">Kategori &amp; Satuan</span>
              <span className="hidden sm:inline-flex ml-3 items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Database Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Selasa, 17 Nov 2026</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                title="Pemberitahuan Sistem"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl p-4 z-50 text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <h4 className="font-bold text-sm text-zinc-900">Notifikasi Master Data</h4>
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      Tersinkron
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                    Seluruh kategori dan konfigurasi desimal satuan ukur (PRD 6.3) berjalan sesuai integritas database PostgreSQL.
                  </p>
                  <div className="pt-2 mt-2 border-t border-zinc-100 text-center">
                    <button
                      onClick={() => setNotificationOpen(false)}
                      className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-zinc-300 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  PE
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* ===================================================================
            PAGE HEADER & SLEEK TAB SWITCHER
        =================================================================== */}
        <div className="bg-white border-b border-zinc-200 px-6 sm:px-8 pt-8 shadow-xs">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                  Kategori &amp; Satuan Ukur
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Atur hierarki kategori bahan jas hujan dan definisi satuan kuantitas (termasuk desimal per meter).
                </p>
              </div>

              {/* Action Button for currently active tab */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setToastMessage({
                      title: 'Data Disinkronkan',
                      desc: 'Struktur kategori dan satuan berhasil divalidasi ulang.',
                      type: 'info',
                    });
                  }}
                  className="p-2.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 rounded-xl shadow-xs transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {activeTab === 'categories' ? (
                  <button
                    onClick={handleOpenAddCategory}
                    className="bg-zinc-900 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xs text-sm font-semibold active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Kategori</span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenAddUnit}
                    className="bg-zinc-900 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xs text-sm font-semibold active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Satuan</span>
                  </button>
                )}
              </div>
            </div>

            {/* SLEEK TAB SWITCHER (flex gap-6 border-b border-zinc-200 mt-6) */}
            <div className="flex gap-8 mt-6">
              <button
                onClick={() => {
                  setActiveTab('categories');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2.5 pb-4 text-sm font-semibold transition-all cursor-pointer relative ${
                  activeTab === 'categories'
                    ? 'border-b-2 border-zinc-900 text-zinc-900 font-bold'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                <span>Kategori Produk</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-mono">
                  {categories.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('units');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2.5 pb-4 text-sm font-semibold transition-all cursor-pointer relative ${
                  activeTab === 'units'
                    ? 'border-b-2 border-zinc-900 text-zinc-900 font-bold'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Ruler className="w-4 h-4" />
                <span>Satuan Ukur</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-mono">
                  {units.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================
            MAIN CONTENT CANVAS
        =================================================================== */}
        <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* =================================================================
              3. CATEGORIES TABLE TAB
          ================================================================= */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Category Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari nama atau deskripsi kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <select
                      value={categoryStatusFilter}
                      onChange={(e) => setCategoryStatusFilter(e.target.value as any)}
                      className="appearance-none bg-white border border-zinc-200 rounded-lg px-4 py-2 pr-9 text-xs font-semibold text-zinc-700 hover:border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 shadow-xs cursor-pointer transition-colors"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="ACTIVE">Aktif Saja</option>
                      <option value="INACTIVE">Nonaktif Saja</option>
                    </select>
                    <Filter className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* The Categories Table */}
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="py-4 px-6">NAMA KATEGORI</th>
                        <th className="py-4 px-6">DESKRIPSI</th>
                        <th className="py-4 px-6 text-center">TOTAL PRODUK</th>
                        <th className="py-4 px-6">STATUS</th>
                        <th className="py-4 px-6 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat) => (
                          <tr
                            key={cat.id}
                            className="hover:bg-zinc-50/70 transition-colors group"
                          >
                            {/* Nama Kategori */}
                            <td className="py-4 px-6 font-semibold text-zinc-900 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-xs shrink-0 border border-zinc-200">
                                  {cat.name.slice(0, 1)}
                                </span>
                                <div>
                                  <span className="block text-zinc-900 font-semibold group-hover:text-zinc-950">
                                    {cat.name}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    ID: {cat.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Deskripsi */}
                            <td className="py-4 px-6 text-zinc-500 max-w-sm">
                              <p className="line-clamp-2 text-xs leading-relaxed">
                                {cat.description || '-'}
                              </p>
                            </td>

                            {/* Total Produk */}
                            <td className="py-4 px-6 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono">
                                {cat.productCount} Produk
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-6 whitespace-nowrap">
                              {cat.isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                  Nonaktif
                                </span>
                              )}
                            </td>

                            {/* Aksi */}
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditCategory(cat)}
                                  title="Edit Kategori"
                                  className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeactivatingCategory(cat)}
                                  title={cat.isActive ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori'}
                                  className={`p-2 rounded-lg transition-colors ${
                                    cat.isActive
                                      ? 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
                                      : 'text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                >
                                  {cat.isActive ? (
                                    <PowerOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4 text-emerald-600" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-zinc-400">
                            <Layers className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                            <p className="text-sm font-semibold text-zinc-700">
                              Tidak ada kategori ditemukan
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                              Coba periksa kata kunci pencarian atau buat kategori baru.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    Menampilkan <strong>{filteredCategories.length}</strong> dari{' '}
                    <strong>{categories.length}</strong> kategori
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Sesuai PRD 9.3.3 &amp; 13.4.4
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              4. UNITS TABLE TAB (PRD 13.4.5 & 6.3)
          ================================================================= */}
          {activeTab === 'units' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Unit Info Banner */}
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4.5 flex items-start gap-3.5 text-xs text-blue-900">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-blue-950">
                    Aturan Bisnis Kuantitas Desimal (PRD 6.3 &amp; 13.4.5)
                  </h4>
                  <p className="text-blue-800 leading-relaxed">
                    Satuan dengan tanda <strong>&quot;Ya, Desimal&quot;</strong> (misal <strong>Meter</strong>) mengizinkan pelanggan membeli kuantitas desimal seperti <strong>2,5 meter</strong> atau <strong>10,75 meter</strong>. Satuan <strong>&quot;Hanya Bulat&quot;</strong> (misal <strong>Pcs, Roll</strong>) akan ditolak oleh backend jika dimasukkan nilai pecahan.
                  </p>
                </div>
              </div>

              {/* Unit Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari nama atau simbol satuan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <select
                      value={unitDecimalFilter}
                      onChange={(e) => setUnitDecimalFilter(e.target.value as any)}
                      className="appearance-none bg-white border border-zinc-200 rounded-lg px-4 py-2 pr-9 text-xs font-semibold text-zinc-700 hover:border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 shadow-xs cursor-pointer transition-colors"
                    >
                      <option value="ALL">Semua Aturan Kuantitas</option>
                      <option value="DECIMAL">Bisa Desimal (Pecahan)</option>
                      <option value="INTEGER">Hanya Bilangan Bulat</option>
                    </select>
                    <Filter className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* The Units Table */}
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="py-4 px-6">NAMA SATUAN</th>
                        <th className="py-4 px-6">SIMBOL</th>
                        <th className="py-4 px-6">IZINKAN DESIMAL?</th>
                        <th className="py-4 px-6">CONTOH PENGGUNAAN PRODUK</th>
                        <th className="py-4 px-6 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      {filteredUnits.length > 0 ? (
                        filteredUnits.map((unit) => (
                          <tr
                            key={unit.id}
                            className="hover:bg-zinc-50/70 transition-colors group"
                          >
                            {/* Nama Satuan */}
                            <td className="py-4 px-6 font-semibold text-zinc-900 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-xs shrink-0 border border-zinc-200">
                                  {unit.symbol.slice(0, 2)}
                                </span>
                                <div>
                                  <span className="block font-semibold text-zinc-900 group-hover:text-zinc-950">
                                    {unit.name}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    {unit.productCount} Produk Memakai
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Simbol */}
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className="font-mono text-xs font-bold text-zinc-800 bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200">
                                {unit.symbol}
                              </span>
                            </td>

                            {/* Izinkan Desimal */}
                            <td className="py-4 px-6 whitespace-nowrap">
                              {unit.allowDecimal ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                                  <Check className="w-3.5 h-3.5 text-blue-600" />
                                  Ya, Desimal (misal 2.5)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                  Hanya Bulat (1, 2, 3...)
                                </span>
                              )}
                            </td>

                            {/* Contoh Penggunaan */}
                            <td className="py-4 px-6 text-zinc-500 max-w-xs truncate">
                              <span className="text-zinc-600 text-xs font-medium">
                                {unit.exampleUsage}
                              </span>
                            </td>

                            {/* Aksi */}
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleOpenEditUnit(unit)}
                                title="Edit Satuan Ukur"
                                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-zinc-400">
                            <Ruler className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                            <p className="text-sm font-semibold text-zinc-700">
                              Tidak ada satuan ukur ditemukan
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    Menampilkan <strong>{filteredUnits.length}</strong> dari{' '}
                    <strong>{units.length}</strong> satuan ukur
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Atribut: units.allow_decimal (PostgreSQL boolean)
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          5. DYNAMIC SLIDE-OUT DRAWER (For Categories & Units)
      ===================================================================== */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-zinc-200 z-50 flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="h-20 px-6 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-zinc-50/50">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                  {drawerMode === 'CATEGORY'
                    ? editingCategory
                      ? 'Edit Kategori Produk'
                      : 'Tambah Kategori Baru'
                    : editingUnit
                    ? 'Edit Satuan Ukur'
                    : 'Tambah Satuan Ukur Baru'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {drawerMode === 'CATEGORY'
                    ? 'Kelola pengelompokan produk bahan jas hujan'
                    : 'Tentukan unit hitung dan validasi kuantitas desimal'}
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: CATEGORY FORM */}
            {drawerMode === 'CATEGORY' && (
              <form
                id="category-drawer-form"
                onSubmit={handleSaveCategory}
                className="flex-1 overflow-y-auto p-6 space-y-5 text-xs"
              >
                {/* Nama Kategori */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Nama Kategori <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Material Jas Hujan, Resleting, Karet..."
                    value={categoryFormData.name}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, name: e.target.value })
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Deskripsi Kategori
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Jelaskan jenis bahan dan komponen yang termasuk dalam kategori ini..."
                    value={categoryFormData.description}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, description: e.target.value })
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all resize-none"
                  />
                </div>

                {/* Status Toggle Switch */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <div>
                    <p className="text-xs font-bold text-zinc-900">
                      Status Kategori: {categoryFormData.isActive ? 'Aktif' : 'Nonaktif'}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Kategori aktif akan tampil di menu navigasi katalog dan form tambah produk.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCategoryFormData({
                        ...categoryFormData,
                        isActive: !categoryFormData.isActive,
                      })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-hidden ${
                      categoryFormData.isActive ? 'bg-zinc-900' : 'bg-zinc-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        categoryFormData.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </form>
            )}

            {/* Drawer Body: UNIT FORM */}
            {drawerMode === 'UNIT' && (
              <form
                id="unit-drawer-form"
                onSubmit={handleSaveUnit}
                className="flex-1 overflow-y-auto p-6 space-y-5 text-xs"
              >
                {/* Nama Satuan */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Nama Satuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Meter, Piece, Roll, Pack..."
                    value={unitFormData.name}
                    onChange={(e) =>
                      setUnitFormData({ ...unitFormData, name: e.target.value })
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                </div>

                {/* Simbol Satuan */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Simbol Satuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: m, pcs, roll, kg..."
                    value={unitFormData.symbol}
                    onChange={(e) =>
                      setUnitFormData({ ...unitFormData, symbol: e.target.value })
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Simbol ringkas yang ditampilkan di tabel harga dan keranjang (e.g. Rp 25.000/m).
                  </p>
                </div>

                {/* Allow Decimal Toggle (CRITICAL PRD 6.3 & 13.4.5) */}
                <div className="pt-2 border-t border-zinc-100 flex items-start justify-between bg-blue-50/50 p-3.5 rounded-xl border border-blue-200/80">
                  <div className="pr-4">
                    <p className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <span>Izinkan Kuantitas Desimal?</span>
                      {unitFormData.allowDecimal && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.2 rounded-full font-bold">
                          Aktif
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                      Aktifkan jika produk bisa dibeli dalam pecahan desimal (contoh: <strong>2,5 meter kain</strong>). Jika nonaktif, backend akan menolak input pecahan dan hanya mengizinkan bilangan bulat (contoh: <strong>1 pcs resleting</strong>).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setUnitFormData({
                        ...unitFormData,
                        allowDecimal: !unitFormData.allowDecimal,
                      })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-hidden shrink-0 mt-0.5 ${
                      unitFormData.allowDecimal ? 'bg-blue-600' : 'bg-zinc-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        unitFormData.allowDecimal ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Contoh Penggunaan */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Contoh Produk yang Menggunakan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kain PVC Balon, Karet Elastis..."
                    value={unitFormData.exampleUsage}
                    onChange={(e) =>
                      setUnitFormData({ ...unitFormData, exampleUsage: e.target.value })
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                </div>
              </form>
            )}

            {/* Drawer Footer */}
            <div className="p-4 px-6 border-t border-zinc-200 flex items-center justify-end gap-3 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form={drawerMode === 'CATEGORY' ? 'category-drawer-form' : 'unit-drawer-form'}
                className="bg-zinc-900 text-white px-5 py-2 text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>
                  {drawerMode === 'CATEGORY'
                    ? editingCategory
                      ? 'Simpan Perubahan'
                      : 'Simpan Kategori'
                    : editingUnit
                    ? 'Simpan Perubahan'
                    : 'Simpan Satuan'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SOFT TOGGLE MODAL (CATEGORIES)
      ===================================================================== */}
      {deactivatingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  deactivatingCategory.isActive
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {deactivatingCategory.isActive ? (
                  <PowerOff className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-zinc-900">
                  {deactivatingCategory.isActive
                    ? 'Nonaktifkan Kategori Ini?'
                    : 'Aktifkan Kembali Kategori Ini?'}
                </h3>
                <p className="text-xs font-semibold text-zinc-800 mt-1">
                  {deactivatingCategory.name} ({deactivatingCategory.productCount} Produk Terkait)
                </p>

                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 mt-3 text-[11px] text-zinc-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                    <Info className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Integritas Hubungan Data (Foreign Key):</span>
                  </div>
                  <p>
                    {deactivatingCategory.isActive
                      ? 'Kategori tidak akan dihapus permanen agar produk yang telah ada tetap memiliki referensi yang valid. Kategori hanya disembunyikan dari katalog dan form baru.'
                      : 'Kategori akan kembali aktif dan dapat dipilih di form penambahan produk.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeactivatingCategory(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmToggleCategory}
                className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                  deactivatingCategory.isActive
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                {deactivatingCategory.isActive ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOAST NOTIFICATION FEEDBACK
      ===================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl border border-zinc-800 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
              toastMessage.type === 'warning'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {toastMessage.type === 'warning' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold text-white">{toastMessage.title}</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
              {toastMessage.desc}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
