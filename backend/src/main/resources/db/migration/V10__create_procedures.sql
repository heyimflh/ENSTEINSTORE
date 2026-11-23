-- ============================================================
-- V10: Create Stored Procedures
-- PRD §13.7 — Business Logic Procedures
-- ============================================================

-- ============================================================
-- PROCEDURE: sp_record_stock_in(...)
-- Records a STOCK_IN movement when admin adds inventory
-- This is the entry point for all manual stock additions
-- RULE: Backend Java calls this, never updates products directly
-- ============================================================
CREATE OR REPLACE PROCEDURE sp_record_stock_in(
    p_product_id    UUID,
    p_quantity      NUMERIC(12,3),
    p_notes         TEXT,
    p_created_by_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock_before      NUMERIC(12,3);
    v_reserved_before   NUMERIC(12,3);
BEGIN
    -- Lock the product row to prevent concurrent modifications
    SELECT stock_on_hand, reserved_quantity
    INTO v_stock_before, v_reserved_before
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;

    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Stock quantity must be positive, got: %', p_quantity;
    END IF;

    -- Insert the stock movement; trigger will update products table
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        reserved_before,
        reserved_after,
        notes,
        created_by_id,
        reference_type
    ) VALUES (
        p_product_id,
        'STOCK_IN',
        p_quantity,
        v_stock_before,
        v_stock_before + p_quantity,
        v_reserved_before,
        v_reserved_before,
        p_notes,
        p_created_by_id,
        'ADJUSTMENT'
    );
END;
$$;

-- ============================================================
-- PROCEDURE: sp_adjust_stock(...)
-- Records an ADJUSTMENT movement (manual correction by admin)
-- p_new_quantity = absolute new stock_on_hand value
-- ============================================================
CREATE OR REPLACE PROCEDURE sp_adjust_stock(
    p_product_id    UUID,
    p_new_quantity  NUMERIC(12,3),
    p_notes         TEXT,
    p_created_by_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock_before      NUMERIC(12,3);
    v_reserved_before   NUMERIC(12,3);
    v_delta             NUMERIC(12,3);
BEGIN
    SELECT stock_on_hand, reserved_quantity
    INTO v_stock_before, v_reserved_before
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;

    IF p_new_quantity < 0 THEN
        RAISE EXCEPTION 'New stock quantity cannot be negative: %', p_new_quantity;
    END IF;

    IF p_new_quantity < v_reserved_before THEN
        RAISE EXCEPTION 'New stock (%) cannot be less than reserved quantity (%)',
            p_new_quantity, v_reserved_before;
    END IF;

    v_delta := ABS(p_new_quantity - v_stock_before);

    IF v_delta = 0 THEN
        RETURN; -- No change needed
    END IF;

    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        reserved_before,
        reserved_after,
        notes,
        created_by_id,
        reference_type
    ) VALUES (
        p_product_id,
        'ADJUSTMENT',
        v_delta,
        v_stock_before,
        p_new_quantity,
        v_reserved_before,
        v_reserved_before,
        COALESCE(p_notes, 'Manual stock adjustment'),
        p_created_by_id,
        'ADJUSTMENT'
    );
END;
$$;
