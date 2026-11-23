package com.ensteinstore.controller;

import com.ensteinstore.dto.request.CancelOrderRequest;
import com.ensteinstore.dto.response.OrderDetailResponse;
import com.ensteinstore.dto.response.PagedResponse;
import com.ensteinstore.entity.User;
import com.ensteinstore.exception.UserNotFoundException;
import com.ensteinstore.repository.UserRepository;
import com.ensteinstore.security.UserPrincipal;
import com.ensteinstore.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@PreAuthorize("hasRole('CUSTOMER')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Customer Orders", description = "Endpoints daftar dan rincian pesanan pelanggan")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "Daftar riwayat pesanan pelanggan", description = "Mengambil riwayat pesanan milik pelanggan aktif dengan paginasi.")
    public ResponseEntity<PagedResponse<OrderDetailResponse>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "Nomor halaman (mulai 0)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Ukuran halaman") @RequestParam(defaultValue = "10") int size) {
        Page<OrderDetailResponse> orderPage = orderService.getCustomerOrders(principal.getId(), PageRequest.of(page, size));
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
    @Operation(summary = "Rincian pesanan pelanggan", description = "Melihat detail pesanan berdasarkan UUID atau nomor pesanan (EST-YYYYMMDD-XXXX).")
    public ResponseEntity<OrderDetailResponse> getOrderDetail(
            @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "UUID atau nomor pesanan") @PathVariable String idOrNumber) {
        User currentUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("Pengguna tidak ditemukan."));
        return ResponseEntity.ok(orderService.getOrderDetail(idOrNumber, currentUser));
    }

    @PostMapping("/{idOrNumber}/cancel")
    @Operation(summary = "Membatalkan pesanan pelanggan", description = "Membatalkan pesanan berstatus PENDING_PAYMENT dan melepaskan reservasi stok kembali.")
    public ResponseEntity<OrderDetailResponse> cancelOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "UUID atau nomor pesanan") @PathVariable String idOrNumber,
            @RequestBody(required = false) CancelOrderRequest request) {
        User currentUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("Pengguna tidak ditemukan."));
        String reason = request != null ? request.getCancellationReason() : "Dibatalkan oleh pelanggan";
        return ResponseEntity.ok(orderService.cancelOrder(idOrNumber, reason, currentUser));
    }
}
