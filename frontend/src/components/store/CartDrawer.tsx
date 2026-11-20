'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, ShoppingBag, X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { CartItem, formatIDR } from '../../data/products';

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const totalCartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalCartPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5 text-zinc-900" />
              <h2 className="text-base font-semibold text-zinc-900">
                Keranjang Belanja ({totalCartCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Tutup Keranjang"
              aria-label="Tutup Keranjang"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 py-16">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200/80 shadow-inner">
                    <ShoppingBag className="w-10 h-10 stroke-[1.5] text-zinc-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center text-[11px] font-black border-2 border-white shadow-xs">
                    0
                  </div>
                </div>
                <h4 className="text-lg font-bold text-zinc-900 font-serif">
                  Keranjang Anda kosong
                </h4>
                <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
                  Belum ada material jas hujan, resleting, kancing, atau karet yang ditambahkan.
                </p>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold transition-all shadow-md active:scale-95 group cursor-pointer"
                >
                  <span>Mulai Belanja</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 pb-4 border-b border-zinc-100 last:border-0"
                >
                  {/* Thumbnail */}
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-16 h-16 rounded-xl object-cover bg-zinc-100 shrink-0 border border-zinc-100"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-zinc-900 truncate" title={product.name}>
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {formatIDR(product.price)} / {product.unit}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        className="w-6 h-6 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
                        title="Kurangi jumlah"
                        aria-label="Kurangi jumlah"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-medium w-6 text-center select-none">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="w-6 h-6 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Tambah jumlah"
                        aria-label="Tambah jumlah"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Price & Trash Delete Button */}
                  <div className="text-right flex flex-col justify-between items-end">
                    <p className="text-xs font-bold text-zinc-900">
                      {formatIDR(product.price * quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.id)}
                      className="text-zinc-300 hover:text-rose-600 p-1.5 mt-2 inline-flex items-center justify-center transition-colors cursor-pointer rounded-md hover:bg-rose-50"
                      title="Hapus dari keranjang"
                      aria-label="Hapus dari keranjang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer / Checkout CTA */}
          {items.length > 0 && (
            <div className="p-6 border-t border-zinc-100 bg-zinc-50 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 font-medium text-xs">Estimasi Subtotal</span>
                <span className="font-bold text-zinc-900 text-base">
                  {formatIDR(totalCartPrice)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full py-3.5 rounded-full bg-zinc-900 text-white font-medium text-xs tracking-wider uppercase hover:bg-zinc-800 transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lanjut ke Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="w-full text-center block text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors py-1 cursor-pointer"
              >
                Buka Halaman Keranjang Penuh
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
