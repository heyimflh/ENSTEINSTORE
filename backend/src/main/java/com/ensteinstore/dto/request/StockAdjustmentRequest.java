package com.ensteinstore.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class StockAdjustmentRequest {

    @NotNull(message = "ID produk wajib diisi.")
    private UUID productId;

    @NotNull(message = "Stok fisik baru wajib diisi.")
    @DecimalMin(value = "0.0", message = "Stok fisik baru tidak boleh negatif.")
    private BigDecimal newActualStock;

    private String notes;

    public StockAdjustmentRequest() {
    }

    public StockAdjustmentRequest(UUID productId, BigDecimal newActualStock, String notes) {
        this.productId = productId;
        this.newActualStock = newActualStock;
        this.notes = notes;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public BigDecimal getNewActualStock() {
        return newActualStock;
    }

    public void setNewActualStock(BigDecimal newActualStock) {
        this.newActualStock = newActualStock;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
