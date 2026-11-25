package com.ensteinstore.controller;

import com.ensteinstore.dto.request.CancelOrderRequest;
import com.ensteinstore.dto.request.UpdateOrderStatusRequest;
import com.ensteinstore.dto.response.OrderDetailResponse;
import com.ensteinstore.dto.response.PagedResponse;
import com.ensteinstore.entity.Admin;
import com.ensteinstore.exception.UserNotFoundException;
import com.ensteinstore.repository.AdminRepository;
import com.ensteinstore.security.UserPrincipal;
import com.ensteinstore.service.OrderService;
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

import java.util.UUID;

@RestController
@RequestMapping({"/api/admin/orders", "/admin/orders", "/api/api/admin/orders"})
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Orders", description = "Endpoints manajemen pesanan pelanggan untuk administrator")
public class AdminOrderController {

    private final OrderService orderService;
    private final AdminRepository adminRepository;

    public AdminOrderController(OrderService orderService, AdminRepository adminRepository) {
        this.orderService = orderService;
        this.adminRepository = adminRepository;
    }

    @GetMapping
    @Operation(summary = "Daftar seluruh pesanan", description = "Mengambil seluruh pesanan yang masuk ke toko dengan paginasi.")
    public ResponseEntity<PagedResponse<OrderDetailResponse>> getAllOrders(
            @Parameter(description = "Halaman") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Ukuran") @RequestParam(defaultValue = "15") int size) {
        Page<OrderDetailResponse> orderPage = orderService.getAllOrders(PageRequest.of(page, size));
        return ResponseEntity.ok(new PagedResponse<>(
                orderPage.getContent(),
                orderPage.getNumber(),
                orderPage.getSize(),
                orderPage.getTotalElements(),
                orderPage.getTotalPages(),
                orderPage.isLast()
        ));
    }

    @GetMapping("/{idOrNumber}")
    @Operation(summary = "Rincian pesanan", description = "Melihat detail pesanan berdasarkan UUID atau nomor pesanan.")
    public ResponseEntity<OrderDetailResponse> getOrderDetail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String idOrNumber) {
        Admin admin = adminRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("Admin tidak ditemukan."));
        return ResponseEntity.ok(orderService.getOrderDetail(idOrNumber, admin));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Memperbarui status pesanan",
               description = "Memperbarui status pesanan sesuai alur State Machine (PRD §11).")
    public ResponseEntity<OrderDetailResponse> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        Admin admin = adminRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("Admin tidak ditemukan."));
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request.getOrderStatus(), admin));
    }

    @PostMapping("/{idOrNumber}/cancel")
    @Operation(summary = "Membatalkan pesanan oleh admin",
               description = "Membatalkan pesanan dan mengembalikan reservasi atau stok barang (TC-14).")
    public ResponseEntity<OrderDetailResponse> cancelOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String idOrNumber,
            @RequestBody(required = false) CancelOrderRequest request) {
        Admin admin = adminRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("Admin tidak ditemukan."));
        String reason = request != null ? request.getCancellationReason() : "Dibatalkan oleh admin";
        return ResponseEntity.ok(orderService.cancelOrder(idOrNumber, reason, admin));
    }
}
