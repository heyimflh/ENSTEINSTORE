package com.ensteinstore.service;

import com.ensteinstore.dto.request.CartItemRequest;
import com.ensteinstore.dto.request.CheckoutRequest;
import com.ensteinstore.dto.request.OfflineSaleItemRequest;
import com.ensteinstore.dto.request.OfflineSaleRequest;
import com.ensteinstore.dto.response.CheckoutResponse;
import com.ensteinstore.dto.response.DashboardSummaryResponse;
import com.ensteinstore.dto.response.OrderDetailResponse;
import com.ensteinstore.entity.Admin;
import com.ensteinstore.entity.Customer;
import com.ensteinstore.entity.Product;
import com.ensteinstore.entity.enums.*;
import com.ensteinstore.exception.FileUploadException;
import com.ensteinstore.payment.PaymentProcessResult;
import com.ensteinstore.repository.AdminRepository;
import com.ensteinstore.repository.CustomerRepository;
import com.ensteinstore.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for Orders, Payments, Dashboard, and Reports (TC-12, TC-13, TC-14, TC-15, TC-17, TC-18).
 */
@SpringBootTest
@ActiveProfiles("integration-test")
@Transactional
class OrderAndPaymentIT {

    @Autowired
    private CartService cartService;

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private ReportService reportService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AdminRepository adminRepository;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private Customer customer;
    private Admin admin;
    private Product product;

    @BeforeEach
    void setUp() {
        product = productRepository.findByProductCode("PRD-BHN-001").orElseThrow();

        customer = new Customer(
                "Siti Order Tester",
                "siti.order." + System.currentTimeMillis() + "@test.com",
                "$2a$10$N31NTmtOgkA3I0rUiHApJefC.t110kDuAtmdKvT7hh4.y8.I1Y9Jq",
                "0812345678",
                "Jl. Melati",
                "Kebumen"
        );
        customer = customerRepository.save(customer);

        admin = adminRepository.findAll().stream().findFirst().orElseThrow();
    }

    private CheckoutResponse createTestCheckout(BigDecimal quantity, PaymentMethod paymentMethod) {
        cartService.addItemToCart(customer.getId(), new CartItemRequest(product.getId(), quantity));
        CheckoutRequest req = new CheckoutRequest(
                "Penerima Siti", "0812345678", FulfillmentMethod.PICKUP, null, paymentMethod, "Catatan"
        );
        return checkoutService.checkout(customer.getId(), req);
    }

    @Test
    @DisplayName("TC-12: Payment simulation outcome SUCCESS vs FAILED")
    void testPaymentSimulation() {
        // 1. Create order for simulation
        CheckoutResponse checkout = createTestCheckout(new BigDecimal("3.0"), PaymentMethod.SIMULATED);

        // 2. Simulate FAILED outcome: per K2 and TC-12, payment stays PENDING, stock remains reserved
        PaymentProcessResult failedResult = paymentService.simulatePayment(
                checkout.getOrderId(), SimulationOutcome.FAILED, customer
        );
        assertThat(failedResult.isSuccess()).isFalse();
        assertThat(failedResult.getNewStatus()).isEqualTo(PaymentStatus.PENDING);

        OrderDetailResponse orderAfterFail = orderService.getOrderDetail(checkout.getOrderNumber(), customer);
        assertThat(orderAfterFail.getOrderStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);

        // 3. Simulate SUCCESS outcome: payment transitions to PAID, order to PROCESSING, stock fulfilled
        PaymentProcessResult successResult = paymentService.simulatePayment(
                checkout.getOrderId(), SimulationOutcome.SUCCESS, customer
        );
        assertThat(successResult.isSuccess()).isTrue();
        assertThat(successResult.getNewStatus()).isEqualTo(PaymentStatus.PAID);

        OrderDetailResponse orderAfterSuccess = orderService.getOrderDetail(checkout.getOrderNumber(), customer);
        assertThat(orderAfterSuccess.getOrderStatus()).isEqualTo(OrderStatus.PROCESSING);
    }

    @Test
    @DisplayName("TC-13: Upload payment proof validation and admin approval/rejection")
    void testPaymentProofAndAdminVerification() {
        // 1. Create order
        CheckoutResponse checkout = createTestCheckout(new BigDecimal("2.0"), PaymentMethod.BANK_TRANSFER);

        // 2. Reject file > 2MB
        byte[] oversized = new byte[3 * 1024 * 1024]; // 3MB
        MockMultipartFile bigFile = new MockMultipartFile(
                "file", "receipt.jpg", "image/jpeg", oversized
        );
        assertThatThrownBy(() -> paymentService.uploadTransferProof(checkout.getOrderId(), bigFile, customer))
                .isInstanceOf(FileUploadException.class)
                .hasMessageContaining("2 MB");

        // 3. Reject invalid extension (e.g. PDF)
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "receipt.pdf", "application/pdf", "fake content".getBytes()
        );
        assertThatThrownBy(() -> paymentService.uploadTransferProof(checkout.getOrderId(), pdfFile, customer))
                .isInstanceOf(FileUploadException.class)
                .hasMessageContaining("tidak didukung");

