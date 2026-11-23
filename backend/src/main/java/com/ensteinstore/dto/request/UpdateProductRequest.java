package com.ensteinstore.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public class UpdateProductRequest {

    @NotBlank(message = "Nama produk wajib diisi")
    private String name;

    private String description;

    @NotNull(message = "Kategori wajib dipilih")
    private UUID categoryId;

    @NotNull(message = "Satuan wajib dipilih")
    private UUID unitId;

    @NotNull(message = "Harga wajib diisi")
    @DecimalMin(value = "0.0", message = "Harga tidak boleh negatif")
    private BigDecimal price;

    @NotNull(message = "Batas stok minimum wajib diisi")
    @DecimalMin(value = "0.0", message = "Batas stok minimum tidak boleh negatif")
    private BigDecimal minimumStock;

    private String image;
    private Boolean isFeatured;
    private Boolean isActive;

    public UpdateProductRequest() {
    }

    public UpdateProductRequest(String name, String description, UUID categoryId, UUID unitId,
                                BigDecimal price, BigDecimal minimumStock, String image,
                                Boolean isFeatured, Boolean isActive) {
        this.name = name;
        this.description = description;
        this.categoryId = categoryId;
        this.unitId = unitId;
        this.price = price;
        this.minimumStock = minimumStock;
        this.image = image;
        this.isFeatured = isFeatured;
        this.isActive = isActive;
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

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
    }

    public UUID getUnitId() {
        return unitId;
    }

    public void setUnitId(UUID unitId) {
        this.unitId = unitId;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
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

    public Boolean getIsFeatured() {
        return isFeatured;
    }

    public void setIsFeatured(Boolean isFeatured) {
        this.isFeatured = isFeatured;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
