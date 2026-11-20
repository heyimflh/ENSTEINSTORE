'use client';

import React from 'react';
import { Product } from '../../types/store';
import { ProductCard } from './ProductCard';
import { Sparkles, PackageOpen } from 'lucide-react';

interface ProductGridProps {
  id: string;
  title: string;
  badgeText: string;
  description: string;
  products: Product[];
  isLoading?: boolean;
  isEmpty?: boolean;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenQuickView: (product: Product) => void;
  onResetFilter?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  id,
  title,
  badgeText,
  description,
  products,
  isLoading = false,
  isEmpty = false,
  onAddToCart,
  onOpenQuickView,
  onResetFilter,
}) => {
  return (
    <section id={id} className="py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 pb-4 border-b border-stone-200/80 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-amber-400 text-xs font-semibold tracking-wide uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{badgeText}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-sm text-stone-600 max-w-xl">
              {description}
            </p>
          </div>

          <div className="text-xs text-stone-500 font-medium">
            Total: <span className="font-bold text-slate-900">{products.length}</span> item aktif
          </div>
        </div>

        {/* Loading Skeleton State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4 animate-pulse shadow-sm"
              >
                <div className="aspect-square bg-stone-200 rounded-xl w-full" />
                <div className="space-y-2">
                  <div className="h-3 bg-stone-200 rounded w-1/3" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-full" />
                </div>
                <div className="h-8 bg-stone-200 rounded-xl w-full pt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (isEmpty || products.length === 0) && (
          <div className="py-16 px-6 text-center bg-white rounded-3xl border border-dashed border-stone-300 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-serif">
              Tidak Ada Produk Ditemukan
            </h3>
            <p className="text-xs text-stone-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Tidak ada produk yang cocok dengan kata kunci atau filter kategori yang Anda pilih saat ini.
            </p>
            {onResetFilter && (
              <button
                onClick={onResetFilter}
                className="mt-5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-stone-100 text-xs font-bold transition-all shadow-sm"
              >
                Reset Semua Filter &amp; Pencarian
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !isEmpty && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onOpenQuickView={onOpenQuickView}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
