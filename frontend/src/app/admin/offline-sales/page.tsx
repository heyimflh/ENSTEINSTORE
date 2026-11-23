'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { adminCreateOfflineSale } from '../../../lib/orders-api';
import { adminGetProducts } from '../../../lib/catalog-api';
import { ApiException } from '../../../lib/api';
import type { ProductResponse, OfflineSaleItemRequest } from '../../../types/api';
import {
  LayoutDashboard, Package, Layers, ShoppingBag, Boxes, Store, BarChart3,
  Plus, X, Loader2, AlertCircle, LogOut, Menu, Trash2, CreditCard, Check,
} from 'lucide-react';

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/products', icon: Package, label: 'Produk' },
  { href: '/admin/categories', icon: Layers, label: 'Kategori' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Pesanan' },
  { href: '/admin/inventory', icon: Boxes, label: 'Inventaris' },
  { href: '/admin/payments', icon: CreditCard, label: 'Pembayaran' },
  { href: '/admin/offline-sales', icon: Store, label: 'Penjualan Offline' },
  { href: '/admin/reports', icon: BarChart3, label: 'Laporan' },
];

interface SaleItem {
  productId: string;
  productName: string;
  price: number;
  unitSymbol: string;
  allowDecimal: boolean;
  stockOnHand: number;
  quantity: number;
  subtotal: number;
}

