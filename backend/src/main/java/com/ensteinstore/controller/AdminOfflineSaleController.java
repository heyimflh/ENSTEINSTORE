package com.ensteinstore.controller;

import com.ensteinstore.dto.request.OfflineSaleRequest;
import com.ensteinstore.dto.response.OrderDetailResponse;
import com.ensteinstore.entity.Admin;
import com.ensteinstore.exception.UserNotFoundException;
import com.ensteinstore.repository.AdminRepository;
import com.ensteinstore.security.UserPrincipal;
import com.ensteinstore.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/offline-sales")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin POS / Offline Sales", description = "Endpoints penjualan langsung di kasir toko fisik Toko Enstein")
public class AdminOfflineSaleController {

    private final OrderService orderService;
    private final AdminRepository adminRepository;

    public AdminOfflineSaleController(OrderService orderService, AdminRepository adminRepository) {
        this.orderService = orderService;
        this.adminRepository = adminRepository;
    }

    @PostMapping
    @Operation(summary = "Pencatatan transaksi kasir toko fisik",
               description = "Mencatat penjualan langsung toko fisik dengan status langsung COMPLETED dan pemotongan stok otomatis (TC-15).")
    public ResponseEntity<OrderDetailResponse> createOfflineSale(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody OfflineSaleRequest request) {
        Admin admin = adminRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("Admin tidak ditemukan."));
        OrderDetailResponse response = orderService.createOfflineSale(request, admin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
