'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  Boxes,
  Store,
  BarChart3,
  Search,
  X,
  Calendar,
  ChevronDown,
  ExternalLink,
  LogOut,
  Bell,
  Menu,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  History,
  Download,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  FileText,
  User,
  ShieldCheck,
  Info,
  ArrowRight,
  Filter,
} from 'lucide-react';

// ============================================================================
// DATA MODELS & TYPES (PRD SECTION 12.2 & FR-39)
// ============================================================================

export type MovementType =
  | 'STOCK_IN'
  | 'ONLINE_RESERVE'
  | 'ONLINE_SALE_OUT'
  | 'RESERVATION_RELEASE'
  | 'OFFLINE_SALE_OUT'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT';

export interface StockMovement {
  id: string;
  date: string;
  timestamp: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  unit: string;
  type: MovementType;
  quantityChange: number; // positive or negative
  stockBefore: number;
  stockAfter: number;
  reference: string;
  notes: string;
  actor: string;
  isSystem: boolean;
}

export interface ProductStockInfo {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  allowDecimal: boolean;
  physicalStock: number;
  availableStock: number;
}

// ============================================================================
// INITIAL ROBUST MOCK DATA (ALL 7 MOVEMENT TYPES ENCOMPASSED)
// ============================================================================

const AVAILABLE_PRODUCTS: ProductStockInfo[] = [
  {
    id: 'PRD-BHN-001',
    name: 'Kain PVC Balon 0.15mm Merah',
    sku: 'PVC-RED-015',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    allowDecimal: true,
    physicalStock: 120,
    availableStock: 95,
  },
  {
    id: 'PRD-BHN-002',
    name: 'Kain PVC Balon 0.15mm Biru Navy',
    sku: 'PVC-NAVY-015',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    allowDecimal: true,
    physicalStock: 48,
    availableStock: 20,
  },
  {
    id: 'PRD-RES-001',
    name: 'Resleting Waterproof 70cm Hitam Seal Karet',
    sku: 'ZIP-WP-070-BLK',
    category: 'Resleting',
    unit: 'Pcs',
    allowDecimal: false,
    physicalStock: 14,
    availableStock: 4,
  },
  {
    id: 'PRD-KRT-001',
    name: 'Karet Elastis 2.5cm Grade A Hitam',
    sku: 'ELAS-BLK-025',
    category: 'Karet',
    unit: 'Meter',
    allowDecimal: true,
    physicalStock: 12,
    availableStock: 12,
  },
  {
    id: 'PRD-KNC-001',
    name: 'Kancing Snap Button Besi 15mm Nikel',
    sku: 'SNP-MET-015',
    category: 'Kancing',
    unit: 'Pcs',
    allowDecimal: false,
    physicalStock: 15,
    availableStock: 10,
  },
  {
    id: 'PRD-BHN-004',
    name: 'Mika Transparan Ketebalan 0.20mm',
    sku: 'MIKA-CLR-020',
    category: 'Material Jas Hujan',
    unit: 'Roll',
    allowDecimal: false,
    physicalStock: 0,
    availableStock: 0,
  },
  {
    id: 'PRD-AKS-002',
    name: 'Seam Sealing Tape Panas 20mm Pelapis Jahitan',
    sku: 'SEAM-TAPE-020',
    category: 'Aksesori',
    unit: 'Meter',
    allowDecimal: true,
    physicalStock: 6,
    availableStock: 0,
  },
  {
    id: 'PRD-BHN-003',
    name: 'Kain Taslan Milky Waterproof Hijau Army',
    sku: 'TSL-MILK-ARM',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    allowDecimal: true,
    physicalStock: 250,
    availableStock: 210,
  },
  {
    id: 'PRD-KNC-002',
    name: 'Kancing Snap Plastik Putih 12mm',
    sku: 'SNP-PLS-WHT',
    category: 'Kancing',
    unit: 'Pcs',
    allowDecimal: false,
    physicalStock: 450,
    availableStock: 430,
  },
  {
    id: 'PRD-RES-002',
    name: 'Resleting Coil No. 5 Gigi Spiral 65cm',
    sku: 'ZIP-COIL-065',
    category: 'Resleting',
    unit: 'Pcs',
    allowDecimal: false,
    physicalStock: 180,
    availableStock: 165,
  },
];

