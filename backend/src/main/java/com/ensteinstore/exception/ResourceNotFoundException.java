package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends EnsteinException {
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND);
    }
}
