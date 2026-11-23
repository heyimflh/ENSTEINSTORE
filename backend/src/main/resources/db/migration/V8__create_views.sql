-- ============================================================
-- V8: Create Database Views
-- PRD §13.6 — Reporting & Analytics Views
-- K13: All periods use Asia/Jakarta timezone, orders.order_date
--      "SOLD" = payment_status='PAID' AND order_status<>'CANCELLED'
-- ============================================================

-- ============================================================
-- VIEW: v_sales_report
-- Daily/monthly aggregated sales for admin reports (PRD §18.2)
-- ============================================================
CREATE OR REPLACE VIEW v_sales_report AS
SELECT
    DATE_TRUNC('day', (o.order_date AT TIME ZONE 'Asia/Jakarta')) AS sale_date,
    DATE_TRUNC('month', (o.order_date AT TIME ZONE 'Asia/Jakarta')) AS sale_month,
    COUNT(DISTINCT o.id)                AS total_orders,
    SUM(o.total_amount)                 AS total_revenue,
    SUM(o.subtotal)                     AS total_subtotal,
    SUM(o.delivery_fee)                 AS total_delivery_fee,
    COUNT(DISTINCT o.customer_id)       AS unique_customers
FROM orders o
WHERE
    o.payment_status = 'PAID'
    AND o.order_status <> 'CANCELLED'
GROUP BY
    DATE_TRUNC('day', (o.order_date AT TIME ZONE 'Asia/Jakarta')),
    DATE_TRUNC('month', (o.order_date AT TIME ZONE 'Asia/Jakarta'));

-- ============================================================
-- VIEW: v_product_sales
-- Per-product sales totals (for salesCount / "terpopuler", K8)
-- ============================================================
CREATE OR REPLACE VIEW v_product_sales AS
SELECT
    oi.product_id,
    SUM(oi.quantity)        AS total_quantity_sold,
    SUM(oi.subtotal)        AS total_revenue,
    COUNT(DISTINCT o.id)    AS total_orders
FROM order_items oi
INNER JOIN orders o ON o.id = oi.order_id
WHERE
    o.payment_status = 'PAID'
    AND o.order_status <> 'CANCELLED'
GROUP BY oi.product_id;

-- ============================================================
-- VIEW: v_stock_status
-- Current stock status for all active products
-- Low stock = stock_on_hand <= minimum_stock
-- ============================================================
CREATE OR REPLACE VIEW v_stock_status AS
SELECT
    p.id                                                AS product_id,
    p.product_code,
    p.name                                              AS product_name,
    c.name                                              AS category_name,
    u.unit_symbol,
    p.stock_on_hand,
    p.reserved_quantity,
    (p.stock_on_hand - p.reserved_quantity)             AS available_quantity,
    p.minimum_stock,
    CASE
        WHEN p.stock_on_hand <= p.minimum_stock THEN TRUE
        ELSE FALSE
    END                                                 AS is_low_stock,
    p.is_active
FROM products p
INNER JOIN categories c ON c.id = p.category_id
INNER JOIN units u ON u.id = p.unit_id;

-- ============================================================
-- VIEW: v_best_selling
-- Top selling products for dashboard widget
-- ============================================================
CREATE OR REPLACE VIEW v_best_selling AS
SELECT
    p.id                            AS product_id,
    p.product_code,
    p.name                          AS product_name,
    p.image_url,
    c.name                          AS category_name,
    COALESCE(ps.total_quantity_sold, 0)  AS total_quantity_sold,
    COALESCE(ps.total_revenue, 0)        AS total_revenue,
    COALESCE(ps.total_orders, 0)         AS total_orders
FROM products p
INNER JOIN categories c ON c.id = p.category_id
LEFT JOIN v_product_sales ps ON ps.product_id = p.id
WHERE p.is_active = TRUE
ORDER BY total_quantity_sold DESC;
