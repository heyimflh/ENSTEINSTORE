package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class EmailAlreadyExistsException extends EnsteinException {
    public EmailAlreadyExistsException(String email) {
        super("Email '" + email + "' sudah terdaftar dalam sistem.", HttpStatus.BAD_REQUEST, ErrorCode.EMAIL_ALREADY_EXISTS);
    }
}
