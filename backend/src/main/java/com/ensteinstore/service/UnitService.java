package com.ensteinstore.service;

import com.ensteinstore.dto.response.UnitResponse;
import com.ensteinstore.entity.Unit;
import com.ensteinstore.exception.ResourceNotFoundException;
import com.ensteinstore.repository.UnitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UnitService {

    private final UnitRepository unitRepository;

    public UnitService(UnitRepository unitRepository) {
        this.unitRepository = unitRepository;
    }

    @Transactional(readOnly = true)
    public List<UnitResponse> getAllUnits() {
        return unitRepository.findAll().stream()
                .map(u -> new UnitResponse(
                        u.getId(),
                        u.getUnitName(),
                        u.getUnitSymbol(),
                        Boolean.TRUE.equals(u.getAllowDecimal())
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UnitResponse getUnitById(UUID id) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Satuan tidak ditemukan dengan ID: " + id));
        return new UnitResponse(
                unit.getId(),
                unit.getUnitName(),
                unit.getUnitSymbol(),
                Boolean.TRUE.equals(unit.getAllowDecimal())
        );
    }
}
