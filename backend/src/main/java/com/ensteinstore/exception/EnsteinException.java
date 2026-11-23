package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public abstract class EnsteinException extends RuntimeException {
    private final HttpStatus status;
    private final ErrorCode errorCode;

    public EnsteinException(String message, HttpStatus status, ErrorCode errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