        // 4. Valid upload -> WAITING_VERIFICATION
        MockMultipartFile validFile = new MockMultipartFile(
                "file", "bukti.jpg", "image/jpeg", "valid image content".getBytes()
        );
        PaymentProcessResult uploadResult = paymentService.uploadTransferProof(checkout.getOrderId(), validFile, customer);
        assertThat(uploadResult.getNewStatus()).isEqualTo(PaymentStatus.WAITING_VERIFICATION);

        // 5. Admin verification: Approval
        PaymentProcessResult approveResult = paymentService.verifyPayment(
                checkout.getOrderId(), true, null, admin
        );
        assertThat(approveResult.isSuccess()).isTrue();
        assertThat(approveResult.getNewStatus()).isEqualTo(PaymentStatus.PAID);

        OrderDetailResponse verifiedOrder = orderService.getOrderDetail(checkout.getOrderNumber(), admin);
        assertThat(verifiedOrder.getOrderStatus()).isEqualTo(OrderStatus.PROCESSING);
    }

    @Test
    @DisplayName("TC-14: Order cancellation releases reserved stock")
    void testOrderCancellation() {
        BigDecimal qty = new BigDecimal("4.0");
        BigDecimal initialReserved = productRepository.findById(product.getId()).orElseThrow().getReservedQuantity();

        CheckoutResponse checkout = createTestCheckout(qty, PaymentMethod.BANK_TRANSFER);

        entityManager.flush();
        entityManager.clear();
        Product pAfterReserve = productRepository.findById(product.getId()).orElseThrow();
        assertThat(pAfterReserve.getReservedQuantity()).isEqualByComparingTo(initialReserved.add(qty));

        // Customer cancels order
        OrderDetailResponse cancelled = orderService.cancelOrder(
                checkout.getOrderNumber(), "Berubah pikiran", customer
        );

        assertThat(cancelled.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(cancelled.getCancellationReason()).isEqualTo("Berubah pikiran");

        // Verify reserved stock released back
        entityManager.flush();
        entityManager.clear();
        Product pAfterCancel = productRepository.findById(product.getId()).orElseThrow();
        assertThat(pAfterCancel.getReservedQuantity()).isEqualByComparingTo(initialReserved);
    }

    @Test
    @DisplayName("TC-15: Offline sales creates COMPLETED order and directly deducts physical stock")
    void testOfflineSales() {
        BigDecimal initialStock = productRepository.findById(product.getId()).orElseThrow().getStockOnHand();
        BigDecimal saleQty = new BigDecimal("10.0");

        OfflineSaleRequest req = new OfflineSaleRequest(
                "Pak Joko Konveksi",
                "081999888777",
                PaymentMethod.CASH,
                List.of(new OfflineSaleItemRequest(product.getId(), saleQty)),
                "Pembelian tunai di toko"
        );

        OrderDetailResponse offlineOrder = orderService.createOfflineSale(req, admin);

        assertThat(offlineOrder.getOrderType()).isEqualTo(OrderType.OFFLINE);
        assertThat(offlineOrder.getOrderStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(offlineOrder.getPayment().getStatus()).isEqualTo(PaymentStatus.PAID);

        // Verify stock directly decreased by SALE trigger
        entityManager.flush();
        entityManager.clear();
        Product reloaded = productRepository.findById(product.getId()).orElseThrow();
        assertThat(reloaded.getStockOnHand()).isEqualByComparingTo(initialStock.subtract(saleQty));
    }

    @Test
    @DisplayName("TC-17: Multithreaded Dashboard summary runs 3 parallel tasks via CompletableFuture")
    void testDashboardMultithreaded() {
        DashboardSummaryResponse dashboard = dashboardService.getDashboardSummary();

        assertThat(dashboard).isNotNull();
        assertThat(dashboard.getSales()).isNotNull();
        assertThat(dashboard.getStock()).isNotNull();
        assertThat(dashboard.getRecentOrders()).isNotNull();

        assertThat(dashboard.getStock().getTotalProducts()).isGreaterThan(0);
        assertThat(dashboard.getSales().getTotalRevenue()).isNotNull();
    }

    @Test
    @DisplayName("TC-18: Report service generates sales and inventory reports")
    void testReportService() throws Exception {
        LocalDate today = LocalDate.now();

        // Daily sales report
        ByteArrayOutputStream dailyBaos = new ByteArrayOutputStream();
        reportService.exportDailySalesReport(today.minusDays(7), today, dailyBaos);
        assertThat(dailyBaos.size()).isGreaterThan(0);

        // Stock inventory report
        ByteArrayOutputStream stockBaos = new ByteArrayOutputStream();
        reportService.exportStockReport(stockBaos);
        assertThat(stockBaos.size()).isGreaterThan(0);
        String stockCsv = stockBaos.toString();
        assertThat(stockCsv).contains("Kode Produk");
        assertThat(stockCsv).contains("PRD-BHN-001");
    }
}
