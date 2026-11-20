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
  Plus,
  Minus,
  Trash2,
  Calendar,
  ChevronDown,
  ExternalLink,
  LogOut,
  Bell,
  Menu,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingCart,
  User,
  Phone,
  Receipt,
  Printer,
  RotateCcw,
  Info,
  DollarSign,
  Wallet,
  Building2,
  CheckCircle,
} from 'lucide-react';

// ============================================================================
// DATA MODELS & TYPES (PRD SECTION 9.3.8, FR-40, FR-41, FR-42, FR-44)
// ============================================================================

export interface OfflineProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  allowDecimal: boolean;
  stock: number;
  image: string;
}

export interface SelectedItem {
  product: OfflineProduct;
  quantity: number;
  subtotal: number;
}

export interface CompletedOfflineSale {
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  items: SelectedItem[];
  subtotal: number;
  discount: number;
  total: number;
  cashReceived?: number;
  cashChange?: number;
}

// ============================================================================
// INITIAL MOCK PRODUCTS CATALOG (PRD DOMAIN BAHAN & AKSESORI ENSTEIN KEBUMEN)
// ============================================================================

const AVAILABLE_PRODUCTS: OfflineProduct[] = [
  {
    id: 'PRD-BHN-001',
    sku: 'PVC-RED-015',
    name: 'Kain PVC Balon 0.15mm Merah',
    category: 'Material Jas Hujan',
    price: 25000,
    unit: 'Meter',
    allowDecimal: true,
    stock: 95,
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'PRD-BHN-002',
    sku: 'PVC-NAVY-015',
    name: 'Kain PVC Balon 0.15mm Biru Navy',
    category: 'Material Jas Hujan',
    price: 25000,
    unit: 'Meter',
    allowDecimal: true,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'PRD-BHN-003',
    sku: 'TSL-MILK-ARM',
    name: 'Kain Taslan Milky Waterproof Hijau Army',
    category: 'Material Jas Hujan',
    price: 38000,
    unit: 'Meter',
    allowDecimal: true,
    stock: 210,
    image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'PRD-BHN-004',
    sku: 'MIKA-CLR-020',
    name: 'Mika Transparan Ketebalan 0.20mm',
    category: 'Material Jas Hujan',
    price: 450000,
    unit: 'Roll',
    allowDecimal: false,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'PRD-RES-001',
    sku: 'ZIP-WP-070-BLK',
    name: 'Resleting Waterproof 70cm Hitam Seal Karet',
    category: 'Resleting',
    price: 12500,
    unit: 'Pcs',
    allowDecimal: false,
    stock: 14,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'PRD-RES-002',
    sku: 'ZIP-COIL-065',
    name: 'Resleting Coil No. 5 Gigi Spiral 65cm',
    category: 'Resleting',
    price: 6000,
    unit: 'Pcs',
    allowDecimal: false,
    stock: 165,
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'PRD-KRT-001',
    sku: 'ELAS-BLK-025',
    name: 'Karet Elastis 2.5cm Grade A Hitam',
    category: 'Karet',
    price: 4000,
    unit: 'Meter',
    allowDecimal: true,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'PRD-KNC-001',
    sku: 'SNP-MET-015',
    name: 'Kancing Snap Button Besi 15mm Nikel',
    category: 'Kancing',
    price: 1500,
    unit: 'Pcs',
    allowDecimal: false,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'PRD-KNC-002',
    sku: 'SNP-PLS-WHT',
    name: 'Kancing Snap Plastik Putih 12mm',
    category: 'Kancing',
    price: 750,
    unit: 'Pcs',
    allowDecimal: false,
    stock: 430,
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'PRD-AKS-002',
    sku: 'SEAM-TAPE-020',
    name: 'Seam Sealing Tape Panas 20mm Pelapis Jahitan',
    category: 'Aksesori',
    price: 8000,
    unit: 'Meter',
    allowDecimal: true,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=160&q=80',
  },
];

