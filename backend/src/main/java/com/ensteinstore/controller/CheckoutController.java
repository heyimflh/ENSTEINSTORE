package com.ensteinstore.controller;

import com.ensteinstore.dto.request.CheckoutRequest;
import com.ensteinstore.dto.response.CheckoutResponse;
import com.ensteinstore.security.UserPrincipal;
import com.ensteinstore.service.CheckoutService;
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
@RequestMapping("/api/checkout")
@PreAuthorize("hasRole('CUSTOMER')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Checkout", description = "Endpoint proses checkout pesanan pelanggan")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping
    @Operation(summary = "Memproses checkout pesanan",
               description = "Melakukan checkout atomik dengan penguncian baris produk (pessimistic lock) dan reservasi stok otomatis.")
    public ResponseEntity<CheckoutResponse> checkout(@AuthenticationPrincipal UserPrincipal principal,
                                                     @Valid @RequestBody CheckoutRequest request) {
        CheckoutResponse response = checkoutService.checkout(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
