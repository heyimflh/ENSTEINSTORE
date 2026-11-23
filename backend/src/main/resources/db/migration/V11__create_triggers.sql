-- ============================================================
-- V11: Create Database Triggers
-- PRD §13.7 — Business Logic Triggers
-- RULE (AGENTS.md §2.7): stock_movements is the ONLY way to mutate stock
-- ============================================================

-- ============================================================
-- TRIGGER FUNCTION: fn_apply_stock_movement()
-- Called AFTER INSERT on stock_movements
-- Updates products.stock_on_hand and reserved_quantity
-- This is the single choke point for all stock mutations
-- ============================================================
CREATE OR REPLACE FUNCTION fn_apply_stock_movement()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    CASE NEW.movement_type
        WHEN 'STOCK_IN' THEN
            -- Increase stock_on_hand
            UPDATE products
            SET stock_on_hand = stock_on_hand + NEW.quantity
            WHERE id = NEW.product_id;

        WHEN 'SALE' THEN
            -- Decrease both stock_on_hand and reserved_quantity (fulfillment)
            -- Used for OFFLINE sales (immediate deduction, no reservation)
            UPDATE products
            SET stock_on_hand = stock_on_hand - NEW.quantity
            WHERE id = NEW.product_id;

        WHEN 'FULFILLMENT' THEN
            -- Convert reservation to actual sale
            -- Decreases stock_on_hand AND reserved_quantity by the same amount
            UPDATE products
            SET
                stock_on_hand     = stock_on_hand - NEW.quantity,
                reserved_quantity = reserved_quantity - NEW.quantity
            WHERE id = NEW.product_id;

        WHEN 'RESERVE' THEN
            -- Increase reserved_quantity (checkout initiated)
            UPDATE products
            SET reserved_quantity = reserved_quantity + NEW.quantity
            WHERE id = NEW.product_id;

        WHEN 'UNRESERVE' THEN
            -- Decrease reserved_quantity (order cancelled before payment)
            UPDATE products
            SET reserved_quantity = reserved_quantity - NEW.quantity
            WHERE id = NEW.product_id;

        WHEN 'RETURN' THEN
            -- Increase stock_on_hand (product returned)
            UPDATE products
            SET stock_on_hand = stock_on_hand + NEW.quantity
            WHERE id = NEW.product_id;

        WHEN 'ADJUSTMENT' THEN
            -- Set stock_on_hand to the absolute new value (stock_after)
            UPDATE products
            SET stock_on_hand = NEW.stock_after
            WHERE id = NEW.product_id;

        ELSE
            RAISE EXCEPTION 'Unknown movement_type: %', NEW.movement_type;
    END CASE;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_stock_movement
    AFTER INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION fn_apply_stock_movement();

-- ============================================================
-- TRIGGER FUNCTION: fn_guard_product_stock()
-- Called AFTER UPDATE on products
-- Prevents stock from going negative or reserved > stock
-- Additional safety net; Java should prevent this via PESSIMISTIC_WRITE
-- ============================================================
CREATE OR REPLACE FUNCTION fn_guard_product_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.stock_on_hand < 0 THEN
        RAISE EXCEPTION 'Stock on hand cannot be negative for product %. Got: %',
            NEW.product_code, NEW.stock_on_hand;
    END IF;

    IF NEW.reserved_quantity < 0 THEN
        RAISE EXCEPTION 'Reserved quantity cannot be negative for product %. Got: %',
            NEW.product_code, NEW.reserved_quantity;
    END IF;

    IF NEW.reserved_quantity > NEW.stock_on_hand THEN
        RAISE EXCEPTION 'Reserved quantity (%) exceeds stock on hand (%) for product %',
            NEW.reserved_quantity, NEW.stock_on_hand, NEW.product_code;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_product_stock
    AFTER UPDATE OF stock_on_hand, reserved_quantity ON products
    FOR EACH ROW EXECUTE FUNCTION fn_guard_product_stock();

-- ============================================================
-- TRIGGER FUNCTION: fn_prevent_movement_mutation()
-- Prevents UPDATE and DELETE on stock_movements (append-only audit log)
-- PRD §12.4.6 — Immutable movement records
-- ============================================================
CREATE OR REPLACE FUNCTION fn_prevent_movement_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'stock_movements records are immutable. UPDATE and DELETE are not allowed. Create a corrective ADJUSTMENT movement instead.';
END;
$$;

CREATE TRIGGER trg_prevent_movement_mutation
    BEFORE UPDATE OR DELETE ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_movement_mutation();

-- ============================================================
-- TRIGGER FUNCTION: fn_validate_order_items_subtotal()
-- Ensures order_items.subtotal = quantity * unit_price
-- ============================================================
CREATE OR REPLACE FUNCTION fn_validate_order_items_subtotal()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.subtotal <> ROUND(NEW.quantity * NEW.unit_price, 2) THEN
        RAISE EXCEPTION 'order_items.subtotal (%) must equal quantity (%) * unit_price (%) = %',
            NEW.subtotal,
            NEW.quantity,
            NEW.unit_price,
            ROUND(NEW.quantity * NEW.unit_price, 2);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_order_item_subtotal
    BEFORE INSERT OR UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION fn_validate_order_items_subtotal();
