package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class UserNotFoundException extends EnsteinException {
    public UserNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, ErrorCode.USER_NOT_FOUND);
    }
}
