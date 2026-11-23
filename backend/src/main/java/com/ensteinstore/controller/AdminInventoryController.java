package com.ensteinstore.controller;

import com.ensteinstore.dto.request.StockAdjustmentRequest;
import com.ensteinstore.dto.request.StockInRequest;
import com.ensteinstore.dto.response.PagedResponse;
import com.ensteinstore.dto.response.StockMovementResponse;
import com.ensteinstore.entity.Admin;
import com.ensteinstore.entity.Product;
import com.ensteinstore.entity.StockMovement;
import com.ensteinstore.exception.ProductNotFoundException;
import com.ensteinstore.exception.UserNotFoundException;
import com.ensteinstore.repository.AdminRepository;
import com.ensteinstore.repository.ProductRepository;
import com.ensteinstore.security.UserPrincipal;
import com.ensteinstore.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/inventory")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Inventory", description = "Endpoints manajemen stok dan mutasi inventaris Toko Enstein")
public class AdminInventoryController {

    private final InventoryService inventoryService;
    private final ProductRepository productRepository;
    private final AdminRepository adminRepository;

    public AdminInventoryController(InventoryService inventoryService,
                                    ProductRepository productRepository,
                                    AdminRepository adminRepository) {
        this.inventoryService = inventoryService;
        this.productRepository = productRepository;
        this.adminRepository = adminRepository;
    }

    @GetMapping("/movements")
    @Operation(summary = "Riwayat seluruh mutasi stok", description = "Mengambil seluruh catatan log pergerakan stok barang di toko.")
    public ResponseEntity<PagedResponse<StockMovementResponse>> getAllMovements(
            @Parameter(description = "Halaman") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Ukuran") @RequestParam(defaultValue = "20") int size) {
        Page<StockMovement> movementPage = inventoryService.getAllMovements(PageRequest.of(page, size));
        List<StockMovementResponse> content = movementPage.getContent().stream()
                .map(StockMovementResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new PagedResponse<>(
                content,
                movementPage.getNumber(),
                movementPage.getSize(),
                movementPage.getTotalElements(),
                movementPage.getTotalPages(),
                movementPage.isLast()
        ));
    }

    @GetMapping("/movements/product/{productId}")
    @Operation(summary = "Riwayat mutasi stok produk tertentu", description = "Mengambil log mutasi stok untuk satu produk spesifik.")
    public ResponseEntity<PagedResponse<StockMovementResponse>> getProductMovements(
            @PathVariable UUID productId,
            @Parameter(description = "Halaman") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Ukuran") @RequestParam(defaultValue = "20") int size) {
        Page<StockMovement> movementPage = inventoryService.getProductMovements(productId, PageRequest.of(page, size));
        List<StockMovementResponse> content = movementPage.getContent().stream()
                .map(StockMovementResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new PagedResponse<>(
                content,
                movementPage.getNumber(),
                movementPage.getSize(),
                movementPage.getTotalElements(),
                movementPage.getTotalPages(),
                movementPage.isLast()
        ));
    }

    @PostMapping("/stock-in")
    @Operation(summary = "Pencatatan stok masuk (kulakan / restock)",
               description = "Menambahkan stok fisik barang melalui trigger database trg_apply_stock_movement (Rule 7).")
    public ResponseEntity<StockMovementResponse> stockIn(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StockInRequest request) {
        Admin admin = adminRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("Admin tidak ditemukan."));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ProductNotFoundException("Produk tidak ditemukan dengan ID: " + request.getProductId()));

        StockMovement movement = inventoryService.stockIn(product, request.getQuantity(), request.getNotes(), admin);
        return ResponseEntity.ok(StockMovementResponse.fromEntity(movement));
    }

    @PostMapping("/adjustment")
    @Operation(summary = "Penyesuaian stok fisik (Stock Opname)",
               description = "Menyesuaikan stok sistem agar cocok dengan stok riil di toko melalui trigger database (Rule 7).")
    public ResponseEntity<StockMovementResponse> adjustStock(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StockAdjustmentRequest request) {
        Admin admin = adminRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("Admin tidak ditemukan."));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ProductNotFoundException("Produk tidak ditemukan dengan ID: " + request.getProductId()));

        StockMovement movement = inventoryService.adjustStock(product, request.getNewActualStock(), request.getNotes(), admin);
        return ResponseEntity.ok(StockMovementResponse.fromEntity(movement));
    }
}
