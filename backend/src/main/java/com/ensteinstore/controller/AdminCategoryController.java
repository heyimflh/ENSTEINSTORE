package com.ensteinstore.controller;

import com.ensteinstore.dto.request.CategoryRequest;
import com.ensteinstore.dto.response.CategoryResponse;
import com.ensteinstore.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/admin/categories", "/admin/categories", "/api/api/admin/categories"})
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Categories", description = "Endpoints manajemen kategori produk untuk administrator Toko Enstein")
public class AdminCategoryController {

    private final CategoryService categoryService;

    public AdminCategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Daftar seluruh kategori admin", description = "Mengambil seluruh kategori (aktif maupun nonaktif) beserta jumlah produk riil di database.")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategoriesForAdmin());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detail kategori admin", description = "Mengambil data kategori berdasarkan UUID.")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable UUID id) {
        return ResponseEntity.ok(categoryService.getCategoryBySlugOrId(id.toString()));
    }

    @PostMapping
    @Operation(summary = "Membuat kategori baru", description = "Menambahkan kategori baru ke database dengan validasi keunikan nama dan slug.")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Memperbarui kategori", description = "Memperbarui informasi nama, slug, deskripsi, dan status aktif kategori.")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @Operation(summary = "Mengubah status aktif kategori", description = "Mengaktifkan atau menonaktifkan visibilitas kategori di katalog pelanggan.")
    public ResponseEntity<CategoryResponse> toggleCategoryStatus(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Boolean> body) {
        Boolean isActive = null;
        if (body != null) {
            if (body.containsKey("isActive")) {
                isActive = body.get("isActive");
            } else if (body.containsKey("active")) {
                isActive = body.get("active");
            } else if (body.containsKey("is_active")) {
                isActive = body.get("is_active");
            }
        }
        return ResponseEntity.ok(categoryService.toggleCategoryStatus(id, isActive));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Menonaktifkan kategori (Soft Delete)", description = "Menonaktifkan kategori dari katalog pelanggan.")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