const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'MOV-20261116-015',
    date: '16 Nov 2026',
    timestamp: '14:30 WIB',
    productId: 'PRD-BHN-001',
    productName: 'Kain PVC Balon 0.15mm Merah',
    sku: 'PVC-RED-015',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    type: 'STOCK_IN',
    quantityChange: 50,
    stockBefore: 70,
    stockAfter: 120,
    reference: 'PO Supplier #SJ-88219 (Pabrik Solo)',
    notes: 'Penerimaan restock bahan gulungan roll baru batch November.',
    actor: 'Pak Enstein (Admin)',
    isSystem: false,
  },
  {
    id: 'MOV-20261116-014',
    date: '16 Nov 2026',
    timestamp: '14:15 WIB',
    productId: 'PRD-BHN-001',
    productName: 'Kain PVC Balon 0.15mm Merah',
    sku: 'PVC-RED-015',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    type: 'ONLINE_RESERVE',
    quantityChange: -25,
    stockBefore: 120,
    stockAfter: 120,
    reference: 'Order #EST-20261116-0042',
    notes: 'Cadangan kuota otomatis pesanan online Konveksi Barokah Kebumen.',
    actor: 'System (Auto)',
    isSystem: true,
  },
  {
    id: 'MOV-20261116-013',
    date: '16 Nov 2026',
    timestamp: '13:50 WIB',
    productId: 'PRD-RES-001',
    productName: 'Resleting Waterproof 70cm Hitam Seal Karet',
    sku: 'ZIP-WP-070-BLK',
    category: 'Resleting',
    unit: 'Pcs',
    type: 'ONLINE_SALE_OUT',
    quantityChange: -10,
    stockBefore: 24,
    stockAfter: 14,
    reference: 'Order #EST-20261116-0038',
    notes: 'Pemotongan fisik pesanan terkirim via Kurir JNE.',
    actor: 'Staf Gudang (Admin)',
    isSystem: false,
  },
  {
    id: 'MOV-20261116-012',
    date: '16 Nov 2026',
    timestamp: '12:10 WIB',
    productId: 'PRD-BHN-004',
    productName: 'Mika Transparan Ketebalan 0.20mm',
    sku: 'MIKA-CLR-020',
    category: 'Material Jas Hujan',
    unit: 'Roll',
    type: 'RESERVATION_RELEASE',
    quantityChange: 2,
    stockBefore: 0,
    stockAfter: 0,
    reference: 'Order #EST-20261115-0031',
    notes: 'Pelepasan kuota reservasi karena pesanan kedaluwarsa 24 jam.',
    actor: 'System (Auto)',
    isSystem: true,
  },
  {
    id: 'MOV-20261116-011',
    date: '16 Nov 2026',
    timestamp: '09:45 WIB',
    productId: 'PRD-KRT-001',
    productName: 'Karet Elastis 2.5cm Grade A Hitam',
    sku: 'ELAS-BLK-025',
    category: 'Karet',
    unit: 'Meter',
    type: 'OFFLINE_SALE_OUT',
    quantityChange: -8,
    stockBefore: 20,
    stockAfter: 12,
    reference: 'Kasir Toko #EST-20261116-0037',
    notes: 'Penjualan tunai fisik di kasir toko Tanahsari (Dewi Sartika).',
    actor: 'Kasir Toko (POS)',
    isSystem: false,
  },
  {
    id: 'MOV-20261115-010',
    date: '15 Nov 2026',
    timestamp: '16:45 WIB',
    productId: 'PRD-KNC-001',
    productName: 'Kancing Snap Button Besi 15mm Nikel',
    sku: 'SNP-MET-015',
    category: 'Kancing',
    unit: 'Pcs',
    type: 'ADJUSTMENT_IN',
    quantityChange: 25,
    stockBefore: 0,
    stockAfter: 25,
    reference: 'Opname Fisik #OPN-NOV-15',
    notes: 'Ditemukan selisih fisik lebih: 1 pack blister baru di laci B1.',
    actor: 'Pak Enstein (Admin)',
    isSystem: false,
  },
  {
    id: 'MOV-20261115-009',
    date: '15 Nov 2026',
    timestamp: '15:30 WIB',
    productId: 'PRD-AKS-002',
    productName: 'Seam Sealing Tape Panas 20mm',
    sku: 'SEAM-TAPE-020',
    category: 'Aksesori',
    unit: 'Meter',
    type: 'ADJUSTMENT_OUT',
    quantityChange: -4,
    stockBefore: 10,
    stockAfter: 6,
    reference: 'Opname Kerusakan #OPN-DMG-09',
    notes: 'Pembuangan ujung tape mengering dan lem rusak akibat kelembaban.',
    actor: 'Pak Enstein (Admin)',
    isSystem: false,
  },
  {
    id: 'MOV-20261115-008',
    date: '15 Nov 2026',
    timestamp: '11:00 WIB',
    productId: 'PRD-BHN-003',
    productName: 'Kain Taslan Milky Waterproof Hijau Army',
    sku: 'TSL-MILK-ARM',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    type: 'STOCK_IN',
    quantityChange: 100,
    stockBefore: 150,
    stockAfter: 250,
    reference: 'PO Supplier #SJ-88201',
    notes: 'Restock bahan taslan gulungan besar 2 roll (masing-masing 50m).',
    actor: 'Pak Enstein (Admin)',
    isSystem: false,
  },
  {
    id: 'MOV-20261114-007',
    date: '14 Nov 2026',
    timestamp: '17:15 WIB',
    productId: 'PRD-KNC-002',
    productName: 'Kancing Snap Plastik Putih 12mm',
    sku: 'SNP-PLS-WHT',
    category: 'Kancing',
    unit: 'Pcs',
    type: 'OFFLINE_SALE_OUT',
    quantityChange: -50,
    stockBefore: 500,
    stockAfter: 450,
    reference: 'Struk Kasir #EST-20261114-0028',
    notes: 'Pembelian langsung konveksi lokal Tanahsari Kebumen.',
    actor: 'Kasir Toko (POS)',
    isSystem: false,
  },
  {
    id: 'MOV-20261114-006',
    date: '14 Nov 2026',
    timestamp: '14:00 WIB',
    productId: 'PRD-RES-002',
    productName: 'Resleting Coil No. 5 Gigi Spiral 65cm',
    sku: 'ZIP-COIL-065',
    category: 'Resleting',
    unit: 'Pcs',
    type: 'ONLINE_SALE_OUT',
    quantityChange: -20,
    stockBefore: 200,
    stockAfter: 180,
    reference: 'Order #EST-20261114-0025',
    notes: 'Pesanan diambil langsung di toko (Self Pickup Pak Hadi).',
    actor: 'Kasir Toko (POS)',
    isSystem: false,
  },
];

