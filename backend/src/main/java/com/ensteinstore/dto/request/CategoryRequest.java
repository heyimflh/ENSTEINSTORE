package com.ensteinstore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CategoryRequest {

    @NotBlank(message = "Nama kategori wajib diisi")
    @Size(max = 100, message = "Nama kategori maksimal 100 karakter")
    private String name;

    private String slug;

    private String description;

    private Boolean isActive = true;

    public CategoryRequest() {
    }

    public CategoryRequest(String name, String slug, String description, Boolean isActive) {
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.isActive = isActive != null ? isActive : true;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
