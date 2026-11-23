package com.ensteinstore.service;

import com.ensteinstore.entity.enums.FulfillmentMethod;
import com.ensteinstore.entity.enums.OrderStatus;
import com.ensteinstore.exception.InvalidOrderStatusException;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * State Machine for Order Lifecycle (PRD §11, §19.1).
 * Single source of truth for valid status transitions.
 */
@Component
public class OrderStateMachine {

    private static final Map<OrderStatus, Set<OrderStatus>> VALID_TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        // PENDING_PAYMENT can transition to PROCESSING (payment confirmed) or CANCELLED (manual / timeout)
        VALID_TRANSITIONS.put(OrderStatus.PENDING_PAYMENT, EnumSet.of(
                OrderStatus.PROCESSING,
                OrderStatus.CANCELLED
        ));

        // PROCESSING can transition to READY_FOR_PICKUP, SHIPPED, or CANCELLED
        VALID_TRANSITIONS.put(OrderStatus.PROCESSING, EnumSet.of(
                OrderStatus.READY_FOR_PICKUP,
                OrderStatus.SHIPPED,
                OrderStatus.CANCELLED
        ));

        // READY_FOR_PICKUP can transition to COMPLETED or CANCELLED
        VALID_TRANSITIONS.put(OrderStatus.READY_FOR_PICKUP, EnumSet.of(
                OrderStatus.COMPLETED,
                OrderStatus.CANCELLED
        ));

        // SHIPPED can transition to COMPLETED
        VALID_TRANSITIONS.put(OrderStatus.SHIPPED, EnumSet.of(
                OrderStatus.COMPLETED
        ));

        // Terminal states
        VALID_TRANSITIONS.put(OrderStatus.COMPLETED, Collections.emptySet());
        VALID_TRANSITIONS.put(OrderStatus.CANCELLED, Collections.emptySet());
    }

    /**
     * Checks if a transition between two order statuses is logically allowed.
     */
    public boolean canTransition(OrderStatus currentStatus, OrderStatus targetStatus) {
        if (currentStatus == null || targetStatus == null) {
            return false;
        }
        if (currentStatus == targetStatus) {
            return true;
        }
        Set<OrderStatus> allowed = VALID_TRANSITIONS.get(currentStatus);
        return allowed != null && allowed.contains(targetStatus);
    }

    /**
     * Validates transition including fulfillment method constraints (PRD §11.1).
     * Throws InvalidOrderStatusException if invalid.
     */
    public void validateTransition(OrderStatus currentStatus, OrderStatus targetStatus, FulfillmentMethod fulfillmentMethod) {
        if (!canTransition(currentStatus, targetStatus)) {
            throw new InvalidOrderStatusException(
                    String.format("Transisi status pesanan tidak valid dari '%s' ke '%s'.", currentStatus, targetStatus)
            );
        }

        // Validate fulfillment method constraints
        if (targetStatus == OrderStatus.READY_FOR_PICKUP && fulfillmentMethod != FulfillmentMethod.PICKUP) {
            throw new InvalidOrderStatusException(
                    "Status 'READY_FOR_PICKUP' hanya berlaku untuk metode pengiriman Ambil Sendiri (PICKUP)."
            );
        }

        if (targetStatus == OrderStatus.SHIPPED && fulfillmentMethod != FulfillmentMethod.DELIVERY) {
            throw new InvalidOrderStatusException(
                    "Status 'SHIPPED' hanya berlaku untuk metode pengiriman Diantar (DELIVERY)."
            );
        }
    }

    /**
     * Convenience method without fulfillment constraint check.
     */
    public void validateTransition(OrderStatus currentStatus, OrderStatus targetStatus) {
        if (!canTransition(currentStatus, targetStatus)) {
            throw new InvalidOrderStatusException(
                    String.format("Transisi status pesanan tidak valid dari '%s' ke '%s'.", currentStatus, targetStatus)
            );
        }
    }

    public Set<OrderStatus> getNextAllowedStatuses(OrderStatus currentStatus) {
        return VALID_TRANSITIONS.getOrDefault(currentStatus, Collections.emptySet());
    }
}
