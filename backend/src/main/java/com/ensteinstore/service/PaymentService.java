package com.ensteinstore.service;

import com.ensteinstore.config.AppProperties;
import com.ensteinstore.entity.*;
import com.ensteinstore.entity.enums.OrderStatus;
import com.ensteinstore.entity.enums.PaymentMethod;
import com.ensteinstore.entity.enums.PaymentStatus;
import com.ensteinstore.entity.enums.SimulationOutcome;
import com.ensteinstore.exception.FileUploadException;
import com.ensteinstore.exception.PaymentException;
import com.ensteinstore.exception.ResourceNotFoundException;
import com.ensteinstore.payment.PaymentProcessResult;
import com.ensteinstore.payment.PaymentProcessor;
import com.ensteinstore.repository.OrderRepository;
import com.ensteinstore.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Payment Service (PRD §8.5, §19.1, TC-12, TC-13).
 * Coordinates payment processors via Strategy Pattern with PESSIMISTIC_WRITE locks for idempotency.
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB (K11)
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/webp"
    );

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final List<PaymentProcessor> paymentProcessors;
    private final AppProperties appProperties;

    public PaymentService(PaymentRepository paymentRepository,
                          OrderRepository orderRepository,
                          InventoryService inventoryService,
                          List<PaymentProcessor> paymentProcessors,
                          AppProperties appProperties) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.inventoryService = inventoryService;
        this.paymentProcessors = paymentProcessors;
        this.appProperties = appProperties;
    }

    /**
     * Executes payment simulation for testing/demo (PRD §8.5, TC-12).
     */
    @Transactional
    public PaymentProcessResult simulatePayment(UUID orderId, SimulationOutcome outcome, User user) {
        // Idempotency lock on payment row
        Payment payment = paymentRepository.findByOrderIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Data pembayaran tidak ditemukan untuk pesanan ID: " + orderId));

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            return PaymentProcessResult.success(PaymentStatus.PAID, "Pembayaran untuk pesanan ini sudah berstatus LUNAS.");
        }

        PaymentProcessor processor = findProcessor(PaymentMethod.SIMULATED);
        PaymentProcessResult result = processor.process(payment, outcome, user);

        paymentRepository.save(payment);
        orderRepository.save(payment.getOrder());

        log.info("Simulation for order {} completed with outcome: {}", orderId, outcome);
        return result;
    }

    /**
     * Uploads transfer proof image (JPG/PNG/WEBP, max 2MB) (K11, TC-13).
     */
    @Transactional
    public PaymentProcessResult uploadTransferProof(UUID orderId, MultipartFile file, User user) {
        validateUploadFile(file);

        Payment payment = paymentRepository.findByOrderIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Data pembayaran tidak ditemukan untuk pesanan ID: " + orderId));

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new PaymentException("Pesanan ini sudah lunas, tidak memerlukan unggah bukti transfer lagi.");
        }

        String originalFilename = file.getOriginalFilename();
        String ext = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase()
                : "jpg";

        String filename = String.format("%s_%d.%s", orderId, System.currentTimeMillis(), ext);
        String proofUrl = "/uploads/payments/" + filename;

        try {
            Path uploadDir = Paths.get(appProperties.getUpload().getDir(), "payments").toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);
            Path targetPath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved payment proof file to disk at: {}", targetPath);
        } catch (IOException ex) {
            log.error("Gagal menyimpan berkas bukti transfer untuk pesanan {}: {}", orderId, ex.getMessage());
            throw new FileUploadException("Gagal menyimpan berkas bukti transfer: " + ex.getMessage());
        }

        PaymentProcessor processor = findProcessor(payment.getPaymentMethod());
        PaymentProcessResult result = processor.process(payment, proofUrl, user);

        payment.setSubmittedAt(OffsetDateTime.now());
        paymentRepository.save(payment);

        log.info("Uploaded payment proof for order {}: {}", orderId, proofUrl);
        return result;
    }

    /**
     * Admin manual verification of payment transfer proof (TC-13, PRD §8.5).
     */
    @Transactional
    public PaymentProcessResult verifyPayment(UUID targetId, boolean approved, String rejectionReason, Admin admin) {
        // Idempotency lock - handles either orderId or paymentId
        Payment payment = paymentRepository.findByOrderIdWithLock(targetId)
                .or(() -> paymentRepository.findByIdWithLock(targetId))
                .orElseThrow(() -> new ResourceNotFoundException("Data pembayaran tidak ditemukan untuk ID atau Pesanan ID: " + targetId));

        Order order = payment.getOrder();
        UUID orderId = order != null ? order.getId() : targetId;

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new PaymentException("Pembayaran ini sudah pernah disetujui sebelumnya.");
        }

        if (approved) {
            payment.setPaymentStatus(PaymentStatus.PAID);
            payment.setPaidAt(OffsetDateTime.now());
            payment.setVerifiedAt(OffsetDateTime.now());
            payment.setVerifiedByAdmin(admin);

            if (order != null) {
                order.setOrderStatus(OrderStatus.PROCESSING);
                order.setPaymentStatus(PaymentStatus.PAID);

                // Fulfill reservation into actual sale
                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        inventoryService.fulfillReservation(item.getProduct(), item.getQuantity(), order.getId(), admin);
                    }
                }
                orderRepository.save(order);
            }

            paymentRepository.save(payment);

            log.info("Admin {} approved payment for order {}", admin.getId(), orderId);
            return PaymentProcessResult.success(PaymentStatus.PAID, "Pembayaran berhasil diverifikasi. Pesanan sedang diproses.");
        } else {
            payment.setPaymentStatus(PaymentStatus.REJECTED);
            payment.setRejectionReason(rejectionReason != null && !rejectionReason.isBlank()
                    ? rejectionReason.trim()
                    : "Bukti pembayaran tidak sesuai atau tidak valid.");
            payment.setVerifiedAt(OffsetDateTime.now());
            payment.setVerifiedByAdmin(admin);

            if (order != null) {
                order.setPaymentStatus(PaymentStatus.REJECTED);
                // Keep order in PENDING_PAYMENT so customer can re-upload payment proof without releasing reserved stock
                orderRepository.save(order);
            }

            paymentRepository.save(payment);

            log.info("Admin {} rejected payment for order {}. Reason: {}", admin.getId(), orderId, payment.getRejectionReason());
            return PaymentProcessResult.failed(PaymentStatus.REJECTED, "Bukti transfer ditolak. Pelanggan dapat mengunggah bukti perbaikan.");
        }
    }

    @Transactional(readOnly = true)
    public Payment getPaymentByOrderId(UUID orderId) {
        return paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Data pembayaran tidak ditemukan untuk pesanan ID: " + orderId));
    }

    private PaymentProcessor findProcessor(PaymentMethod method) {
        return paymentProcessors.stream()
                .filter(p -> p.supports(method))
                .findFirst()
                .orElseThrow(() -> new PaymentException("Metode pembayaran '" + method + "' tidak didukung."));
    }

    private void validateUploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileUploadException("Berkas bukti pembayaran tidak boleh kosong.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileUploadException("Ukuran berkas melebihi batas maksimal 2 MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new FileUploadException("Tipe berkas tidak didukung. Hanya file JPG, PNG, atau WEBP yang diperbolehkan.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                throw new FileUploadException("Ekstensi berkas '." + ext + "' tidak diperbolehkan. Hanya JPG, PNG, WEBP.");
            }
        }
    }
}
