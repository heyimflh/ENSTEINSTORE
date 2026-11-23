/**
 * ENSTEINSTORE — Cart API
 */
import { api } from './api';
import type { CartResponse, AddToCartRequest, UpdateCartItemRequest } from '../types/api';

export async function getCart(): Promise<CartResponse> {
  return api.get<CartResponse>('/api/cart');
}

export async function addToCart(data: AddToCartRequest): Promise<CartResponse> {
  return api.post<CartResponse>('/api/cart/items', data);
}

export async function updateCartItem(itemId: string | number, data: UpdateCartItemRequest): Promise<CartResponse> {
  return api.put<CartResponse>(`/api/cart/items/${itemId}`, data);
}

export async function removeCartItem(itemId: string | number): Promise<CartResponse> {
  return api.delete<CartResponse>(`/api/cart/items/${itemId}`);
}

export async function clearCart(): Promise<void> {
  return api.delete<void>('/api/cart');
}
