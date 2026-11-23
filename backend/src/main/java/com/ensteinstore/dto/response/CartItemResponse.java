package com.ensteinstore.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public class CartItemResponse {

    private UUID id;
    private UUID productId;
    private String productCode;
    private String name;
    private String image;
    private BigDecimal price;
    private BigDecimal quantity;
    private String unit;
    private String unitSymbol;
    private boolean allowDecimal;
    private BigDecimal subtotal;
    private BigDecimal availableStock;
    private boolean available;

    public CartItemResponse() {
    }

    public CartItemResponse(UUID id, UUID productId, String productCode, String name, String image,
                            BigDecimal price, BigDecimal quantity, String unit, String unitSymbol,
                            boolean allowDecimal, BigDecimal subtotal, BigDecimal availableStock, boolean available) {
        this.id = id;
        this.productId = productId;
        this.productCode = productCode;
        this.name = name;
        this.image = image;
        this.price = price;
        this.quantity = quantity;
        this.unit = unit;
        this.unitSymbol = unitSymbol;
        this.allowDecimal = allowDecimal;
        this.subtotal = subtotal;
        this.availableStock = availableStock;
        this.available = available;
    }

    // Getters and Setters
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getUnitSymbol() {
        return unitSymbol;
    }

    public void setUnitSymbol(String unitSymbol) {
        this.unitSymbol = unitSymbol;
    }

    public boolean isAllowDecimal() {
        return allowDecimal;
    }

    public void setAllowDecimal(boolean allowDecimal) {
        this.allowDecimal = allowDecimal;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getAvailableStock() {
        return availableStock;
    }

    public void setAvailableStock(BigDecimal availableStock) {
        this.availableStock = availableStock;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}
