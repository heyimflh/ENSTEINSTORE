package com.ensteinstore.payment;

import com.ensteinstore.entity.enums.PaymentStatus;
import com.ensteinstore.entity.enums.SimulationOutcome;

public class PaymentProcessResult {

    private final boolean success;
    private final PaymentStatus newStatus;
    private final String message;
    private final SimulationOutcome outcome;

    public PaymentProcessResult(boolean success, PaymentStatus newStatus, String message, SimulationOutcome outcome) {
        this.success = success;
        this.newStatus = newStatus;
        this.message = message;
        this.outcome = outcome;
    }

    public static PaymentProcessResult success(PaymentStatus newStatus, String message) {
        return new PaymentProcessResult(true, newStatus, message, SimulationOutcome.SUCCESS);
    }

    public static PaymentProcessResult failed(PaymentStatus status, String message) {
        return new PaymentProcessResult(false, status, message, SimulationOutcome.FAILED);
    }

    public boolean isSuccess() {
        return success;
    }

    public PaymentStatus getNewStatus() {
        return newStatus;
    }

    public String getMessage() {
        return message;
    }

    public SimulationOutcome getOutcome() {
        return outcome;
    }
}
