package com.ensteinstore.repository;

import com.ensteinstore.entity.OrderNumberCounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface OrderNumberCounterRepository extends JpaRepository<OrderNumberCounter, LocalDate> {

    /**
     * Atomically increments and retrieves the order sequence for a specific date (K9, AGENTS.md §4).
     * Uses PostgreSQL INSERT ... ON CONFLICT DO UPDATE ... RETURNING to prevent race conditions.
     */
    @Query(value = "INSERT INTO order_number_counters (order_date, last_value) " +
                   "VALUES (:orderDate, 1) " +
                   "ON CONFLICT (order_date) " +
                   "DO UPDATE SET last_value = order_number_counters.last_value + 1 " +
                   "RETURNING last_value", nativeQuery = true)
    int getNextOrderSequence(@Param("orderDate") LocalDate orderDate);
}
