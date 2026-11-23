'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { adminGetPayments, adminVerifyPayment } from '../../../lib/orders-api';
import { ApiException } from '../../../lib/api';
import {
  LayoutDashboard, Package, Layers, ShoppingBag, Boxes, Store, BarChart3,
  Eye, X, Loader2, AlertCircle, LogOut, Menu, RefreshCw, CheckCircle2, XCircle,
  CreditCard, Download, Ban,
} from 'lucide-react';

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}
function formatDate(iso?: string) {
  if (!iso) return '-';
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

const PAYMENT_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  UNPAID: { label: 'Belum Dibayar', color: 'text-zinc-500' },
  WAITING_VERIFICATION: { label: 'Menunggu Verifikasi', color: 'text-amber-600' },
  PAID: { label: 'Lunas', color: 'text-emerald-600' },
  EXPIRED: { label: 'Kedaluwarsa', color: 'text-rose-500' },
  REJECTED: { label: 'Ditolak', color: 'text-rose-700' },
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { isAdmin, logout, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetPayments({ page, size: 15, status: statusFilter || undefined });
      setPayments(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Gagal memuat pembayaran.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (!authLoading && !isAdmin) { router.replace('/auth'); return; }
    if (!authLoading) fetchPayments();
  }, [authLoading, isAdmin, fetchPayments]);

  const handleVerify = async (approve: boolean) => {
    if (!selected) return;
    setVerifying(true);
    try {
      await adminVerifyPayment(selected.orderId ?? selected.id, {
        approve,
        rejectionReason: approve ? undefined : (rejectReason || undefined),
      });
      setMsg(approve ? 'Pembayaran diverifikasi!' : 'Pembayaran ditolak.');
      setSelected(null);
      fetchPayments();
    } catch (err) {
      setMsg(err instanceof ApiException ? err.message : 'Gagal verifikasi.');
    } finally {
      setVerifying(false);
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
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${href === '/admin/payments' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}>
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

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 h-16 flex items-center px-5 gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-zinc-100"><Menu className="w-5 h-5" /></button>
          <h1 className="text-base font-bold text-zinc-900">Manajemen Pembayaran</h1>
          <div className="ml-auto flex items-center gap-3">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-white focus:outline-none">
              <option value="">Semua Status</option>
              <option value="WAITING_VERIFICATION">Menunggu Verifikasi</option>
              <option value="PAID">Lunas</option>
              <option value="REJECTED">Ditolak</option>
            </select>
            <button onClick={fetchPayments} className="p-2 rounded-lg hover:bg-zinc-100"><RefreshCw className="w-4 h-4 text-zinc-500" /></button>
          </div>
        </header>

        {msg && (
          <div className="mx-5 mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 flex justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        <main className="flex-1 p-5">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
          ) : error ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <AlertCircle className="w-10 h-10 text-rose-400" /><p className="text-zinc-600">{error}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="text-left px-5 py-3">ID Pembayaran</th>
                    <th className="text-left px-5 py-3">Metode</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Dikirim</th>
                    <th className="text-right px-5 py-3">Jumlah</th>
                    <th className="text-center px-5 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {payments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-zinc-400">Tidak ada data pembayaran.</td></tr>
                  ) : payments.map((p: any) => {
                    const st = PAYMENT_STATUS_LABEL[p.status] ?? { label: p.status, color: 'text-zinc-500' };
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/50">
                        <td className="px-5 py-3 text-xs font-mono text-zinc-700">#{p.id}</td>
                        <td className="px-5 py-3 text-zinc-700">{p.paymentMethod?.replace('_', ' ')}</td>
                        <td className={`px-5 py-3 font-semibold text-xs ${st.color}`}>{st.label}</td>
                        <td className="px-5 py-3 text-zinc-500">{formatDate(p.submittedAt)}</td>
                        <td className="px-5 py-3 text-right font-bold text-amber-600">{formatIDR(p.amount)}</td>
                        <td className="px-5 py-3 text-center">
                          {p.status === 'WAITING_VERIFICATION' && (
                            <button onClick={() => setSelected(p)} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg">
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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

      {/* Verification Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">Verifikasi Pembayaran #{selected.id}</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-zinc-400">Metode</p><p className="font-semibold">{selected.paymentMethod?.replace('_', ' ')}</p></div>
                <div><p className="text-xs text-zinc-400">Jumlah</p><p className="font-bold text-amber-600">{formatIDR(selected.amount)}</p></div>
                <div><p className="text-xs text-zinc-400">Dikirim Pada</p><p className="font-semibold">{formatDate(selected.submittedAt)}</p></div>
              </div>
              {selected.proofOfPaymentUrl && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Bukti Pembayaran</p>
                  <img src={selected.proofOfPaymentUrl} alt="Bukti" className="w-full rounded-xl border border-zinc-100 object-cover max-h-64" />
                  <a href={selected.proofOfPaymentUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-2 text-xs text-zinc-500 underline flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />Lihat ukuran penuh
                  </a>
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Alasan Penolakan (opsional)</p>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Isi jika menolak..." rows={2}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleVerify(false)} disabled={verifying}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-100 text-rose-700 rounded-xl text-sm font-semibold hover:bg-rose-200 disabled:opacity-60">
                  <XCircle className="w-4 h-4" />Tolak
                </button>
                <button onClick={() => handleVerify(true)} disabled={verifying}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                  <CheckCircle2 className="w-4 h-4" />Verifikasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
