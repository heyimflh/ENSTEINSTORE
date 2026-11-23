package com.ensteinstore.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class StockInRequest {

    @NotNull(message = "ID produk wajib diisi.")
    private UUID productId;

    @NotNull(message = "Jumlah stok masuk wajib diisi.")
    @DecimalMin(value = "0.01", message = "Jumlah stok masuk harus lebih besar dari 0.")
    private BigDecimal quantity;

    private String notes;

    public StockInRequest() {
    }

    public StockInRequest(UUID productId, BigDecimal quantity, String notes) {
        this.productId = productId;
        this.quantity = quantity;
        this.notes = notes;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
