'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { adminGetOrders, adminGetOrderDetail, adminUpdateOrderStatus, adminCancelOrder } from '../../../lib/orders-api';
import { ApiException } from '../../../lib/api';
import type { OrderSummaryResponse, OrderDetailResponse, OrderStatus } from '../../../types/api';
import {
  LayoutDashboard, Package, Layers, ShoppingBag, Boxes, Store, BarChart3,
  Search, Eye, X, Loader2, AlertCircle, ChevronDown, LogOut, Bell, Menu,
  CheckCircle2, Clock, CreditCard, Truck, XCircle, RefreshCw,
} from 'lucide-react';

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_OPTS: { v: string; label: string; color: string }[] = [
  { v: '', label: 'Semua Status', color: 'text-zinc-700' },
  { v: 'PENDING_PAYMENT', label: 'Menunggu Bayar', color: 'text-amber-600' },
  { v: 'PROCESSING', label: 'Diproses', color: 'text-violet-600' },
  { v: 'READY_FOR_PICKUP', label: 'Siap Diambil (Pickup)', color: 'text-cyan-600' },
  { v: 'SHIPPED', label: 'Dikirim (Delivery)', color: 'text-blue-600' },
  { v: 'COMPLETED', label: 'Selesai', color: 'text-emerald-600' },
  { v: 'CANCELLED', label: 'Dibatalkan', color: 'text-rose-600' },
];

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

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isAdmin, logout, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('PROCESSING');
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetOrders({ page, size: 15, status: statusFilter || undefined });
      setOrders(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Gagal memuat pesanan.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (!authLoading && !isAdmin) { router.replace('/auth'); return; }
    if (!authLoading) fetchOrders();
  }, [authLoading, isAdmin, fetchOrders]);

  const openDetail = async (id: string | number) => {
    setDetailLoading(true);
    try {
      const detail = await adminGetOrderDetail(id);
      setSelectedOrder(detail);
      setNewStatus(detail.orderStatus as OrderStatus);
    } catch { }
    finally { setDetailLoading(false); }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const updated = await adminUpdateOrderStatus(selectedOrder.id, { orderStatus: newStatus });
      setSelectedOrder(updated);
      setUpdateMsg('Status berhasil diperbarui!');
      fetchOrders();
    } catch (err) {
      setUpdateMsg(err instanceof ApiException ? err.message : 'Gagal update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    setUpdating(true);
    try {
      const updated = await adminCancelOrder(selectedOrder.id, { reason: cancelReason });
      setSelectedOrder(updated);
      setUpdateMsg('Pesanan berhasil dibatalkan.');
      setCancelReason('');
      fetchOrders();
    } catch (err) {
      setUpdateMsg(err instanceof ApiException ? err.message : 'Gagal membatalkan.');
    } finally {
      setUpdating(false);
    }
  };

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
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${href === '/admin/orders' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-100">
          <button onClick={() => logout().then(() => router.push('/auth'))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-rose-50 hover:text-rose-600">
            <LogOut className="w-4 h-4" />Logout
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 h-16 flex items-center px-5 gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-zinc-100"><Menu className="w-5 h-5" /></button>
          <h1 className="text-base font-bold text-zinc-900">Manajemen Pesanan</h1>
          <div className="ml-auto flex items-center gap-3">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900">
              {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
            <button onClick={fetchOrders} className="p-2 rounded-lg hover:bg-zinc-100"><RefreshCw className="w-4 h-4 text-zinc-500" /></button>
          </div>
        </header>

        <main className="flex-1 p-5">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
          ) : error ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <AlertCircle className="w-10 h-10 text-rose-400" /><p className="text-zinc-600">{error}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="text-left px-5 py-3">No. Pesanan</th>
                      <th className="text-left px-5 py-3">Pelanggan</th>
                      <th className="text-left px-5 py-3">Tanggal</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Total</th>
                      <th className="text-center px-5 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {orders.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-zinc-400">Tidak ada pesanan.</td></tr>
                    ) : orders.map((order) => {
                      const st = STATUS_OPTS.find(o => o.v === order.orderStatus);
                      return (
                        <tr key={order.id} className="hover:bg-zinc-50/50">
                          <td className="px-5 py-3 font-mono text-xs font-semibold text-zinc-700">{order.orderNumber}</td>
                          <td className="px-5 py-3 text-zinc-700">{order.recipientName}</td>
                          <td className="px-5 py-3 text-zinc-500">{formatDate(order.orderDate)}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-semibold ${st?.color ?? 'text-zinc-500'}`}>{st?.label ?? order.orderStatus}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-amber-600">{formatIDR(order.totalAmount)}</td>
                          <td className="px-5 py-3 text-center">
                            <button onClick={() => openDetail(order.id)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 p-4 border-t border-zinc-100">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 disabled:opacity-40">← Sebelumnya</button>
                  <span className="text-sm text-zinc-500">Hal. {page + 1}/{totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 disabled:opacity-40">Berikutnya →</button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Order Detail Panel */}
      {(selectedOrder || detailLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedOrder(null); setUpdateMsg(null); }} />
          <div className="relative w-full max-w-lg bg-white h-full flex flex-col shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">
                {detailLoading ? 'Memuat...' : `Detail: ${selectedOrder?.orderNumber}`}
              </h2>
              <button onClick={() => { setSelectedOrder(null); setUpdateMsg(null); }} className="p-1.5 hover:bg-zinc-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            {detailLoading ? (
              <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
            ) : selectedOrder && (
              <div className="p-5 space-y-5">
                {updateMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 flex justify-between">
                    <span>{updateMsg}</span>
                    <button onClick={() => setUpdateMsg(null)}><X className="w-4 h-4" /></button>
                  </div>
                )}

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-zinc-400">Pelanggan</p><p className="font-semibold">{selectedOrder.recipientName}</p></div>
                  <div><p className="text-xs text-zinc-400">Telepon</p><p className="font-semibold">{selectedOrder.recipientPhone}</p></div>
                  <div><p className="text-xs text-zinc-400">Status</p>
                    <p className="font-semibold">{STATUS_OPTS.find(o => o.v === selectedOrder.orderStatus)?.label ?? selectedOrder.orderStatus}</p>
                  </div>
                  <div><p className="text-xs text-zinc-400">Total</p><p className="font-bold text-amber-600">{formatIDR(selectedOrder.totalAmount)}</p></div>
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Item Pesanan</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-zinc-600">{item.productName} × {item.quantity} {item.unitName}</span>
                        <span className="font-semibold">{formatIDR(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Update Status */}
                {!['COMPLETED', 'CANCELLED'].includes(selectedOrder.orderStatus) && (
                  <div className="border-t border-zinc-100 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Ubah Status</p>
                    <div className="flex gap-3">
                      <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                        className="flex-1 text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900">
                        {STATUS_OPTS.filter(o => o.v && o.v !== 'CANCELLED').map(o => (
                          <option key={o.v} value={o.v}>{o.label}</option>
                        ))}
                      </select>
                      <button onClick={handleUpdateStatus} disabled={updating}
                        className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60">
                        {updating ? '...' : 'Update'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel */}
                {!['COMPLETED', 'CANCELLED'].includes(selectedOrder.orderStatus) && (
                  <div className="border-t border-zinc-100 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Batalkan Pesanan</p>
                    <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                      placeholder="Alasan pembatalan..." rows={2}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 mb-2" />
                    <button onClick={handleCancel} disabled={updating || !cancelReason.trim()}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-60">
                      {updating ? '...' : 'Batalkan Pesanan'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
