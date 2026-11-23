package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class InvalidOrderStatusException extends EnsteinException {
    public InvalidOrderStatusException(String message) {
        super(message, HttpStatus.CONFLICT, ErrorCode.INVALID_ORDER_STATUS);
    }
}
