package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class InvalidCartException extends EnsteinException {
    public InvalidCartException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ErrorCode.INVALID_CART);
    }
}
