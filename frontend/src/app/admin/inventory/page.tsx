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
  Filter,
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
  AlertCircle,
  XCircle,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  History,
  Download,
  RefreshCw,
  Edit3,
  TrendingDown,
  Info,
} from 'lucide-react';

// ============================================================================
// DATA MODELS & TYPES (PRD SECTION 12.1 & 13.4.6, FR-35, FR-37, FR-38)
// ============================================================================

export type StockStatus = 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  allowDecimal: boolean;
  physicalStock: number; // Fisik on hand (gudang/toko)
  reservedStock: number; // Cadangan pesanan online yang belum dikirim
  availableStock: number; // Fisik - Reservasi (PRD 12.1)
  minimumStock: number; // Batas ambang reorder
  status: StockStatus; // Dihitung otomatis (FR-38)
  image: string;
  location: string;
  lastUpdated: string;
}

export type MovementType = 'IN' | 'ADJUSTMENT' | 'OUT_ORDER' | 'RESERVE';

export interface StockMovementLog {
  id: string;
  itemId: string;
  productName: string;
  sku: string;
  type: MovementType;
  quantityChange: number;
  unit: string;
  previousPhysical: number;
  newPhysical: number;
  reference: string;
  notes: string;
  date: string;
  operator: string;
}

// ============================================================================
// HELPER: CALCULATE STOCK MATH & AUTOMATIC STATUS (PRD 12.1 & FR-38)
// ============================================================================
const computeStockDetails = (
  physical: number,
  reserved: number,
  minimum: number
): { availableStock: number; status: StockStatus } => {
  const available = Math.max(0, physical - reserved);
  let status: StockStatus = 'NORMAL';

  if (available <= 0) {
    status = 'OUT_OF_STOCK'; // available == 0 (FR-38)
  } else if (available <= minimum) {
    status = 'LOW_STOCK'; // 0 < available <= minimum (FR-38)
  } else {
    status = 'NORMAL'; // available > minimum (FR-38)
  }

  return { availableStock: available, status };
};

// ============================================================================
// INITIAL MOCK DATA (PRD 12.1 DOMAIN BAHAN & AKSESORI JAS HUJAN KEBUMEN)
// ============================================================================

