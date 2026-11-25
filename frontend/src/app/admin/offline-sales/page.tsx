'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdminLayout } from '@/components/admin/AdminShell';
import { adminCreateOfflineSale, adminGetOrders } from '../../../lib/orders-api';
import {
  adminGetProducts,
  getCategories,
  resolveProductImageUrl,
} from '../../../lib/catalog-api';
import { ApiException } from '../../../lib/api';
import type {
  ProductResponse,
  CategoryResponse,
  OrderDetailResponse,
  PaymentMethod,
} from '../../../types/api';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
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
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Printer,
  Copy,
  Check,
  Receipt,
  Clock,
  ArrowRight,
  ChevronDown,
  History,
  Sparkles,
  Banknote,
  Wallet,
  Building2,
  ShoppingBag as ShoppingBagIcon,
  Phone,
  UserCheck,
} from 'lucide-react';

// ─── Formatters ──────────────────────────────────────────────────────────────
function formatIDR(n?: number | null): string {
  if (n === undefined || n === null || isNaN(Number(n))) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n));
}

function formatQty(n?: number | null, allowDecimal: boolean = false): string {
  if (n === undefined || n === null || isNaN(Number(n))) return '0';
  const num = Number(n);
  if (allowDecimal) {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  }
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(iso?: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ─── POS Cart Item Structure ─────────────────────────────────────────────────
interface PosCartItem {
  productId: string;
  code: string;
  name: string;
  price: number;
  unitSymbol: string;
  allowDecimal: boolean;
  availableStock: number;
  quantity: number;
  image?: string;
}

export default function AdminOfflineSalesPage() {
  const router = useRouter();
  const { user, isAdmin, logout, loading: authLoading } = useAuth();

  // ─── Live Data States ──────────────────────────────────────────────────────
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [recentOfflineOrders, setRecentOfflineOrders] = useState<OrderDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Search & Category Filters (Left Grid) ─────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // ─── POS Cart State ────────────────────────────────────────────────────────
  const [cart, setCart] = useState<PosCartItem[]>([]);

  // ─── Customer & Payment Information ────────────────────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<number | string>('');

  // ─── Submitting & Receipt Modal States ──────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState<OrderDetailResponse | null>(null);
  const [receiptCash, setReceiptCash] = useState<number>(0);
  const [receiptChange, setReceiptChange] = useState<number>(0);

  // Layout UI
  const { toggleMobile } = useAdminLayout();
  const [showHistorySection, setShowHistorySection] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  // ─── Authentication Guard ──────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/auth');
    }
  }, [authLoading, isAdmin, router]);

  // Toast Timer
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // ─── Fetch Real Products & Offline Orders from PostgreSQL ───────────────────
  const fetchAllPosData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [prodRes, catRes, orderRes] = await Promise.allSettled([
          adminGetProducts({ size: 100 }),
          getCategories(),
          adminGetOrders({ page: 0, size: 50 }),
        ]);

        if (prodRes.status === 'fulfilled') {
          setProducts(prodRes.value.content || []);
          setDbConnected(true);
        } else {
          setDbConnected(false);
          throw prodRes.reason;
        }

        if (catRes.status === 'fulfilled') {
          setCategories(catRes.value || []);
        }

        if (orderRes.status === 'fulfilled') {
          // Filter to only OFFLINE orders
          const allOrders = orderRes.value.content || [];
          const offlineOnly = allOrders.filter((o) => o.orderType === 'OFFLINE');
          setRecentOfflineOrders(offlineOnly);
        }
      } catch (err) {
        setDbConnected(false);
        setError(err instanceof ApiException ? err.message : 'Koneksi ke backend POS gagal.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchAllPosData();
    }
  }, [authLoading, isAdmin, fetchAllPosData]);

  // ─── Filtered Product Catalog (Left Side) ──────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Must be active
      if (p.isActive === false) return false;

      // Category Filter
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = p.name?.toLowerCase().includes(q);
        const codeMatch = p.code?.toLowerCase().includes(q);
        const catMatch = p.categoryName?.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !catMatch) return false;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // ─── Cart Calculations ─────────────────────────────────────────────────────
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }, [cart]);

  const grandTotal = cartSubtotal; // Offline walk-in counter sales have 0 delivery fee

  const numCashReceived = Number(cashReceived) || 0;
  const cashChange = Math.max(0, numCashReceived - grandTotal);
  const isCashInsufficient = paymentMethod === 'CASH' && numCashReceived < grandTotal;

  // ─── Add Product to Cart ───────────────────────────────────────────────────
  const handleAddToCart = (product: ProductResponse) => {
    const physical = Number(product.stockOnHand || 0);
    const reserved = Number(product.reservedQuantity || 0);
    const available = Math.max(0, physical - reserved);

    if (available <= 0) {
      setToastMsg({
        type: 'error',
        text: `Stok produk "${product.name}" habis di gudang (0 ${product.unitSymbol || 'unit'}).`,
      });
      return;
    }

    const existingIndex = cart.findIndex((i) => i.productId === product.id);
    const step = product.allowDecimal ? 1 : 1;

    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      const newQty = existing.quantity + step;

      if (newQty > available) {
        setToastMsg({
          type: 'error',
          text: `Maksimal stok tersedia untuk "${product.name}" adalah ${formatQty(available, product.allowDecimal)} ${product.unitSymbol || ''}.`,
        });
        return;
      }

      setCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: newQty } : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          productId: product.id,
          code: product.code,
          name: product.name,
          price: product.price,
          unitSymbol: product.unitSymbol || 'unit',
          allowDecimal: Boolean(product.allowDecimal),
          availableStock: available,
          quantity: step,
          image: product.image,
        },
      ]);
    }
  };

  // ─── Update Cart Quantity ──────────────────────────────────────────────────
  const handleUpdateQty = (productId: string, newQty: number) => {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (newQty > item.availableStock) {
      setToastMsg({
        type: 'error',
        text: `Kuantitas melebihi stok tersedia (${formatQty(item.availableStock, item.allowDecimal)} ${item.unitSymbol}).`,
      });
      return;
    }

    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: newQty } : i))
    );
  };

  // ─── Remove Item from Cart ─────────────────────────────────────────────────
  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  // ─── Clear Whole Cart ──────────────────────────────────────────────────────
  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan semua item di keranjang kasir?')) {
      setCart([]);
      setCashReceived('');
    }
  };

  // ─── Quick Cash Denomination Chips ─────────────────────────────────────────
  const quickCashChips = useMemo(() => {
    if (grandTotal <= 0) return [];
    const chips: number[] = [grandTotal];

    const standard = [50000, 100000, 200000, 500000];
    standard.forEach((amt) => {
      if (amt >= grandTotal && !chips.includes(amt)) {
        chips.push(amt);
      }
    });

    const rounded50k = Math.ceil(grandTotal / 50000) * 50000;
    if (rounded50k > grandTotal && !chips.includes(rounded50k)) {
      chips.push(rounded50k);
    }

    return chips.sort((a, b) => a - b).slice(0, 5);
  }, [grandTotal]);

  // ─── Submit Transaction to Spring Boot (POST /api/admin/offline-sales) ──────
  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setToastMsg({ type: 'error', text: 'Keranjang kasir masih kosong.' });
      return;
    }

    if (paymentMethod === 'CASH' && numCashReceived < grandTotal) {
      setToastMsg({
        type: 'error',
        text: `Uang tunai diterima (${formatIDR(numCashReceived)}) kurang dari total tagihan (${formatIDR(grandTotal)}).`,
      });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const clientCustomerName = customerName.trim() || 'Pelanggan Toko (Offline)';
    const clientCustomerPhone = customerPhone.trim() || undefined;

    try {
      const response = await adminCreateOfflineSale({
        customerName: clientCustomerName,
        recipientName: clientCustomerName,
        customerPhone: clientCustomerPhone,
        recipientPhone: clientCustomerPhone,
        paymentMethod: paymentMethod,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        notes: notes.trim() || undefined,
      });

      // Transaction Success!
      setToastMsg({
        type: 'success',
        text: `Transaksi #${response.orderNumber} berhasil dicatat & stok terpotong otomatis!`,
      });

      // Save for receipt modal
      setReceiptOrder(response);
      setReceiptCash(paymentMethod === 'CASH' ? numCashReceived : grandTotal);
      setReceiptChange(paymentMethod === 'CASH' ? cashChange : 0);

      // Reset Form & Cart
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setCashReceived('');

      // Refresh products and recent orders from PostgreSQL
      await fetchAllPosData(true);
    } catch (err) {
      const errMsg =
        err instanceof ApiException
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Gagal memproses transaksi kasir.';
      setSubmitError(errMsg);
      setToastMsg({ type: 'error', text: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Open Existing Order Receipt ───────────────────────────────────────────
  const handleOpenExistingReceipt = (order: OrderDetailResponse) => {
    setReceiptOrder(order);
    setReceiptCash(order.totalAmount);
    setReceiptChange(0);
  };

  // ─── Copy Receipt Text to Clipboard ────────────────────────────────────────
  const handleCopyReceiptText = () => {
    if (!receiptOrder) return;
    const lines = [
      '================================',
      '      TOKO ENSTEIN KEBUMEN      ',
      ' Spesialis Bahan & Aksesori Jas Hujan ',
      ' Jl. Pemuda No. 42, Kebumen, Jawa Tengah',
      '================================',
      `No. Pesanan : ${receiptOrder.orderNumber}`,
      `Tanggal     : ${formatDate(receiptOrder.orderDate)}`,
      `Kasir       : ${user?.name || 'Administrator'}`,
      `Pelanggan   : ${receiptOrder.recipientName || 'Pelanggan Toko'}`,
      '--------------------------------',
      ...(receiptOrder.items || []).map(
        (it) =>
          `${it.name}\n  ${it.quantity} ${it.unitSymbol || ''} x ${formatIDR(it.unitPrice)} = ${formatIDR(it.subtotal)}`
      ),
      '--------------------------------',
      `TOTAL       : ${formatIDR(receiptOrder.totalAmount)}`,
      `Metode      : ${receiptOrder.payment?.paymentMethod || 'CASH'}`,
      `Tunai/Bayar : ${formatIDR(receiptCash || receiptOrder.totalAmount)}`,
      `Kembalian   : ${formatIDR(receiptChange || 0)}`,
      '================================',
      ' Terima kasih atas kunjungan Anda! ',
      '      Barang yang dibeli tidak  ',
      '     dapat ditukar/dikembalikan ',
      '================================',
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  // ─── Trigger Native Print ──────────────────────────────────────────────────
  const handlePrintReceipt = () => {
    window.print();
  };

  // ─── Auth Loading View ─────────────────────────────────────────────────────
  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
          Memverifikasi Otoritas Kasir...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Executive Sticky Topbar */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                <span>Admin Panel</span>
                <span>/</span>
                <span className="text-zinc-900 font-semibold">Kasir & Penjualan Offline (POS)</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-sm font-extrabold text-zinc-950">
                  Point of Sale (POS) Toko Fisik
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    dbConnected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span>{dbConnected ? 'Database Live' : 'Koneksi Terputus'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Offline Sales Count Pill */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700">
              <Store className="w-3.5 h-3.5 text-zinc-500" />
              <span>{recentOfflineOrders.length} Transaksi Selesai</span>
            </span>

            {/* Refresh Stock Button */}
            <button
              onClick={() => fetchAllPosData(true)}
              disabled={refreshing}
              title="Perbarui Stok & Transaksi"
              className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-zinc-900' : ''}`} />
            </button>

            {/* Riwayat Transaksi Toggle Button */}
            <button
              onClick={() => {
                setShowHistorySection(!showHistorySection);
                if (!showHistorySection) {
                  setTimeout(() => {
                    historyRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition-colors"
            >
              <History className="w-3.5 h-3.5 text-zinc-500" />
              <span>Riwayat Transaksi</span>
            </button>
          </div>
        </header>

        {/* Global Toast */}
        {toastMsg && (
          <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
                toastMsg.type === 'success'
                  ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
                  : 'bg-rose-950 text-rose-100 border-rose-800'
              }`}
            >
              {toastMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{toastMsg.text}</span>
              <button onClick={() => setToastMsg(null)} className="text-zinc-400 hover:text-white p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* MAIN POS 2-COLUMN WORKSPACE                                       */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <main className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
              <button
                onClick={() => fetchAllPosData(true)}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ───────────────────────────────────────────────────────────── */}
            {/* LEFT COLUMN: INTERACTIVE PRODUCT SELECTOR (col-span-7)        */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-7 space-y-4">
              {/* Search & Category Filter Toolbar */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik nama produk atau kode SKU (misal: PRD-BHN-001)..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-zinc-200 text-xs bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-medium"
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

                {/* Category Filter Pills (Horizontal Scroll) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === 'ALL'
                        ? 'bg-zinc-950 text-white shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    Semua ({products.filter((p) => p.isActive !== false).length})
                  </button>
                  {categories.map((c) => {
                    const count = products.filter(
                      (p) => p.categoryId === c.id && p.isActive !== false
                    ).length;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          selectedCategory === c.id
                            ? 'bg-zinc-950 text-white shadow-2xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {c.name} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product Visual Quick-Pick Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {loading ? (
                  <div className="col-span-full py-16 text-center text-zinc-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <p className="text-xs font-medium">Memuat katalog barang kasir...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-zinc-400 bg-white rounded-2xl border border-zinc-200">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                    <p className="text-xs font-semibold text-zinc-700">Tidak ada produk yang cocok</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Ubah kata kunci pencarian atau kategori.</p>
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const physical = Number(p.stockOnHand || 0);
                    const reserved = Number(p.reservedQuantity || 0);
                    const available = Math.max(0, physical - reserved);
                    const unit = p.unitSymbol || p.unit || 'unit';
                    const isOutOfStock = available <= 0;
                    const isLowStock = available > 0 && available <= Number(p.minimumStock || 10);

                    // Check if already in cart
                    const cartItem = cart.find((i) => i.productId === p.id);
                    const inCartQty = cartItem ? cartItem.quantity : 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => !isOutOfStock && handleAddToCart(p)}
                        className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all select-none ${
                          isOutOfStock
                            ? 'bg-zinc-100/70 border-zinc-200 opacity-60 cursor-not-allowed'
                            : inCartQty > 0
                            ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-500/20 hover:shadow-sm cursor-pointer'
                            : 'bg-white border-zinc-200/80 hover:border-zinc-950 hover:shadow-sm cursor-pointer'
                        }`}
                      >
                        {/* Top: Image & Badges */}
                        <div>
                          <div className="relative mb-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resolveProductImageUrl(p.image)}
                              alt={p.name}
                              className="w-full h-28 rounded-xl object-cover bg-zinc-100 border border-zinc-100"
                            />
                            {/* SKU Micro-badge */}
                            <span className="absolute top-2 left-2 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-xs">
                              {p.code}
                            </span>
                            {/* In-cart indicator */}
                            {inCartQty > 0 && (
                              <span className="absolute top-2 right-2 bg-amber-500 text-zinc-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in duration-150">
                                Di Keranjang ({formatQty(inCartQty, p.allowDecimal)})
                              </span>
                            )}
                          </div>

                          {/* Product Name */}
                          <h3 className="font-bold text-xs text-zinc-900 leading-snug line-clamp-2">
                            {p.name}
                          </h3>
                        </div>

                        {/* Bottom: Price, Stock & Add Button */}
                        <div className="pt-2.5 mt-2 border-t border-zinc-100 flex items-end justify-between">
                          <div>
                            <p className="text-sm font-black text-zinc-950">
                              {formatIDR(p.price)}
                              <span className="text-[10px] font-normal text-zinc-400 ml-0.5">
                                /{unit}
                              </span>
                            </p>
                            <p
                              className={`text-[10px] font-bold mt-0.5 ${
                                isOutOfStock
                                  ? 'text-rose-600'
                                  : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {isOutOfStock
                                ? 'Stok Habis'
                                : `Stok: ${formatQty(available, p.allowDecimal)} ${unit}`}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock}
                            className={`p-1.5 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                              isOutOfStock
                                ? 'bg-zinc-200 text-zinc-400'
                                : inCartQty > 0
                                ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950'
                                : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* RIGHT COLUMN: STICKY POS CASHIER CART & CHECKOUT (col-span-5) */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-5 sticky top-20 space-y-4">
              {/* Card 1: Cart Items */}
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <ShoppingBagIcon className="w-4 h-4 text-zinc-700" />
                    <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                      Item Transaksi ({cart.length})
                    </h2>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="divide-y divide-zinc-100 max-h-64 overflow-y-auto pr-1 space-y-1">
                  {cart.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 space-y-2">
                      <ShoppingBag className="w-8 h-8 mx-auto text-zinc-300 stroke-1" />
                      <p className="text-xs font-semibold text-zinc-700">Keranjang kasir masih kosong</p>
                      <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                        Klik kartu produk di sebelah kiri untuk menambahkan barang ke transaksi ini.
                      </p>
                    </div>
                  ) : (
                    cart.map((item) => {
                      const step = item.allowDecimal ? 0.5 : 1;
                      return (
                        <div key={item.productId} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-zinc-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                              {formatIDR(item.price)}/{item.unitSymbol} • Stok: {formatQty(item.availableStock, item.allowDecimal)}
                            </p>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.productId, item.quantity - step)}
                              className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 text-xs font-bold"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <input
                              type="number"
                              min={item.allowDecimal ? '0.1' : '1'}
                              step={item.allowDecimal ? '0.1' : '1'}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) handleUpdateQty(item.productId, val);
                              }}
                              className="w-14 text-center py-1 rounded-lg border border-zinc-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />

                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.productId, item.quantity + step)}
                              disabled={item.quantity >= item.availableStock}
                              className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 text-xs font-bold disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>

                            {/* Subtotal */}
                            <p className="w-20 text-right font-black text-xs text-zinc-900">
                              {formatIDR(item.quantity * item.price)}
                            </p>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="text-zinc-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card 2: Customer Data & Payment Form */}
              <form
                onSubmit={handleSubmitSale}
                className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs space-y-4"
              >
                {/* Customer Information Header */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Data Pelanggan</span>
                  </span>

                  {/* Quick-Fill Walk-In Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerName('Pelanggan Walk-in');
                      setCustomerPhone('');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Isi: Pelanggan Walk-in</span>
                  </button>
                </div>

                {/* Customer Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Nama Pembeli *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Pak Slamet / Konveksi..."
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      No. WhatsApp (opsional)
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-medium"
                    />
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Catatan Kasir (opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Potongan khusus 10 meter, dibungkus karung..."
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-medium"
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Metode Pembayaran *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'CASH'
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Tunai (CASH)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'BANK_TRANSFER'
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Transfer Bank</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('E_WALLET')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'E_WALLET'
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span>QRIS / E-Wallet</span>
                    </button>
                  </div>
                </div>

                {/* Cash Calculator (When CASH selected) */}
                {paymentMethod === 'CASH' && (
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-700">
                        Uang Tunai Diterima (Rp)
                      </label>
                      <span className="text-[10px] text-zinc-400">Pecahan cepat:</span>
                    </div>

                    {/* Quick Denomination Chips */}
                    {quickCashChips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {quickCashChips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setCashReceived(chip)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              numCashReceived === chip
                                ? 'bg-zinc-900 text-white border-zinc-900'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            {chip === grandTotal ? 'Uang Pas' : formatIDR(chip)}
                          </button>
                        ))}
                      </div>
                    )}

                    <input
                      type="number"
                      min="0"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="Masukkan nominal uang tunai..."
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                    />

                    {/* Change Readout */}
                    {numCashReceived > 0 && (
                      <div
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                          isCashInsufficient
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        <span>
                          {isCashInsufficient ? 'Uang Masih Kurang:' : 'Kembalian Pelanggan:'}
                        </span>
                        <span className="text-sm font-black">
                          {isCashInsufficient
                            ? formatIDR(grandTotal - numCashReceived)
                            : formatIDR(cashChange)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Grand Total Summary Box */}
                <div className="p-4 rounded-2xl bg-zinc-950 text-white flex items-center justify-between shadow-md">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Total Tagihan
                    </p>
                    <p className="text-2xl font-black text-amber-400 mt-0.5">
                      {formatIDR(grandTotal)}
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono text-right max-w-[120px]">
                    Stok langsung terpotong otomatis
                  </span>
                </div>

                {/* Submit Error Banner */}
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="flex-1">{submitError}</p>
                    <button onClick={() => setSubmitError(null)} className="text-rose-400 hover:text-rose-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Primary Checkout CTA */}
                <button
                  type="submit"
                  disabled={submitting || cart.length === 0 || isCashInsufficient}
                  className="w-full py-4 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Memproses Transaksi Kasir...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>✓ Selesaikan Transaksi & Cetak Struk</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* BOTTOM SECTION: RECENT OFFLINE SALES HISTORY                      */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div ref={historyRef} className="pt-6 border-t border-zinc-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-zinc-950">
                  Riwayat Transaksi Kasir Offline (Database Live)
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Daftar seluruh pesanan walk-in toko fisik yang tercatat resmi di database PostgreSQL
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200">
                {recentOfflineOrders.length} Pesanan Offline
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="py-3.5 px-5">No. Pesanan</th>
                      <th className="py-3.5 px-4">Waktu</th>
                      <th className="py-3.5 px-4">Pelanggan</th>
                      <th className="py-3.5 px-4">Metode Bayar</th>
                      <th className="py-3.5 px-4">Item Produk</th>
                      <th className="py-3.5 px-4 text-right">Total Transaksi</th>
                      <th className="py-3.5 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {recentOfflineOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-400">
                          <Store className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                          <p className="font-semibold text-zinc-700 text-xs">Belum ada transaksi offline tercatat</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Gunakan panel kasir di atas untuk mencatat transaksi langsung di toko.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      recentOfflineOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-amber-700">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                            {formatDate(ord.orderDate)}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-zinc-900">
                            {ord.recipientName || 'Pelanggan Toko'}
                            {ord.recipientPhone && (
                              <span className="block text-[10px] text-zinc-400 font-normal">
                                {ord.recipientPhone}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                              {ord.payment?.paymentMethod || 'CASH'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-600">
                            {ord.items && ord.items.length > 0 ? (
                              <span className="truncate max-w-xs block">
                                {ord.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-zinc-950">
                            {formatIDR(ord.totalAmount)}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => handleOpenExistingReceipt(ord)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-[11px] font-bold transition-colors"
                            >
                              <Receipt className="w-3 h-3 text-zinc-500" />
                              <span>Lihat Struk</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DIGITAL RECEIPT CONFIRMATION MODAL                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {receiptOrder && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col my-8">
            {/* Modal Topbar Actions */}
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-700 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Struk Transaksi Kasir Berhasil</span>
              </span>
              <button
                onClick={() => setReceiptOrder(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Paper Container */}
            <div className="p-6 text-zinc-800 space-y-4 print:p-0 print:m-0" id="receipt-paper">
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-zinc-300">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white font-black text-sm flex items-center justify-center mx-auto mb-1">
                  E
                </div>
                <h3 className="font-black text-sm text-zinc-950 tracking-wider">
                  TOKO ENSTEIN KEBUMEN
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Pusat Bahan & Aksesori Jas Hujan Terlengkap
                </p>
                <p className="text-[10px] text-zinc-400">
                  Jl. Pemuda No. 42, Kebumen • Telp: 0812-3456-7890
                </p>
              </div>

              {/* Order Metadata */}
              <div className="text-xs space-y-1 font-mono pb-3 border-b border-dashed border-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">No. Order:</span>
                  <span className="font-bold text-zinc-950">{receiptOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Waktu:</span>
                  <span>{formatDate(receiptOrder.orderDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Kasir:</span>
                  <span>{user?.name || 'Administrator'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pelanggan:</span>
                  <span className="font-semibold text-zinc-900">
                    {receiptOrder.recipientName || 'Pelanggan Toko'}
                  </span>
                </div>
                {receiptOrder.recipientPhone && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">No. HP:</span>
                    <span>{receiptOrder.recipientPhone}</span>
                  </div>
                )}
              </div>

              {/* Itemized Purchased List */}
              <div className="space-y-2 pb-3 border-b border-dashed border-zinc-300">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                  Rincian Barang
                </p>
                <div className="space-y-2 text-xs">
                  {(receiptOrder.items || []).map((it) => (
                    <div key={it.id} className="flex items-start justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-zinc-900">{it.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {it.quantity} {it.unitSymbol || ''} × {formatIDR(it.unitPrice)}
                        </p>
                      </div>
                      <p className="font-black text-zinc-900 shrink-0 font-mono">
                        {formatIDR(it.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Payment Details */}
              <div className="space-y-1 text-xs font-mono pb-3 border-b border-dashed border-zinc-300">
                <div className="flex justify-between text-sm font-black pt-1">
                  <span>TOTAL TAGIHAN:</span>
                  <span className="text-zinc-950">{formatIDR(receiptOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 pt-1">
                  <span>Metode Bayar:</span>
                  <span>{receiptOrder.payment?.paymentMethod || 'CASH'}</span>
                </div>
                {receiptCash > 0 && (
                  <>
                    <div className="flex justify-between text-zinc-600">
                      <span>Uang Diterima:</span>
                      <span>{formatIDR(receiptCash)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>Kembalian:</span>
                      <span>{formatIDR(receiptChange)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Receipt Footer Message */}
              <div className="text-center text-[10px] text-zinc-400 space-y-0.5 pt-1">
                <p className="font-bold text-zinc-700">Terima kasih atas kunjungan Anda!</p>
                <p>Barang yang telah dipotong/dibeli tidak dapat ditukar.</p>
                <p className="font-mono">Simpan struk ini sebagai bukti pembayaran sah.</p>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyReceiptText}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold transition-colors"
              >
                {copiedReceipt ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span>{copiedReceipt ? 'Disalin!' : 'Salin Teks'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cetak Struk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReceiptOrder(null)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition-colors"
                >
                  Tutup / Transaksi Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
