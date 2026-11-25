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
  CategoryResponse,
  CategoryRequest,
  UnitResponse,
  UnitRequest,
} from '../types/api';

// ─── Categories & Units Management ───────────────────────────────────────────
export async function getAdminCategories(): Promise<CategoryResponse[]> {
  return api.get<CategoryResponse[]>('/admin/categories');
}

export async function createCategory(data: CategoryRequest): Promise<CategoryResponse> {
  return api.post<CategoryResponse>('/admin/categories', data);
}

export async function updateCategory(id: string, data: CategoryRequest): Promise<CategoryResponse> {
  return api.put<CategoryResponse>(`/admin/categories/${id}`, data);
}

export async function toggleCategoryStatus(id: string, isActive?: boolean): Promise<CategoryResponse> {
  return api.patch<CategoryResponse>(`/admin/categories/${id}/status`, { isActive });
}

export async function deleteCategory(id: string): Promise<void> {
  return api.delete<void>(`/admin/categories/${id}`);
}

export async function getAdminUnits(): Promise<UnitResponse[]> {
  return api.get<UnitResponse[]>('/admin/units');
}

export async function createUnit(data: UnitRequest): Promise<UnitResponse> {
  return api.post<UnitResponse>('/admin/units', data);
}

export async function updateUnit(id: string, data: UnitRequest): Promise<UnitResponse> {
  return api.put<UnitResponse>(`/admin/units/${id}`, data);
}

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

// ─── Reports (Live JSON & CSV Download) ──────────────────────────────────────
export type {
  DailySalesResponse,
  MonthlySalesResponse,
  TopProductResponse,
  StockReportResponse,
} from '../types/api';

import type {
  DailySalesResponse,
  MonthlySalesResponse,
  TopProductResponse,
  StockReportResponse,
} from '../types/api';

export interface DailySalesRecord {
  date: string;
  totalOrders: number;
  paidOrders: number;
  revenue: number;
}

export interface TopProductRecord {
  productCode: string;
  productName: string;
  categoryName: string;
  totalSold: number;
  unitSymbol: string;
  totalRevenue: number;
}

// ─── Live JSON Report Endpoints ─────────────────────────────────────────────
export async function getDailySalesData(startDate: string, endDate: string): Promise<DailySalesResponse[]> {
  try {
    return await api.get<DailySalesResponse[]>(`/api/admin/reports/sales/daily/data?startDate=${startDate}&endDate=${endDate}`);
  } catch (err) {
    console.warn('Fallback to CSV parsing for daily sales:', err);
    return fetchDailySalesReport(startDate, endDate);
  }
}

export async function getMonthlySalesData(year: number): Promise<MonthlySalesResponse[]> {
  try {
    return await api.get<MonthlySalesResponse[]>(`/api/admin/reports/sales/monthly/data?year=${year}`);
  } catch (err) {
    console.warn('Failed to fetch monthly sales data:', err);
    return [];
  }
}

export async function getTopProductsData(startDate?: string, endDate?: string, limit = 10): Promise<TopProductResponse[]> {
  try {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    q.set('limit', String(limit));
    const qs = q.toString();
    return await api.get<TopProductResponse[]>(`/api/admin/reports/products/top/data${qs ? `?${qs}` : ''}`);
  } catch (err) {
    console.warn('Fallback to CSV parsing for top products:', err);
    return fetchTopProductsReport(startDate, endDate, limit);
  }
}

export async function getStockReportData(): Promise<StockReportResponse[]> {
  try {
    return await api.get<StockReportResponse[]>('/api/admin/reports/inventory/stock/data');
  } catch (err) {
    console.warn('Failed to fetch stock report data:', err);
    return [];
  }
}

// ─── CSV Fallback Parsers ───────────────────────────────────────────────────
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function cleanCell(cell: string): string {
  let c = cell.trim();
  if (c.startsWith("'")) c = c.slice(1);
  return c;
}

export function parseDailySalesCsv(csv: string): DailySalesRecord[] {
  const clean = csv.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];
  const lines = clean.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  const records: DailySalesRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]).map(cleanCell);
    if (cols.length >= 4) {
      records.push({
        date: cols[0],
        totalOrders: parseInt(cols[1], 10) || 0,
        paidOrders: parseInt(cols[2], 10) || 0,
        revenue: parseFloat(cols[3]) || 0,
      });
    }
  }
  return records;
}

export function parseTopProductsCsv(csv: string): TopProductRecord[] {
  const clean = csv.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];
  const lines = clean.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  const records: TopProductRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]).map(cleanCell);
    if (cols.length >= 6) {
      records.push({
        productCode: cols[0],
        productName: cols[1],
        categoryName: cols[2],
        totalSold: parseFloat(cols[3]) || 0,
        unitSymbol: cols[4],
        totalRevenue: parseFloat(cols[5]) || 0,
      });
    }
  }
  return records;
}

export async function fetchDailySalesReport(startDate: string, endDate: string): Promise<DailySalesRecord[]> {
  try {
    const blob = await api.download(`/api/admin/reports/sales/daily?startDate=${startDate}&endDate=${endDate}`);
    const text = await blob.text();
    return parseDailySalesCsv(text);
  } catch (e) {
    console.error('Failed to fetch daily sales report:', e);
    return [];
  }
}

export async function fetchTopProductsReport(startDate?: string, endDate?: string, limit = 10): Promise<TopProductRecord[]> {
  try {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    q.set('limit', String(limit));
    const qs = q.toString();
    const blob = await api.download(`/api/admin/reports/products/top${qs ? `?${qs}` : ''}`);
    const text = await blob.text();
    return parseTopProductsCsv(text);
  } catch (e) {
    console.error('Failed to fetch top products report:', e);
    return [];
  }
}

// ─── Reports (CSV Download Actions) ──────────────────────────────────────────
export async function downloadDailySalesReport(startDate: string, endDate: string): Promise<void> {
  const blob = await api.download(`/api/admin/reports/sales/daily?startDate=${startDate}&endDate=${endDate}`);
  triggerDownload(blob, `laporan-penjualan-harian-${startDate}_sd_${endDate}.csv`);
}

export async function downloadMonthlySalesReport(year: number): Promise<void> {
  const blob = await api.download(`/api/admin/reports/sales/monthly?year=${year}`);
  triggerDownload(blob, `laporan-penjualan-bulanan-${year}.csv`);
}

export async function downloadTopProductsReport(startDate?: string, endDate?: string, limit = 50): Promise<void> {
  const q = new URLSearchParams();
  if (startDate) q.set('startDate', startDate);
  if (endDate) q.set('endDate', endDate);
  q.set('limit', String(limit));
  const qs = q.toString();
  const blob = await api.download(`/api/admin/reports/products/top${qs ? `?${qs}` : ''}`);
  const range = startDate && endDate ? `${startDate}_sd_${endDate}` : 'semua-periode';
  triggerDownload(blob, `laporan-produk-terlaris-${range}.csv`);
}

export async function downloadStockReport(): Promise<void> {
  const blob = await api.download('/api/admin/reports/inventory/stock');
  const today = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `laporan-stok-inventaris-${today}.csv`);
}

// ─── Orders & Payments Re-export ─────────────────────────────────────────────
export {
  adminGetOrders,
  adminGetOrderDetail,
  adminUpdateOrderStatus,
  adminCancelOrder,
  adminGetPayments,
  adminVerifyPayment,
} from './orders-api';

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
