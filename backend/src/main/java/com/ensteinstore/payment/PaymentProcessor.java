package com.ensteinstore.payment;

import com.ensteinstore.entity.Payment;
import com.ensteinstore.entity.User;
import com.ensteinstore.entity.enums.PaymentMethod;

/**
 * Strategy Pattern for Payment Processing (PRD §19.1).
 */
public interface PaymentProcessor {

    /**
     * Determines whether this processor supports the given payment method.
     */
    boolean supports(PaymentMethod method);

    /**
     * Processes payment execution, verification, or simulation.
     */
    PaymentProcessResult process(Payment payment, Object payload, User initiatedBy);
}
