package com.ensteinstore.controller;

import com.ensteinstore.dto.request.UnitRequest;
import com.ensteinstore.dto.response.UnitResponse;
import com.ensteinstore.service.UnitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/admin/units", "/admin/units", "/api/api/admin/units"})
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Units", description = "Endpoints manajemen satuan ukuran produk (Unit) untuk administrator")
public class AdminUnitController {

    private final UnitService unitService;

    public AdminUnitController(UnitService unitService) {
        this.unitService = unitService;
    }

    @GetMapping
    @Operation(summary = "Daftar seluruh satuan admin", description = "Mengambil seluruh master data satuan beserta konfigurasi desimal dan total produk terkait.")
    public ResponseEntity<List<UnitResponse>> getAllUnits() {
        return ResponseEntity.ok(unitService.getAllUnitsForAdmin());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detail satuan admin", description = "Mengambil data satuan berdasarkan UUID.")
    public ResponseEntity<UnitResponse> getUnitById(@PathVariable UUID id) {
        return ResponseEntity.ok(unitService.getUnitById(id));
    }

    @PostMapping
    @Operation(summary = "Membuat satuan baru", description = "Menambahkan satuan ukuran baru (misal: Roll, Yard, Pak) ke master database.")
    public ResponseEntity<UnitResponse> createUnit(@Valid @RequestBody UnitRequest request) {
        UnitResponse response = unitService.createUnit(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Memperbarui satuan", description = "Memperbarui nama satuan, simbol, atau konfigurasi izin pecahan desimal.")
    public ResponseEntity<UnitResponse> updateUnit(
            @PathVariable UUID id,
            @Valid @RequestBody UnitRequest request) {
        return ResponseEntity.ok(unitService.updateUnit(id, request));
    }
}
