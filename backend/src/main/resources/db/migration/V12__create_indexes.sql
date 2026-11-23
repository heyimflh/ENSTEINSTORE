-- ============================================================
-- V12: Create Additional Indexes
-- PRD §13.8 — Performance Optimization
-- ============================================================

-- ============================================================
-- Full-text search indexes
-- ============================================================
-- Product name full-text search (Bahasa Indonesia)
-- Note: idx_products_name GIN index already created in V3
-- Additional B-tree for exact/prefix matching
CREATE INDEX IF NOT EXISTS idx_products_name_btree ON products(name);

-- ============================================================
-- Foreign key support indexes
-- (PostgreSQL does not auto-create FK indexes)
-- ============================================================

-- orders FK indexes (some already in V5)
CREATE INDEX IF NOT EXISTS idx_orders_payment_method  ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_deadline ON orders(payment_deadline);

-- payments FK
CREATE INDEX IF NOT EXISTS idx_payments_verified_by  ON payments(verified_by_admin_id);

-- stock_movements extra
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON stock_movements(created_by_id);

-- ============================================================
-- Composite indexes for common query patterns
-- ============================================================

-- Products catalog: active + featured for homepage
CREATE INDEX IF NOT EXISTS idx_products_active_featured
    ON products(is_active, is_featured)
    WHERE is_active = TRUE;

-- Products catalog: active + category (category filter)
CREATE INDEX IF NOT EXISTS idx_products_active_category
    ON products(is_active, category_id)
    WHERE is_active = TRUE;

-- Orders: customer + status (order history page)
CREATE INDEX IF NOT EXISTS idx_orders_customer_status
    ON orders(customer_id, order_status);

-- Orders: admin + order_date (admin order management)
CREATE INDEX IF NOT EXISTS idx_orders_date_type
    ON orders(order_date DESC, order_type);

-- Stock movements: product + date (inventory timeline)
CREATE INDEX IF NOT EXISTS idx_movements_product_date
    ON stock_movements(product_id, created_at DESC);

-- Revoked tokens cleanup
-- idx_revoked_tokens_expires already in V1
