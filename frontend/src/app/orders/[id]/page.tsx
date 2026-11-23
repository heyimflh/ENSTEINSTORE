'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getOrderDetail, cancelMyOrder } from '../../../lib/orders-api';
import { getPayment, uploadPaymentProof, simulatePayment } from '../../../lib/orders-api';
import { ApiException } from '../../../lib/api';
import type { OrderDetailResponse } from '../../../types/api';
import {
  ArrowLeft, Loader2, AlertCircle, Clock, CheckCircle2,
  Package, Truck, XCircle, CreditCard, Store, Upload, X, AlertTriangle,
} from 'lucide-react';

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Menunggu Pembayaran', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  PAID: { label: 'Sudah Dibayar', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  PROCESSING: { label: 'Sedang Diproses', color: 'text-violet-600 bg-violet-50 border-violet-200' },
  READY: { label: 'Siap Diambil/Kirim', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  COMPLETED: { label: 'Selesai', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  CANCELLED: { label: 'Dibatalkan', color: 'text-rose-600 bg-rose-50 border-rose-200' },
};

export default function OrderDetailPage() {
  const routeParams = useParams();
  const id = routeParams?.id as string;
  const { isLoggedIn } = useAuth();
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    if (!isLoggedIn) { setLoading(false); return; }
    getOrderDetail(id)
      .then(setOrder)
      .catch((err) => setError(err instanceof ApiException ? err.message : 'Pesanan tidak ditemukan.'))
      .finally(() => setLoading(false));
  }, [id, isLoggedIn]);

  const handleCancel = async () => {
    if (!order || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      const updated = await cancelMyOrder(id, { reason: cancelReason });
      setOrder(updated);
      setShowCancelForm(false);
      setActionMsg('Pesanan berhasil dibatalkan.');
    } catch (err) {
      setActionMsg(err instanceof ApiException ? err.message : 'Gagal membatalkan pesanan.');
    } finally {
      setCancelling(false);
    }
  };

  const handleUploadProof = async () => {
    if (!order || !proofFile) return;
    setUploadingProof(true);
    try {
      await uploadPaymentProof(order.id, proofFile);
      const updated = await getOrderDetail(id);
      setOrder(updated);
      setProofFile(null);
      setActionMsg('Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.');
    } catch (err) {
      setActionMsg(err instanceof ApiException ? err.message : 'Gagal upload bukti pembayaran.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!order) return;
    setSimulating(true);
    try {
      await simulatePayment(order.id);
      const updated = await getOrderDetail(id);
      setOrder(updated);
      setActionMsg('Pembayaran berhasil disimulasikan!');
    } catch (err) {
      setActionMsg(err instanceof ApiException ? err.message : 'Simulasi pembayaran gagal.');
    } finally {
      setSimulating(false);
    }
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-10 h-10 text-zinc-300" />
      <p className="text-zinc-600">Silakan login terlebih dahulu.</p>
      <Link href="/auth" className="bg-zinc-900 text-white px-6 py-3 rounded-full text-sm font-semibold">Login</Link>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>;
  if (error || !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-10 h-10 text-rose-400" />
      <p className="text-zinc-600">{error || 'Pesanan tidak ditemukan.'}</p>
      <Link href="/orders" className="text-sm underline text-zinc-500">Kembali ke Pesanan</Link>
    </div>
  );

  const statusInfo = STATUS_LABEL[order.orderStatus] ?? { label: order.orderStatus, color: 'text-zinc-500 bg-zinc-50 border-zinc-200' };
  const canCancel = ['PENDING_PAYMENT', 'PAID'].includes(order.orderStatus);
  const needPayment = order.orderStatus === 'PENDING_PAYMENT' && order.payment?.status !== 'WAITING_VERIFICATION';

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/orders" className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <ArrowLeft className="w-4 h-4" />Pesanan Saya
          </Link>
          <h1 className="text-sm font-bold text-zinc-900">{order.orderNumber}</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {actionMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex justify-between items-start">
            <p className="text-sm text-emerald-700">{actionMsg}</p>
            <button onClick={() => setActionMsg(null)} className="text-emerald-400 hover:text-emerald-700"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Status Badge */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-400 mb-1">Status Pesanan</p>
            <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Tanggal Pesan</p>
            <p className="text-sm font-semibold text-zinc-900">{formatDate(order.orderDate)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Total</p>
            <p className="text-lg font-bold text-amber-600">{formatIDR(order.totalAmount)}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5">
          <h3 className="text-sm font-bold text-zinc-900 mb-4">Item Pesanan ({order.items.length})</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <img src={item.image || '/placeholder-product.jpg'} alt={item.productName} className="w-16 h-16 object-cover rounded-xl border border-zinc-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">{item.productName}</p>
                  <p className="text-xs text-zinc-400">{item.quantity} {item.unitName} × {formatIDR(item.unitPrice)}</p>
                  <p className="text-sm font-bold text-amber-600 mt-1">{formatIDR(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-100 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Subtotal</span>
              <span className="font-semibold">{formatIDR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Ongkir</span>
              <span className="font-semibold">{formatIDR(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-amber-600">{formatIDR(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Recipient & Fulfillment */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 grid sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Penerima</p>
            <p className="text-sm font-semibold text-zinc-900">{order.recipientName}</p>
            <p className="text-sm text-zinc-500">{order.recipientPhone}</p>
            {order.deliveryAddress && <p className="text-sm text-zinc-500 mt-1">{order.deliveryAddress}</p>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Pengiriman</p>
            <p className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              {order.fulfillmentMethod === 'DELIVERY' ? <><Truck className="w-4 h-4 text-zinc-400" />Dikirim</> : <><Store className="w-4 h-4 text-zinc-400" />Ambil di Toko</>}
            </p>
            {order.payment && (
              <p className="text-sm text-zinc-500 mt-1">Pembayaran: {order.payment.paymentMethod.replace('_', ' ')}</p>
            )}
          </div>
        </div>

        {/* Payment Actions */}
        {needPayment && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />Selesaikan Pembayaran
            </h3>
            {order.payment?.paymentMethod === 'MANUAL_TRANSFER' ? (
              <div className="space-y-3">
                <p className="text-xs text-amber-700">Upload bukti transfer ke rekening toko:</p>
                <p className="text-sm font-bold text-amber-900">BCA: 1234567890 a/n Toko Enstein</p>
                <div>
                  <label className="block text-xs font-semibold text-amber-700 mb-1.5">Upload Bukti Bayar:</label>
                  <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} className="text-sm" />
                </div>
                {proofFile && (
                  <button
                    onClick={handleUploadProof}
                    disabled={uploadingProof}
                    className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingProof ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                  </button>
                )}
                <p className="text-xs text-amber-600 italic">Atau gunakan simulasi pembayaran untuk demo:</p>
                <button
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="text-sm text-amber-700 underline"
                >
                  {simulating ? 'Memproses...' : '→ Simulasi Pembayaran Berhasil'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-amber-700 mb-3">Bayar tunai saat mengambil di toko. Atau simulasikan untuk demo:</p>
                <button
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
                >
                  {simulating ? 'Memproses...' : 'Simulasi Pembayaran Berhasil'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-5">
            {!showCancelForm ? (
              <button
                onClick={() => setShowCancelForm(true)}
                className="flex items-center gap-2 text-sm text-rose-500 hover:text-rose-700 font-semibold"
              >
                <XCircle className="w-4 h-4" />Batalkan Pesanan
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />Konfirmasi Pembatalan
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Alasan pembatalan..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelForm(false)}
                    className="px-4 py-2 text-sm border border-zinc-200 rounded-xl hover:bg-zinc-50"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling || !cancelReason.trim()}
                    className="px-4 py-2 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-60"
                  >
                    {cancelling ? 'Memproses...' : 'Ya, Batalkan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {order.orderStatus === 'CANCELLED' && order.cancellationReason && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-rose-700 mb-1">Alasan Pembatalan:</p>
            <p className="text-sm text-rose-600">{order.cancellationReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
