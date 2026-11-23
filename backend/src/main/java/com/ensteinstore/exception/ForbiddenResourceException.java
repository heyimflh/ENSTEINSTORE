package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenResourceException extends EnsteinException {
    public ForbiddenResourceException(String message) {
        super(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN);
    }
}
