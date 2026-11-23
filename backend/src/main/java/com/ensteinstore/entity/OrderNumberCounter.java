package com.ensteinstore.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

/**
 * OrderNumberCounter entity (PRD §13.7, K9).
 * Used for atomic order number generation per day: EST-YYYYMMDD-XXXX.
 */
@Entity
@Table(name = "order_number_counters")
public class OrderNumberCounter {

    @Id
    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "last_value", nullable = false)
    private Integer lastValue = 0;

    public OrderNumberCounter() {
    }

    public OrderNumberCounter(LocalDate orderDate, Integer lastValue) {
        this.orderDate = orderDate;
        this.lastValue = lastValue;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public Integer getLastValue() {
        return lastValue;
    }

    public void setLastValue(Integer lastValue) {
        this.lastValue = lastValue;
    }
}
