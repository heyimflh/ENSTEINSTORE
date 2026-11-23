'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getProductById } from '../../../lib/catalog-api';
import { addToCart } from '../../../lib/cart-api';
import { ApiException } from '../../../lib/api';
import type { ProductResponse } from '../../../types/api';
import { ArrowLeft, ShoppingCart, Plus, Minus, Check, AlertCircle, Loader2, Store } from 'lucide-react';

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

export default function ProductDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const id = routeParams?.id as string;
  const { isLoggedIn } = useAuth();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProductById(id)
      .then(setProduct)
      .catch((err) => setError(err instanceof ApiException ? err.message : 'Produk tidak ditemukan.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) { router.push('/auth'); return; }
    if (!product) return;
    setAdding(true);
    try {
      await addToCart({ productId: product.id, quantity });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      if (err instanceof ApiException) alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-10 h-10 text-rose-400" />
      <p className="text-zinc-600">{error || 'Produk tidak ditemukan.'}</p>
      <Link href="/products" className="text-sm underline text-zinc-500">Kembali ke Produk</Link>
    </div>
  );

  const step = product.allowDecimal ? 0.5 : 1;
  const maxQty = product.stockOnHand;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/products" className="flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900">
            <ArrowLeft className="w-4 h-4" />Kembali
          </Link>
          <Link href="/" className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-500" />ENSTEINSTORE
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Image */}
          <div className="aspect-square rounded-3xl overflow-hidden bg-zinc-50 border border-zinc-100">
            <img
              src={product.image || '/placeholder-product.jpg'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div>
              <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider">{product.categoryName}</span>
              <h1 className="text-2xl font-bold text-zinc-900 mt-1">{product.name}</h1>
              <p className="text-xs text-zinc-400 mt-1">Kode: {product.code}</p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-900">{formatIDR(product.price)}</span>
              <span className="text-sm text-zinc-500">/ {product.unitSymbol}</span>
            </div>

            {product.description && (
              <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>
            )}

            <div className="bg-zinc-50 rounded-2xl p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Stok Tersedia</p>
                <p className={`font-bold ${product.available ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {product.stockOnHand} {product.unitSymbol}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Satuan</p>
                <p className="font-bold text-zinc-900">{product.unit}</p>
              </div>
            </div>

            {product.available && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 border border-zinc-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(step, parseFloat((q - step).toFixed(2))))}
                    className="p-3 hover:bg-zinc-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxQty, parseFloat((q + step).toFixed(2))))}
                    className="p-3 hover:bg-zinc-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-zinc-500">
                  = {formatIDR(product.price * quantity)}
                </span>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={!product.available || adding}
              className={`w-full py-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                added ? 'bg-emerald-500 text-white'
                : product.available ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {adding ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : added ? (
                <><Check className="w-5 h-5" />Berhasil Ditambahkan!</>
              ) : product.available ? (
                <><ShoppingCart className="w-5 h-5" />Tambah ke Keranjang</>
              ) : (
                'Stok Habis'
              )}
            </button>

            <Link href="/cart" className="text-center text-sm text-zinc-500 underline underline-offset-2">
              Lihat Keranjang →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