// Helper: Format Rupiah
const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function AdminOfflineSalesPage() {
  // Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cart / Selected Items State (FR-41 & FR-42)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([
    {
      product: AVAILABLE_PRODUCTS[0], // PVC Merah
      quantity: 5,
      subtotal: 5 * AVAILABLE_PRODUCTS[0].price,
    },
    {
      product: AVAILABLE_PRODUCTS[4], // Resleting WP
      quantity: 2,
      subtotal: 2 * AVAILABLE_PRODUCTS[4].price,
    },
  ]);

  // Product Search & Catalog State
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Customer Info State (PRD 5.1 & 7.3: Walk-in, optional)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Payment Calculation State
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'QRIS' | 'TRANSFER'>('TUNAI');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');

  // Success Receipt Modal State
  const [completedSale, setCompletedSale] = useState<CompletedOfflineSale | null>(null);

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

  // Categories list
  const categories = useMemo(() => {
    return ['Semua', ...Array.from(new Set(AVAILABLE_PRODUCTS.map((p) => p.category)))];
  }, []);

  // Filtered Product Catalog for Selector
  const filteredProducts = useMemo(() => {
    return AVAILABLE_PRODUCTS.filter((prod) => {
      const q = searchProductQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q);

      const matchCategory =
        selectedCategory === 'Semua' || prod.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [searchProductQuery, selectedCategory]);

  // Calculations
  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.subtotal, 0);
  }, [selectedItems]);

  const discount = 0;
  const grandTotal = subtotal - discount;

  const cashReceived = parseFloat(cashReceivedInput) || 0;
  const cashChange = Math.max(0, cashReceived - grandTotal);

  // Add Product to Cart
  const handleAddProduct = (product: OfflineProduct) => {
    setSelectedItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        // Increment quantity by 1 or 0.5
        const step = product.allowDecimal ? 1 : 1;
        const newQty = prev[existingIndex].quantity + step;
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: newQty * product.price,
        };
        return updated;
      } else {
        // Add new
        return [
          ...prev,
          {
            product,
            quantity: 1,
            subtotal: product.price,
          },
        ];
      }
    });

    setToastMessage({
      title: 'Item Ditambahkan',
      desc: `${product.name} dimasukkan ke daftar transaksi kasir.`,
      type: 'info',
    });
  };

  // Update Quantity
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * item.product.price,
          };
        }
        return item;
      })
    );
  };

  // Remove Item
  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear Cart
  const handleClearCart = () => {
    if (window.confirm('Kosongkan semua item dalam transaksi ini?')) {
      setSelectedItems([]);
      setCashReceivedInput('');
    }
  };

  // Submit Transaction (FR-44: sales_channel=OFFLINE, fulfillment_method=IN_STORE, order_status=COMPLETED, payment_status=PAID)
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      alert('Tambahkan minimal 1 produk untuk menyimpan transaksi.');
      return;
    }

    if (paymentMethod === 'TUNAI' && cashReceivedInput && cashReceived < grandTotal) {
      alert('Uang tunai yang diterima kurang dari total belanja.');
      return;
    }

    const orderNum = `EST-OFF-20261116-${Math.floor(1000 + Math.random() * 9000)}`;

    const completed: CompletedOfflineSale = {
      orderNumber: orderNum,
      date: '16 Nov 2026, 14:45 WIB',
      customerName: customerName.trim() || 'Pelanggan Langsung (Walk-in)',
      customerPhone: customerPhone.trim() || '-',
      paymentMethod:
        paymentMethod === 'TUNAI'
          ? 'Tunai (Cash Fisik)'
          : paymentMethod === 'QRIS'
          ? 'QRIS Kasir Enstein'
          : 'Transfer Bank Toko',
      items: [...selectedItems],
      subtotal,
      discount,
      total: grandTotal,
      cashReceived: paymentMethod === 'TUNAI' ? cashReceived || grandTotal : undefined,
      cashChange: paymentMethod === 'TUNAI' ? cashChange : undefined,
    };

    setCompletedSale(completed);

    setToastMessage({
      title: 'Transaksi Kasir Berhasil!',
      desc: `Pesanan offline #${orderNum} telah disimpan dengan status COMPLETED & PAID.`,
      type: 'success',
    });

    // Reset Form for next customer
    setSelectedItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setCashReceivedInput('');
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased flex flex-col">
      {/* =====================================================================
          1. THE STANDARDIZED ADMIN SIDEBAR
          (Red geometric 'E', dual typo, glass ADMIN badge, active Penjualan Offline)
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

            {/* Inventory */}
            <Link
              href="/admin/inventory"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-colors"
            >
              <Boxes className="w-4 h-4" />
              <span>Inventaris</span>
              <span className="ml-auto bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                6 Kritis
              </span>
            </Link>
          </nav>

          {/* Section: OPERASIONAL TOKO */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-3 px-2">
              OPERASIONAL TOKO
            </p>
            <nav className="space-y-1">
              {/* Penjualan Offline (ACTIVE) */}
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl bg-zinc-900 text-white shadow-xs transition-all"
              >
                <Store className="w-4 h-4 text-zinc-200" />
                <span>Penjualan Offline</span>
                <span className="ml-auto bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase">
                  POS
                </span>
              </button>

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
                <p className="text-[10px] text-zinc-500 truncate">Kasir &amp; Admin Toko</p>
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
              <span className="text-zinc-900 font-semibold">Penjualan Offline</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-4 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Kasir Toko Fisik Aktif (Tanahsari, Kebumen)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-600 border border-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Senin, 16 Nov 2026</span>
            </div>

            <button className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg relative">
              <Bell className="w-4 h-4" />
            </button>

            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-zinc-200">
              PE
            </div>
          </div>
        </header>

        {/* TOAST NOTIFICATION */}
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
              Catat Penjualan Offline
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Pencatatan langsung transaksi kasir toko fisik untuk pembeli langsung (walk-in) tanpa perlu akun pelanggan (PRD 5.1 &amp; FR-40).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedItems.length > 0 && (
              <button
                onClick={handleClearCart}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Transaksi</span>
              </button>
            )}

            <Link
              href="/admin/orders"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5 text-zinc-500" />
              <span>Daftar Pesanan Toko</span>
            </Link>
          </div>
        </div>

        {/* ===================================================================
            3. SPLIT ENTRY LAYOUT (px-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8)
        =================================================================== */}
        <div className="px-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          {/* LEFT COLUMN: PRODUCT SELECTION & CART (span 8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* PRODUCT SELECTOR SEARCH BAR & QUICK CATALOG */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Pilih Produk Toko</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Ketik nama bahan/aksesori atau klik dari daftar cepat di bawah
                  </p>
                </div>
                <span className="text-xs text-zinc-500 font-medium">
                  {AVAILABLE_PRODUCTS.length} Produk Tersedia
                </span>
              </div>

              {/* Search Bar Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari dan pilih produk untuk ditambahkan (contoh: PVC, Resleting, Kancing)..."
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 focus:bg-white transition-all shadow-inner"
                />
                {searchProductQuery && (
                  <button
                    onClick={() => setSearchProductQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === cat
                        ? 'bg-zinc-900 text-white shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Quick Products Mini Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 max-h-60 overflow-y-auto pr-1">
                {filteredProducts.map((product) => {
                  const isAlreadyInCart = selectedItems.some((i) => i.product.id === product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 cursor-pointer transition-all group ${
                        isAlreadyInCart
                          ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-400/20'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-9 h-9 rounded-lg object-cover border border-zinc-200 bg-zinc-100 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-zinc-900 truncate group-hover:text-amber-600 transition-colors">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            {formatRupiah(product.price)} / {product.unit}
                          </p>
                        </div>
                      </div>

                      <button
                        title="Tambahkan ke Transaksi"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isAlreadyInCart
                            ? 'bg-amber-500 text-white'
                            : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SELECTED ITEMS LIST (bg-white border border-zinc-200 rounded-2xl shadow-sm) */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden min-h-[420px] flex flex-col justify-between">
              <div>
                {/* Header: "Item Transaksi" */}
                <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900">Item Transaksi Kasir</h3>
                      <p className="text-xs text-zinc-400">
                        {selectedItems.length} macam produk dipilih
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-md">
                    Total Kuantitas:{' '}
                    <span className="font-mono text-zinc-900">
                      {selectedItems.reduce((acc, curr) => acc + curr.quantity, 0)}
                    </span>
                  </span>
                </div>

                {/* Empty State */}
                {selectedItems.length === 0 ? (
                  <div className="py-24 text-center text-zinc-400 px-6">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-zinc-300 stroke-1" />
                    <p className="font-semibold text-zinc-700 text-sm">
                      Belum ada produk yang dipilih
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                      Cari produk di panel atas atau klik tombol (+) pada kartu produk untuk menambahkan item belanja pelanggan.
                    </p>
                  </div>
                ) : (
                  /* Filled Items List */
                  <div className="divide-y divide-zinc-100">
                    {selectedItems.map((item) => {
                      const { product, quantity, subtotal: itemSubtotal } = item;
                      const step = product.allowDecimal ? 0.5 : 1;
                      return (
                        <div
                          key={product.id}
                          className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-zinc-50/50 transition-colors"
                        >
                          {/* Left: Image, Name, SKU, Price */}
                          <div className="flex items-center gap-3.5 min-w-[240px]">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover border border-zinc-200 bg-zinc-100 shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-xs text-zinc-900 line-clamp-1">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                                <span className="font-mono">{product.sku}</span>
                                <span>&bull;</span>
                                <span className="font-mono font-medium text-zinc-600">
                                  {formatRupiah(product.price)} / {product.unit}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Center: Sleek Quantity Selector (Minus, Input, Plus) */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-zinc-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(product.id, Math.max(0, quantity - step))}
                                className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                                title="Kurang"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <input
                                type="number"
                                step={product.allowDecimal ? '0.1' : '1'}
                                min="0.1"
                                value={quantity}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  handleUpdateQuantity(product.id, val);
                                }}
                                className="w-16 text-center text-xs font-mono font-bold text-zinc-900 border-x border-zinc-200 py-1.5 focus:outline-hidden"
                              />

                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(product.id, quantity + step)}
                                className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                                title="Tambah"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-xs text-zinc-400 font-medium">
                              {product.unit}
                            </span>
                          </div>

                          {/* Right: Subtotal + Delete Button */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 min-w-[150px]">
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-zinc-900 block">
                                {formatRupiah(itemSubtotal)}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                ({quantity} &times; {formatRupiah(product.price)})
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(product.id)}
                              className="text-zinc-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Hapus Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Table Footer info */}
              <div className="p-4 bg-zinc-50/60 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  Mendukung pembelian bahan desimal (seperti <span className="font-semibold text-zinc-700">2.5 Meter</span>)
                </span>
                <span className="font-medium text-emerald-600">
                  Stok otomatis berkurang setelah disimpan (FR-44)
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CUSTOMER INFO & SUMMARY (span 4) */}
          <div className="lg:col-span-4 space-y-6">
            <form onSubmit={handleSaveTransaction} className="sticky top-24 space-y-6">
              {/* CUSTOMER INFO CARD (bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm) */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-500" />
                    <span>Informasi Pembeli (Opsional)</span>
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">
                      Nama Pembeli (Walk-in)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Bu Rina / Pak Budi (Konveksi)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">
                      Nomor Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 0812-3456-7890"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-2xs"
                    />
                  </div>

                  <p className="text-[11px] text-zinc-400 italic pt-1">
                    Kosongkan jika pembeli datang langsung dan tidak ingin didata nomor kontaknya.
                  </p>
                </div>
              </div>

              {/* TRANSACTION SUMMARY CARD (bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm) */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-zinc-500" />
                    <span>Ringkasan Transaksi</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Lunas di Kasir
                  </span>
                </div>

                {/* Metode Pembayaran Kasir */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('TUNAI')}
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        paymentMethod === 'TUNAI'
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5 mx-auto mb-1" />
                      <span>Tunai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        paymentMethod === 'QRIS'
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5 mx-auto mb-1" />
                      <span>QRIS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('TRANSFER')}
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        paymentMethod === 'TRANSFER'
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 mx-auto mb-1" />
                      <span>Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Kalkulator Tunai (Cash Received & Change) */}
                {paymentMethod === 'TUNAI' && (
                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2 text-xs">
                    <label className="text-[11px] font-semibold text-zinc-700 block">
                      Uang Diterima dari Pembeli (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-zinc-400 font-medium">
                        Rp
                      </span>
                      <input
                        type="number"
                        placeholder="Contoh: 150000"
                        value={cashReceivedInput}
                        onChange={(e) => setCashReceivedInput(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10"
                      />
                    </div>

                    {cashReceived > 0 && (
                      <div className="flex items-center justify-between pt-1 font-mono text-xs">
                        <span className="text-zinc-500">Uang Kembalian:</span>
                        <span
                          className={`font-bold ${
                            cashChange >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {cashReceived >= grandTotal
                            ? formatRupiah(cashChange)
                            : `Kurang ${formatRupiah(grandTotal - cashReceived)}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Perhitungan Dasar Subtotal & Diskon */}
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Subtotal Produk ({selectedItems.length} item)</span>
                    <span className="font-mono font-medium text-zinc-800">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Pajak &amp; Biaya Admin Toko</span>
                    <span className="font-mono text-zinc-400">Rp 0 (Gratis)</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-200 my-4" />

                {/* Grand Total: text-3xl font-bold text-zinc-900 mb-6 flex justify-between */}
                <div className="mb-4">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">
                    Total Pembayaran
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-zinc-900 font-mono tracking-tight">
                      {formatRupiah(grandTotal)}
                    </span>
                    <span className="text-xs font-semibold text-zinc-400">IDR</span>
                  </div>
                </div>

                {/* Static Info Box (bg-blue-50 text-blue-700 p-3 rounded-lg text-xs mb-6) */}
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3.5 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Konfirmasi Alur PRD (FR-44)</span>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Transaksi ini otomatis dicatat dengan kanal <span className="font-semibold">OFFLINE</span>, fulfillment <span className="font-semibold">IN_STORE</span>, status pesanan <span className="font-semibold">COMPLETED</span>, dan pembayaran <span className="font-semibold">PAID</span>.
                  </p>
                </div>

                {/* Action Button: "Simpan Transaksi" */}
                <button
                  type="submit"
                  disabled={selectedItems.length === 0}
                  className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-md flex justify-center items-center gap-2 ${
                    selectedItems.length > 0
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer'
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Simpan Transaksi Kasir</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* =====================================================================
          4. SUCCESS RECEIPT MODAL DIALOG
      ===================================================================== */}
      {completedSale && (
        <div
          onClick={() => setCompletedSale(null)}
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-zinc-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Transaksi Kasir Berhasil</h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{completedSale.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setCompletedSale(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[60vh]">
              <div className="text-center pb-3 border-b border-dashed border-zinc-200">
                <p className="font-bold text-base text-zinc-900">ENSTEIN STORE KEBUMEN</p>
                <p className="text-[11px] text-zinc-500">
                  Bahan Jas Hujan, Parasut, Mika &amp; Aksesoris Konveksi
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Jl. Kertanegara Km. 03 Tanahsari, Kebumen &bull; 0812-3456-7890
                </p>
                <p className="text-[10px] font-mono text-zinc-400 mt-1">{completedSale.date}</p>
              </div>

              {/* Buyer info */}
              <div className="flex justify-between py-1 text-zinc-600">
                <span>Pelanggan:</span>
                <span className="font-semibold text-zinc-900">{completedSale.customerName}</span>
              </div>
              <div className="flex justify-between py-1 text-zinc-600">
                <span>Metode Bayar:</span>
                <span className="font-medium text-zinc-800">{completedSale.paymentMethod}</span>
              </div>

              {/* Items List */}
              <div className="py-2 border-y border-dashed border-zinc-200 space-y-2">
                <p className="font-semibold text-zinc-500 text-[10px] uppercase tracking-wider">
                  Rincian Barang:
                </p>
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-zinc-800">{item.product.name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {item.quantity} {item.product.unit} &times; {formatRupiah(item.product.price)}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-zinc-900">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total & Change */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatRupiah(completedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-zinc-900 pt-1 border-t border-zinc-100">
                  <span>Total Bayar:</span>
                  <span className="font-mono">{formatRupiah(completedSale.total)}</span>
                </div>
                {completedSale.cashReceived !== undefined && (
                  <>
                    <div className="flex justify-between text-zinc-600 pt-1">
                      <span>Uang Tunai:</span>
                      <span className="font-mono">{formatRupiah(completedSale.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Kembalian:</span>
                      <span className="font-mono">{formatRupiah(completedSale.cashChange || 0)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-zinc-200 bg-zinc-50 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-1/2 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-100 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk</span>
              </button>

              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Transaksi Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
