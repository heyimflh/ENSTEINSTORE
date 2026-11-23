'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { getMyOrders } from '../../lib/orders-api';
import { ApiException } from '../../lib/api';
import type { OrderSummaryResponse } from '../../types/api';
import {
  ShoppingBag, ArrowLeft, Loader2, AlertCircle, Store,
  Clock, CheckCircle2, Package, Truck, XCircle, CreditCard,
  ChevronRight,
} from 'lucide-react';

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING_PAYMENT: { label: 'Menunggu Pembayaran', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  PROCESSING: { label: 'Diproses', color: 'text-violet-600 bg-violet-50 border-violet-200', icon: <Package className="w-3.5 h-3.5" /> },
  READY_FOR_PICKUP: { label: 'Siap Diambil di Toko', color: 'text-cyan-600 bg-cyan-50 border-cyan-200', icon: <Store className="w-3.5 h-3.5" /> },
  SHIPPED: { label: 'Sedang Dikirim', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <Truck className="w-3.5 h-3.5" /> },
  COMPLETED: { label: 'Selesai', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CANCELLED: { label: 'Dibatalkan', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function OrdersPage() {
  const { isLoggedIn } = useAuth();
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    setLoading(true);
    getMyOrders(page, 10)
      .then((res) => { setOrders(res.content); setTotalPages(res.totalPages); })
      .catch((err) => setError(err instanceof ApiException ? err.message : 'Gagal memuat pesanan.'))
      .finally(() => setLoading(false));
  }, [isLoggedIn, page]);

  if (!isLoggedIn) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <ShoppingBag className="w-12 h-12 text-zinc-300" />
      <p className="text-zinc-600 font-medium">Silakan login untuk melihat pesanan.</p>
      <Link href="/auth" className="bg-zinc-900 text-white px-6 py-3 rounded-full text-sm font-semibold">Login</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <ArrowLeft className="w-4 h-4" />Beranda
          </Link>
          <h1 className="text-base font-bold text-zinc-900">Pesanan Saya</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
        ) : error ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <p className="text-zinc-600">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center gap-4">
            <ShoppingBag className="w-16 h-16 text-zinc-200" />
            <h2 className="text-xl font-bold text-zinc-900">Belum Ada Pesanan</h2>
            <p className="text-zinc-500">Yuk mulai belanja di ENSTEINSTORE!</p>
            <Link href="/products" className="bg-zinc-900 text-white px-6 py-3 rounded-full text-sm font-semibold">Mulai Belanja</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusInfo = STATUS_LABEL[order.orderStatus] ?? { label: order.orderStatus, color: 'text-zinc-500 bg-zinc-50 border-zinc-200', icon: null };
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.orderNumber}`}
                  className="block bg-white rounded-2xl border border-zinc-100 p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{order.orderNumber}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{formatDate(order.orderDate)}</p>
                      <p className="text-xs text-zinc-500 mt-1">{order.recipientName} · {order.fulfillmentMethod === 'DELIVERY' ? 'Dikirim' : 'Ambil di Toko'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                      <p className="text-sm font-bold text-amber-600">{formatIDR(order.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-50 flex justify-end">
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      Lihat Detail <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 disabled:opacity-40">
                  ← Sebelumnya
                </button>
                <span className="text-sm text-zinc-500">Hal. {page + 1}/{totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 disabled:opacity-40">
                  Berikutnya →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
