package com.ensteinstore.controller;

import com.ensteinstore.dto.request.ChangePasswordRequest;
import com.ensteinstore.dto.request.UpdateProfileRequest;
import com.ensteinstore.dto.response.UserProfileResponse;
import com.ensteinstore.exception.EnsteinException;
import com.ensteinstore.exception.ErrorCode;
import com.ensteinstore.exception.UserNotFoundException;
import com.ensteinstore.security.UserPrincipal;
import com.ensteinstore.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/me", "/api/profile"})
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "User Profile", description = "Endpoints untuk melihat dan memperbarui profil pengguna aktif")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    @Operation(summary = "Mendapatkan profil pengguna aktif", description = "Mengambil data profil dari pengguna yang sedang terautentikasi.")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new UserNotFoundException("Autentikasi diperlukan untuk mengakses resource ini.");
        }
        UserProfileResponse response = profileService.getProfile(principal.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @Operation(summary = "Memperbarui profil pengguna aktif", description = "Memperbarui data nama lengkap, nomor telepon, alamat, dan kota.")
    public ResponseEntity<UserProfileResponse> updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                                             @Valid @RequestBody UpdateProfileRequest request) {
        if (principal == null) {
            throw new UserNotFoundException("Autentikasi diperlukan untuk mengakses resource ini.");
        }
        UserProfileResponse response = profileService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/password")
    @Operation(summary = "Ubah kata sandi pengguna aktif", description = "Mengubah kata sandi pengguna dengan memverifikasi password saat ini.")
    public ResponseEntity<Map<String, String>> changePassword(@AuthenticationPrincipal UserPrincipal principal,
                                                              @Valid @RequestBody ChangePasswordRequest request) {
        if (principal == null) {
            throw new UserNotFoundException("Autentikasi diperlukan untuk mengakses resource ini.");
        }
        profileService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(Map.of("message", "Password berhasil diperbarui."));
    }
}
