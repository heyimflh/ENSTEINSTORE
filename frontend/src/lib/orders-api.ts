/**
 * ENSTEINSTORE — Orders, Checkout & Payment API
 */
import { api } from './api';
import type {
  CheckoutRequest,
  CheckoutResponse,
  OrderSummaryResponse,
  OrderDetailResponse,
  PagedResponse,
  PaymentResponse,
  VerifyPaymentRequest,
  UpdateOrderStatusRequest,
  CancelOrderRequest,
  OfflineSaleRequest,
  OrderDetailResponse as OfflineSaleResponse,
} from '../types/api';

// ─── Customer Checkout ────────────────────────────────────────────────────────
export async function checkout(data: CheckoutRequest): Promise<CheckoutResponse> {
  return api.post<CheckoutResponse>('/api/checkout', data);
}

// ─── Customer Orders ──────────────────────────────────────────────────────────
export async function getMyOrders(page = 0, size = 10): Promise<PagedResponse<OrderSummaryResponse>> {
  return api.get<PagedResponse<OrderSummaryResponse>>(`/api/orders?page=${page}&size=${size}`);
}

export async function getOrderDetail(idOrNumber: string | number): Promise<OrderDetailResponse> {
  return api.get<OrderDetailResponse>(`/api/orders/${idOrNumber}`);
}

export async function cancelMyOrder(idOrNumber: string | number, data: CancelOrderRequest): Promise<OrderDetailResponse> {
  return api.post<OrderDetailResponse>(`/api/orders/${idOrNumber}/cancel`, data);
}

// ─── Customer Payment ─────────────────────────────────────────────────────────
export async function getPayment(orderId: string | number): Promise<PaymentResponse> {
  return api.get<PaymentResponse>(`/api/payments/${orderId}`);
}

export async function uploadPaymentProof(orderId: string | number, file: File): Promise<PaymentResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return api.upload<PaymentResponse>(`/api/payments/${orderId}/proof`, formData);
}

export async function simulatePayment(orderId: string | number): Promise<PaymentResponse> {
  return api.post<PaymentResponse>(`/api/payments/${orderId}/simulate`);
}

// ─── Admin Orders ─────────────────────────────────────────────────────────────
export async function adminGetOrders(params?: {
  page?: number; size?: number; status?: string;
}): Promise<PagedResponse<OrderSummaryResponse>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set('page', String(params.page));
  if (params?.size !== undefined) q.set('size', String(params.size));
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return api.get<PagedResponse<OrderSummaryResponse>>(`/api/admin/orders${qs ? `?${qs}` : ''}`);
}

export async function adminGetOrderDetail(idOrNumber: string | number): Promise<OrderDetailResponse> {
  return api.get<OrderDetailResponse>(`/api/admin/orders/${idOrNumber}`);
}

export async function adminUpdateOrderStatus(id: string | number, data: UpdateOrderStatusRequest): Promise<OrderDetailResponse> {
  const payload = {
    orderStatus: data.orderStatus || data.status,
  };
  return api.put<OrderDetailResponse>(`/api/admin/orders/${id}/status`, payload);
}

export async function adminCancelOrder(idOrNumber: string | number, data: CancelOrderRequest): Promise<OrderDetailResponse> {
  return api.post<OrderDetailResponse>(`/api/admin/orders/${idOrNumber}/cancel`, data);
}

// ─── Admin Payments ───────────────────────────────────────────────────────────
export async function adminGetPayments(params?: {
  page?: number; size?: number; status?: string;
}): Promise<PagedResponse<PaymentResponse & { orderNumber?: string; recipientName?: string }>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set('page', String(params.page));
  if (params?.size !== undefined) q.set('size', String(params.size));
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return api.get(`/api/admin/payments${qs ? `?${qs}` : ''}`);
}

export async function adminVerifyPayment(orderId: string | number, data: VerifyPaymentRequest): Promise<PaymentResponse> {
  return api.post<PaymentResponse>(`/api/admin/payments/${orderId}/verify`, data);
}

// ─── Admin Offline Sales ──────────────────────────────────────────────────────
export async function adminCreateOfflineSale(data: OfflineSaleRequest): Promise<OfflineSaleResponse> {
  const payload = {
    customerName: data.customerName || data.recipientName || 'Pelanggan Toko',
    customerPhone: data.customerPhone || data.recipientPhone,
    paymentMethod: data.paymentMethod || 'CASH',
    items: data.items,
    notes: data.notes,
  };
  return api.post<OfflineSaleResponse>('/api/admin/offline-sales', payload);
}
