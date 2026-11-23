'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getDashboard } from '../../../lib/admin-api';
import { ApiException } from '../../../lib/api';
import type { DashboardSummaryResponse } from '../../../types/api';
import {
  LayoutDashboard, Package, Layers, ShoppingBag, Boxes, Store, BarChart3,
  TrendingUp, AlertTriangle, LogOut, ArrowUpRight, CheckCircle2, Clock,
  Loader2, AlertCircle, RefreshCw, CreditCard, Menu, X,
} from 'lucide-react';

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
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

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Menunggu Bayar',
  PAID: 'Dibayar',
  PROCESSING: 'Diproses',
  READY: 'Siap',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, logout, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboard();
      setData(res);
    } catch (err) {
      if (err instanceof ApiException) setError(err.message);
      else setError('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) { router.replace('/auth'); return; }
    fetchDashboard();
  }, [isAdmin, authLoading]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  if (authLoading || (!isAdmin && !authLoading)) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:flex`}>
        <div className="p-5 border-b border-zinc-100">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Admin Panel</p>
          <p className="text-base font-bold text-zinc-900">ENSTEINSTORE</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                href === '/admin/dashboard' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
              {user?.name?.[0] ?? 'A'}
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900">{user?.name}</p>
              <p className="text-[10px] text-zinc-400">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">
            <LogOut className="w-4 h-4" />Logout
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 h-16 flex items-center px-5 gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-zinc-100">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-zinc-900">Dashboard</h1>
            <p className="text-xs text-zinc-400">{formatDate(new Date().toISOString())}</p>
          </div>
          <div className="ml-auto">
            <button onClick={fetchDashboard} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 px-3 py-2 rounded-lg hover:bg-zinc-100">
              <RefreshCw className="w-3.5 h-3.5" />Refresh
            </button>
          </div>
        </header>

        <main className="p-5 max-w-6xl">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
          ) : error ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <AlertCircle className="w-10 h-10 text-rose-400" />
              <p className="text-zinc-600">{error}</p>
              <button onClick={fetchDashboard} className="text-sm underline text-zinc-500">Coba lagi</button>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Pendapatan', value: formatIDR(data.sales.totalRevenue || 0), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Total Pesanan', value: String(data.sales.totalOrders || 0), icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Pesanan Terbayar', value: String(data.sales.paidOrders ?? data.sales.pendingOrders ?? 0), icon: Clock, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Produk Stok Rendah', value: String(data.stock.lowStockProducts || 0), icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-2xl border border-zinc-100 p-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                    <p className="text-xl font-bold text-zinc-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Stock Info */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                  <p className="text-xs text-zinc-400 mb-1">Total Produk</p>
                  <p className="text-2xl font-bold text-zinc-900">{data.stock.totalProducts || 0}</p>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                  <p className="text-xs text-zinc-400 mb-1">Produk Stok Habis</p>
                  <p className="text-2xl font-bold text-rose-500">{data.stock.outOfStockProducts || 0}</p>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                  <p className="text-xs text-zinc-400 mb-1">Produk Siap Jual</p>
                  <p className="text-2xl font-bold text-emerald-600">{data.stock.inStockProducts ?? data.stock.totalProducts}</p>
                </div>
              </div>

              {/* Today / Performance Stats */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                  <p className="text-xs text-zinc-400 mb-1">Rata-rata Nilai Pesanan</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatIDR(data.sales.averageOrderValue || 0)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                  <p className="text-xs text-zinc-400 mb-1">Pesanan Selesai / Terbayar</p>
                  <p className="text-2xl font-bold text-zinc-900">{data.sales.paidOrders || 0}</p>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-zinc-900">Pesanan Terbaru</h3>
                  <Link href="/admin/orders" className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
                    Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {data.recentOrders.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-6">Belum ada pesanan.</p>
                ) : (
                  <div className="space-y-2">
                    {data.recentOrders.map((order) => (
                      <Link key={order.id} href={`/admin/orders`} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{order.orderNumber}</p>
                          <p className="text-xs text-zinc-400">{order.recipientName} · {formatDate(order.orderDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-amber-600">{formatIDR(order.totalAmount)}</p>
                          <p className="text-[10px] text-zinc-400">{ORDER_STATUS_LABEL[order.orderStatus] ?? order.orderStatus}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { href: '/admin/inventory', label: '+ Stok Masuk', icon: Boxes },
                  { href: '/admin/offline-sales', label: '+ Penjualan Offline', icon: Store },
                  { href: '/admin/reports', label: 'Unduh Laporan', icon: BarChart3 },
                ].map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className="flex items-center gap-3 bg-zinc-900 text-white rounded-2xl p-4 hover:bg-zinc-800 transition-colors">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
