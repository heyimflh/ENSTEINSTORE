package com.ensteinstore.controller;

import com.ensteinstore.dto.response.UnitResponse;
import com.ensteinstore.service.UnitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/units", "/units"})
@Tag(name = "Units", description = "Endpoints satuan produk (Unit) Toko Enstein")
public class UnitController {

    private final UnitService unitService;

    public UnitController(UnitService unitService) {
        this.unitService = unitService;
    }

    @GetMapping
    @Operation(summary = "Daftar seluruh satuan produk", description = "Mengambil master data satuan seperti pcs, kg, meter beserta konfigurasi allowDecimal")
    public ResponseEntity<List<UnitResponse>> getAllUnits() {
        return ResponseEntity.ok(unitService.getAllUnits());
    }
}
