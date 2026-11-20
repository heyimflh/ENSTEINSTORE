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
  UploadCloud,
  ImageIcon,
  Filter,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  LogOut,
  Bell,
  Calendar,
  Menu,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
} from 'lucide-react';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface AdminProduct {
  id: string;
  name: string;
  code: string; // SKU
  categoryId: string;
  categoryName: string;
  unit: 'Meter' | 'Pcs' | 'Roll' | 'Pack';
  price: number;
  stock: number;
  minStock: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
  hasTransactions: boolean; // For BR-13 & FR-31 Soft Delete rule
}

// Initial Mock Dataset tailored to Toko Enstein rainwear business
const INITIAL_PRODUCTS: AdminProduct[] = [
  {
    id: 'PRD-BHN-001',
    name: 'PVC Super Ketebalan 0.25',
    code: 'PRD-BHN-001',
    categoryId: 'cat-1',
    categoryName: 'Material Jas Hujan',
    unit: 'Meter',
    price: 35000,
    stock: 150,
    minStock: 20,
    description: 'Kain PVC super tebal 0.25mm lentur waterproof premium untuk jas hujan setelan dan mantel.',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
    isActive: true,
    hasTransactions: true,
  },
  {
    id: 'PRD-BHN-002',
    name: 'PVC New Fantastik Ketebalan 0.18',
    code: 'PRD-BHN-002',
    categoryId: 'cat-1',
    categoryName: 'Material Jas Hujan',
    unit: 'Meter',
    price: 28000,
    stock: 200,
    minStock: 25,
    description: 'Bahan PVC New Fantastik 0.18mm warna Navy elegan, lentur, tahan robek, dan 100% kedap air.',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCNavy.jpeg',
    isActive: true,
    hasTransactions: true,
  },
  {
    id: 'PRD-BHN-003',
    name: 'PVC Idola Ketebalan 0.18',
    code: 'PRD-BHN-003',
    categoryId: 'cat-1',
    categoryName: 'Material Jas Hujan',
    unit: 'Meter',
    price: 25000,
    stock: 120,
    minStock: 15,
    description: 'Kain PVC Idola 0.18mm warna Hijau Army kokoh dan lentur untuk konveksi jas hujan lapangan.',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHijauArmy.jpeg',
    isActive: true,
    hasTransactions: true,
  },
  {
    id: 'PRD-BHN-004',
    name: 'PVC Elite Ketebalan 0.15',
    code: 'PRD-BHN-004',
    categoryId: 'cat-1',
    categoryName: 'Material Jas Hujan',
    unit: 'Meter',
    price: 22000,
    stock: 300,
    minStock: 30,
    description: 'Material PVC Elite 0.15mm Sage Green elastis, ekonomis, ringan, dan mudah diproses seam sealing.',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSage.jpg',
    isActive: true,
    hasTransactions: false,
  },
  {
    id: 'PRD-ALT-001',
    name: 'Kancing Snap (Hitam/Putih)',
    code: 'PRD-ALT-001',
    categoryId: 'cat-3',
    categoryName: 'Kancing',
    unit: 'Pcs',
    price: 500,
    stock: 5000,
    minStock: 500,
    description: 'Kancing snap button jepret polyacetal resin hitam dan putih tahan karat dan kuat dicuci.',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingAll.jpeg',
    isActive: true,
    hasTransactions: true,
  },
  {
    id: 'PRD-ALT-002',
    name: 'Tali Kur / Hoddie (Hitam/Putih)',
    code: 'PRD-ALT-002',
    categoryId: 'cat-5',
    categoryName: 'Aksesori',
    unit: 'Meter',
    price: 1500,
    stock: 1000,
    minStock: 100,
    description: 'Tali kur / hoodie serbaguna untuk kerutan tudung kepala jas hujan, lentur dan kuat.',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/TaliHoddieALL.jpeg',
    isActive: true,
    hasTransactions: true,
  },
  {
    id: 'PRD-ALT-003',
    name: 'Resleting Waterproof (Hitam/Putih)',
    code: 'PRD-ALT-003',
    categoryId: 'cat-2',
    categoryName: 'Resleting',
    unit: 'Pcs',
    price: 8500,
    stock: 800,
    minStock: 50,
    description: 'Resleting ritsleting anti rembes dengan seal waterproof TPU matte finish.',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg',
    isActive: true,
    hasTransactions: true,
  },
  {
    id: 'PRD-ALT-004',
    name: 'Skotlet Reflektor (Kain & Plastik)',
    code: 'PRD-ALT-004',
    categoryId: 'cat-5',
    categoryName: 'Aksesori',
    unit: 'Roll',
    price: 12000,
    stock: 50,
    minStock: 10,
    description: 'Pita reflektif pemantul cahaya skotlet standar safety rider untuk visibilitas malam hari.',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg',
    isActive: true,
    hasTransactions: true,
  },
  {
    id: 'PRD-ALT-005',
    name: 'Seam Sealing Tape (Silent Weath)',
    code: 'PRD-ALT-005',
    categoryId: 'cat-5',
    categoryName: 'Aksesori',
    unit: 'Roll',
    price: 4500,
    stock: 150,
    minStock: 20,
    description: 'Pita perekat seam sealing hot melt untuk menambal jahitan jas hujan agar kedap air.',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SilenMantel.webp',
    isActive: true,
    hasTransactions: true,
  },
  {
    id: 'PRD-ALT-006',
    name: 'Stopper Lobi-Lobi (Hitam/Putih)',
    code: 'PRD-ALT-006',
    categoryId: 'cat-5',
    categoryName: 'Aksesori',
    unit: 'Pcs',
    price: 1000,
    stock: 2000,
    minStock: 200,
    description: 'Stopper tali lobi-lobi pegas internal kuat untuk mengunci tali serut hoodie jas hujan.',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/LobilobiAll.jpg',
    isActive: true,
    hasTransactions: true,
  },
  {
    id: 'PRD-ALT-007',
    name: 'Karet Elastis (2cm - 2.5cm)',
    code: 'PRD-ALT-007',
    categoryId: 'cat-4',
    categoryName: 'Karet',
    unit: 'Meter',
    price: 3500,
    stock: 0,
    minStock: 50,
    description: 'Karet elastis tenun kuat lebar 2cm - 2.5cm untuk ban pinggang dan pergelangan jas hujan.',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikAll.jpeg',
    isActive: true,
    hasTransactions: true,
  },
];

