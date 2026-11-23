package com.ensteinstore.service;

import com.ensteinstore.entity.enums.FulfillmentMethod;
import com.ensteinstore.entity.enums.OrderStatus;
import com.ensteinstore.exception.InvalidOrderStatusException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * TC-09: Unit tests for OrderStateMachine transitions (PRD §11).
 */
class OrderStateMachineTest {

    private OrderStateMachine stateMachine;

    @BeforeEach
    void setUp() {
        stateMachine = new OrderStateMachine();
    }

    @Test
    @DisplayName("TC-09: Valid status transitions succeed")
    void testValidTransitions() {
        // PENDING_PAYMENT -> PROCESSING
        assertThat(stateMachine.canTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.PROCESSING)).isTrue();
        // PENDING_PAYMENT -> CANCELLED
        assertThat(stateMachine.canTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED)).isTrue();

        // PROCESSING -> READY_FOR_PICKUP (with PICKUP method)
        stateMachine.validateTransition(OrderStatus.PROCESSING, OrderStatus.READY_FOR_PICKUP, FulfillmentMethod.PICKUP);
        // PROCESSING -> SHIPPED (with DELIVERY method)
        stateMachine.validateTransition(OrderStatus.PROCESSING, OrderStatus.SHIPPED, FulfillmentMethod.DELIVERY);

        // READY_FOR_PICKUP -> COMPLETED
        assertThat(stateMachine.canTransition(OrderStatus.READY_FOR_PICKUP, OrderStatus.COMPLETED)).isTrue();

        // SHIPPED -> COMPLETED
        assertThat(stateMachine.canTransition(OrderStatus.SHIPPED, OrderStatus.COMPLETED)).isTrue();
    }

    @Test
    @DisplayName("TC-09: Invalid transitions throw InvalidOrderStatusException")
    void testInvalidTransitionsThrowException() {
        // PENDING_PAYMENT cannot directly jump to COMPLETED or SHIPPED
        assertThatThrownBy(() -> stateMachine.validateTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.COMPLETED))
                .isInstanceOf(InvalidOrderStatusException.class)
                .hasMessageContaining("Transisi status pesanan tidak valid");

        assertThatThrownBy(() -> stateMachine.validateTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.SHIPPED))
                .isInstanceOf(InvalidOrderStatusException.class);

        // Terminal state: COMPLETED cannot transition to anything
        assertThatThrownBy(() -> stateMachine.validateTransition(OrderStatus.COMPLETED, OrderStatus.PROCESSING))
                .isInstanceOf(InvalidOrderStatusException.class);

        assertThatThrownBy(() -> stateMachine.validateTransition(OrderStatus.COMPLETED, OrderStatus.CANCELLED))
                .isInstanceOf(InvalidOrderStatusException.class);

        // Terminal state: CANCELLED cannot transition to anything
        assertThatThrownBy(() -> stateMachine.validateTransition(OrderStatus.CANCELLED, OrderStatus.PROCESSING))
                .isInstanceOf(InvalidOrderStatusException.class);
    }

    @Test
    @DisplayName("TC-09: Fulfillment method constraints are strictly enforced")
    void testFulfillmentMethodConstraints() {
        // READY_FOR_PICKUP requires PICKUP, rejects DELIVERY
        assertThatThrownBy(() -> stateMachine.validateTransition(OrderStatus.PROCESSING, OrderStatus.READY_FOR_PICKUP, FulfillmentMethod.DELIVERY))
                .isInstanceOf(InvalidOrderStatusException.class)
                .hasMessageContaining("Ambil Sendiri (PICKUP)");

        // SHIPPED requires DELIVERY, rejects PICKUP
        assertThatThrownBy(() -> stateMachine.validateTransition(OrderStatus.PROCESSING, OrderStatus.SHIPPED, FulfillmentMethod.PICKUP))
                .isInstanceOf(InvalidOrderStatusException.class)
                .hasMessageContaining("Diantar (DELIVERY)");
    }
}
