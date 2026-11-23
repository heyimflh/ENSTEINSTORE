package com.ensteinstore.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Product entity (PRD §13.4.6, K8, K9, Rule 4 BigDecimal, Rule 7 Stock Guard).
 * Stock mutation occurs EXCLUSIVELY via stock_movements trigger, so stockOnHand
 * and reservedQuantity are mapped with updatable = false to prevent direct Java updates.
 */
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "product_code", nullable = false, unique = true, length = 30)
    private String productCode;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    @Column(name = "price", nullable = false, precision = 14, scale = 2)
    private BigDecimal price;

    @Column(name = "stock_on_hand", nullable = false, precision = 12, scale = 3, updatable = false)
    private BigDecimal stockOnHand = BigDecimal.ZERO;

    @Column(name = "reserved_quantity", nullable = false, precision = 12, scale = 3, updatable = false)
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    @Column(name = "minimum_stock", nullable = false, precision = 12, scale = 3)
    private BigDecimal minimumStock = BigDecimal.ZERO;

    @Column(name = "image_url", length = 500)
    private String image;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public Product() {
    }

    public Product(String productCode, String name, String description, Category category, Unit unit,
                   BigDecimal price, BigDecimal minimumStock, String image, Boolean isFeatured) {
        this.productCode = productCode;
        this.name = name;
        this.description = description;
        this.category = category;
        this.unit = unit;
        this.price = price;
        this.stockOnHand = BigDecimal.ZERO;
        this.reservedQuantity = BigDecimal.ZERO;
        this.minimumStock = minimumStock != null ? minimumStock : BigDecimal.ZERO;
        this.image = image;
        this.isActive = true;
        this.isFeatured = isFeatured != null ? isFeatured : false;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = OffsetDateTime.now();
        if (stockOnHand == null) stockOnHand = BigDecimal.ZERO;
        if (reservedQuantity == null) reservedQuantity = BigDecimal.ZERO;
        if (minimumStock == null) minimumStock = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    /**
     * Available stock calculation: stockOnHand - reservedQuantity.
     */
    public BigDecimal getAvailableQuantity() {
        if (stockOnHand == null) return BigDecimal.ZERO;
        BigDecimal reserved = reservedQuantity != null ? reservedQuantity : BigDecimal.ZERO;
        return stockOnHand.subtract(reserved);
    }

    /**
     * Checks if available quantity is sufficient for requested quantity.
     */
    public boolean hasAvailableStock(BigDecimal requestedQty) {
        if (requestedQty == null || requestedQty.compareTo(BigDecimal.ZERO) <= 0) return false;
        return getAvailableQuantity().compareTo(requestedQty) >= 0;
    }

    /**
     * Checks if stock level is at or below minimum threshold.
     */
    public boolean isLowStock() {
        if (stockOnHand == null) return true;
        BigDecimal min = minimumStock != null ? minimumStock : BigDecimal.ZERO;
        return stockOnHand.compareTo(min) <= 0;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Unit getUnit() {
        return unit;
    }

    public void setUnit(Unit unit) {
        this.unit = unit;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getStockOnHand() {
        return stockOnHand;
    }

    public void setStockOnHand(BigDecimal stockOnHand) {
        this.stockOnHand = stockOnHand;
    }

    public BigDecimal getReservedQuantity() {
        return reservedQuantity;
    }

    public void setReservedQuantity(BigDecimal reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
    }

    public BigDecimal getMinimumStock() {
        return minimumStock;
    }

    public void setMinimumStock(BigDecimal minimumStock) {
        this.minimumStock = minimumStock;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsFeatured() {
        return isFeatured;
    }

    public void setIsFeatured(Boolean isFeatured) {
        this.isFeatured = isFeatured;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
