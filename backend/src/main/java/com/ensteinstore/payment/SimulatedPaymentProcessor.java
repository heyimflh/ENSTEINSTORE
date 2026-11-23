package com.ensteinstore.payment;

import com.ensteinstore.entity.Order;
import com.ensteinstore.entity.OrderItem;
import com.ensteinstore.entity.Payment;
import com.ensteinstore.entity.User;
import com.ensteinstore.entity.enums.OrderStatus;
import com.ensteinstore.entity.enums.PaymentMethod;
import com.ensteinstore.entity.enums.PaymentStatus;
import com.ensteinstore.entity.enums.SimulationOutcome;
import com.ensteinstore.service.InventoryService;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

/**
 * Strategy implementation for Demo Payment Simulation (PRD §8.5, K2, TC-12).
 */
@Component
public class SimulatedPaymentProcessor implements PaymentProcessor {

    private final InventoryService inventoryService;

    public SimulatedPaymentProcessor(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @Override
    public boolean supports(PaymentMethod method) {
        return method == PaymentMethod.SIMULATED;
    }

    @Override
    public PaymentProcessResult process(Payment payment, Object payload, User initiatedBy) {
        SimulationOutcome outcome = payload instanceof SimulationOutcome ? (SimulationOutcome) payload : SimulationOutcome.SUCCESS;
        Order order = payment.getOrder();

        if (outcome == SimulationOutcome.SUCCESS) {
            payment.setPaymentStatus(PaymentStatus.PAID);
            payment.setPaidAt(OffsetDateTime.now());
            order.setOrderStatus(OrderStatus.PROCESSING);

            // Fulfill reserved stock into actual sale via single choke point
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    inventoryService.fulfillReservation(item.getProduct(), item.getQuantity(), order.getId(), initiatedBy);
                }
            }

            return PaymentProcessResult.success(PaymentStatus.PAID, "Simulasi pembayaran berhasil. Pesanan sedang diproses.");
        } else {
            // Per PRD K2 and TC-12: on failed simulation, payment stays PENDING, stock remains reserved
            payment.setPaymentStatus(PaymentStatus.PENDING);
            return PaymentProcessResult.failed(PaymentStatus.PENDING, "Simulasi pembayaran gagal. Status pembayaran tetap PENDING.");
        }
    }
}
