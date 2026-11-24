package com.ensteinstore.controller;

import com.ensteinstore.config.AppProperties;
import com.ensteinstore.dto.response.PaymentResponse;
import com.ensteinstore.entity.Payment;
import com.ensteinstore.entity.User;
import com.ensteinstore.entity.enums.SimulationOutcome;
import com.ensteinstore.exception.UserNotFoundException;
import com.ensteinstore.repository.UserRepository;
import com.ensteinstore.security.UserPrincipal;
import com.ensteinstore.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@PreAuthorize("isAuthenticated()")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Payments", description = "Endpoints pembayaran, unggah bukti transfer, dan simulasi")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    public PaymentController(PaymentService paymentService, UserRepository userRepository, AppProperties appProperties) {
        this.paymentService = paymentService;
        this.userRepository = userRepository;
        this.appProperties = appProperties;
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Status pembayaran pesanan", description = "Melihat data dan status pembayaran suatu pesanan.")
    public ResponseEntity<PaymentResponse> getPaymentStatus(@PathVariable UUID orderId) {
        Payment payment = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(PaymentResponse.fromEntity(payment));
    }

    @GetMapping("/proofs/{filename:.+}")
    @Operation(summary = "Lihat berkas bukti transfer berdasarkan nama berkas")
    public ResponseEntity<Resource> getProofByFilename(@PathVariable String filename) {
        List<Path> candidatePaths = List.of(
                Paths.get(appProperties.getUpload().getDir(), filename),
                Paths.get(appProperties.getUpload().getDir(), "payments", filename),
                Paths.get(appProperties.getUpload().getDir(), "proofs", filename),
                Paths.get("uploads", filename),
                Paths.get("uploads", "payments", filename),
                Paths.get("uploads", "proofs", filename),
                Paths.get("backend", "uploads", filename),
                Paths.get("backend", "uploads", "payments", filename),
                Paths.get("backend", "uploads", "proofs", filename)
        );

        for (Path path : candidatePaths) {
            try {
                Resource resource = new UrlResource(path.toAbsolutePath().normalize().toUri());
                if (resource.exists() && resource.isReadable()) {
                    String contentType = "image/jpeg";
                    String lower = filename.toLowerCase();
                    if (lower.endsWith(".png")) contentType = "image/png";
                    else if (lower.endsWith(".webp")) contentType = "image/webp";

                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(contentType))
                            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                            .body(resource);
                }
            } catch (MalformedURLException ignored) {
            }
        }

        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{orderId}/proof")
    @Operation(summary = "Unduh / lihat bukti transfer pesanan", description = "Mengambil berkas gambar bukti transfer.")
    public ResponseEntity<Resource> getPaymentProof(@PathVariable UUID orderId) {
        Payment payment = paymentService.getPaymentByOrderId(orderId);
        String proofUrl = payment.getTransferProofUrl();
        if (proofUrl == null || proofUrl.isBlank()) {
            return ResponseEntity.notFound().build();
        }

        String filename = proofUrl.contains("/") ? proofUrl.substring(proofUrl.lastIndexOf('/') + 1) : proofUrl;
        return getProofByFilename(filename);
    }

    @PostMapping(value = "/{orderId}/proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Unggah bukti pembayaran transfer bank",
               description = "Mengunggah berkas gambar bukti pembayaran (JPG/PNG/WEBP, maksimal 2 MB).")
    public ResponseEntity<PaymentResponse> uploadProof(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId,
            @Parameter(description = "Berkas bukti transfer (JPG, PNG, WEBP maks 2MB)") @RequestParam("file") MultipartFile file) {
        User currentUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("Pengguna tidak ditemukan."));
        paymentService.uploadTransferProof(orderId, file, currentUser);
        Payment payment = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(PaymentResponse.fromEntity(payment));
    }

    @PostMapping("/{orderId}/simulate")
    @Operation(summary = "Simulasi pembayaran pesanan",
               description = "Menjalankan simulasi pembayaran instan (SUCCESS atau FAILED) untuk pengujian/demo tanpa gateway riil.")
    public ResponseEntity<PaymentResponse> simulatePayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId,
            @Parameter(description = "Hasil simulasi (SUCCESS atau FAILED)") @RequestParam(defaultValue = "SUCCESS") SimulationOutcome outcome) {
        User currentUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("Pengguna tidak ditemukan."));
        paymentService.simulatePayment(orderId, outcome, currentUser);
        Payment payment = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(PaymentResponse.fromEntity(payment));
    }
}
