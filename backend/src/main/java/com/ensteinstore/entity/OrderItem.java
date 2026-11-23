package com.ensteinstore.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * OrderItem entity (PRD §13.4.10).
 * Stores point-in-time snapshot of product details (K4, 3NF historical snapshot).
 */
@Entity
@Table(name = "order_items", uniqueConstraints = {
        @UniqueConstraint(name = "uq_order_items_order_product", columnNames = {"order_id", "product_id"})
})
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "product_code", nullable = false, length = 30)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "unit_symbol", nullable = false, length = 20)
    private String unitSymbol;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "subtotal", nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public OrderItem() {
    }

    public OrderItem(Order order, Product product, BigDecimal quantity, BigDecimal unitPrice, BigDecimal subtotal) {
        this.order = order;
        this.product = product;
        this.productCode = product != null ? product.getProductCode() : null;
        this.productName = product != null ? product.getName() : null;
        this.unitSymbol = product != null && product.getUnit() != null ? product.getUnit().getUnitSymbol() : null;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
        this.createdAt = OffsetDateTime.now();
    }

    public OrderItem(Order order, Product product, String productCode, String productName,
                     String unitSymbol, BigDecimal quantity, BigDecimal unitPrice) {
        this.order = order;
        this.product = product;
        this.productCode = productCode;
        this.productName = productName;
        this.unitSymbol = unitSymbol;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = quantity != null && unitPrice != null ? quantity.multiply(unitPrice) : BigDecimal.ZERO;
        this.createdAt = OffsetDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (subtotal == null && quantity != null && unitPrice != null) {
            subtotal = quantity.multiply(unitPrice);
        }
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
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

    public String getUnitSymbol() {
        return unitSymbol;
    }

    public void setUnitSymbol(String unitSymbol) {
        this.unitSymbol = unitSymbol;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