export default function AdminStockMovementsPage() {
  // Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Movements & Products State
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [products, setProducts] = useState<ProductStockInfo[]>(AVAILABLE_PRODUCTS);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  // Drawer State (FR-35 & FR-37)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTab, setFormTab] = useState<'STOCK_IN' | 'ADJUSTMENT'>('STOCK_IN');
  const [selectedProductId, setSelectedProductId] = useState<string>(AVAILABLE_PRODUCTS[0].id);
  const [adjustmentDirection, setAdjustmentDirection] = useState<'IN' | 'OUT'>('IN');
  const [quantityInput, setQuantityInput] = useState<string>('10');
  const [referenceInput, setReferenceInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Selected Product in Drawer
  const activeProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Ledger Summary Calculations
  const metrics = useMemo(() => {
    const totalTransactions = movements.length;
    const totalInflow = movements
      .filter((m) => m.type === 'STOCK_IN' || m.type === 'ADJUSTMENT_IN')
      .reduce((acc, curr) => acc + Math.abs(curr.quantityChange), 0);

    const totalOutflow = movements
      .filter(
        (m) =>
          m.type === 'ONLINE_SALE_OUT' ||
          m.type === 'OFFLINE_SALE_OUT' ||
          m.type === 'ADJUSTMENT_OUT'
      )
      .reduce((acc, curr) => acc + Math.abs(curr.quantityChange), 0);

    const activeReservations = movements
      .filter((m) => m.type === 'ONLINE_RESERVE')
      .reduce((acc, curr) => acc + Math.abs(curr.quantityChange), 0);

    return {
      totalTransactions,
      totalInflow,
      totalOutflow,
      activeReservations,
    };
  }, [movements]);

  // Filtered Movements List
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        mov.productName.toLowerCase().includes(q) ||
        mov.sku.toLowerCase().includes(q) ||
        mov.reference.toLowerCase().includes(q) ||
        mov.notes.toLowerCase().includes(q) ||
        mov.actor.toLowerCase().includes(q);

      // 2. Type Filter
      const matchType = typeFilter === 'ALL' || mov.type === typeFilter;

      // 3. Date Filter
      let matchDate = true;
      if (dateFilter === 'TODAY') {
        matchDate = mov.date.includes('16 Nov');
      } else if (dateFilter === '7DAYS') {
        matchDate = mov.date.includes('Nov');
      }

      return matchSearch && matchType && matchDate;
    });
  }, [movements, searchQuery, typeFilter, dateFilter]);

  // Dynamic Stock Preview in Drawer
  const livePreview = useMemo(() => {
    const qty = parseFloat(quantityInput) || 0;
    const current = activeProduct.physicalStock;
    let delta = 0;
    let newPhysical = current;
    let generatedType: MovementType = 'STOCK_IN';

    if (formTab === 'STOCK_IN') {
      delta = qty;
      newPhysical = current + qty;
      generatedType = 'STOCK_IN';
    } else {
      if (adjustmentDirection === 'IN') {
        delta = qty;
        newPhysical = current + qty;
        generatedType = 'ADJUSTMENT_IN';
      } else {
        delta = -qty;
        newPhysical = Math.max(0, current - qty);
        generatedType = 'ADJUSTMENT_OUT';
      }
    }

    return {
      delta,
      newPhysical,
      generatedType,
    };
  }, [activeProduct, formTab, adjustmentDirection, quantityInput]);

  // Open Drawer Handlers
  const handleOpenStockIn = () => {
    setFormTab('STOCK_IN');
    setQuantityInput('20');
    setReferenceInput('PO Supplier #SJ-');
    setNotesInput('Restock barang masuk dari pabrik / vendor.');
    setDrawerOpen(true);
  };

  const handleOpenAdjustment = () => {
    setFormTab('ADJUSTMENT');
    setAdjustmentDirection('IN');
    setQuantityInput('5');
    setReferenceInput('Opname Toko #OPN-');
    setNotesInput('Penyesuaian stok opname fisik toko.');
    setDrawerOpen(true);
  };

  // Submit Drawer Form (FR-35 & FR-37)
  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesInput.trim()) {
      alert('Alasan atau keterangan pergerakan stok wajib diisi.');
      return;
    }

    const { delta, newPhysical, generatedType } = livePreview;

    // Create New Movement Record
    const newMovement: StockMovement = {
      id: `MOV-20261116-${(movements.length + 10).toString()}`,
      date: '16 Nov 2026',
      timestamp: 'Baru Saja',
      productId: activeProduct.id,
      productName: activeProduct.name,
      sku: activeProduct.sku,
      category: activeProduct.category,
      unit: activeProduct.unit,
      type: generatedType,
      quantityChange: delta,
      stockBefore: activeProduct.physicalStock,
      stockAfter: newPhysical,
      reference: referenceInput || (formTab === 'STOCK_IN' ? 'Surat Jalan Supplier' : 'Koreksi Opname'),
      notes: notesInput,
      actor: 'Pak Enstein (Admin)',
      isSystem: false,
    };

    // Update Movements List
    setMovements((prev) => [newMovement, ...prev]);

    // Update Product Stock In Memory
    setProducts((prev) =>
      prev.map((p) =>
        p.id === activeProduct.id ? { ...p, physicalStock: newPhysical } : p
      )
    );

    // Show Toast & Reset Form
    setToastMessage({
      title: formTab === 'STOCK_IN' ? 'Barang Masuk Berhasil Dicatat' : 'Penyesuaian Stok Tersimpan',
      desc: `Pergerakan stok ${activeProduct.name} (${delta > 0 ? `+${delta}` : delta} ${activeProduct.unit}) sukses dicatat ke buku besar mutasi.`,
      type: 'success',
    });

    setDrawerOpen(false);
  };

  // Render Semantic Badges for 7 Movement Types (PRD 12.2)
  const renderMovementTypeBadge = (type: MovementType) => {
    switch (type) {
      case 'STOCK_IN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
            Stock In (Masuk)
          </span>
        );
      case 'ADJUSTMENT_IN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Plus className="w-3 h-3 text-teal-600" />
            Adjustment In (+)
          </span>
        );
      case 'ONLINE_SALE_OUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowUpRight className="w-3 h-3 text-blue-600" />
            Online Sale Out
          </span>
        );
      case 'OFFLINE_SALE_OUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Store className="w-3 h-3 text-indigo-600" />
            Offline Kasir Out
          </span>
        );
      case 'ADJUSTMENT_OUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <TrendingDown className="w-3 h-3 text-rose-600" />
            Adjustment Out (-)
          </span>
        );
      case 'ONLINE_RESERVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Online Reserve
          </span>
        );
      case 'RESERVATION_RELEASE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
            <RefreshCw className="w-3 h-3 text-zinc-500" />
            Reservation Release
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased flex flex-col">
      {/* =====================================================================
          1. THE STANDARDIZED ADMIN SIDEBAR
          (Standard geometric 'E', dual typo, glass ADMIN badge, nested under Inventaris)
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
        {/* TOP BRAND HEADER */}
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

            {/* Categories */}
            <Link
              href="/admin/categories"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Kategori &amp; Satuan</span>
              <span className="text-[11px] text-zinc-500 font-mono ml-auto">11</span>
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

            {/* Payments */}
            <Link
              href="/admin/payments"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pembayaran</span>
              <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                2 Perlu Cek
              </span>
            </Link>

            {/* Inventory SECTION (WITH SUB-NAVIGATION) */}
            <div className="pt-1">
              <Link
                href="/admin/inventory"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
              >
                <Boxes className="w-4 h-4" />
                <span>Persediaan Barang</span>
                <span className="ml-auto bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  6 Kritis
                </span>
              </Link>

              {/* Nested Sub-link: Riwayat Pergerakan (ACTIVE) */}
              <div className="ml-7 mt-1 border-l border-zinc-800 pl-3">
                <button
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white shadow-xs"
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Riwayat Mutasi</span>
                </button>
              </div>
            </div>
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

        {/* BOTTOM SIDEBAR FOOTER */}
        <div className="p-4 border-t border-zinc-900/50 space-y-3 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Lihat Toko Publik
            </span>
            <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-zinc-500" />
          </Link>

          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-zinc-800">
                PE
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-zinc-200 truncate">Pak Enstein</p>
                <p className="text-[10px] text-zinc-500 truncate">Owner &amp; Admin</p>
              </div>
            </div>
            <button
              title="Logout"
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          2. MAIN CONTENT AREA (ml-64 min-h-screen bg-zinc-50 flex flex-col)
      ===================================================================== */}
      <main className="md:ml-64 min-h-screen flex flex-col transition-all duration-300">
        {/* TOPBAR */}
        <header className="h-16 px-8 border-b border-zinc-200 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <Link href="/admin/dashboard" className="hover:text-zinc-900 transition-colors">
                Manajemen
              </Link>
              <span>/</span>
              <Link href="/admin/inventory" className="hover:text-zinc-900 transition-colors">
                Persediaan
              </Link>
              <span>/</span>
              <span className="text-zinc-900 font-semibold">Riwayat Pergerakan</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-600 border border-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Senin, 16 Nov 2026</span>
            </div>

            <button
              onClick={() => {
                setToastMessage({
                  title: 'Buku Besar Sinkron',
                  desc: 'Seluruh mutasi stok online, offline POS, dan barang masuk terverifikasi.',
                  type: 'info',
                });
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg relative">
              <Bell className="w-4 h-4" />
            </button>

            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-zinc-200">
              PE
            </div>
          </div>
        </header>

        {/* TOAST FEEDBACK */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 flex items-start gap-3 p-4 rounded-xl bg-zinc-900 text-white shadow-xl max-w-md animate-in fade-in slide-in-from-top-4 duration-200 border border-zinc-800">
            {toastMessage.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {toastMessage.type === 'info' && (
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-xs font-bold text-zinc-100">{toastMessage.title}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                {toastMessage.desc}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 text-zinc-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between px-8 py-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Riwayat Pergerakan Stok
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Master Ledger: Audit komprehensif seluruh mutasi barang masuk, alokasi pesanan online, kasir toko, dan penyesuaian opname (PRD 12.2).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdjustment}
              className="bg-white border border-zinc-200 text-zinc-700 px-4 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors text-xs font-semibold shadow-xs flex items-center gap-2"
            >
              <Sliders className="w-3.5 h-3.5 text-zinc-500" />
              <span>+ Penyesuaian Stok</span>
            </button>

            <button
              onClick={handleOpenStockIn}
              className="bg-zinc-900 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-colors text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Barang Masuk (Stock In)</span>
            </button>
          </div>
        </div>

        {/* QUICK METRIC CARDS (LEDGER SUMMARY) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-8 mb-6">
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Total Transaksi Mutasi
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-zinc-900 font-mono">
                {metrics.totalTransactions}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                Log tercatat bulan ini
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Total Inflow (Masuk)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-emerald-700 font-mono">
                +{metrics.totalInflow}
              </div>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                Penerimaan supplier &amp; opname (+)
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Total Outflow (Keluar)
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-rose-700 font-mono">
                -{metrics.totalOutflow}
              </div>
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                Pesanan online &amp; kasir toko fisik
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Reservasi Aktif
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-amber-700 font-mono">
                {metrics.activeReservations}
              </div>
              <p className="text-[11px] text-amber-600 mt-1 font-medium">
                Alokasi pesanan belum dikirim
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================
            3. DATA TABLE SECTION (px-8 pb-12)
        =================================================================== */}
        <div className="px-8 pb-12 space-y-4 flex-1">
          {/* ADVANCED FILTER BAR */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Left: Search input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari produk, nomor order, atau referensi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400 shadow-xs"
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

            {/* Right: Date Range Picker & Movement Type Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none bg-white border border-zinc-200 rounded-lg px-3.5 py-2.5 pr-8 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 transition-colors shadow-xs cursor-pointer"
                >
                  <option value="ALL">Semua Jenis Mutasi (7 Tipe)</option>
                  <option value="STOCK_IN">Stock In (Barang Masuk)</option>
                  <option value="ONLINE_RESERVE">Online Reserve (Cadangan)</option>
                  <option value="ONLINE_SALE_OUT">Online Sale Out (Pengiriman)</option>
                  <option value="RESERVATION_RELEASE">Reservation Release (Batal)</option>
                  <option value="OFFLINE_SALE_OUT">Offline Sale Out (Kasir POS)</option>
                  <option value="ADJUSTMENT_IN">Adjustment In (+ Opname)</option>
                  <option value="ADJUSTMENT_OUT">Adjustment Out (- Opname)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none bg-white border border-zinc-200 rounded-lg px-3.5 py-2.5 pr-8 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 transition-colors shadow-xs cursor-pointer"
                >
                  <option value="ALL">Semua Periode</option>
                  <option value="TODAY">Hari Ini (16 Nov 2026)</option>
                  <option value="7DAYS">Bulan Ini (Nov 2026)</option>
                </select>
                <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Reset Filter Button */}
              {(searchQuery || typeFilter !== 'ALL' || dateFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('ALL');
                    setDateFilter('ALL');
                  }}
                  className="p-2.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors text-xs font-medium flex items-center gap-1.5"
                  title="Reset Filter"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* THE LEDGER TABLE (PRD 12.2 & FR-39) */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-6">TANGGAL &amp; WAKTU</th>
                    <th className="py-3.5 px-6">PRODUK</th>
                    <th className="py-3.5 px-6">JENIS PERGERAKAN</th>
                    <th className="py-3.5 px-6">JUMLAH</th>
                    <th className="py-3.5 px-6">KETERANGAN / REFERENSI</th>
                    <th className="py-3.5 px-6">AKTOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 text-xs">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-400">
                        <History className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                        <p className="font-medium text-zinc-600">Tidak ada riwayat pergerakan stok ditemukan</p>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Coba sesuaikan kata kunci pencarian atau ubah opsi filter jenis mutasi.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((mov) => {
                      const isPositive = mov.quantityChange > 0;
                      return (
                        <tr
                          key={mov.id}
                          className="hover:bg-zinc-50/80 transition-colors group"
                        >
                          {/* TANGGAL & WAKTU */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="font-medium text-zinc-900 block font-mono">
                              {mov.date}
                            </span>
                            <span className="text-[11px] text-zinc-400 block mt-0.5">
                              {mov.timestamp}
                            </span>
                          </td>

                          {/* PRODUK: Name + SKU */}
                          <td className="py-4 px-6">
                            <p className="font-semibold text-zinc-900 group-hover:text-amber-600 transition-colors">
                              {mov.productName}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                              <span className="font-mono">{mov.sku}</span>
                              <span>&bull;</span>
                              <span>{mov.category}</span>
                            </div>
                          </td>

                          {/* JENIS PERGERAKAN (PRD 12.2) */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            {renderMovementTypeBadge(mov.type)}
                          </td>

                          {/* JUMLAH: Monospaced and Color-coded */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-baseline gap-1 font-mono">
                              <span
                                className={`text-sm font-bold ${
                                  mov.type === 'ONLINE_RESERVE'
                                    ? 'text-amber-600'
                                    : mov.type === 'RESERVATION_RELEASE'
                                    ? 'text-zinc-600'
                                    : isPositive
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {isPositive ? `+ ${mov.quantityChange}` : `- ${Math.abs(mov.quantityChange)}`}
                              </span>
                              <span className="text-xs text-zinc-500 font-medium">
                                {mov.unit}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              Fisik: {mov.stockBefore} &rarr; {mov.stockAfter}
                            </span>
                          </td>

                          {/* KETERANGAN / REFERENSI */}
                          <td className="py-4 px-6 max-w-xs">
                            <span className="font-medium text-zinc-800 font-mono text-[11px] bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                              {mov.reference}
                            </span>
                            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1 italic">
                              &ldquo;{mov.notes}&rdquo;
                            </p>
                          </td>

                          {/* AKTOR */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  mov.isSystem
                                    ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {mov.isSystem ? 'SY' : 'PE'}
                              </div>
                              <span className="font-medium text-zinc-800">
                                {mov.actor}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER SUMMARY */}
            <div className="px-6 py-4 bg-zinc-50/60 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-500 gap-2">
              <span>
                Menampilkan <span className="font-semibold text-zinc-700">{filteredMovements.length}</span> dari{' '}
                <span className="font-semibold text-zinc-700">{movements.length}</span> catatan audit mutasi stok
              </span>
              <span className="text-[11px] text-zinc-400">
                Data mutasi terlindungi secara permanen sesuai standar PRD 12.2 &amp; FR-39
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* =====================================================================
          4. ADD MOVEMENT DRAWER (Slide-out panel)
          (Slide-out panel emerging from right side with backdrop)
      ===================================================================== */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Shell */}
          <aside className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-zinc-200 z-50 transform transition-transform duration-300 flex flex-col">
            {/* Header */}
            <div className="h-20 px-6 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
                  <History className="w-5 h-5 text-zinc-700" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Catat Pergerakan Stok</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Input mutasi manual ke master ledger stok</p>
                </div>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitMovement} className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Tab Switcher: "Barang Masuk" vs "Penyesuaian (Adjustment)" */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-2">
                    Tipe Mutasi
                  </label>
                  <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setFormTab('STOCK_IN')}
                      className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        formTab === 'STOCK_IN'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Barang Masuk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormTab('ADJUSTMENT')}
                      className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        formTab === 'ADJUSTMENT'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-600" />
                      <span>Penyesuaian</span>
                    </button>
                  </div>
                </div>

                {/* Select Product */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Pilih Produk <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full appearance-none bg-white border border-zinc-200 rounded-xl px-4 py-2.5 pr-8 text-xs font-medium text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 transition-colors shadow-xs"
                    >
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} ({prod.sku}) &bull; {prod.unit}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Current Stock Info Helper */}
                  <div className="mt-2 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-zinc-500">Kondisi Stok Saat Ini:</span>
                    <span className="font-mono font-bold text-zinc-800">
                      Fisik: {activeProduct.physicalStock} {activeProduct.unit} (Tersedia: {activeProduct.availableStock})
                    </span>
                  </div>
                </div>

                {/* Form Fields: STOCK IN */}
                {formTab === 'STOCK_IN' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        Jumlah Masuk ({activeProduct.unit}) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={activeProduct.allowDecimal ? '0.1' : '1'}
                          min="0.1"
                          required
                          value={quantityInput}
                          onChange={(e) => setQuantityInput(e.target.value)}
                          placeholder="Masukkan jumlah barang masuk..."
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                          {activeProduct.unit}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        Nomor Referensi / Surat Jalan (DO)
                      </label>
                      <input
                        type="text"
                        value={referenceInput}
                        onChange={(e) => setReferenceInput(e.target.value)}
                        placeholder="Contoh: PO Supplier #SJ-88219"
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                      />
                    </div>
                  </div>
                )}

                {/* Form Fields: ADJUSTMENT */}
                {formTab === 'ADJUSTMENT' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        Arah Penyesuaian
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAdjustmentDirection('IN')}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            adjustmentDirection === 'IN'
                              ? 'bg-teal-50 border-teal-300 text-teal-800 ring-2 ring-teal-500/10'
                              : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5 text-teal-600" />
                          <span>Penambahan (+)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAdjustmentDirection('OUT')}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            adjustmentDirection === 'OUT'
                              ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/10'
                              : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                          <span>Pengurangan (-)</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        Kuantitas Penyesuaian ({activeProduct.unit}) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={activeProduct.allowDecimal ? '0.1' : '1'}
                          min="0.1"
                          required
                          value={quantityInput}
                          onChange={(e) => setQuantityInput(e.target.value)}
                          placeholder="Jumlah kuantitas opname..."
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                          {activeProduct.unit}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        Nomor Berita Acara / Referensi
                      </label>
                      <input
                        type="text"
                        value={referenceInput}
                        onChange={(e) => setReferenceInput(e.target.value)}
                        placeholder="Contoh: BA-OPNAME-NOV-16"
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                      />
                    </div>
                  </div>
                )}

                {/* Mandatory Keterangan / Alasan Textarea */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Keterangan / Alasan Audit <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Nomor DO supplier atau alasan rinci penyesuaian (misal: cacat potongan, barang rusak, dsb)..."
                    className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>

                {/* LIVE DYNAMIC CALCULATION PREVIEW */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Pratinjau Saldo Mutasi
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-800">
                      {livePreview.delta >= 0 ? `+${livePreview.delta}` : livePreview.delta} {activeProduct.unit}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Stok Fisik Awal:</span>
                      <span className="font-bold text-zinc-700 text-sm font-mono">
                        {activeProduct.physicalStock} {activeProduct.unit}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block text-[11px]">Stok Fisik Baru:</span>
                      <span className="font-bold text-emerald-600 text-sm font-mono">
                        {livePreview.newPhysical} {activeProduct.unit}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Tipe Badge Mutasi:</span>
                    <div>{renderMovementTypeBadge(livePreview.generatedType)}</div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-zinc-200 bg-white shrink-0 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-1/3 py-3 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-semibold text-xs transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="w-2/3 bg-zinc-900 text-white py-3 rounded-lg font-bold text-xs hover:bg-zinc-800 transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Simpan Pergerakan</span>
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
