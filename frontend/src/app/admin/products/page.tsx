'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from '../../../lib/catalog-api';
import { getCategories, getUnits } from '../../../lib/catalog-api';
import { ApiException } from '../../../lib/api';
import type { ProductResponse, CategoryResponse, UnitResponse, CreateProductRequest, UpdateProductRequest } from '../../../types/api';
import {
  LayoutDashboard, Package, Layers, ShoppingBag, Boxes, Store, BarChart3,
  Search, Plus, Pencil, PowerOff, X, Loader2, AlertCircle, LogOut, Menu,
  RefreshCw, CreditCard, Check,
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

const EMPTY_FORM: CreateProductRequest = { code: '', name: '', description: '', price: 0, minimumStock: 10, categoryId: '', unitId: '', isFeatured: false, isNew: false, image: '' };

export default function AdminProductsPage() {
  const router = useRouter();
  const { isAdmin, logout, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProductRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetProducts({ query: search, page, size: 15 });
      setProducts(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Gagal memuat produk.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    if (!authLoading && !isAdmin) { router.replace('/auth'); return; }
    if (!authLoading) {
      fetchProducts();
      getCategories().then(setCategories).catch(() => {});
      getUnits().then(setUnits).catch(() => {});
    }
  }, [authLoading, isAdmin, fetchProducts]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); setMsg(null); };
  const openEdit = (p: ProductResponse) => {
    setForm({ code: p.code, name: p.name, description: p.description, price: p.price, minimumStock: p.minimumStock, categoryId: p.categoryId, unitId: '', isFeatured: p.isFeatured, isNew: p.isNew, image: p.image });
    setEditingId(p.id);
    setShowForm(true);
    setMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await adminUpdateProduct(editingId, form as UpdateProductRequest);
        setMsg('Produk berhasil diperbarui!');
      } else {
        await adminCreateProduct(form);
        setMsg('Produk berhasil ditambahkan!');
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      setMsg(err instanceof ApiException ? err.message : 'Gagal menyimpan produk.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: ProductResponse) => {
    try {
      await adminUpdateProduct(p.id, { isActive: !p.available });
      setMsg(`Produk ${!p.available ? 'diaktifkan' : 'dinonaktifkan'}.`);
      fetchProducts();
    } catch (err) {
      setMsg(err instanceof ApiException ? err.message : 'Gagal update status.');
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
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${href === '/admin/products' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}>
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
          <h1 className="text-base font-bold text-zinc-900">Manajemen Produk</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Cari produk..."
                className="pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 w-48" />
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-800">
              <Plus className="w-4 h-4" />Tambah Produk
            </button>
          </div>
        </header>

        {msg && (
          <div className="mx-5 mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 flex justify-between">
            <span>{msg}</span><button onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        <main className="flex-1 p-5">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
          ) : error ? (
            <div className="flex flex-col items-center py-20 gap-3"><AlertCircle className="w-10 h-10 text-rose-400" /><p className="text-zinc-600">{error}</p></div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="text-left px-5 py-3">Produk</th>
                      <th className="text-left px-5 py-3">Kategori</th>
                      <th className="text-right px-5 py-3">Harga</th>
                      <th className="text-right px-5 py-3">Stok</th>
                      <th className="text-center px-5 py-3">Status</th>
                      <th className="text-center px-5 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {products.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-zinc-400">Tidak ada produk.</td></tr>
                    ) : products.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.image || '/placeholder-product.jpg'} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-zinc-100" />
                            <div>
                              <p className="font-semibold text-zinc-900 leading-tight">{p.name}</p>
                              <p className="text-xs text-zinc-400">{p.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-zinc-600">{p.categoryName}</td>
                        <td className="px-5 py-3 text-right font-semibold text-zinc-900">{formatIDR(p.price)}/{p.unitSymbol}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-semibold ${p.stockOnHand <= p.minimumStock ? 'text-rose-500' : 'text-zinc-700'}`}>{p.stockOnHand}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs font-semibold ${p.available ? 'text-emerald-600' : 'text-zinc-400'}`}>
                            {p.available ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEdit(p)} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleToggleActive(p)} className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><PowerOff className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
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

      {/* Product Form Panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-white h-full flex flex-col shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {[
                { label: 'Kode Produk', key: 'code', type: 'text', placeholder: 'PRD-BHN-001' },
                { label: 'Nama Produk', key: 'name', type: 'text', placeholder: 'Nama produk...' },
                { label: 'Harga (Rp)', key: 'price', type: 'number', placeholder: '0' },
                { label: 'Minimum Stok', key: 'minimumStock', type: 'number', placeholder: '10' },
                { label: 'URL Gambar', key: 'image', type: 'text', placeholder: '/images/...' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">{label}</label>
                  <input type={type} value={(form as any)[key]} onChange={(e) => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Deskripsi produk..."
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Kategori</label>
                <select value={form.categoryId} onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
                  <option value="">Pilih kategori...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Satuan</label>
                <select value={form.unitId} onChange={(e) => setForm(f => ({ ...f, unitId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
                  <option value="">Pilih satuan...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.unitName} ({u.unitSymbol})</option>)}
                </select>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded" />
                  Produk Unggulan
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isNew} onChange={(e) => setForm(f => ({ ...f, isNew: e.target.checked }))} className="rounded" />
                  Produk Baru
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-semibold hover:bg-zinc-50">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60">
                  {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
