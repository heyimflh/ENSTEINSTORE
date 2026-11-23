package com.ensteinstore.dto.request;

public class CancelOrderRequest {

    private String cancellationReason;

    public CancelOrderRequest() {
    }

    public CancelOrderRequest(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }
}
