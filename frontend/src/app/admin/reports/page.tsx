'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { downloadDailySalesReport, downloadMonthlySalesReport, downloadTopProductsReport, downloadStockReport } from '../../../lib/admin-api';
import {
  LayoutDashboard, Package, Layers, ShoppingBag, Boxes, Store, BarChart3,
  Download, Loader2, LogOut, Menu, CreditCard, AlertCircle, Calendar, TrendingUp,
} from 'lucide-react';

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

export default function AdminReportsPage() {
  const router = useRouter();
  const { isAdmin, logout, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const today = new Date();
  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [year, setYear] = useState(today.getFullYear());

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/auth');
  }, [authLoading, isAdmin]);

  const handleDownload = async (key: string, fn: () => Promise<void>) => {
    setDownloading(key);
    setMsg(null);
    try {
      await fn();
      setMsg('Laporan berhasil diunduh!');
    } catch (err) {
      setMsg('Gagal mengunduh laporan. Pastikan backend berjalan.');
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      key: 'daily',
      title: 'Laporan Penjualan Harian',
      description: 'Ringkasan penjualan per hari dalam rentang tanggal tertentu.',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50',
      extra: (
        <div className="flex gap-3 mt-3 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1">Tanggal Mulai</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-zinc-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1">Tanggal Akhir</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-zinc-200 rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>
      ),
      onDownload: () => handleDownload('daily', () => downloadDailySalesReport(startDate, endDate)),
    },
    {
      key: 'monthly',
      title: 'Laporan Penjualan Bulanan',
      description: 'Ringkasan penjualan per bulan untuk tahun tertentu.',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
      extra: (
        <div className="mt-3">
          <label className="block text-xs font-semibold text-zinc-500 mb-1">Tahun</label>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min={2020} max={2030}
            className="w-28 border border-zinc-200 rounded-xl px-3 py-2 text-sm" />
        </div>
      ),
      onDownload: () => handleDownload('monthly', () => downloadMonthlySalesReport(year)),
    },
    {
      key: 'top',
      title: 'Laporan Produk Terlaris',
      description: 'Daftar produk berdasarkan volume penjualan tertinggi.',
      icon: BarChart3,
      color: 'text-amber-600 bg-amber-50',
      extra: null,
      onDownload: () => handleDownload('top', downloadTopProductsReport),
    },
    {
      key: 'stock',
      title: 'Laporan Stok Inventaris',
      description: 'Kondisi stok terkini seluruh produk aktif.',
      icon: Boxes,
      color: 'text-violet-600 bg-violet-50',
      extra: null,
      onDownload: () => handleDownload('stock', downloadStockReport),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:flex`}>
        <div className="p-5 border-b border-zinc-100">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Admin Panel</p>
          <p className="text-base font-bold text-zinc-900">ENSTEINSTORE</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${href === '/admin/reports' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}>
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
            <h1 className="text-base font-bold text-zinc-900">Laporan & Ekspor Data</h1>
            <p className="text-xs text-zinc-400">Unduh laporan CSV untuk analisis bisnis</p>
          </div>
        </header>

        <main className="flex-1 p-5 max-w-3xl">
          {msg && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
              {msg}
            </div>
          )}

          <div className="space-y-4">
            {reports.map(({ key, title, description, icon: Icon, color, extra, onDownload }) => (
              <div key={key} className="bg-white rounded-2xl border border-zinc-100 p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
                    {extra}
                    <button
                      onClick={onDownload}
                      disabled={downloading === key}
                      className="mt-4 flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {downloading === key
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <Download className="w-4 h-4" />
                      }
                      {downloading === key ? 'Mengunduh...' : 'Unduh CSV'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
