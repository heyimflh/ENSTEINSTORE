package com.ensteinstore.repository;

import com.ensteinstore.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByProductCode(String productCode);

    boolean existsByProductCode(String productCode);

    @Query("SELECT p FROM Product p WHERE p.id = :id OR p.productCode = :idOrCode")
    Optional<Product> findByIdOrCode(@Param("id") UUID id, @Param("idOrCode") String idOrCode);

    List<Product> findAllByIsActiveTrue();

    List<Product> findAllByIsActiveTrueAndIsFeaturedTrue();

    List<Product> findAllByIsActiveTrueAndCategoryId(UUID categoryId);

    Page<Product> findAllByIsActiveTrue(Pageable pageable);

    Page<Product> findAllByIsActiveTrueAndCategoryId(UUID categoryId, Pageable pageable);

    long countByCategoryIdAndIsActiveTrue(UUID categoryId);

    /**
     * Locks a product row for update (PESSIMISTIC_WRITE) to prevent race conditions (AGENTS.md §4).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithLock(@Param("id") UUID id);

    /**
     * Locks multiple product rows ordered by ID to prevent deadlocks during checkout (AGENTS.md §4).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id IN :ids ORDER BY p.id ASC")
    List<Product> findAllByIdInWithLock(@Param("ids") List<UUID> ids);
}
