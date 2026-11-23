package com.ensteinstore.repository;

import com.ensteinstore.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnitRepository extends JpaRepository<Unit, UUID> {
    Optional<Unit> findByUnitName(String unitName);
    Optional<Unit> findByUnitSymbol(String unitSymbol);
    boolean existsByUnitName(String unitName);
    boolean existsByUnitSymbol(String unitSymbol);
}
