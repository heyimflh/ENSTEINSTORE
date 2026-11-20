'use client';

import React, { useState } from 'react';
import { ShoppingCart, AlertCircle, Check, Eye, Plus, Minus } from 'lucide-react';
import { Product } from '../../types/store';
import { formatRupiah, getAvailableStock, getStockStatus } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onOpenQuickView,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const availableStock = getAvailableStock(product.stockOnHand, product.reservedQuantity);
  const stockInfo = getStockStatus(product.stockOnHand, product.reservedQuantity, product.minimumStock);
  const isOutOfStock = availableStock <= 0;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    setIsAdding(true);
    // Default quantity: 1 (or 1 meter / 1 pcs)
    onAddToCart(product, 1);

    setTimeout(() => {
      setIsAdding(false);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    }, 250);
  };

  return (
    <article className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-stone-300 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Product Image & Badges */}
        <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isOutOfStock ? 'grayscale opacity-75' : ''
            }`}
            loading="lazy"
          />

          {/* Overlay gradient for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            {/* Category Tag */}
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/85 backdrop-blur-sm text-stone-100 shadow-sm">
              {product.categoryName}
            </span>

            {/* New Product Tag */}
            {product.isNew && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider shadow-sm">
                Baru
              </span>
            )}
          </div>

          {/* Stock Availability Badge (Floating on Top Right) */}
          <div className="absolute top-3 right-3">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm shadow-sm ${
                isOutOfStock
                  ? 'bg-rose-600 text-white border-rose-700'
                  : availableStock <= product.minimumStock
                  ? 'bg-amber-400 text-slate-950 border-amber-500'
                  : 'bg-white/90 text-emerald-800 border-emerald-200'
              }`}
            >
              {isOutOfStock ? 'Stok Habis' : stockInfo.label}
            </span>
          </div>

          {/* Quick View Button on Hover */}
          {onOpenQuickView && (
            <button
              onClick={() => onOpenQuickView(product)}
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/95 text-slate-900 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
              title="Lihat Detail & Kalkulator Meteran"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Product Information */}
        <div className="p-4 sm:p-5">
          {/* Product Code */}
          <p className="text-[11px] font-mono font-medium text-stone-400 mb-1">
            SKU: {product.code}
          </p>

          {/* Product Name */}
          <h3 className="text-base font-bold text-slate-900 font-serif leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors">
            {product.name}
          </h3>

          {/* Description snippet */}
          <p className="mt-1.5 text-xs text-stone-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Price & Unit Display (Strict Requirement) */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-stone-400 block font-medium">Harga / Satuan</span>
              <div className="text-lg font-extrabold text-slate-900 font-serif">
                {formatRupiah(product.price)}
                <span className="text-xs font-normal text-stone-500 ml-1">/ {product.unit}</span>
              </div>
            </div>

            {product.allowDecimal && (
              <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono font-medium">
                Bisa Desimal
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Button (Strict Requirement) */}
      <div className="p-4 sm:p-5 pt-0">
        {isOutOfStock ? (
          // Out of stock state: Disabled button with "Stok habis" label
          <button
            disabled
            className="w-full py-3 px-4 rounded-xl bg-stone-100 text-stone-400 border border-stone-200 text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2 select-none"
          >
            <AlertCircle className="w-4 h-4 text-stone-400" />
            <span>Stok habis</span>
          </button>
        ) : (
          // Active state: Add to Cart button
          <button
            onClick={handleAddClick}
            disabled={isAdding}
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
              justAdded
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-900 hover:bg-amber-500 text-stone-100 hover:text-slate-950 font-bold active:scale-[0.99]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Berhasil Masuk Keranjang!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>+ Keranjang ({product.unit === 'meter' ? '1m' : '1pcs'})</span>
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
};
