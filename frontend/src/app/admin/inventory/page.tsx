'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getStockMovements, stockIn, stockAdjustment } from '../../../lib/admin-api';
import { adminGetProducts } from '../../../lib/catalog-api';
import { ApiException } from '../../../lib/api';
import type { StockMovementResponse, ProductResponse } from '../../../types/api';
import {
  LayoutDashboard, Package, Layers, ShoppingBag, Boxes, Store, BarChart3,
  Plus, X, Loader2, AlertCircle, LogOut, Menu, RefreshCw, CreditCard, ArrowRight,
} from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

const MOVEMENT_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  STOCK_IN: { label: 'Barang Masuk', color: 'text-emerald-600 bg-emerald-50' },
  STOCK_OUT: { label: 'Penjualan', color: 'text-blue-600 bg-blue-50' },
  ADJUSTMENT: { label: 'Penyesuaian', color: 'text-violet-600 bg-violet-50' },
  RESERVE: { label: 'Reservasi', color: 'text-amber-600 bg-amber-50' },
  RELEASE: { label: 'Rilis Reservasi', color: 'text-cyan-600 bg-cyan-50' },
  CANCELLED: { label: 'Dibatalkan', color: 'text-zinc-500 bg-zinc-50' },
};

type Mode = 'list' | 'stock-in' | 'adjustment';

