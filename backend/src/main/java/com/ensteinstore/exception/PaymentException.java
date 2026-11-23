package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class PaymentException extends EnsteinException {
    public PaymentException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ErrorCode.PAYMENT_FAILED);
    }

    public PaymentException(String message, HttpStatus status) {
        super(message, status, ErrorCode.PAYMENT_FAILED);
    }
}