export default function AdminOfflineSalesPage() {
  const router = useRouter();
  const { isAdmin, logout, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastOrder, setLastOrder] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) { router.replace('/auth'); return; }
    if (!authLoading) {
      adminGetProducts({ size: 100 }).then(r => setProducts(r.content)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [authLoading, isAdmin]);

  const handleAddItem = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) { setMsg({ type: 'error', text: 'Pilih produk terlebih dahulu.' }); return; }
    if (selectedQty <= 0 || selectedQty > product.stockOnHand) {
      setMsg({ type: 'error', text: `Jumlah tidak valid. Stok tersedia: ${product.stockOnHand}` }); return;
    }
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(prev => prev.map(i => i.productId === product.id
        ? { ...i, quantity: i.quantity + selectedQty, subtotal: (i.quantity + selectedQty) * i.price }
        : i));
    } else {
      setItems(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        unitSymbol: product.unitSymbol,
        allowDecimal: product.allowDecimal,
        stockOnHand: product.stockOnHand,
        quantity: selectedQty,
        subtotal: selectedQty * product.price,
      }]);
    }
    setSelectedProductId('');
    setSelectedQty(1);
    setMsg(null);
  };

  const handleRemoveItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { setMsg({ type: 'error', text: 'Tambahkan minimal 1 produk.' }); return; }
    if (!recipientName.trim()) { setMsg({ type: 'error', text: 'Nama pelanggan wajib diisi.' }); return; }
    setSaving(true);
    try {
      const order = await adminCreateOfflineSale({
        recipientName,
        recipientPhone: recipientPhone || undefined,
        notes: notes || undefined,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      });
      setLastOrder(order);
      setMsg({ type: 'success', text: `Transaksi berhasil! No. Pesanan: ${order.orderNumber}` });
      setItems([]);
      setRecipientName('');
      setRecipientPhone('');
      setNotes('');
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof ApiException ? err.message : 'Gagal mencatat penjualan.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:flex`}>
        <div className="p-5 border-b border-zinc-100">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Admin Panel</p>
          <p className="text-base font-bold text-zinc-900">ENSTEINSTORE</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${href === '/admin/offline-sales' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-100">
          <button onClick={() => logout().then(() => router.push('/auth'))} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-rose-50 hover:text-rose-600">
            <LogOut className="w-4 h-4" />Logout
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 h-16 flex items-center px-5 gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-zinc-100"><Menu className="w-5 h-5" /></button>
          <div>
            <h1 className="text-base font-bold text-zinc-900">Penjualan Offline / POS</h1>
            <p className="text-xs text-zinc-400">Catat transaksi langsung di toko</p>
          </div>
        </header>

        <main className="flex-1 p-5">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid lg:grid-cols-3 gap-5">
                {/* Left: Add Items */}
                <div className="lg:col-span-2 space-y-5">
                  {msg && (
                    <div className={`rounded-xl p-3 text-sm flex justify-between ${msg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
                      <span>{msg.text}</span>
                      <button type="button" onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
                    </div>
                  )}

                  {/* Add Product */}
                  <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                    <h3 className="text-sm font-bold text-zinc-900 mb-4">Tambah Produk ke Transaksi</h3>
                    <div className="flex gap-3 flex-wrap">
                      <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}
                        className="flex-1 min-w-48 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900">
                        <option value="">Pilih produk...</option>
                        {products.filter(p => p.available).map(p => (
                          <option key={p.id} value={p.id}>{p.name} — {formatIDR(p.price)}/{p.unitSymbol} (Stok: {p.stockOnHand})</option>
                        ))}
                      </select>
                      <input type="number" value={selectedQty} onChange={(e) => setSelectedQty(Number(e.target.value))} min={0.1} step={0.1} placeholder="Jml"
                        className="w-24 px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                      <button type="button" onClick={handleAddItem}
                        className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-800">
                        <Plus className="w-4 h-4" />Tambah
                      </button>
                    </div>
                  </div>

                  {/* Item List */}
                  <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                    <h3 className="text-sm font-bold text-zinc-900 mb-4">Item Transaksi ({items.length})</h3>
                    {items.length === 0 ? (
                      <p className="text-sm text-zinc-400 text-center py-6">Belum ada produk ditambahkan.</p>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.productId} className="flex items-center gap-3 py-2 border-b border-zinc-50">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-zinc-900">{item.productName}</p>
                              <p className="text-xs text-zinc-400">{item.quantity} {item.unitSymbol} × {formatIDR(item.price)}</p>
                            </div>
                            <p className="text-sm font-bold text-amber-600">{formatIDR(item.subtotal)}</p>
                            <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-zinc-400 hover:text-rose-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                    <h3 className="text-sm font-bold text-zinc-900 mb-4">Data Pelanggan</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Nama Pelanggan *</label>
                        <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required placeholder="Nama pelanggan..."
                          className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">No. Telepon (opsional)</label>
                        <input type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="08xxxxxxxxxx"
                          className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Catatan (opsional)</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Catatan transaksi..."
                          className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Summary & Submit */}
                <div>
                  <div className="sticky top-24 bg-white rounded-2xl border border-zinc-100 p-5">
                    <h3 className="text-sm font-bold text-zinc-900 mb-4">Ringkasan Transaksi</h3>
                    <div className="space-y-2 text-sm mb-4">
                      {items.map(i => (
                        <div key={i.productId} className="flex justify-between">
                          <span className="text-zinc-500 line-clamp-1 flex-1">{i.productName}</span>
                          <span className="font-semibold ml-2">{formatIDR(i.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-zinc-100 pt-4 flex justify-between font-bold text-base mb-5">
                      <span>TOTAL</span>
                      <span className="text-amber-600">{formatIDR(total)}</span>
                    </div>
                    <div className="bg-zinc-50 rounded-xl p-3 mb-5 text-xs text-zinc-500">
                      <p className="font-semibold mb-1">Pembayaran:</p>
                      <p>Tunai di Toko (CASH)</p>
                    </div>
                    <button type="submit" disabled={saving || items.length === 0}
                      className="w-full py-3.5 bg-zinc-900 text-white rounded-full text-sm font-bold hover:bg-zinc-800 disabled:opacity-60 flex items-center justify-center gap-2">
                      {saving
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Check className="w-4 h-4" />Selesaikan Transaksi</>
                      }
                    </button>
                    {lastOrder && (
                      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                        <p className="font-bold text-emerald-700 mb-1">Transaksi Terakhir:</p>
                        <p className="text-emerald-600">{lastOrder.orderNumber}</p>
                        <p className="text-emerald-600">{formatIDR(lastOrder.totalAmount)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
