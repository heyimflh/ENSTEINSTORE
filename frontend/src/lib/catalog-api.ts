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
  categorySlug?: string;
  featured?: boolean;
  activeOnly?: boolean;
  sort?: string;
  page?: number;
  size?: number;
}

export function resolveProductImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '/images/placeholder-product.svg';
  }
  const clean = url.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }
  if (clean.startsWith('/images/') || clean.startsWith('images/')) {
    return clean.startsWith('/') ? clean : `/${clean}`;
  }
  if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const path = clean.startsWith('/') ? clean : `/${clean}`;
    return `${backendUrl}${path}`;
  }
  if (clean.startsWith('/')) {
    return clean;
  }
  return `/images/DB_GAMBAR_ENSTEINSTORE/${clean}`;
}

export const PRESET_PRODUCT_IMAGES = [
  { label: 'PVC Super (Bahan)', path: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg' },
  { label: 'PVC Blue Sky (Bahan)', path: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCBluesky.jpg' },
  { label: 'PVC Cream (Bahan)', path: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCCream.jpeg' },
  { label: 'PVC Hijau Army (Bahan)', path: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHijauArmy.jpeg' },
  { label: 'PVC Hijau Olive (Bahan)', path: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHijauOlive.jpg' },
  { label: 'PVC Hitam (Bahan)', path: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCHitam.jpeg' },
  { label: 'PVC Navy (Bahan)', path: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCNavy.jpeg' },
  { label: 'PVC Sage (Bahan)', path: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSage.jpg' },
  { label: 'PVC Salem (Bahan)', path: '/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVCSalem.jpeg' },
  { label: 'Tali Hoodie (Aksesori)', path: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/TaliHoddieALL.jpeg' },
  { label: 'Skotlet Reflektor (Aksesori)', path: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SkotletPlastikALL.jpg' },
  { label: 'Resleting Waterproof', path: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/Resleting.jpeg' },
  { label: 'Seam Sealing Tape / Silen', path: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/SilenMantel.webp' },
  { label: 'Stopper Lobi-Lobi', path: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/LobiLobiALL.jpg' },
  { label: 'Karet Elastis', path: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/ElastikALL.jpeg' },
  { label: 'Kancing Snap', path: '/images/DB_GAMBAR_ENSTEINSTORE/Alat/KancingALL.jpeg' },
];

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
  if (params.categorySlug) q.set('categorySlug', params.categorySlug);
  if (params.featured !== undefined) q.set('featured', String(params.featured));
  if (params.activeOnly !== undefined) q.set('activeOnly', String(params.activeOnly));
  if (params.sort) q.set('sort', params.sort);
  if (params.page !== undefined) q.set('page', String(params.page));
  if (params.size !== undefined) q.set('size', String(params.size));
  const qs = q.toString();
  return api.get<PagedResponse<ProductResponse>>(`/api/admin/products${qs ? `?${qs}` : ''}`);
}

export async function adminCreateProduct(data: CreateProductRequest): Promise<ProductResponse> {
  const payload = {
    ...data,
    productCode: data.productCode || data.code,
  };
  return api.post<ProductResponse>('/api/admin/products', payload);
}

export async function adminUpdateProduct(id: string | number, data: UpdateProductRequest): Promise<ProductResponse> {
  return api.put<ProductResponse>(`/api/admin/products/${id}`, data);
}

export async function adminDeleteProduct(id: string | number): Promise<void> {
  return api.delete<void>(`/api/admin/products/${id}`);
}
