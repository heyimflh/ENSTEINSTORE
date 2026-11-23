package com.ensteinstore.controller;

import com.ensteinstore.dto.request.CreateProductRequest;
import com.ensteinstore.dto.request.UpdateProductRequest;
import com.ensteinstore.dto.response.PagedResponse;
import com.ensteinstore.dto.response.ProductResponse;
import com.ensteinstore.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Products", description = "Endpoints manajemen produk untuk administrator")
public class AdminProductController {

    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Daftar produk admin (termasuk nonaktif)", description = "Mengambil seluruh data produk untuk panel admin.")
    public ResponseEntity<PagedResponse<ProductResponse>> getAdminProducts(
            @Parameter(description = "Kata kunci pencarian nama atau kode produk") @RequestParam(required = false) String query,
            @Parameter(description = "Filter berdasarkan UUID kategori") @RequestParam(required = false) UUID categoryId,
            @Parameter(description = "Filter berdasarkan slug kategori") @RequestParam(required = false) String categorySlug,
            @Parameter(description = "Filter produk unggulan") @RequestParam(required = false) Boolean featured,
            @Parameter(description = "Filter status aktif") @RequestParam(required = false) Boolean activeOnly,
            @Parameter(description = "Pengurutan") @RequestParam(required = false, defaultValue = "terbaru") String sort,
            @Parameter(description = "Halaman") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Ukuran") @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(productService.getProducts(query, categoryId, categorySlug, featured, null, activeOnly, sort, page, size));
    }

    @GetMapping("/{idOrCode}")
    @Operation(summary = "Detail produk admin", description = "Melihat detail produk berdasarkan UUID atau kode produk.")
    public ResponseEntity<ProductResponse> getProductDetail(@PathVariable String idOrCode) {
        return ResponseEntity.ok(productService.getProductByIdOrCode(idOrCode));
    }

    @PostMapping
    @Operation(summary = "Membuat produk baru", description = "Menambahkan produk baru ke katalog dengan stok awal 0 (mutasi stok via inventory).")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Memperbarui produk", description = "Memperbarui informasi produk tanpa mengubah stok secara langsung.")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable UUID id,
                                                         @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Menonaktifkan produk", description = "Soft-delete produk dengan mengubah status isActive menjadi false.")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        productService.deactivateProduct(id);
        return ResponseEntity.noContent().build();
    }
}