const RAW_INVENTORY_ITEMS = [
  {
    id: 'PRD-BHN-001',
    sku: 'PVC-RED-015',
    name: 'Kain PVC Balon Ketebalan 0.15mm Merah',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    allowDecimal: true,
    physicalStock: 120,
    reservedStock: 25,
    minimumStock: 30,
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=160&q=80',
    location: 'Gudang Utama - Rak A1',
    lastUpdated: '16 Nov 2026, 14:15',
  },
  {
    id: 'PRD-BHN-002',
    sku: 'PVC-NAVY-015',
    name: 'Kain PVC Balon Ketebalan 0.15mm Biru Navy',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    allowDecimal: true,
    physicalStock: 48,
    reservedStock: 28,
    minimumStock: 25,
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=160&q=80',
    location: 'Gudang Utama - Rak A2',
    lastUpdated: '16 Nov 2026, 11:30',
  },
  {
    id: 'PRD-RES-001',
    sku: 'ZIP-WP-070-BLK',
    name: 'Resleting Waterproof 70cm Hitam Seal Karet',
    category: 'Resleting',
    unit: 'Pcs',
    allowDecimal: false,
    physicalStock: 14,
    reservedStock: 10,
    minimumStock: 20,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=160&q=80',
    location: 'Etalase Toko - Laci B4',
    lastUpdated: '16 Nov 2026, 10:20',
  },
  {
    id: 'PRD-KRT-001',
    sku: 'ELAS-BLK-025',
    name: 'Karet Elastis 2.5cm Grade A Hitam (Pinggang & Manset)',
    category: 'Karet',
    unit: 'Meter',
    allowDecimal: true,
    physicalStock: 12,
    reservedStock: 0,
    minimumStock: 30,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=160&q=80',
    location: 'Gudang Utama - Rak C1',
    lastUpdated: '15 Nov 2026, 16:40',
  },
  {
    id: 'PRD-KNC-001',
    sku: 'SNP-MET-015',
    name: 'Kancing Snap Button Besi 15mm Nikel Anti Karat',
    category: 'Kancing',
    unit: 'Pcs',
    allowDecimal: false,
    physicalStock: 15,
    reservedStock: 5,
    minimumStock: 50,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=160&q=80',
    location: 'Etalase Toko - Laci B1',
    lastUpdated: '15 Nov 2026, 14:00',
  },
  {
    id: 'PRD-BHN-004',
    sku: 'MIKA-CLR-020',
    name: 'Mika Transparan Ketebalan 0.20mm (Jas Hujan Bening)',
    category: 'Material Jas Hujan',
    unit: 'Roll',
    allowDecimal: false,
    physicalStock: 0,
    reservedStock: 0,
    minimumStock: 5,
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=160&q=80',
    location: 'Gudang Utama - Rak A5',
    lastUpdated: '14 Nov 2026, 09:20',
  },
  {
    id: 'PRD-AKS-002',
    sku: 'SEAM-TAPE-020',
    name: 'Seam Sealing Tape Panas 20mm Pelapis Jahitan Air',
    category: 'Aksesori',
    unit: 'Meter',
    allowDecimal: true,
    physicalStock: 6,
    reservedStock: 6,
    minimumStock: 15,
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=160&q=80',
    location: 'Etalase Toko - Laci C2',
    lastUpdated: '16 Nov 2026, 12:00',
  },
  {
    id: 'PRD-BHN-003',
    sku: 'TSL-MILK-ARM',
    name: 'Kain Taslan Milky Waterproof Hijau Army',
    category: 'Material Jas Hujan',
    unit: 'Meter',
    allowDecimal: true,
    physicalStock: 250,
    reservedStock: 40,
    minimumStock: 50,
    image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=160&q=80',
    location: 'Gudang Utama - Rak A3',
    lastUpdated: '16 Nov 2026, 13:10',
  },
  {
    id: 'PRD-KNC-002',
    sku: 'SNP-PLS-WHT',
    name: 'Kancing Snap Plastik Putih 12mm Anti Karat',
    category: 'Kancing',
    unit: 'Pcs',
    allowDecimal: false,
    physicalStock: 450,
    reservedStock: 20,
    minimumStock: 100,
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=160&q=80',
    location: 'Etalase Toko - Laci B2',
    lastUpdated: '16 Nov 2026, 09:15',
  },
  {
    id: 'PRD-RES-002',
    sku: 'ZIP-COIL-065',
    name: 'Resleting Coil No. 5 Gigi Spiral 65cm Hitam',
    category: 'Resleting',
    unit: 'Pcs',
    allowDecimal: false,
    physicalStock: 180,
    reservedStock: 15,
    minimumStock: 40,
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=160&q=80',
    location: 'Gudang Utama - Rak B1',
    lastUpdated: '15 Nov 2026, 17:30',
  },
];

const INITIAL_INVENTORY: InventoryItem[] = RAW_INVENTORY_ITEMS.map((item) => {
  const { availableStock, status } = computeStockDetails(
    item.physicalStock,
    item.reservedStock,
    item.minimumStock
  );
  return {
    ...item,
    availableStock,
    status,
  };
});

