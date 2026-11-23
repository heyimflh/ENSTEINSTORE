/**
 * ENSTEINSTORE — Inventory & Dashboard & Reports API
 */
import { api } from './api';
import type {
  StockMovementResponse,
  StockInRequest,
  StockAdjustmentRequest,
  PagedResponse,
  DashboardSummaryResponse,
} from '../types/api';

// ─── Dashboard ────────────────────────────────────────────────────────────────
export async function getDashboard(): Promise<DashboardSummaryResponse> {
  return api.get<DashboardSummaryResponse>('/api/admin/dashboard');
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export async function getStockMovements(params?: {
  page?: number; size?: number; productId?: string | number;
}): Promise<PagedResponse<StockMovementResponse>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set('page', String(params.page));
  if (params?.size !== undefined) q.set('size', String(params.size));
  if (params?.productId) q.set('productId', String(params.productId));
  const qs = q.toString();
  return api.get<PagedResponse<StockMovementResponse>>(`/api/admin/inventory/movements${qs ? `?${qs}` : ''}`);
}

export async function stockIn(data: StockInRequest): Promise<StockMovementResponse> {
  return api.post<StockMovementResponse>('/api/admin/inventory/stock-in', data);
}

export async function stockAdjustment(data: StockAdjustmentRequest): Promise<StockMovementResponse> {
  const payload = {
    productId: data.productId,
    newActualStock: data.newActualStock !== undefined ? data.newActualStock : (data as { newQuantity?: number }).newQuantity,
    notes: data.notes || (data as { reason?: string }).reason || '',
  };
  return api.post<StockMovementResponse>('/api/admin/inventory/adjustment', payload);
}

// ─── Reports (CSV Download) ───────────────────────────────────────────────────
export async function downloadDailySalesReport(startDate: string, endDate: string): Promise<void> {
  const blob = await api.download(`/api/admin/reports/sales/daily?startDate=${startDate}&endDate=${endDate}`);
  triggerDownload(blob, `laporan-penjualan-harian-${startDate}-${endDate}.csv`);
}

export async function downloadMonthlySalesReport(year: number): Promise<void> {
  const blob = await api.download(`/api/admin/reports/sales/monthly?year=${year}`);
  triggerDownload(blob, `laporan-penjualan-bulanan-${year}.csv`);
}

export async function downloadTopProductsReport(): Promise<void> {
  const blob = await api.download('/api/admin/reports/products/top');
  triggerDownload(blob, 'laporan-produk-terlaris.csv');
}

export async function downloadStockReport(): Promise<void> {
  const blob = await api.download('/api/admin/reports/inventory/stock');
  triggerDownload(blob, 'laporan-stok-inventaris.csv');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
