package com.ensteinstore.repository;

import com.ensteinstore.entity.Payment;
import com.ensteinstore.entity.enums.PaymentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByOrderId(UUID orderId);

    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Payment> findAllByPaymentStatusOrderByCreatedAtDesc(PaymentStatus paymentStatus, Pageable pageable);

    /**
     * Idempotency guard on payment verification / simulation (AGENTS.md §4).
     * Locks the payment row with PESSIMISTIC_WRITE.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.order.id = :orderId")
    Optional<Payment> findByOrderIdWithLock(@Param("orderId") UUID orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.id = :id")
    Optional<Payment> findByIdWithLock(@Param("id") UUID id);
}
