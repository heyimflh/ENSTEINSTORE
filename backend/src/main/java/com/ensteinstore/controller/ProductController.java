package com.ensteinstore.controller;

import com.ensteinstore.dto.response.PagedResponse;
import com.ensteinstore.dto.response.ProductResponse;
import com.ensteinstore.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Products", description = "Endpoints katalog produk publik Toko Enstein")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Pencarian dan katalog produk",
               description = "Mendukung pencarian kata kunci, filter kategori, produk unggulan, produk baru, pengurutan, dan paginasi.")
    public ResponseEntity<PagedResponse<ProductResponse>> getProducts(
            @Parameter(description = "Kata kunci pencarian nama atau kode produk") @RequestParam(required = false) String query,
            @Parameter(description = "Filter berdasarkan UUID kategori") @RequestParam(required = false) UUID categoryId,
            @Parameter(description = "Filter berdasarkan slug kategori") @RequestParam(required = false) String categorySlug,
            @Parameter(description = "Filter produk unggulan") @RequestParam(required = false) Boolean featured,
            @Parameter(description = "Filter produk baru") @RequestParam(required = false) Boolean isNew,
            @Parameter(description = "Pengurutan: terbaru, harga-rendah, harga-tinggi, terpopuler") @RequestParam(required = false, defaultValue = "terbaru") String sort,
            @Parameter(description = "Nomor halaman (mulai dari 0)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Jumlah item per halaman") @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(productService.getProducts(query, categoryId, categorySlug, featured, isNew, true, sort, page, size));
    }

    @GetMapping("/{idOrCode}")
    @Operation(summary = "Detail produk berdasarkan UUID atau kode produk",
               description = "Mendukung pencarian menggunakan UUID atau kode produk (misal: PRD-001)")
    public ResponseEntity<ProductResponse> getProductByIdOrCode(
            @Parameter(description = "UUID atau kode produk") @PathVariable String idOrCode) {
        return ResponseEntity.ok(productService.getProductByIdOrCode(idOrCode));
    }

    @GetMapping("/featured")
    @Operation(summary = "Daftar produk unggulan", description = "Mengambil seluruh produk unggulan aktif untuk beranda")
    public ResponseEntity<List<ProductResponse>> getFeaturedProducts() {
        return ResponseEntity.ok(productService.getFeaturedProducts());
    }
}
