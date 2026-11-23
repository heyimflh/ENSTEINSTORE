package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class DuplicateResourceException extends EnsteinException {

    public DuplicateResourceException(String message) {
        super(message, HttpStatus.CONFLICT, ErrorCode.BAD_REQUEST);
    }
}
