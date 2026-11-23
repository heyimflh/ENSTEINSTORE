package com.ensteinstore.repository;

import com.ensteinstore.entity.Cart;
import com.ensteinstore.entity.enums.CartStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {

    Optional<Cart> findByCustomerIdAndStatus(UUID customerId, CartStatus status);

    @Query("SELECT c FROM Cart c LEFT JOIN FETCH c.items i LEFT JOIN FETCH i.product " +
           "WHERE c.customer.id = :customerId AND c.status = :status")
    Optional<Cart> findWithItemsByCustomerIdAndStatus(@Param("customerId") UUID customerId,
                                                      @Param("status") CartStatus status);
}
