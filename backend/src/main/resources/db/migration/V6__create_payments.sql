-- ============================================================
-- V6: Create Payments Table
-- PRD §13.4.11 — Payment Domain
-- BR-05: One payment per order (UNIQUE constraint)
-- K3: payment_method enum mapping
-- K11: proof_of_payment_url for file upload
-- ============================================================

CREATE TABLE payments (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID            NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    payment_method          VARCHAR(20)     NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'E_WALLET', 'SIMULATED', 'CASH')),
    status                  VARCHAR(25)     NOT NULL DEFAULT 'PENDING'
                                            CHECK (status IN (
                                                'PENDING',
                                                'WAITING_VERIFICATION',
                                                'PAID',
                                                'REJECTED',
                                                'EXPIRED'
                                            )),
    amount                  NUMERIC(14,2)   NOT NULL CHECK (amount >= 0),
    proof_of_payment_url    VARCHAR(500),
    submitted_at            TIMESTAMPTZ,
    verified_at             TIMESTAMPTZ,
    verified_by_admin_id    UUID            REFERENCES admins(id),
    rejection_reason        TEXT,
    simulation_outcome      VARCHAR(10)     CHECK (simulation_outcome IN ('SUCCESS', 'FAILED')),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id  ON payments(order_id);
CREATE INDEX idx_payments_status    ON payments(status);
CREATE INDEX idx_payments_method    ON payments(payment_method);

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
