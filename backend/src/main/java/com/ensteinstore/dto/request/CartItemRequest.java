package com.ensteinstore.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public class CartItemRequest {

    @NotNull(message = "Product ID wajib diisi")
    private UUID productId;

    @NotNull(message = "Jumlah (quantity) wajib diisi")
    @DecimalMin(value = "0.001", message = "Jumlah minimal harus lebih besar dari 0")
    private BigDecimal quantity;

    public CartItemRequest() {
    }

    public CartItemRequest(UUID productId, BigDecimal quantity) {
        this.productId = productId;
        this.quantity = quantity;
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
}
