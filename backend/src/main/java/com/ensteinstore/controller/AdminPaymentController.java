package com.ensteinstore.controller;

import com.ensteinstore.dto.request.VerifyPaymentRequest;
import com.ensteinstore.dto.response.PagedResponse;
import com.ensteinstore.dto.response.PaymentResponse;
import com.ensteinstore.entity.Admin;
import com.ensteinstore.entity.Payment;
import com.ensteinstore.entity.enums.PaymentStatus;
import com.ensteinstore.exception.UserNotFoundException;
import com.ensteinstore.repository.AdminRepository;
import com.ensteinstore.repository.PaymentRepository;
import com.ensteinstore.security.UserPrincipal;
import com.ensteinstore.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/admin/payments", "/admin/payments", "/api/api/admin/payments"})
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Payments", description = "Endpoints verifikasi pembayaran manual transfer untuk administrator")
public class AdminPaymentController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final AdminRepository adminRepository;

    public AdminPaymentController(PaymentService paymentService,
                                  PaymentRepository paymentRepository,
                                  AdminRepository adminRepository) {
        this.paymentService = paymentService;
        this.paymentRepository = paymentRepository;
        this.adminRepository = adminRepository;
    }

    @GetMapping
    @Operation(summary = "Daftar pembayaran pesanan", description = "Mengambil daftar pembayaran pesanan, bisa difilter berdasarkan status (misal: WAITING_VERIFICATION).")
    public ResponseEntity<PagedResponse<PaymentResponse>> getPayments(
            @Parameter(description = "Filter status pembayaran") @RequestParam(required = false) PaymentStatus status,
            @Parameter(description = "Halaman") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Ukuran") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Payment> paymentPage = (status != null)
                ? paymentRepository.findAllByPaymentStatusOrderByCreatedAtDesc(status, pageRequest)
                : paymentRepository.findAllByOrderByCreatedAtDesc(pageRequest);

        List<PaymentResponse> content = paymentPage.getContent().stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new PagedResponse<>(
                content,
                paymentPage.getNumber(),
                paymentPage.getSize(),
                paymentPage.getTotalElements(),
                paymentPage.getTotalPages(),
                paymentPage.isLast()
        ));
    }

    @RequestMapping(value = {"/{orderId}/verify", "/{orderId}"}, method = {RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH})
    @Operation(summary = "Verifikasi pembayaran bukti transfer",
               description = "Menyetujui (mengubah status menjadi PAID & pesanan PROCESSING) atau menolak bukti transfer (TC-13).")
    public ResponseEntity<PaymentResponse> verifyPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId,
            @Valid @RequestBody VerifyPaymentRequest request) {
        Admin admin = adminRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("Admin tidak ditemukan."));

        Payment payment = paymentRepository.findByOrderId(orderId)
                .or(() -> paymentRepository.findById(orderId))
                .orElseThrow(() -> new com.ensteinstore.exception.ResourceNotFoundException("Data pembayaran tidak ditemukan untuk ID atau Pesanan ID: " + orderId));

        UUID targetId = payment.getOrder() != null ? payment.getOrder().getId() : payment.getId();
        paymentService.verifyPayment(targetId, request.getApproved(), request.getRejectionReason(), admin);
        Payment updatedPayment = paymentRepository.findById(payment.getId()).orElse(payment);
        return ResponseEntity.ok(PaymentResponse.fromEntity(updatedPayment));
    }
}