const INITIAL_MOVEMENT_LOGS: StockMovementLog[] = [
  {
    id: 'LOG-20261116-009',
    itemId: 'PRD-BHN-001',
    productName: 'Kain PVC Balon 0.15mm Merah',
    sku: 'PVC-RED-015',
    type: 'IN',
    quantityChange: 50,
    unit: 'Meter',
    previousPhysical: 70,
    newPhysical: 120,
    reference: 'PO Supplier #SJ-88219 (Pabrik Solo)',
    notes: 'Penerimaan restock bahan gulungan roll baru.',
    date: '16 Nov 2026, 14:15',
    operator: 'Pak Enstein (Admin)',
  },
  {
    id: 'LOG-20261116-008',
    itemId: 'PRD-BHN-002',
    productName: 'Kain PVC Balon 0.15mm Biru Navy',
    sku: 'PVC-NAVY-015',
    type: 'RESERVE',
    quantityChange: -25,
    unit: 'Meter',
    previousPhysical: 48,
    newPhysical: 48,
    reference: 'Order #EST-20261116-0042',
    notes: 'Reservasi otomatis untuk Konveksi Barokah.',
    date: '16 Nov 2026, 11:30',
    operator: 'Sistem Toko (Otomatis)',
  },
  {
    id: 'LOG-20261116-007',
    itemId: 'PRD-RES-001',
    productName: 'Resleting Waterproof 70cm Hitam',
    sku: 'ZIP-WP-070-BLK',
    type: 'OUT_ORDER',
    quantityChange: -10,
    unit: 'Pcs',
    previousPhysical: 24,
    newPhysical: 14,
    reference: 'Order #EST-20261116-0038',
    notes: 'Pemenuhan pesanan pelanggan kirim via Kurir JNE.',
    date: '16 Nov 2026, 10:20',
    operator: 'Staf Gudang',
  },
  {
    id: 'LOG-20261115-006',
    itemId: 'PRD-KRT-001',
    productName: 'Karet Elastis 2.5cm Grade A',
    sku: 'ELAS-BLK-025',
    type: 'ADJUSTMENT',
    quantityChange: -8,
    unit: 'Meter',
    previousPhysical: 20,
    newPhysical: 12,
    reference: 'Opname Rutin #OPN-NOV-15',
    notes: 'Penyesuaian stok opname: potongan sisa rusak/terkena oli.',
    date: '15 Nov 2026, 16:40',
    operator: 'Pak Enstein (Admin)',
  },
];

