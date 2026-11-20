'use client';

import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { MOCK_CATEGORIES } from '../../data/mock-data';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  resultsCount: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onSelectCategory,
  resultsCount,
}) => {
  return (
    <div id="search-section" className="relative z-20 -mt-7 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="bg-[#FDFBF7] p-4 sm:p-5 rounded-2xl md:rounded-3xl shadow-xl border border-stone-200/90 transition-all">
        
        {/* Main Search Input */}
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-stone-400">
            <Search className="w-5 h-5 text-amber-600" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari bahan (contoh: Kain PVC Merah, Resleting 60cm, Kancing Snap, Karet)..."
            className="w-full pl-12 pr-12 py-3.5 bg-stone-50 hover:bg-stone-100/60 focus:bg-white text-slate-900 placeholder:text-stone-400 text-sm md:text-base font-medium rounded-xl md:rounded-2xl border border-stone-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all shadow-inner"
          />

          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 p-1.5 text-stone-400 hover:text-slate-900 rounded-full hover:bg-stone-200 transition-colors"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Category Pills & Result Summary */}
        <div className="mt-3.5 pt-3 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-semibold text-stone-500 flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Kategori:
            </span>

            <button
              onClick={() => onSelectCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                selectedCategoryId === null
                  ? 'bg-slate-900 text-stone-100 shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Semua Kategori
            </button>

            {MOCK_CATEGORIES.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Results Badge */}
          <div className="text-xs text-stone-500 font-medium ml-auto">
            Menampilkan <span className="font-bold text-slate-900">{resultsCount}</span> produk
          </div>
        </div>

      </div>
    </div>
  );
};
