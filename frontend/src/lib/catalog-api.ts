/**
 * ENSTEINSTORE — Catalog API (Products, Categories, Units)
 */
import { api } from './api';
import type {
  ProductResponse,
  CategoryResponse,
  UnitResponse,
  PagedResponse,
  CreateProductRequest,
  UpdateProductRequest,
} from '../types/api';

export interface ProductSearchParams {
  query?: string;
  categoryId?: string | number;
  sort?: string;
  page?: number;
  size?: number;
}

export async function getProducts(params: ProductSearchParams = {}): Promise<PagedResponse<ProductResponse>> {
  const q = new URLSearchParams();
  if (params.query) q.set('query', params.query);
  if (params.categoryId) q.set('categoryId', String(params.categoryId));
  if (params.sort) q.set('sort', params.sort);
  if (params.page !== undefined) q.set('page', String(params.page));
  if (params.size !== undefined) q.set('size', String(params.size));
  const qs = q.toString();
  return api.get<PagedResponse<ProductResponse>>(`/api/products${qs ? `?${qs}` : ''}`);
}

export async function getProductById(idOrCode: string | number): Promise<ProductResponse> {
  return api.get<ProductResponse>(`/api/products/${idOrCode}`);
}

export async function getFeaturedProducts(): Promise<ProductResponse[]> {
  return api.get<ProductResponse[]>('/api/products/featured');
}

export async function getCategories(): Promise<CategoryResponse[]> {
  return api.get<CategoryResponse[]>('/api/categories');
}

export async function getCategoryBySlug(slugOrId: string): Promise<CategoryResponse> {
  return api.get<CategoryResponse>(`/api/categories/${slugOrId}`);
}

export async function getUnits(): Promise<UnitResponse[]> {
  return api.get<UnitResponse[]>('/api/units');
}

// ─── Admin Product Management ────────────────────────────────────────────────
export async function adminGetProducts(params: ProductSearchParams = {}): Promise<PagedResponse<ProductResponse>> {
  const q = new URLSearchParams();
  if (params.query) q.set('query', params.query);
  if (params.categoryId) q.set('categoryId', String(params.categoryId));
  if (params.sort) q.set('sort', params.sort);
  if (params.page !== undefined) q.set('page', String(params.page));
  if (params.size !== undefined) q.set('size', String(params.size));
  const qs = q.toString();
  return api.get<PagedResponse<ProductResponse>>(`/api/admin/products${qs ? `?${qs}` : ''}`);
}

export async function adminCreateProduct(data: CreateProductRequest): Promise<ProductResponse> {
  return api.post<ProductResponse>('/api/admin/products', data);
}

export async function adminUpdateProduct(id: string | number, data: UpdateProductRequest): Promise<ProductResponse> {
  return api.put<ProductResponse>(`/api/admin/products/${id}`, data);
}

export async function adminDeleteProduct(id: string | number): Promise<void> {
  return api.delete<void>(`/api/admin/products/${id}`);
}
