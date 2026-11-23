package com.ensteinstore.dto.response;

import com.ensteinstore.entity.enums.PaymentMethod;
import com.ensteinstore.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class PaymentResponse {

    private UUID id;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private BigDecimal amount;
    private String proofOfPaymentUrl;
    private OffsetDateTime submittedAt;
    private OffsetDateTime verifiedAt;
    private String rejectionReason;

    public PaymentResponse() {
    }

    public PaymentResponse(UUID id, PaymentMethod paymentMethod, PaymentStatus status,
                           BigDecimal amount, String proofOfPaymentUrl, OffsetDateTime submittedAt,
                           OffsetDateTime verifiedAt, String rejectionReason) {
        this.id = id;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.amount = amount;
        this.proofOfPaymentUrl = proofOfPaymentUrl;
        this.submittedAt = submittedAt;
        this.verifiedAt = verifiedAt;
        this.rejectionReason = rejectionReason;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getProofOfPaymentUrl() {
        return proofOfPaymentUrl;
    }

    public void setProofOfPaymentUrl(String proofOfPaymentUrl) {
        this.proofOfPaymentUrl = proofOfPaymentUrl;
    }

    public OffsetDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(OffsetDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public OffsetDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(OffsetDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public static PaymentResponse fromEntity(com.ensteinstore.entity.Payment p) {
        if (p == null) return null;
        return new PaymentResponse(
                p.getId(),
                p.getPaymentMethod(),
                p.getPaymentStatus(),
                p.getAmount(),
                p.getProofOfPaymentUrl(),
                p.getSubmittedAt(),
                p.getVerifiedAt(),
                p.getRejectionReason()
        );
    }
}
