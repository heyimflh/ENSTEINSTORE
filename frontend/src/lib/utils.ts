/**
 * Utility functions for ENSTEINSTORE frontend
 */

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getAvailableStock(stockOnHand: number, reservedQuantity: number): number {
  return Math.max(0, stockOnHand - reservedQuantity);
}

export function getStockStatus(stockOnHand: number, reservedQuantity: number, minimumStock: number) {
  const available = getAvailableStock(stockOnHand, reservedQuantity);
  if (available <= 0) {
    return {
      status: 'OUT_OF_STOCK' as const,
      label: 'Stok habis',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    };
  }
  if (available <= minimumStock) {
    return {
      status: 'LOW_STOCK' as const,
      label: `Sisa ${available} (Menipis)`,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    };
  }
  return {
    status: 'NORMAL' as const,
    label: `Tersedia: ${available}`,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}
