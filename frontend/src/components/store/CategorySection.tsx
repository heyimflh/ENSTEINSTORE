'use client';

import React from 'react';
import { Layers, GitCommitHorizontal, CircleDot, Activity, Scissors, ArrowUpRight } from 'lucide-react';
import { Category } from '../../types/store';

interface CategorySectionProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  // Map icon component dynamically
  const getIcon = (name: string) => {
    switch (name) {
      case 'Layers':
        return <Layers className="w-6 h-6" />;
      case 'GitCommitHorizontal':
        return <GitCommitHorizontal className="w-6 h-6" />;
      case 'CircleDot':
        return <CircleDot className="w-6 h-6" />;
      case 'Activity':
        return <Activity className="w-6 h-6" />;
      case 'Scissors':
        return <Scissors className="w-6 h-6" />;
      default:
        return <Layers className="w-6 h-6" />;
    }
  };

  return (
    <section id="categories-section" className="py-16 bg-[#FDFBF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-stone-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-2">
              Katalog Toko Enstein
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
              5 Kategori Utama Bahan Jas Hujan
            </h2>
            <p className="mt-1 text-sm text-stone-600 max-w-xl">
              Pilih kategori bahan baku untuk memfilter produk spesifik yang Anda butuhkan untuk produksi jas hujan.
            </p>
          </div>

          {selectedCategoryId && (
            <button
              onClick={() => onSelectCategory(null)}
              className="mt-4 md:mt-0 text-xs font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-4"
            >
              Reset Filter Kategori
            </button>
          )}
        </div>

        {/* 5 Categories Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategoryId === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                className={`group cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-stone-100 border-slate-900 shadow-xl ring-2 ring-amber-500 scale-[1.02]'
                    : 'bg-white hover:bg-stone-50/80 text-slate-900 border-stone-200/90 shadow-sm hover:shadow-md hover:-translate-y-1'
                }`}
              >
                <div>
                  {/* Top Bar inside card: Icon & Index */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-stone-100 text-amber-600 group-hover:bg-amber-100 group-hover:text-amber-800'
                      }`}
                    >
                      {getIcon(cat.iconName)}
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-slate-800 text-stone-300' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`text-base font-bold font-serif mb-1 group-hover:text-amber-600 transition-colors ${
                      isSelected ? 'text-amber-400 group-hover:text-amber-300' : 'text-slate-900'
                    }`}
                  >
                    {cat.name}
                  </h3>
                  <p
                    className={`text-xs line-clamp-2 leading-relaxed ${
                      isSelected ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    {cat.description}
                  </p>
                </div>

                {/* Footer inside card */}
                <div className="mt-5 pt-3 border-t border-stone-100/30 flex items-center justify-between text-xs font-semibold">
                  <span className={isSelected ? 'text-stone-400' : 'text-stone-500'}>
                    {cat.itemCount} Variasi
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 transition-transform group-hover:translate-x-1 ${
                      isSelected ? 'text-amber-400' : 'text-amber-700'
                    }`}
                  >
                    {isSelected ? 'Terpilih' : 'Pilih'}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
