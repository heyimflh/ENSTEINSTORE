export type UnitType = 'meter' | 'pcs' | 'roll';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  itemCount: number;
  imageUrl?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  unit: UnitType;
  allowDecimal: boolean;
  stockOnHand: number;
  reservedQuantity: number;
  minimumStock: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  rating?: number;
  salesCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'CUSTOMER' | 'ADMIN';
  avatarUrl?: string;
}

export type PageUIState = 'SUCCESS' | 'LOADING' | 'EMPTY' | 'ERROR';
