package com.ensteinstore.controller;

import com.ensteinstore.dto.request.LoginRequest;
import com.ensteinstore.dto.request.RegisterRequest;
import com.ensteinstore.dto.response.AuthResponse;
import com.ensteinstore.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints untuk registrasi pelanggan, login, dan logout (token revocation)")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Registrasi pelanggan baru (FR-01)", description = "Mendaftarkan akun customer baru secara publik.")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    @Operation(summary = "Login pengguna (FR-02)", description = "Autentikasi email dan password, mengembalikan JWT Bearer token.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Logout pengguna (FR-03, K12)", description = "Mencabut token aktif dan memasukkan jti ke daftar blacklist revoked_tokens.")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader(value = "Authorization", required = false) String bearerToken) {
        authService.logout(bearerToken);
        return ResponseEntity.ok(Map.of("message", "Logout berhasil. Token telah dicabut."));
    }
}
