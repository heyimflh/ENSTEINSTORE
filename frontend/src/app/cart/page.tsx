'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getCart, updateCartItem, removeCartItem, clearCart } from '../../lib/cart-api';
import { checkout } from '../../lib/orders-api';
import { ApiException } from '../../lib/api';
import type { CartResponse, FulfillmentMethod, PaymentMethod } from '../../types/api';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight, ArrowLeft, AlertCircle,
  Loader2, Truck, Store, Check, ShieldCheck, PackageCheck, X,
} from 'lucide-react';

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [removingId, setRemovingId] = useState<string | number | null>(null);
  const [clearing, setClearing] = useState(false);

  // Checkout form state
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('PICKUP');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getCart();
      setCart(res);
    } catch (err) {
      if (err instanceof ApiException) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleUpdateQty = async (itemId: string | number, qty: number) => {
    setUpdatingId(itemId);
    try {
      const updated = await updateCartItem(itemId, { quantity: qty });
      setCart(updated);
    } catch (err) {
      if (err instanceof ApiException) alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: string | number) => {
    setRemovingId(itemId);
    try {
      const updated = await removeCartItem(itemId);
      setCart(updated);
    } catch (err) {
      if (err instanceof ApiException) alert(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Kosongkan keranjang?')) return;
    setClearing(true);
    try {
      await clearCart();
      setCart(null);
    } catch (err) {
      if (err instanceof ApiException) alert(err.message);
    } finally {
      setClearing(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    if (!recipientName.trim() || !recipientPhone.trim()) {
      setCheckoutError('Nama dan nomor telepon penerima wajib diisi.');
      return;
    }
    if (fulfillmentMethod === 'DELIVERY' && !deliveryAddress.trim()) {
      setCheckoutError('Alamat pengiriman wajib diisi untuk metode pengiriman.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const order = await checkout({
        recipientName,
        recipientPhone,
        fulfillmentMethod,
        paymentMethod,
        deliveryAddress: fulfillmentMethod === 'DELIVERY' ? deliveryAddress : undefined,
        notes: notes || undefined,
      });
      router.push(`/orders/${order.orderNumber}`);
    } catch (err) {
      if (err instanceof ApiException) {
        setCheckoutError(err.message);
      } else {
        setCheckoutError('Gagal memproses checkout. Coba lagi.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <ShoppingCart className="w-12 h-12 text-zinc-300" />
      <p className="text-zinc-600 font-medium">Silakan login untuk melihat keranjang.</p>
      <Link href="/auth" className="bg-zinc-900 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-zinc-800">Login</Link>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-10 h-10 text-rose-400" />
      <p className="text-zinc-600">{error}</p>
      <button onClick={fetchCart} className="text-sm underline text-zinc-500">Coba lagi</button>
    </div>
  );

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/products" className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <ArrowLeft className="w-4 h-4" />Lanjutkan Belanja
          </Link>
          <h1 className="text-base font-bold text-zinc-900">
            {step === 'cart' ? 'Keranjang Belanja' : 'Konfirmasi Pesanan'}
          </h1>
          <div className="w-24" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {step === 'cart' ? (
          <>
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShoppingCart className="w-16 h-16 text-zinc-200 mb-4" />
                <h2 className="text-xl font-bold text-zinc-900 mb-2">Keranjang Kosong</h2>
                <p className="text-zinc-500 mb-6">Belum ada produk di keranjang Anda.</p>
                <Link href="/products" className="bg-zinc-900 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-zinc-800">
                  Mulai Belanja
                </Link>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-zinc-900">{cart!.totalItems} Item</h2>
                    <button
                      onClick={handleClearCart}
                      disabled={clearing}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />{clearing ? 'Mengosongkan...' : 'Kosongkan'}
                    </button>
                  </div>
                  {cart!.items.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-zinc-100 p-4 flex gap-4">
                      <img
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-xl border border-zinc-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 leading-tight">{item.productName}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{item.productCode}</p>
                        <p className="text-sm font-bold text-amber-600 mt-1">{formatIDR(item.priceAtAdd)}/{item.unitName}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 border border-zinc-200 rounded-xl">
                            <button
                              onClick={() => handleUpdateQty(item.id, Math.max(item.allowDecimal ? 0.5 : 1, parseFloat((item.quantity - (item.allowDecimal ? 0.5 : 1)).toFixed(2))))}
                              disabled={updatingId === item.id}
                              className="p-2 hover:bg-zinc-100 rounded-l-xl"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQty(item.id, Math.min(item.stockAvailable, parseFloat((item.quantity + (item.allowDecimal ? 0.5 : 1)).toFixed(2))))}
                              disabled={updatingId === item.id}
                              className="p-2 hover:bg-zinc-100 rounded-r-xl"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-zinc-900">{formatIDR(item.subtotal)}</span>
                            <button
                              onClick={() => handleRemove(item.id)}
                              disabled={removingId === item.id}
                              className="text-zinc-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 bg-white rounded-2xl border border-zinc-100 p-5">
                    <h3 className="text-sm font-bold text-zinc-900 mb-4">Ringkasan</h3>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Subtotal</span>
                        <span className="font-semibold">{formatIDR(cart!.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Ongkir</span>
                        <span className="text-zinc-400">Dihitung saat checkout</span>
                      </div>
                    </div>
                    <div className="border-t border-zinc-100 pt-3 flex justify-between font-bold text-sm mb-5">
                      <span>Total Sementara</span>
                      <span className="text-amber-600">{formatIDR(cart!.subtotal)}</span>
                    </div>
                    <button
                      onClick={() => setStep('checkout')}
                      className="w-full bg-zinc-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-zinc-800 flex items-center justify-center gap-2"
                    >
                      Lanjut ke Checkout <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Transaksi aman & terenkripsi</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleCheckout} className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                <h3 className="text-sm font-bold text-zinc-900 mb-4">Data Penerima</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Nama Penerima *</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Nama lengkap penerima"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Nomor Telepon *</label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Catatan (opsional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan untuk penjual..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                <h3 className="text-sm font-bold text-zinc-900 mb-4">Metode Pengambilan</h3>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { v: 'PICKUP', label: 'Ambil di Toko', icon: <Store className="w-5 h-5" /> },
                    { v: 'DELIVERY', label: 'Dikirim', icon: <Truck className="w-5 h-5" /> },
                  ] as const).map(({ v, label, icon }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFulfillmentMethod(v)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                        fulfillmentMethod === v
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {icon}{label}
                    </button>
                  ))}
                </div>
                {fulfillmentMethod === 'DELIVERY' && (
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Alamat Pengiriman *</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Jl. ..., RT/RW, Kelurahan, Kecamatan, Kota, Provinsi, Kode Pos"
                      rows={3}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-zinc-100 p-5">
                <h3 className="text-sm font-bold text-zinc-900 mb-4">Metode Pembayaran</h3>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { v: 'BANK_TRANSFER', label: 'Transfer Bank (BCA)' },
                    { v: 'CASH', label: 'Tunai di Toko' },
                  ] as const).map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPaymentMethod(v)}
                      className={`p-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                        paymentMethod === v
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {checkoutError && (
                <div className="flex gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-700">{checkoutError}</p>
                </div>
              )}
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
                <h3 className="text-sm font-bold text-zinc-900">Ringkasan Pesanan</h3>
                {cart!.items.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <span className="text-zinc-500 flex-1 line-clamp-1">{item.productName}</span>
                    <span className="font-semibold text-zinc-900 shrink-0">{formatIDR(item.subtotal)}</span>
                  </div>
                ))}
                <div className="border-t border-zinc-100 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="font-semibold">{formatIDR(cart!.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ongkir</span>
                    <span className="text-zinc-400">{fulfillmentMethod === 'DELIVERY' ? 'Sesuai jarak' : 'Gratis'}</span>
                  </div>
                </div>
                <div className="border-t border-zinc-100 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-amber-600">{formatIDR(cart!.subtotal)}</span>
                </div>
                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="w-full bg-zinc-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {checkoutLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><PackageCheck className="w-4 h-4" />Konfirmasi Pesanan</>
                  }
                </button>
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="w-full text-center text-sm text-zinc-500 underline underline-offset-2"
                >
                  ← Kembali ke Keranjang
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
