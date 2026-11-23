package com.ensteinstore.payment;

import com.ensteinstore.entity.Payment;
import com.ensteinstore.entity.User;
import com.ensteinstore.entity.enums.PaymentMethod;
import com.ensteinstore.entity.enums.PaymentStatus;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

/**
 * Strategy implementation for Cash / Offline Payment (PRD §19.1, K3).
 */
@Component
public class CashPaymentProcessor implements PaymentProcessor {

    @Override
    public boolean supports(PaymentMethod method) {
        return method == PaymentMethod.CASH;
    }

    @Override
    public PaymentProcessResult process(Payment payment, Object payload, User initiatedBy) {
        payment.setPaymentStatus(PaymentStatus.PAID);
        payment.setPaidAt(OffsetDateTime.now());
        return PaymentProcessResult.success(PaymentStatus.PAID, "Pembayaran tunai lunas.");
    }
}
