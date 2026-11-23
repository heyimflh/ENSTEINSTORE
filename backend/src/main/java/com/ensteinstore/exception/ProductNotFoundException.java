package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class ProductNotFoundException extends EnsteinException {
    public ProductNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND);
    }
}