export default function AdminInventoryPage() {
  const router = useRouter();
  const { isAdmin, logout, loading: authLoading } = useAuth();
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [mode, setMode] = useState<Mode>('list');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Stock In form
  const [stockInProductId, setStockInProductId] = useState('');
  const [stockInQty, setStockInQty] = useState(1);
  const [stockInNotes, setStockInNotes] = useState('');

  // Adjustment form
  const [adjProductId, setAdjProductId] = useState('');
  const [adjNewQty, setAdjNewQty] = useState(0);
  const [adjReason, setAdjReason] = useState('');

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStockMovements({ page, size: 20 });
      setMovements(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Gagal memuat pergerakan stok.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (!authLoading && !isAdmin) { router.replace('/auth'); return; }
    if (!authLoading) {
      fetchMovements();
      adminGetProducts({ size: 100 }).then(r => setProducts(r.content)).catch(() => {});
    }
  }, [authLoading, isAdmin, fetchMovements]);

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInProductId) { setMsg('Pilih produk terlebih dahulu.'); return; }
    setSaving(true);
    try {
      await stockIn({ productId: stockInProductId, quantity: stockInQty, notes: stockInNotes || undefined });
      setMsg('Stok masuk berhasil dicatat!');
      setMode('list');
      setStockInProductId(''); setStockInQty(1); setStockInNotes('');
      fetchMovements();
    } catch (err) {
      setMsg(err instanceof ApiException ? err.message : 'Gagal mencatat stok masuk.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId) { setMsg('Pilih produk terlebih dahulu.'); return; }
    setSaving(true);
    try {
      await stockAdjustment({ productId: adjProductId, newQuantity: adjNewQty, reason: adjReason });
      setMsg('Penyesuaian stok berhasil!');
      setMode('list');
      setAdjProductId(''); setAdjNewQty(0); setAdjReason('');
      fetchMovements();
    } catch (err) {
      setMsg(err instanceof ApiException ? err.message : 'Gagal penyesuaian stok.');
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
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${href === '/admin/inventory' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}>
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
          <h1 className="text-base font-bold text-zinc-900">Manajemen Inventaris</h1>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => { setMode('stock-in'); setMsg(null); }}
              className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-800">
              <Plus className="w-4 h-4" />Stok Masuk
            </button>
            <button onClick={() => { setMode('adjustment'); setMsg(null); }}
              className="flex items-center gap-2 border border-zinc-200 text-zinc-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-100">
              Penyesuaian
            </button>
          </div>
        </header>

        {msg && (
          <div className="mx-5 mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 flex justify-between">
            <span>{msg}</span><button onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        <main className="flex-1 p-5">
          {/* Stock In Form */}
          {mode === 'stock-in' && (
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 max-w-lg mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-900">Catat Stok Masuk</h3>
                <button onClick={() => setMode('list')} className="p-1.5 hover:bg-zinc-100 rounded-full"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleStockIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Produk *</label>
                  <select value={stockInProductId} onChange={(e) => setStockInProductId(e.target.value)} required
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900">
                    <option value="">Pilih produk...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stockOnHand})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Jumlah Masuk *</label>
                  <input type="number" min={0.1} step={0.1} value={stockInQty} onChange={(e) => setStockInQty(Number(e.target.value))} required
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Catatan (Supplier/No. Nota)</label>
                  <input type="text" value={stockInNotes} onChange={(e) => setStockInNotes(e.target.value)} placeholder="Supplier A, Nota #001"
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setMode('list')} className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-semibold">Batal</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                    {saving ? 'Menyimpan...' : 'Simpan Stok Masuk'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Adjustment Form */}
          {mode === 'adjustment' && (
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 max-w-lg mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-900">Penyesuaian Stok</h3>
                <button onClick={() => setMode('list')} className="p-1.5 hover:bg-zinc-100 rounded-full"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleAdjustment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Produk *</label>
                  <select value={adjProductId} onChange={(e) => { setAdjProductId(e.target.value); const p = products.find(p => p.id === e.target.value); if(p) setAdjNewQty(p.stockOnHand); }} required
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900">
                    <option value="">Pilih produk...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stockOnHand})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Stok Baru (Fisik) *</label>
                  <input type="number" min={0} step={0.1} value={adjNewQty} onChange={(e) => setAdjNewQty(Number(e.target.value))} required
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Alasan Penyesuaian *</label>
                  <textarea value={adjReason} onChange={(e) => setAdjReason(e.target.value)} rows={2} required placeholder="Koreksi stok fisik setelah pengecekan gudang..."
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setMode('list')} className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-semibold">Batal</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                    {saving ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Movements List */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
          ) : error ? (
            <div className="flex flex-col items-center py-20 gap-3"><AlertCircle className="w-10 h-10 text-rose-400" /><p className="text-zinc-600">{error}</p></div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900">Riwayat Pergerakan Stok</h3>
                <button onClick={fetchMovements} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="text-left px-5 py-3">Produk</th>
                      <th className="text-left px-5 py-3">Jenis</th>
                      <th className="text-right px-5 py-3">Jumlah</th>
                      <th className="text-right px-5 py-3">Sebelum → Sesudah</th>
                      <th className="text-left px-5 py-3">Oleh</th>
                      <th className="text-left px-5 py-3">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {movements.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-zinc-400">Belum ada pergerakan stok.</td></tr>
                    ) : movements.map((m) => {
                      const type = MOVEMENT_TYPE_LABEL[m.movementType] ?? { label: m.movementType, color: 'text-zinc-500 bg-zinc-50' };
                      return (
                        <tr key={m.id} className="hover:bg-zinc-50/50">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-zinc-900 leading-tight">{m.productName}</p>
                            <p className="text-xs text-zinc-400">{m.productCode}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${type.color}`}>{type.label}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-semibold">
                            <span className={m.quantity >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                              {m.quantity >= 0 ? '+' : ''}{m.quantity}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-zinc-500">
                            {m.stockBefore} <span className="text-zinc-300">→</span> {m.stockAfter}
                          </td>
                          <td className="px-5 py-3 text-zinc-600">{m.createdByName}</td>
                          <td className="px-5 py-3 text-zinc-500">{formatDate(m.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 p-4 border-t border-zinc-100">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 disabled:opacity-40">← Sebelumnya</button>
                  <span className="text-sm text-zinc-500">Hal. {page + 1}/{totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 disabled:opacity-40">Berikutnya →</button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
