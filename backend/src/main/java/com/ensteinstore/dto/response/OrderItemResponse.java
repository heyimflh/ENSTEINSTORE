package com.ensteinstore.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public class OrderItemResponse {

    private UUID id;
    private UUID productId;
    private String productCode;
    private String name;
    private String image;
    private BigDecimal price;
    private BigDecimal quantity;
    private String unit;
    private String unitSymbol;
    private BigDecimal subtotal;

    public OrderItemResponse() {
    }

    public OrderItemResponse(UUID id, UUID productId, String productCode, String name, String image,
                             BigDecimal price, BigDecimal quantity, String unit, String unitSymbol, BigDecimal subtotal) {
        this.id = id;
        this.productId = productId;
        this.productCode = productCode;
        this.name = name;
        this.image = image;
        this.price = price;
        this.quantity = quantity;
        this.unit = unit;
        this.unitSymbol = unitSymbol;
        this.subtotal = subtotal;
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

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}
