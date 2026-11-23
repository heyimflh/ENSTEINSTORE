package com.ensteinstore.entity;

import com.ensteinstore.entity.enums.StockMovementType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * StockMovement entity (PRD §13.4.12, §12.2, AGENTS.md Rule 7).
 * Single choke point for all stock mutations.
 * Append-only audit trail (no updated_at).
 */
@Entity
@Table(name = "stock_movements")
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 20)
    private StockMovementType movementType;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "stock_before", nullable = false, precision = 12, scale = 3)
    private BigDecimal stockBefore;

    @Column(name = "stock_after", nullable = false, precision = 12, scale = 3)
    private BigDecimal stockAfter;

    @Column(name = "reserved_before", nullable = false, precision = 12, scale = 3)
    private BigDecimal reservedBefore;

    @Column(name = "reserved_after", nullable = false, precision = 12, scale = 3)
    private BigDecimal reservedAfter;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "reference_type", length = 20)
    private String referenceType;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public StockMovement() {
    }

    public StockMovement(Product product, StockMovementType movementType, BigDecimal quantity,
                         BigDecimal stockBefore, BigDecimal stockAfter,
                         BigDecimal reservedBefore, BigDecimal reservedAfter,
                         UUID referenceId, String referenceType, String notes, User createdBy) {
        this.product = product;
        this.movementType = movementType;
        this.quantity = quantity;
        this.stockBefore = stockBefore;
        this.stockAfter = stockAfter;
        this.reservedBefore = reservedBefore;
        this.reservedAfter = reservedAfter;
        this.referenceId = referenceId;
        this.referenceType = referenceType;
        this.notes = notes;
        this.createdBy = createdBy;
        this.createdAt = OffsetDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public StockMovementType getMovementType() {
        return movementType;
    }

    public void setMovementType(StockMovementType movementType) {
        this.movementType = movementType;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getStockBefore() {
        return stockBefore;
    }

    public void setStockBefore(BigDecimal stockBefore) {
        this.stockBefore = stockBefore;
    }

    public BigDecimal getStockAfter() {
        return stockAfter;
    }

    public void setStockAfter(BigDecimal stockAfter) {
        this.stockAfter = stockAfter;
    }

    public BigDecimal getReservedBefore() {
        return reservedBefore;
    }

    public void setReservedBefore(BigDecimal reservedBefore) {
        this.reservedBefore = reservedBefore;
    }

    public BigDecimal getReservedAfter() {
        return reservedAfter;
    }

    public void setReservedAfter(BigDecimal reservedAfter) {
        this.reservedAfter = reservedAfter;
    }

    public UUID getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(UUID referenceId) {
        this.referenceId = referenceId;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
