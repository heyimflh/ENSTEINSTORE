package com.ensteinstore.dto.response;

import com.ensteinstore.entity.StockMovement;
import com.ensteinstore.entity.enums.StockMovementType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class StockMovementResponse {

    private UUID id;
    private UUID productId;
    private String productCode;
    private String productName;
    private StockMovementType movementType;
    private BigDecimal quantity;
    private BigDecimal stockBefore;
    private BigDecimal stockAfter;
    private BigDecimal reservedBefore;
    private BigDecimal reservedAfter;
    private UUID referenceId;
    private String referenceType;
    private String notes;
    private String createdByName;
    private OffsetDateTime createdAt;

    public StockMovementResponse() {
    }

    public static StockMovementResponse fromEntity(StockMovement movement) {
        if (movement == null) return null;

        StockMovementResponse res = new StockMovementResponse();
        res.setId(movement.getId());
        if (movement.getProduct() != null) {
            res.setProductId(movement.getProduct().getId());
            res.setProductCode(movement.getProduct().getProductCode());
            res.setProductName(movement.getProduct().getName());
        }
        res.setMovementType(movement.getMovementType());
        res.setQuantity(movement.getQuantity());
        res.setStockBefore(movement.getStockBefore());
        res.setStockAfter(movement.getStockAfter());
        res.setReservedBefore(movement.getReservedBefore());
        res.setReservedAfter(movement.getReservedAfter());
        res.setReferenceId(movement.getReferenceId());
        res.setReferenceType(movement.getReferenceType());
        res.setNotes(movement.getNotes());
        if (movement.getCreatedBy() != null) {
            res.setCreatedByName(movement.getCreatedBy().getFullName());
        }
        res.setCreatedAt(movement.getCreatedAt());
        return res;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
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

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
