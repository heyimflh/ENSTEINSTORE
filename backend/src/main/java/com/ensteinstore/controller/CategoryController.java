package com.ensteinstore.controller;

import com.ensteinstore.dto.response.CategoryResponse;
import com.ensteinstore.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/categories", "/categories"})
@Tag(name = "Categories", description = "Endpoints kategori produk Toko Enstein")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Daftar seluruh kategori", description = "Mengambil seluruh kategori aktif lengkap dengan jumlah produk")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/{slugOrId}")
    @Operation(summary = "Detail kategori", description = "Mencari detail kategori berdasarkan slug atau UUID")
    public ResponseEntity<CategoryResponse> getCategoryBySlugOrId(
            @Parameter(description = "Slug atau UUID kategori") @PathVariable String slugOrId) {
        return ResponseEntity.ok(categoryService.getCategoryBySlugOrId(slugOrId));
    }
}
