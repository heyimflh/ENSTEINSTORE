package com.ensteinstore.service;

import com.ensteinstore.dto.request.UnitRequest;
import com.ensteinstore.dto.response.UnitResponse;
import com.ensteinstore.entity.Unit;
import com.ensteinstore.exception.DuplicateResourceException;
import com.ensteinstore.exception.ResourceNotFoundException;
import com.ensteinstore.repository.ProductRepository;
import com.ensteinstore.repository.UnitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UnitService {

    private static final Logger log = LoggerFactory.getLogger(UnitService.class);

    private final UnitRepository unitRepository;
    private final ProductRepository productRepository;

    public UnitService(UnitRepository unitRepository, ProductRepository productRepository) {
        this.unitRepository = unitRepository;
        this.productRepository = productRepository;
    }

    /**
     * Public: Get all units.
     */
    @Transactional(readOnly = true)
    public List<UnitResponse> getAllUnits() {
        return unitRepository.findAll().stream()
                .map(u -> {
                    long count = productRepository.countByUnitId(u.getId());
                    return new UnitResponse(
                            u.getId(),
                            u.getUnitName(),
                            u.getUnitSymbol(),
                            Boolean.TRUE.equals(u.getAllowDecimal()),
                            count
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * Admin: Get all units with product count.
     */
    @Transactional(readOnly = true)
    public List<UnitResponse> getAllUnitsForAdmin() {
        return getAllUnits();
    }

    /**
     * Public / Admin: Detail unit by UUID.
     */
    @Transactional(readOnly = true)
    public UnitResponse getUnitById(UUID id) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Satuan tidak ditemukan dengan ID: " + id));
        long count = productRepository.countByUnitId(unit.getId());
        return new UnitResponse(
                unit.getId(),
                unit.getUnitName(),
                unit.getUnitSymbol(),
                Boolean.TRUE.equals(unit.getAllowDecimal()),
                count
        );
    }

    /**
     * Admin: Create a new unit.
     */
    @Transactional
    public UnitResponse createUnit(UnitRequest request) {
        String trimmedName = request.getUnitName().trim();
        String trimmedSymbol = request.getUnitSymbol().trim();

        if (unitRepository.existsByUnitName(trimmedName)) {
            throw new DuplicateResourceException("Satuan dengan nama '" + trimmedName + "' sudah terdaftar.");
        }
        if (unitRepository.existsByUnitSymbol(trimmedSymbol)) {
            throw new DuplicateResourceException("Simbol satuan '" + trimmedSymbol + "' sudah terdaftar.");
        }

        Unit unit = new Unit(
                trimmedName,
                trimmedSymbol,
                Boolean.TRUE.equals(request.getAllowDecimal())
        );

        Unit saved = unitRepository.save(unit);
        log.info("Unit created by admin: {} ({}) - allowDecimal={}", saved.getUnitName(), saved.getUnitSymbol(), saved.getAllowDecimal());
        return new UnitResponse(saved.getId(), saved.getUnitName(), saved.getUnitSymbol(), Boolean.TRUE.equals(saved.getAllowDecimal()), 0);
    }

    /**
     * Admin: Update an existing unit.
     */
    @Transactional
    public UnitResponse updateUnit(UUID id, UnitRequest request) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Satuan tidak ditemukan dengan ID: " + id));

        String trimmedName = request.getUnitName().trim();
        String trimmedSymbol = request.getUnitSymbol().trim();

        unitRepository.findByUnitName(trimmedName).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Nama satuan '" + trimmedName + "' sudah digunakan oleh satuan lain.");
            }
        });

        unitRepository.findByUnitSymbol(trimmedSymbol).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Simbol satuan '" + trimmedSymbol + "' sudah digunakan oleh satuan lain.");
            }
        });

        unit.setUnitName(trimmedName);
        unit.setUnitSymbol(trimmedSymbol);
        if (request.getAllowDecimal() != null) {
            unit.setAllowDecimal(request.getAllowDecimal());
        }

        Unit updated = unitRepository.save(unit);
        long count = productRepository.countByUnitId(updated.getId());
        log.info("Unit updated by admin: {} ({}) - allowDecimal={}", updated.getUnitName(), updated.getUnitSymbol(), updated.getAllowDecimal());
        return new UnitResponse(updated.getId(), updated.getUnitName(), updated.getUnitSymbol(), Boolean.TRUE.equals(updated.getAllowDecimal()), count);
    }
}
