package com.ensteinstore.dto.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class ProductResponse {

    private UUID id;
    private String code;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal stock;
    private BigDecimal stockOnHand;
    private BigDecimal reservedQuantity;
    private BigDecimal minimumStock;
    private String unit;
    private String unitSymbol;
    private boolean allowDecimal;
    private UUID categoryId;
    private String categoryName;
    private String categorySlug;
    private String image;
    private boolean available;
    private boolean isFeatured;
    private boolean isNew;
    private BigDecimal salesCount;
    private OffsetDateTime createdAt;

    public ProductResponse() {
    }

    public ProductResponse(UUID id, String code, String name, String description, BigDecimal price,
                           BigDecimal stock, BigDecimal stockOnHand, BigDecimal reservedQuantity,
                           BigDecimal minimumStock, String unit, String unitSymbol, boolean allowDecimal,
                           UUID categoryId, String categoryName, String categorySlug, String image,
                           boolean available, boolean isFeatured, boolean isNew, BigDecimal salesCount,
                           OffsetDateTime createdAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stock = stock;
        this.stockOnHand = stockOnHand;
        this.reservedQuantity = reservedQuantity;
        this.minimumStock = minimumStock;
        this.unit = unit;
        this.unitSymbol = unitSymbol;
        this.allowDecimal = allowDecimal;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.categorySlug = categorySlug;
        this.image = image;
        this.available = available;
        this.isFeatured = isFeatured;
        this.isNew = isNew;
        this.salesCount = salesCount != null ? salesCount : BigDecimal.ZERO;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getStock() {
        return stock;
    }

    public void setStock(BigDecimal stock) {
        this.stock = stock;
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

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getCategorySlug() {
        return categorySlug;
    }

    public void setCategorySlug(String categorySlug) {
        this.categorySlug = categorySlug;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public boolean isFeatured() {
        return isFeatured;
    }

    public void setFeatured(boolean featured) {
        isFeatured = featured;
    }

    public boolean isNew() {
        return isNew;
    }

    public void setNew(boolean aNew) {
        isNew = aNew;
    }

    public BigDecimal getSalesCount() {
        return salesCount;
    }

    public void setSalesCount(BigDecimal salesCount) {
        this.salesCount = salesCount;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static ProductResponse fromEntity(com.ensteinstore.entity.Product p) {
        if (p == null) return null;
        boolean isNew = p.getCreatedAt() != null && p.getCreatedAt().isAfter(OffsetDateTime.now().minusDays(14));
        boolean available = p.getAvailableQuantity() != null && p.getAvailableQuantity().compareTo(BigDecimal.ZERO) > 0;
        return new ProductResponse(
                p.getId(),
                p.getProductCode(),
                p.getName(),
                p.getDescription(),
                p.getPrice(),
                p.getAvailableQuantity(),
                p.getStockOnHand(),
                p.getReservedQuantity(),
                p.getMinimumStock(),
                p.getUnit() != null ? p.getUnit().getUnitName() : "",
                p.getUnit() != null ? p.getUnit().getUnitSymbol() : "",
                p.getUnit() != null && Boolean.TRUE.equals(p.getUnit().getAllowDecimal()),
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getCategory() != null ? p.getCategory().getName() : "",
                p.getCategory() != null ? p.getCategory().getSlug() : "",
                p.getImage(),
                available,
                Boolean.TRUE.equals(p.getIsFeatured()),
                isNew,
                BigDecimal.ZERO,
                p.getCreatedAt()
        );
    }
}
