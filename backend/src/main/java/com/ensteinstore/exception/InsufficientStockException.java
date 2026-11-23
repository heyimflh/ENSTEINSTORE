package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class InsufficientStockException extends EnsteinException {
    public InsufficientStockException(String message) {
        super(message, HttpStatus.CONFLICT, ErrorCode.INSUFFICIENT_STOCK);
    }
}
