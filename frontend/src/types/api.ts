/**
 * ENSTEINSTORE — Backend DTO Types (mirrors Java response classes)
 * All types map 1-to-1 with backend JSON responses (camelCase).
 */

// ─── Pagination ──────────────────────────────────────────────────────────────
export interface PagedResponse<T> {
  content: T[];
  page: number;        // 0-based current page index
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  phone?: string;
  address?: string;
  city?: string;
}

export interface AuthResponse {
  token: string;
  expiresIn?: number;
  type?: string;
  user?: UserSummary;
  userId?: string;
  email?: string;
  role?: 'CUSTOMER' | 'ADMIN';
  name?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN';
  address?: string;
  city?: string;
  createdAt?: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
  address?: string;
  city?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  createdAt?: string;
}

// ─── Unit ────────────────────────────────────────────────────────────────────
export interface UnitResponse {
  id: string;
  unitName: string;
  unitSymbol: string;
  allowDecimal: boolean;
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface ProductResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  stockOnHand: number;
  reservedQuantity: number;
  minimumStock: number;
  unit: string;
  unitSymbol: string;
  allowDecimal: boolean;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  image: string;
  available: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  new?: boolean;
  isNew?: boolean;
  salesCount: number;
  createdAt: string;
}

export interface CreateProductRequest {
  code: string;
  name: string;
  description: string;
  price: number;
  minimumStock: number;
  categoryId: string;
  unitId: string;
  image?: string;
  isFeatured?: boolean;
  isNew?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  isActive?: boolean;
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export interface CartItemResponse {
  id: string;
  productId: string;
  productCode: string;
  name: string;
  productName?: string;
  image: string;
  price: number;
  priceAtAdd?: number;
  unitPrice?: number;
  quantity: number;
  unit: string;
  unitSymbol?: string;
  unitName?: string;
  allowDecimal: boolean;
  subtotal: number;
  availableStock: number;
  stockAvailable?: number;
  available?: boolean;
}

export interface CartResponse {
  id?: string;
  cartId?: string;
  items: CartItemResponse[];
  totalItems: number;
  subtotal: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// ─── Checkout ────────────────────────────────────────────────────────────────
export type FulfillmentMethod = 'DELIVERY' | 'PICKUP';
export type PaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'SIMULATED' | 'E_WALLET';

export interface CheckoutRequest {
  recipientName: string;
  recipientPhone: string;
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  notes?: string;
}

export interface CheckoutResponse {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfillmentMethod: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentDeadline?: string;
  items?: OrderItemResponse[];
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'READY'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItemResponse {
  id: string;
  productId: string;
  productCode: string;
  name: string;
  productName?: string;
  image: string;
  productImageUrl?: string;
  imageUrl?: string;
  price: number;
  unitPrice?: number;
  priceAtOrder?: number;
  quantity: number;
  unit: string;
  unitSymbol?: string;
  unitName?: string;
  subtotal: number;
}

export interface OrderSummaryResponse {
  id: string;
  orderNumber: string;
  orderType: string;
  orderStatus: OrderStatus;
  fulfillmentMethod: string;
  totalAmount: number;
  orderDate: string;
  recipientName: string;
  paymentStatus: string;
}

export interface OrderDetailResponse {
  id: string;
  orderNumber: string;
  orderType: string;
  orderStatus: OrderStatus;
  fulfillmentMethod: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress?: string;
  orderDate: string;
  paymentDeadline?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  notes?: string;
  items: OrderItemResponse[];
  payment?: PaymentResponse;
}

export interface UpdateOrderStatusRequest {
  orderStatus: OrderStatus;
  status?: OrderStatus;
  notes?: string;
}

export interface CancelOrderRequest {
  reason?: string;
  cancellationReason?: string;
}

// ─── Payment ─────────────────────────────────────────────────────────────────
export type PaymentStatus =
  | 'PENDING'
  | 'UNPAID'
  | 'WAITING_VERIFICATION'
  | 'PAID'
  | 'EXPIRED'
  | 'REJECTED';

export interface PaymentResponse {
  id: string;
  paymentMethod: string;
  status: PaymentStatus;
  amount: number;
  proofOfPaymentUrl?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface VerifyPaymentRequest {
  approve: boolean;
  rejectionReason?: string;
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export interface StockMovementResponse {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  movementType: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reservedBefore: number;
  reservedAfter: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  createdByName: string;
  createdAt: string;
}

export interface StockInRequest {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface StockAdjustmentRequest {
  productId: string;
  newActualStock?: number;
  newQuantity?: number;
  notes?: string;
  reason?: string;
}

// ─── Offline Sales ───────────────────────────────────────────────────────────
export interface OfflineSaleItemRequest {
  productId: string;
  quantity: number;
}

export interface OfflineSaleRequest {
  customerName?: string;
  customerPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  items: OfflineSaleItemRequest[];
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardSalesStats {
  totalRevenue: number;
  totalOrders: number;
  paidOrders?: number;
  averageOrderValue?: number;
  pendingOrders?: number;
  completedOrders?: number;
  revenueToday?: number;
  ordersToday?: number;
}

export interface DashboardStockStats {
  totalProducts: number;
  inStockProducts?: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue?: number;
}

export interface DashboardSummaryResponse {
  sales: DashboardSalesStats;
  stock: DashboardStockStats;
  recentOrders: OrderSummaryResponse[];
}

// ─── Store Configuration ─────────────────────────────────────────────────────
export interface BankAccountInfo {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
}

export interface EWalletInfo {
  walletName: string;
  walletCode: string;
  accountNumber: string;
  accountHolder: string;
  qrCodeUrl?: string;
}

export interface StoreConfigResponse {
  storeName: string;
  owner: string;
  tagline: string;
  subtagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  deliveryFee: number;
  paymentExpiryHours: number;
  simulationEnabled: boolean;
  maxUploadBytes: number;
  bankAccounts?: BankAccountInfo[];
  ewallets?: EWalletInfo[];
}