const CATEGORIES = [
  'Material Jas Hujan',
  'Resleting',
  'Kancing',
  'Karet',
  'Aksesori',
];

const UNITS: Array<AdminProduct['unit']> = ['Meter', 'Pcs', 'Roll', 'Pack'];

// Helper: Format Rupiah
const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

// ============================================================================
// MAIN COMPONENT: ADMIN PRODUCTS
// ============================================================================

export default function AdminProductsPage() {
  // Navigation & UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Product List State
  const [products, setProducts] = useState<AdminProduct[]>(INITIAL_PRODUCTS);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Slide-out Drawer State (Add / Edit)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  // Form State for Drawer
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    categoryName: CATEGORIES[0],
    unit: 'Meter' as AdminProduct['unit'],
    price: 25000,
    stock: 50,
    minStock: 20,
    description: '',
    imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
    isActive: true,
  });

  // Soft Delete Confirmation Dialog State
  const [deactivatingProduct, setDeactivatingProduct] = useState<AdminProduct | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Open Drawer in Add Mode
  const handleOpenAddDrawer = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      code: `PRD-${Date.now().toString().slice(-4)}`,
      categoryName: CATEGORIES[0],
      unit: 'Meter',
      price: 25000,
      stock: 50,
      minStock: 20,
      description: '',
      imageUrl: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg',
      isActive: true,
    });
    setIsDrawerOpen(true);
  };

  // Open Drawer in Edit Mode
  const handleOpenEditDrawer = (product: AdminProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      categoryName: product.categoryName,
      unit: product.unit,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock,
      description: product.description,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
    });
    setIsDrawerOpen(true);
  };

  // Save / Update Product Handler
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      setToastMessage({
        title: 'Formulir Tidak Lengkap',
        desc: 'Mohon isi Nama Produk dan Kode SKU sebelum menyimpan.',
        type: 'warning',
      });
      return;
    }

    if (editingProduct) {
      // Edit existing product
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formData.name,
                code: formData.code,
                categoryName: formData.categoryName,
                unit: formData.unit,
                price: Number(formData.price),
                stock: Number(formData.stock),
                minStock: Number(formData.minStock),
                description: formData.description,
                imageUrl: formData.imageUrl,
                isActive: formData.isActive,
              }
            : p
        )
      );
      setToastMessage({
        title: 'Produk Berhasil Diperbarui',
        desc: `Perubahan data untuk ${formData.name} telah disimpan.`,
        type: 'success',
      });
    } else {
      // Create new product
      const newProduct: AdminProduct = {
        id: `prd-${Date.now().toString().slice(-4)}`,
        name: formData.name,
        code: formData.code,
        categoryId: `cat-${CATEGORIES.indexOf(formData.categoryName) + 1}`,
        categoryName: formData.categoryName,
        unit: formData.unit,
        price: Number(formData.price),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        description: formData.description,
        imageUrl: formData.imageUrl,
        isActive: formData.isActive,
        hasTransactions: false,
      };
      setProducts((prev) => [newProduct, ...prev]);
      setToastMessage({
        title: 'Produk Baru Ditambahkan',
        desc: `${formData.name} berhasil dimasukkan ke katalog inventaris.`,
        type: 'success',
      });
    }

    setIsDrawerOpen(false);
  };

  // Soft Delete / Toggle Active Handler (FR-31 & BR-13)
  const handleConfirmToggleActive = () => {
    if (!deactivatingProduct) return;

    const nextStatus = !deactivatingProduct.isActive;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === deactivatingProduct.id ? { ...p, isActive: nextStatus } : p
      )
    );

    setToastMessage({
      title: nextStatus ? 'Produk Diaktifkan' : 'Produk Dinonaktifkan (Soft Delete)',
      desc: nextStatus
        ? `${deactivatingProduct.name} kini kembali tampil di katalog publik.`
        : `${deactivatingProduct.name} telah dinonaktifkan tanpa menghapus riwayat transaksi (Aturan BR-13).`,
      type: nextStatus ? 'success' : 'warning',
    });

    setDeactivatingProduct(null);
  };

  // Filtered Products Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search matching
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      // Category matching
      const matchesCategory =
        selectedCategory === 'ALL' || p.categoryName === selectedCategory;

      // Status matching
      let matchesStatus = true;
      if (selectedStatus === 'ACTIVE') matchesStatus = p.isActive;
      if (selectedStatus === 'INACTIVE') matchesStatus = !p.isActive;
      if (selectedStatus === 'LOW_STOCK')
        matchesStatus = p.stock > 0 && p.stock <= p.minStock;
      if (selectedStatus === 'OUT_OF_STOCK') matchesStatus = p.stock === 0;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Inventory Health Badge Helper
  const getStockHealthBadge = (stock: number, minStock: number, unit: string) => {
    if (stock === 0) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          <span className="font-bold text-rose-600">0 {unit}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
            Habis
          </span>
        </div>
      );
    }
    if (stock <= minStock) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span className="font-bold text-rose-600">{stock} {unit}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
            Stok Rendah
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span className="font-semibold text-zinc-900">{stock} {unit}</span>
        <span className="text-[10px] font-medium text-zinc-400">Normal</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased flex flex-col">
      {/* =====================================================================
          1. THE STANDARDIZED ADMIN SIDEBAR
          (Strictly using the established high-end brand header and palette)
      ===================================================================== */}
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Component */}
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

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MIDDLE NAV LINKS (px-4 py-6 space-y-1 overflow-y-auto) */}
        <div className="px-4 py-6 space-y-1 overflow-y-auto flex-1">
          {/* Section: MENU UTAMA */}
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

            {/* Products (ACTIVE) */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl bg-zinc-900 text-white shadow-xs transition-all"
            >
              <Package className="w-4 h-4 text-zinc-200" />
              <span>Produk</span>
              <span className="text-[11px] text-zinc-400 font-mono ml-auto">
                {products.length}
              </span>
            </button>

            {/* Categories */}
            <Link
              href="/admin/categories"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Kategori</span>
              <span className="text-[11px] text-zinc-500 font-mono ml-auto">5</span>
            </Link>

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
              {/* Offline Sales */}
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

              {/* Reports */}
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

        {/* BOTTOM PROFILE (p-4 border-t border-zinc-900/50) */}
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
        {/* TOPBAR (h-20 bg-white border-b border-zinc-200 px-8) */}
        <header className="h-20 bg-white border-b border-zinc-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Left: Mobile Toggle & Breadcrumbs */}
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
              <span className="text-zinc-900 font-semibold tracking-tight">Produk</span>
              <span className="hidden sm:inline-flex ml-3 items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Database Live
              </span>
            </div>
          </div>

          {/* Right: Date, Notification, Avatar */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Senin, 16 Nov 2026</span>
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
                    <h4 className="font-bold text-sm text-zinc-900">Notifikasi Inventaris</h4>
                    <span className="text-[11px] font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                      Peringatan Stok
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                    Terdapat 2 produk dengan sisa stok di bawah batas aman minimum (Kain PVC Balon Biru &amp; Resleting Waterproof 70cm).
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
            PAGE CONTENT & HEADER
        =================================================================== */}
        <main className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* PAGE HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                  Manajemen Produk
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700">
                  {products.length} Total
                </span>
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                Kelola data katalog bahan jas hujan, harga satuan, dan kontrol status aktif.
              </p>
            </div>

            {/* Sleek "Tambah Produk" button */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setToastMessage({
                    title: 'Sinkronisasi Inventaris',
                    desc: 'Data produk dan stok berhasil disinkronkan dengan database.',
                    type: 'info',
                  });
                }}
                className="p-2.5 text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl shadow-xs transition-colors"
                title="Refresh Tabel"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleOpenAddDrawer}
                className="bg-zinc-900 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xs text-sm font-semibold active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>
            </div>
          </div>

          {/* =================================================================
              3. DATA TABLE SECTION (p-8 pt-4)
          ================================================================= */}
          {/* FILTER BAR (flex justify-between mb-6) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Search input with Search icon */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama atau SKU produk..."
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

            {/* Right: Category Filter Dropdown & Status Filter Dropdown */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-white border border-zinc-200 rounded-lg px-4 py-2 pr-9 text-xs font-semibold text-zinc-700 hover:border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 shadow-xs cursor-pointer transition-colors"
                >
                  <option value="ALL">Semua Kategori</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none bg-white border border-zinc-200 rounded-lg px-4 py-2 pr-9 text-xs font-semibold text-zinc-700 hover:border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 shadow-xs cursor-pointer transition-colors"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="ACTIVE">Aktif Saja</option>
                  <option value="INACTIVE">Nonaktif Saja</option>
                  <option value="LOW_STOCK">Stok Rendah</option>
                  <option value="OUT_OF_STOCK">Stok Habis</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* THE TABLE (bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden) */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                {/* Headers */}
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-4 px-6">PRODUK</th>
                    <th className="py-4 px-6">SKU</th>
                    <th className="py-4 px-6">KATEGORI</th>
                    <th className="py-4 px-6">HARGA</th>
                    <th className="py-4 px-6">STOK</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-right">AKSI</th>
                  </tr>
                </thead>

                {/* Rows with beautiful hover states */}
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-zinc-50/70 transition-colors group"
                        >
                          {/* Product Column: Flex layout with small aesthetic thumbnail (w-10 h-10 rounded-md) & Name */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-zinc-900 block truncate group-hover:text-zinc-950">
                                  {product.name}
                                </span>
                                <span className="text-[11px] text-zinc-400 block truncate mt-0.5 max-w-[260px]">
                                  {product.description || 'Bahan konveksi berkualitas tinggi'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* SKU Column */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                              {product.code}
                            </span>
                          </td>

                          {/* Category Column */}
                          <td className="py-4 px-6 whitespace-nowrap font-medium text-zinc-700">
                            {product.categoryName}
                          </td>

                          {/* Price Column: Formatted in Rupiah */}
                          <td className="py-4 px-6 whitespace-nowrap font-bold text-zinc-900">
                            {formatRupiah(product.price)}
                            <span className="text-[11px] font-normal text-zinc-400 ml-1">
                              / {product.unit}
                            </span>
                          </td>

                          {/* Stock Column: Value + indicator */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            {getStockHealthBadge(
                              product.stock,
                              product.minStock,
                              product.unit
                            )}
                          </td>

                          {/* Status Column: Sleek pill badges (Aktif / Nonaktif) */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            {product.isActive ? (
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

                          {/* Actions Column: Ghost buttons for Edit and Deactivate (NOT a trash can) */}
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditDrawer(product)}
                                title="Edit Detail Produk"
                                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* Deactivate / Soft Delete Action Button */}
                              <button
                                onClick={() => setDeactivatingProduct(product)}
                                title={
                                  product.isActive
                                    ? 'Nonaktifkan Produk (Soft Delete BR-13)'
                                    : 'Aktifkan Kembali Produk'
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  product.isActive
                                    ? 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
                                    : 'text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {product.isActive ? (
                                  <PowerOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4 text-emerald-600" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        <Package className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                        <p className="text-sm font-semibold text-zinc-700">
                          Tidak ada produk ditemukan
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Coba ubah kata kunci pencarian atau sesuaikan filter status.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination / Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Menampilkan <strong>{filteredProducts.length}</strong> dari{' '}
                <strong>{products.length}</strong> produk
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 mr-2">
                  Aturan BR-13: Produk nonaktif tetap tersimpan aman di database.
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =====================================================================
          4. SLIDE-OUT DRAWER FORM (For Add/Edit Product)
          (fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l)
      ===================================================================== */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Sleek dark overlay */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />

          {/* Drawer Shell Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-zinc-200 z-50 flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="h-20 px-6 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-zinc-50/50">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                  {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {editingProduct
                    ? `Perbarui informasi SKU #${editingProduct.code}`
                    : 'Lengkapi parameter data produk bahan jas hujan'}
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (flex-1 overflow-y-auto p-6 space-y-6) */}
            <form
              id="product-drawer-form"
              onSubmit={handleSaveProduct}
              className="flex-1 overflow-y-auto p-6 space-y-5 text-xs"
            >
              {/* Image Upload Zone */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Foto Produk
                </label>
                <div
                  onClick={() => {
                    setToastMessage({
                      title: 'Upload Media',
                      desc: 'File browser mockup dibuka. Foto otomatis dioptimalkan.',
                      type: 'info',
                    });
                  }}
                  className="border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-xl h-36 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 hover:border-zinc-400 transition-colors group relative overflow-hidden"
                >
                  {formData.imageUrl ? (
                    <div className="w-full h-full relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.imageUrl}
                        alt="Preview Foto"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-xs">
                        <UploadCloud className="w-4 h-4" />
                        <span>Ganti Foto</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 group-hover:text-zinc-600 transition-colors">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="mt-2 font-semibold text-zinc-700">
                        Klik untuk upload foto produk
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        PNG, JPG atau WEBP (Maksimal 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nama Produk */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kain PVC Balon 0.15mm Merah"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all"
                />
              </div>

              {/* SKU / Kode Produk */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  SKU / Kode Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PVC-RED-015"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2 text-xs font-mono font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all uppercase"
                />
              </div>

              {/* Grid 2 Columns: Kategori & Satuan */}
              <div className="grid grid-cols-2 gap-3">
                {/* Kategori */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={formData.categoryName}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryName: e.target.value })
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Satuan */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Satuan Jual
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit: e.target.value as AdminProduct['unit'],
                      })
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Harga Jual (Rp) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Harga Jual Satuan (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg pl-10 pr-3.5 py-2 text-xs font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                </div>
              </div>

              {/* Grid 2 Columns: Stok Awal & Minimum Stok */}
              <div className="grid grid-cols-2 gap-3">
                {/* Stok Awal / Saat Ini */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    {editingProduct ? 'Stok Saat Ini' : 'Stok Awal'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                </div>

                {/* Minimum Stok */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Batas Min. Peringatan
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minStock: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Deskripsi Produk
                </label>
                <textarea
                  rows={3}
                  placeholder="Karakteristik bahan, ketebalan, daya tahan waterproof..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all resize-none"
                />
              </div>

              {/* Status (A sleek custom toggle switch for Aktif/Nonaktif) */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <div>
                  <p className="text-xs font-bold text-zinc-900">
                    Status Katalog: {formData.isActive ? 'Aktif' : 'Nonaktif'}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {formData.isActive
                      ? 'Produk tampil di etalase dan dapat dibeli pelanggan.'
                      : 'Produk disembunyikan dari katalog publik toko.'}
                  </p>
                </div>

                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, isActive: !formData.isActive })
                  }
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-hidden ${
                    formData.isActive ? 'bg-zinc-900' : 'bg-zinc-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      formData.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </form>

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
                form="product-drawer-form"
                className="bg-zinc-900 text-white px-5 py-2 text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{editingProduct ? 'Simpan Perubahan' : 'Simpan Produk'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          CONFIRMATION MODAL: SOFT DELETE / DEACTIVATE (FR-31 & BR-13)
      ===================================================================== */}
      {deactivatingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  deactivatingProduct.isActive
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {deactivatingProduct.isActive ? (
                  <PowerOff className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-zinc-900">
                  {deactivatingProduct.isActive
                    ? 'Nonaktifkan Produk Ini?'
                    : 'Aktifkan Kembali Produk Ini?'}
                </h3>
                <p className="text-xs font-semibold text-zinc-800 mt-1">
                  {deactivatingProduct.name} ({deactivatingProduct.code})
                </p>

                {/* PRD Business Rule Callout */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 mt-3 text-[11px] text-zinc-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                    <Info className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Aturan Bisnis PRD FR-31 &amp; BR-13:</span>
                  </div>
                  <p>
                    {deactivatingProduct.isActive
                      ? 'Produk yang pernah masuk transaksi tidak dihapus permanen agar seluruh laporan dan audit stok tetap valid. Produk hanya akan dinonaktifkan dari katalog publik.'
                      : 'Produk akan segera muncul kembali di katalog toko publik sehingga pelanggan dapat memesannya.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeactivatingProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmToggleActive}
                className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                  deactivatingProduct.isActive
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                {deactivatingProduct.isActive ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOAST FEEDBACK NOTIFICATION
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
