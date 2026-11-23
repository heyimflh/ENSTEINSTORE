package com.ensteinstore.controller;

import com.ensteinstore.dto.request.CartItemRequest;
import com.ensteinstore.dto.response.CartResponse;
import com.ensteinstore.security.UserPrincipal;
import com.ensteinstore.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@PreAuthorize("hasRole('CUSTOMER')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Cart", description = "Endpoints keranjang belanja pelanggan Toko Enstein")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    @Operation(summary = "Melihat isi keranjang belanja", description = "Mengambil data keranjang aktif milik pelanggan yang sedang terautentikasi.")
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cartService.getCartSummary(principal.getId()));
    }

    @PostMapping("/items")
    @Operation(summary = "Menambahkan produk ke keranjang", description = "Menambahkan kuantitas produk ke keranjang dengan validasi batas pecahan satuan (allowDecimal).")
    public ResponseEntity<CartResponse> addItem(@AuthenticationPrincipal UserPrincipal principal,
                                                @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(cartService.addItemToCart(principal.getId(), request));
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "Mengubah kuantitas item keranjang", description = "Memperbarui kuantitas produk pada item keranjang belanja.")
    public ResponseEntity<CartResponse> updateItem(@AuthenticationPrincipal UserPrincipal principal,
                                                   @PathVariable UUID itemId,
                                                   @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(cartService.updateItemQuantity(principal.getId(), itemId, request.getQuantity()));
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Menghapus item dari keranjang", description = "Menghapus satu item spesifik dari keranjang belanja.")
    public ResponseEntity<CartResponse> removeItem(@AuthenticationPrincipal UserPrincipal principal,
                                                   @PathVariable UUID itemId) {
        return ResponseEntity.ok(cartService.removeItemFromCart(principal.getId(), itemId));
    }

    @DeleteMapping
    @Operation(summary = "Mengosongkan keranjang belanja", description = "Menghapus seluruh item dari keranjang aktif pelanggan.")
    public ResponseEntity<CartResponse> clearCart(@AuthenticationPrincipal UserPrincipal principal) {
        cartService.clearCart(principal.getId());
        return ResponseEntity.ok(cartService.getCartSummary(principal.getId()));
    }
}
