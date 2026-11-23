package com.ensteinstore.controller;

import com.ensteinstore.dto.request.UpdateProfileRequest;
import com.ensteinstore.dto.response.UserProfileResponse;
import com.ensteinstore.security.UserPrincipal;
import com.ensteinstore.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
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
        UserProfileResponse response = profileService.getProfile(principal.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @Operation(summary = "Memperbarui profil pengguna aktif", description = "Memperbarui data nama lengkap, nomor telepon, alamat, dan kota.")
    public ResponseEntity<UserProfileResponse> updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                                             @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse response = profileService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(response);
    }
}