export default function AdminInventoryPage() {
  // Navigation & UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Inventory State
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [movementLogs, setMovementLogs] = useState<StockMovementLog[]>(INITIAL_MOVEMENT_LOGS);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Update Drawer State (FR-35 & FR-37)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [drawerType, setDrawerType] = useState<'STOCK_IN' | 'ADJUSTMENT'>('STOCK_IN');
  const [inputQuantity, setInputQuantity] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('Selisih Stok Opname Fisik');
  const [referenceInput, setReferenceInput] = useState<string>('');

  // Stock Movement Log Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Toast State
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

  // Metric Computations
  const stats = useMemo(() => {
    const totalProducts = inventory.length;
    const normalCount = inventory.filter((i) => i.status === 'NORMAL').length;
    const lowStockCount = inventory.filter((i) => i.status === 'LOW_STOCK').length;
    const outOfStockCount = inventory.filter((i) => i.status === 'OUT_OF_STOCK').length;

    return {
      totalProducts,
      normalCount,
      lowStockCount,
      outOfStockCount,
      criticalTotal: lowStockCount + outOfStockCount,
    };
  }, [inventory]);

  // Categories list
  const categories = useMemo(() => {
    return Array.from(new Set(inventory.map((i) => i.category)));
  }, [inventory]);

  // Filtered Inventory List
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [inventory, searchQuery, statusFilter, categoryFilter]);

  // Calculations for dynamic preview in Drawer
  const previewCalculation = useMemo(() => {
    if (!selectedItem) return null;

    const parsedQty = parseFloat(inputQuantity) || 0;
    let newPhysical = selectedItem.physicalStock;

    if (drawerType === 'STOCK_IN') {
      newPhysical = Math.max(0, selectedItem.physicalStock + parsedQty);
    } else {
      // Adjustment: Absolute value on hand
      newPhysical = Math.max(0, parsedQty);
    }

    const { availableStock: newAvailable, status: newStatus } = computeStockDetails(
      newPhysical,
      selectedItem.reservedStock,
      selectedItem.minimumStock
    );

    return {
      newPhysical,
      newAvailable,
      newStatus,
      diff: newPhysical - selectedItem.physicalStock,
    };
  }, [selectedItem, drawerType, inputQuantity]);

  // Open Drawer for a specific item
  const handleOpenDrawer = (item: InventoryItem, type: 'STOCK_IN' | 'ADJUSTMENT' = 'STOCK_IN') => {
    setSelectedItem(item);
    setDrawerType(type);
    setInputQuantity(type === 'STOCK_IN' ? '10' : item.physicalStock.toString());
    setReferenceInput(type === 'STOCK_IN' ? 'PO Supplier / Surat Jalan' : 'Opname Rutin Toko');
    setReasonInput('Selisih Stok Opname Fisik');
  };

  // Handle Save Stock Update (FR-35 & FR-37)
  const handleSaveStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !previewCalculation) return;

    const { newPhysical, newAvailable, newStatus, diff } = previewCalculation;

    // 1. Update Inventory State
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            physicalStock: newPhysical,
            availableStock: newAvailable,
            status: newStatus,
            lastUpdated: 'Baru Saja (16 Nov 2026, 14:40)',
          };
        }
        return item;
      })
    );

    // 2. Append Stock Movement Log (FR-36)
    const newLog: StockMovementLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      itemId: selectedItem.id,
      productName: selectedItem.name,
      sku: selectedItem.sku,
      type: drawerType === 'STOCK_IN' ? 'IN' : 'ADJUSTMENT',
      quantityChange: diff,
      unit: selectedItem.unit,
      previousPhysical: selectedItem.physicalStock,
      newPhysical: newPhysical,
      reference: referenceInput || (drawerType === 'STOCK_IN' ? 'Penerimaan Stok Masuk' : 'Koreksi Manual'),
      notes: drawerType === 'STOCK_IN' ? 'Penambahan stok barang masuk dari supplier.' : reasonInput,
      date: '16 Nov 2026, 14:40',
      operator: 'Pak Enstein (Admin)',
    };

    setMovementLogs((prev) => [newLog, ...prev]);

    // 3. Show Toast & Close Drawer
    setToastMessage({
      title: drawerType === 'STOCK_IN' ? 'Barang Masuk Tercatat' : 'Penyesuaian Stok Disimpan',
      desc: `Stok ${selectedItem.name} berhasil diperbarui menjadi ${newPhysical} ${selectedItem.unit} (Tersedia: ${newAvailable} ${selectedItem.unit}).`,
      type: 'success',
    });

    setSelectedItem(null);
  };

  // Render Status Badge (FR-38)
  const renderStatusBadge = (status: StockStatus) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Normal (Aman)
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Low Stock (Kritis)
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Out of Stock (Habis)
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
          (Red geometric 'E', dual typo, glass ADMIN badge, active Inventaris)
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

            {/* Inventory (ACTIVE) */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl bg-zinc-900 text-white shadow-xs transition-all"
            >
              <Boxes className="w-4 h-4 text-zinc-200" />
              <span>Inventaris</span>
              {stats.criticalTotal > 0 && (
                <span className="ml-auto bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {stats.criticalTotal} Kritis
                </span>
              )}
            </button>
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
              <span className="text-zinc-900 font-semibold">Persediaan Barang</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-4 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700">
              <Info className="w-3 h-3 text-blue-600" />
              <span>Formula: Tersedia = Fisik (Hand) − Reservasi</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setToastMessage({
                  title: 'Data Sinkron',
                  desc: 'Seluruh stok fisik dan status reservasi pesanan teraktualisasi.',
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
              {stats.criticalTotal > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
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
              Manajemen Persediaan
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Pantau stok fisik toko, alokasi reservasi pesanan online, dan ambang batas minimum bahan baku jas hujan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/inventory/movements"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs"
            >
              <History className="w-4 h-4 text-zinc-500" />
              <span>Riwayat Mutasi (Ledger)</span>
            </Link>

            <button
              onClick={() => handleOpenDrawer(inventory[0], 'STOCK_IN')}
              className="bg-zinc-900 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Update Stok</span>
            </button>
          </div>
        </div>

        {/* QUICK STATS WIDGETS (grid grid-cols-1 md:grid-cols-4 gap-6 px-8 mb-6) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-8 mb-6">
          {/* Card 1: Total Produk (Zinc) */}
          <div
            onClick={() => setStatusFilter('ALL')}
            className={`p-5 rounded-2xl bg-white border shadow-xs cursor-pointer transition-all ${
              statusFilter === 'ALL'
                ? 'border-zinc-900 ring-2 ring-zinc-900/10'
                : 'border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Total Produk
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {stats.totalProducts}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                Semua item bahan &amp; aksesori
              </p>
            </div>
          </div>

          {/* Card 2: Stok Aman (Green) */}
          <div
            onClick={() => setStatusFilter('NORMAL')}
            className={`p-5 rounded-2xl bg-white border shadow-xs cursor-pointer transition-all ${
              statusFilter === 'NORMAL'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-zinc-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Stok Aman
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-emerald-700">
                {stats.normalCount}
              </div>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                Stok melebihi batas minimum
              </p>
            </div>
          </div>

          {/* Card 3: Low Stock (Amber) */}
          <div
            onClick={() => setStatusFilter('LOW_STOCK')}
            className={`p-5 rounded-2xl bg-white border shadow-xs cursor-pointer transition-all ${
              statusFilter === 'LOW_STOCK'
                ? 'border-amber-500 ring-2 ring-amber-500/20'
                : 'border-zinc-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Low Stock
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-amber-700">
                {stats.lowStockCount}
              </div>
              <p className="text-[11px] text-amber-600 mt-1 font-medium">
                Mendekati ambang batas minimum
              </p>
            </div>
          </div>

          {/* Card 4: Out of Stock (Red) */}
          <div
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
            className={`p-5 rounded-2xl bg-white border shadow-xs cursor-pointer transition-all ${
              statusFilter === 'OUT_OF_STOCK'
                ? 'border-rose-500 ring-2 ring-rose-500/20'
                : 'border-zinc-200 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Out of Stock
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-rose-700">
                {stats.outOfStockCount}
              </div>
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                Stok habis, perlu restock segera
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================
            3. DATA TABLE SECTION (px-8 pb-12)
        =================================================================== */}
        <div className="px-8 pb-12 space-y-4 flex-1">
          {/* FILTER BAR (flex justify-between mb-4) */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Left: Search input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama produk / SKU..."
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

            {/* Right: Status & Category Filter */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-white border border-zinc-200 rounded-lg px-3.5 py-2.5 pr-8 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 transition-colors shadow-xs cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-zinc-200 rounded-lg px-3.5 py-2.5 pr-8 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 transition-colors shadow-xs cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="NORMAL">Normal (Aman)</option>
                  <option value="LOW_STOCK">Low Stock (Kritis)</option>
                  <option value="OUT_OF_STOCK">Out of Stock (Habis)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Reset Filter Button */}
              {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setCategoryFilter('ALL');
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

          {/* THE TABLE (bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden) */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-6">PRODUK</th>
                    <th className="py-3.5 px-6">FISIK (HAND)</th>
                    <th className="py-3.5 px-6">RESERVASI</th>
                    <th className="py-3.5 px-6">TERSEDIA</th>
                    <th className="py-3.5 px-6">MINIMUM</th>
                    <th className="py-3.5 px-6">STATUS</th>
                    <th className="py-3.5 px-6 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 text-xs">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-zinc-400">
                        <Boxes className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                        <p className="font-medium text-zinc-600">Tidak ada produk ditemukan</p>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Coba sesuaikan kata kunci pencarian atau bersihkan filter status.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const isCritical = item.status !== 'NORMAL';
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-zinc-50/80 transition-colors group ${
                            isCritical && item.status === 'OUT_OF_STOCK'
                              ? 'bg-rose-50/20'
                              : isCritical
                              ? 'bg-amber-50/20'
                              : ''
                          }`}
                        >
                          {/* PRODUK: Thumbnail, Name, SKU, Unit */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover border border-zinc-200 bg-zinc-100 shrink-0"
                              />
                              <div className="overflow-hidden">
                                <p className="font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">
                                  {item.name}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                                  <span className="font-mono">{item.sku}</span>
                                  <span>&bull;</span>
                                  <span>{item.category}</span>
                                  <span>&bull;</span>
                                  <span className="capitalize">{item.unit}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* FISIK (Physical): Bold text */}
                          <td className="py-4 px-6">
                            <span className="font-bold text-zinc-900 text-sm font-mono">
                              {item.physicalStock}
                            </span>
                            <span className="text-[11px] text-zinc-500 ml-1">
                              {item.unit}
                            </span>
                            <span className="block text-[10px] text-zinc-400">
                              {item.location}
                            </span>
                          </td>

                          {/* RESERVASI: Muted text */}
                          <td className="py-4 px-6">
                            <span className="font-medium text-zinc-500 font-mono">
                              {item.reservedStock}
                            </span>
                            <span className="text-[11px] text-zinc-400 ml-1">
                              {item.unit}
                            </span>
                            {item.reservedStock > 0 && (
                              <span className="block text-[10px] text-amber-600 font-medium">
                                Pending Order
                              </span>
                            )}
                          </td>

                          {/* TERSEDIA: Emphasized bold text */}
                          <td className="py-4 px-6">
                            <div className="flex items-baseline gap-1">
                              <span
                                className={`text-lg font-bold font-mono ${
                                  item.status === 'OUT_OF_STOCK'
                                    ? 'text-rose-600'
                                    : item.status === 'LOW_STOCK'
                                    ? 'text-amber-600'
                                    : 'text-zinc-900'
                                }`}
                              >
                                {item.availableStock}
                              </span>
                              <span className="text-xs text-zinc-500 font-medium">
                                {item.unit}
                              </span>
                            </div>
                            <span className="block text-[10px] text-zinc-400">
                              (Siap Dijual)
                            </span>
                          </td>

                          {/* MINIMUM: Small muted text */}
                          <td className="py-4 px-6">
                            <span className="text-xs text-zinc-500 font-mono">
                              {item.minimumStock} {item.unit}
                            </span>
                          </td>

                          {/* STATUS: Sleek Pill Badges */}
                          <td className="py-4 px-6">{renderStatusBadge(item.status)}</td>

                          {/* AKSI: Subtle ghost button Update */}
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleOpenDrawer(item, 'STOCK_IN')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Update</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER */}
            <div className="px-6 py-4 bg-zinc-50/60 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-500 gap-2">
              <span>
                Menampilkan <span className="font-semibold text-zinc-700">{filteredInventory.length}</span> dari{' '}
                <span className="font-semibold text-zinc-700">{inventory.length}</span> total persediaan produk
              </span>
              <span className="text-[11px] text-zinc-400">
                Peringatan otomatis aktif berdasarkan ambang batas reorder Toko Enstein
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* =====================================================================
          4. INVENTORY UPDATE DRAWER (Slide-out panel)
          (Slide-out panel emerging from right side with backdrop)
      ===================================================================== */}
      {selectedItem && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Shell */}
          <aside className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-zinc-200 z-50 transform transition-transform duration-300 flex flex-col">
            {/* Header */}
            <div className="h-20 px-6 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
                  <Boxes className="w-5 h-5 text-zinc-700" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Update Stok Produk</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Catat barang masuk atau penyesuaian opname</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveStockUpdate} className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Product Info Card */}
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex items-center gap-3">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-14 h-14 rounded-xl object-cover border border-zinc-200 bg-white shrink-0"
                  />
                  <div className="overflow-hidden flex-1">
                    <h3 className="font-semibold text-xs text-zinc-900 truncate">
                      {selectedItem.name}
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      {selectedItem.sku} &bull; {selectedItem.category}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-zinc-500">
                        Fisik:{' '}
                        <span className="font-bold text-zinc-800">
                          {selectedItem.physicalStock} {selectedItem.unit}
                        </span>
                      </span>
                      <span>&bull;</span>
                      <span className="text-[11px] text-zinc-500">
                        Tersedia:{' '}
                        <span className="font-bold text-emerald-600">
                          {selectedItem.availableStock} {selectedItem.unit}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Type Selector: Segmented Control */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-2">
                    Jenis Tindakan Stok
                  </label>
                  <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerType('STOCK_IN');
                        setInputQuantity('10');
                      }}
                      className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        drawerType === 'STOCK_IN'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Barang Masuk (In)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDrawerType('ADJUSTMENT');
                        setInputQuantity(selectedItem.physicalStock.toString());
                      }}
                      className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        drawerType === 'ADJUSTMENT'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-600" />
                      <span>Penyesuaian (Opname)</span>
                    </button>
                  </div>
                </div>

                {/* Form Input: STOCK IN */}
                {drawerType === 'STOCK_IN' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        Jumlah Masuk ({selectedItem.unit}) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={selectedItem.allowDecimal ? '0.1' : '1'}
                          min="0.1"
                          required
                          value={inputQuantity}
                          onChange={(e) => setInputQuantity(e.target.value)}
                          placeholder="Masukkan jumlah barang masuk..."
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                          {selectedItem.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Jumlah akan ditambahkan langsung ke stok fisik toko.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        Referensi / Surat Jalan
                      </label>
                      <input
                        type="text"
                        value={referenceInput}
                        onChange={(e) => setReferenceInput(e.target.value)}
                        placeholder="Contoh: SJ-202611-081 atau PO Pabrik"
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                      />
                    </div>
                  </div>
                )}

                {/* Form Input: ADJUSTMENT */}
                {drawerType === 'ADJUSTMENT' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        Jumlah Fisik Baru ({selectedItem.unit}) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={selectedItem.allowDecimal ? '0.1' : '1'}
                          min="0"
                          required
                          value={inputQuantity}
                          onChange={(e) => setInputQuantity(e.target.value)}
                          placeholder="Hasil hitung riil di toko/gudang..."
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                          {selectedItem.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Nilai mutlak hasil hitungan fisik (stok opname) saat ini.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        Alasan Penyesuaian <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={reasonInput}
                        onChange={(e) => setReasonInput(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 mb-2"
                      >
                        <option value="Selisih Stok Opname Fisik">Selisih Stok Opname Fisik</option>
                        <option value="Barang Rusak / Cacat Produksi">Barang Rusak / Cacat Produksi</option>
                        <option value="Barang Hilang / Selisih Potong">Barang Hilang / Selisih Potong</option>
                        <option value="Koreksi Salah Input Admin">Koreksi Salah Input Admin</option>
                        <option value="Retur Pembeli Masuk Kembali">Retur Pembeli Masuk Kembali</option>
                      </select>

                      <textarea
                        rows={2}
                        value={reasonInput}
                        onChange={(e) => setReasonInput(e.target.value)}
                        placeholder="Catatan detail audit penyesuaian..."
                        className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10"
                      />
                    </div>
                  </div>
                )}

                {/* DYNAMIC PREVIEW BOX */}
                {previewCalculation && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                        Kalkulasi Setelah Update
                      </span>
                      <span className="text-xs font-mono font-semibold text-zinc-700">
                        {previewCalculation.diff >= 0 ? `+${previewCalculation.diff}` : previewCalculation.diff}{' '}
                        {selectedItem.unit}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[11px]">Stok Fisik Baru:</span>
                        <span className="font-bold text-zinc-900 text-sm font-mono">
                          {previewCalculation.newPhysical} {selectedItem.unit}
                        </span>
                      </div>

                      <div>
                        <span className="text-zinc-500 block text-[11px]">Tersedia (Ready):</span>
                        <span className="font-bold text-emerald-600 text-sm font-mono">
                          {previewCalculation.newAvailable} {selectedItem.unit}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Status Baru:</span>
                      <div>{renderStatusBadge(previewCalculation.newStatus)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-zinc-200 bg-white shrink-0">
                <button
                  type="submit"
                  className="bg-zinc-900 text-white w-full py-3 rounded-lg font-semibold text-xs hover:bg-zinc-800 transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Simpan Perubahan Stok</span>
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {/* =====================================================================
          5. STOCK MOVEMENT AUDIT LOG MODAL (FR-36)
      ===================================================================== */}
      {historyModalOpen && (
        <div
          onClick={() => setHistoryModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="h-16 px-6 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Riwayat Pergerakan Stok</h3>
                  <p className="text-xs text-zinc-400">Log audit keluar, masuk, dan penyesuaian bahan baku</p>
                </div>
              </div>

              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {movementLogs.map((log) => {
                const isPositive = log.quantityChange > 0;
                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900">{log.productName}</span>
                        <span className="font-mono text-[11px] text-zinc-400">({log.sku})</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.type === 'IN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.type === 'ADJUSTMENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.type}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-[11px]">
                        Ref: <span className="font-medium text-zinc-700">{log.reference}</span> &bull; {log.notes}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Oleh: {log.operator} &bull; {log.date}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${log.quantityChange}` : log.quantityChange} {log.unit}
                      </span>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                        Fisik: {log.previousPhysical} &rarr; {log.newPhysical} {log.unit}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
              <span>Menampilkan {movementLogs.length} transaksi pergerakan stok terakhir</span>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-semibold text-xs hover:bg-zinc-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
