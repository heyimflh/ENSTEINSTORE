package com.ensteinstore.repository;

import com.ensteinstore.entity.Order;
import com.ensteinstore.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Optional<Order> findByOrderNumber(String orderNumber);

    @Query("SELECT o FROM Order o WHERE o.id = :id OR o.orderNumber = :idOrNumber")
    Optional<Order> findByIdOrOrderNumber(@Param("id") UUID id, @Param("idOrNumber") String idOrNumber);

    List<Order> findAllByCustomerIdOrderByOrderDateDesc(UUID customerId);

    Page<Order> findAllByCustomerIdOrderByOrderDateDesc(UUID customerId, Pageable pageable);

    Page<Order> findAllByOrderByOrderDateDesc(Pageable pageable);

    List<Order> findAllByOrderStatus(OrderStatus orderStatus);

    long countByOrderStatus(OrderStatus orderStatus);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findWithItemsById(@Param("id") UUID id);
}
