'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Check, Minus, Plus } from 'lucide-react';
import { Product, formatIDR } from '../../data/products';

export interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [modalQuantity, setModalQuantity] = useState<number>(1);

  // Reset quantity whenever product changes
  useEffect(() => {
    setModalQuantity(1);
  }, [product]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden border border-zinc-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Circular Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer z-20"
            title="Tutup Modal"
            aria-label="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            {/* Product Image */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-100">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="bg-zinc-900/90 text-white text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
                    Stok Habis
                  </span>
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="flex flex-col h-full justify-between space-y-4">
              <div>
                {/* Category & SKU Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                    {product.category}
                  </span>
                  <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-mono font-medium">
                    {product.code}
                  </span>
                </div>

                {/* Product Name */}
                <h3 className="text-lg font-bold text-zinc-900 mt-1 leading-snug">
                  {product.name}
                </h3>

                {/* Product Price */}
                <p className="text-xl font-bold text-zinc-900 mt-2">
                  {formatIDR(product.price)}{' '}
                  <span className="text-zinc-400 text-xs font-normal">
                    / {product.unit}
                  </span>
                </p>

                {/* Description Divider & Text */}
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <p className="text-xs text-zinc-600 leading-relaxed font-light">
                    {product.description}
                  </p>
                </div>

                {/* Stock Status Indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="text-zinc-400">Status Stok:</span>
                  {!isOutOfStock ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Tersedia ({product.stock} {product.unit})
                    </span>
                  ) : (
                    <span className="text-rose-500 font-medium">Stok habis di gudang</span>
                  )}
                </div>
              </div>

              {/* Quantity Selector & Action Button */}
              <div className="pt-4 border-t border-zinc-100 space-y-3">
                {!isOutOfStock ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Jumlah ({product.unit}):</span>
                      <div className="flex items-center gap-2 border border-zinc-200 rounded-full px-2 py-1">
                        <button
                          type="button"
                          onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                          className="p-1 hover:text-zinc-900 text-zinc-500 cursor-pointer"
                          aria-label="Kurangi jumlah"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold px-2 w-8 text-center select-none">
                          {modalQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setModalQuantity((q) => Math.min(product.stock, q + 1))
                          }
                          className="p-1 hover:text-zinc-900 text-zinc-500 cursor-pointer"
                          aria-label="Tambah jumlah"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                      <span>Subtotal:</span>
                      <span className="text-sm font-bold text-zinc-900">
                        {formatIDR(product.price * modalQuantity)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(product, modalQuantity);
                        onClose();
                      }}
                      className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Tambah ke Keranjang</span>
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-zinc-300 text-zinc-500 font-medium text-xs tracking-wider uppercase cursor-not-allowed text-center"
                  >
                    Stok habis
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
