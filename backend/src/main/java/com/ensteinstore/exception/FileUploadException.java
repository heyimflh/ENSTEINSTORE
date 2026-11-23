package com.ensteinstore.exception;

import org.springframework.http.HttpStatus;

public class FileUploadException extends EnsteinException {
    public FileUploadException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ErrorCode.FILE_UPLOAD_ERROR);
    }
}
