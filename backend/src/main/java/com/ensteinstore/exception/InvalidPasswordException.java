package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class InvalidPasswordException extends EnsteinException {
    public InvalidPasswordException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED);
    }
}
