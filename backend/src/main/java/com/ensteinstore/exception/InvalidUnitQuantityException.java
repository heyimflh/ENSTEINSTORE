package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class InvalidUnitQuantityException extends EnsteinException {
    public InvalidUnitQuantityException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ErrorCode.INVALID_UNIT_QUANTITY);
    }
}
