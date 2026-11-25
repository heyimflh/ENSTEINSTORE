package com.ensteinstore.dto.response;

import java.util.UUID;

public class CategoryResponse {

    private UUID id;
    private String name;
    private String slug;
    private String description;
    private long productCount;
    private Boolean isActive = true;

    public CategoryResponse() {
    }

    public CategoryResponse(UUID id, String name, String slug, String description, long productCount) {
        this(id, name, slug, description, productCount, true);
    }

    public CategoryResponse(UUID id, String name, String slug, String description, long productCount, Boolean isActive) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.productCount = productCount;
        this.isActive = isActive != null ? isActive : true;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public long getProductCount() {
        return productCount;
    }

    public void setProductCount(long productCount) {
        this.productCount = productCount;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
