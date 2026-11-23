package com.ensteinstore.repository;

import com.ensteinstore.entity.StockMovement;
import com.ensteinstore.entity.enums.StockMovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    List<StockMovement> findAllByProductIdOrderByCreatedAtDesc(UUID productId);

    Page<StockMovement> findAllByProductIdOrderByCreatedAtDesc(UUID productId, Pageable pageable);

    Page<StockMovement> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<StockMovement> findAllByReferenceId(UUID referenceId);

    List<StockMovement> findAllByMovementType(StockMovementType movementType);
}
