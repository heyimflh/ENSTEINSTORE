package com.ensteinstore.dto.request;

import jakarta.validation.constraints.NotNull;

public class VerifyPaymentRequest {

    @NotNull(message = "Keputusan verifikasi (approved) wajib diisi.")
    private Boolean approved;

    private String rejectionReason;

    public VerifyPaymentRequest() {
    }

    public VerifyPaymentRequest(Boolean approved, String rejectionReason) {
        this.approved = approved;
        this.rejectionReason = rejectionReason;
    }

    public Boolean getApproved() {
        return approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }

    public Boolean getApprove() {
        return approved;
    }

    public void setApprove(Boolean approve) {
        this.approved = approve;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
