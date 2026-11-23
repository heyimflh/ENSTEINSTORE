package com.ensteinstore.payment;

import com.ensteinstore.entity.Payment;
import com.ensteinstore.entity.User;
import com.ensteinstore.entity.enums.PaymentMethod;
import com.ensteinstore.entity.enums.PaymentStatus;
import org.springframework.stereotype.Component;

/**
 * Strategy implementation for Manual Transfer (Bank Transfer & E-Wallet) (PRD §19.1, K3).
 * Transitions status to WAITING_VERIFICATION upon proof upload.
 */
@Component
public class ManualTransferProcessor implements PaymentProcessor {

    @Override
    public boolean supports(PaymentMethod method) {
        return method == PaymentMethod.BANK_TRANSFER || method == PaymentMethod.E_WALLET;
    }

    @Override
    public PaymentProcessResult process(Payment payment, Object payload, User initiatedBy) {
        if (payload instanceof String proofUrl && !proofUrl.isBlank()) {
            payment.setTransferProofUrl(proofUrl);
            payment.setPaymentStatus(PaymentStatus.WAITING_VERIFICATION);
            return PaymentProcessResult.success(
                    PaymentStatus.WAITING_VERIFICATION,
                    "Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin."
            );
        }

        return PaymentProcessResult.failed(
                payment.getPaymentStatus(),
                "URL bukti pembayaran tidak valid."
        );
    }
}
