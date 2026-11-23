-- ============================================================
-- V9: Create Database Functions
-- PRD §13.7 — Business Logic Functions
-- ============================================================

-- ============================================================
-- FUNCTION: fn_generate_order_number(p_date DATE)
-- Atomically generates unique order number for a given date
-- Format: EST-YYYYMMDD-XXXX (zero-padded 4 digits)
-- Uses INSERT ... ON CONFLICT DO UPDATE ... RETURNING for atomicity
-- K9: Anti-race condition for order numbering
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generate_order_number(p_date DATE)
RETURNS VARCHAR(25)
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_value INTEGER;
    v_order_number VARCHAR(25);
BEGIN
    INSERT INTO order_number_counters(order_date, last_value)
    VALUES (p_date, 1)
    ON CONFLICT (order_date)
    DO UPDATE SET last_value = order_number_counters.last_value + 1
    RETURNING last_value INTO v_next_value;

    v_order_number := 'EST-' || TO_CHAR(p_date, 'YYYYMMDD') || '-' || LPAD(v_next_value::TEXT, 4, '0');
    RETURN v_order_number;
END;
$$;

-- ============================================================
-- FUNCTION: fn_order_total(p_order_id UUID)
-- Calculates and returns the total amount for an order
-- (subtotal from order_items + delivery_fee from orders)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_order_total(p_order_id UUID)
RETURNS NUMERIC(14,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_subtotal      NUMERIC(14,2);
    v_delivery_fee  NUMERIC(14,2);
BEGIN
    SELECT
        COALESCE(SUM(subtotal), 0),
        o.delivery_fee
    INTO v_subtotal, v_delivery_fee
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE oi.order_id = p_order_id
    GROUP BY o.delivery_fee;

    RETURN COALESCE(v_subtotal, 0) + COALESCE(v_delivery_fee, 0);
END;
$$;

-- ============================================================
-- FUNCTION: fn_get_available_stock(p_product_id UUID)
-- Returns available (uncommitted) stock for a product
-- available = stock_on_hand - reserved_quantity
-- ============================================================
CREATE OR REPLACE FUNCTION fn_get_available_stock(p_product_id UUID)
RETURNS NUMERIC(12,3)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_available NUMERIC(12,3);
BEGIN
    SELECT (stock_on_hand - reserved_quantity)
    INTO v_available
    FROM products
    WHERE id = p_product_id;

    RETURN COALESCE(v_available, 0);
END;
$$;
