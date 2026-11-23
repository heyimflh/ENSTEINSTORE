package com.ensteinstore.service;

import com.ensteinstore.dto.request.CartItemRequest;
import com.ensteinstore.dto.request.CheckoutRequest;
import com.ensteinstore.dto.response.CartResponse;
import com.ensteinstore.dto.response.CheckoutResponse;
import com.ensteinstore.entity.Customer;
import com.ensteinstore.entity.Product;
import com.ensteinstore.entity.StockMovement;
import com.ensteinstore.entity.enums.FulfillmentMethod;
import com.ensteinstore.entity.enums.PaymentMethod;
import com.ensteinstore.entity.enums.PaymentStatus;
import com.ensteinstore.entity.enums.StockMovementType;
import com.ensteinstore.exception.InsufficientStockException;
import com.ensteinstore.exception.InvalidUnitQuantityException;
import com.ensteinstore.repository.CustomerRepository;
import com.ensteinstore.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for Cart, Inventory, and Checkout (TC-08, TC-10, TC-11, TC-16).
 */
@SpringBootTest
@ActiveProfiles("integration-test")
@Transactional
class CartAndInventoryIT {

    @Autowired
    private CartService cartService;

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private OrderNumberService orderNumberService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private Customer testCustomer;
    private Product meterProduct;  // PRD-BHN-001 (Meter, allowDecimal = true)
    private Product pcsProduct;    // PRD-ALT-001 (Pcs, allowDecimal = false)

    @BeforeEach
    void setUp() {
        // Find existing seed products
        meterProduct = productRepository.findByProductCode("PRD-BHN-001")
                .orElseThrow(() -> new IllegalStateException("Seed product PRD-BHN-001 not found"));
        pcsProduct = productRepository.findByProductCode("PRD-ALT-001")
                .orElseThrow(() -> new IllegalStateException("Seed product PRD-ALT-001 not found"));

        // Create a dedicated test customer
        testCustomer = new Customer(
                "Budi Cart Tester",
                "budi.cart." + System.currentTimeMillis() + "@test.com",
                "$2a$10$N31NTmtOgkA3I0rUiHApJefC.t110kDuAtmdKvT7hh4.y8.I1Y9Jq",
                "081234567890",
                "Jl. Pahlawan No. 12",
                "Kebumen"
        );
        testCustomer = customerRepository.save(testCustomer);
    }

    @Test
    @DisplayName("TC-08: Decimal quantity allowed for Meter, rejected for Pcs/Roll")
    void testUnitDecimalValidation() {
        // 1. Meter product (allowDecimal = true) accepts decimal quantity 2.5
        CartItemRequest meterReq = new CartItemRequest(meterProduct.getId(), new BigDecimal("2.5"));
        CartResponse cartAfterMeter = cartService.addItemToCart(testCustomer.getId(), meterReq);
        assertThat(cartAfterMeter.getItems()).hasSize(1);
        assertThat(cartAfterMeter.getItems().get(0).getQuantity()).isEqualByComparingTo("2.5");

        // 2. Pcs product (allowDecimal = false) rejects decimal quantity 2.5 with InvalidUnitQuantityException
        CartItemRequest pcsReq = new CartItemRequest(pcsProduct.getId(), new BigDecimal("2.5"));
        assertThatThrownBy(() -> cartService.addItemToCart(testCustomer.getId(), pcsReq))
                .isInstanceOf(InvalidUnitQuantityException.class)
                .hasMessageContaining("tidak mengizinkan jumlah desimal");

        // 3. Pcs product accepts whole number quantity 3.0 or 3
        CartItemRequest pcsValidReq = new CartItemRequest(pcsProduct.getId(), new BigDecimal("3.0"));
        CartResponse cartAfterPcs = cartService.addItemToCart(testCustomer.getId(), pcsValidReq);
        assertThat(cartAfterPcs.getItems()).hasSize(2);
    }

    @Test
    @DisplayName("TC-08: Cart rejects quantity exceeding available stock")
    void testCartInsufficientStock() {
        // Request quantity higher than available
        BigDecimal hugeQuantity = meterProduct.getAvailableQuantity().add(BigDecimal.TEN);
        CartItemRequest overStockReq = new CartItemRequest(meterProduct.getId(), hugeQuantity);

        assertThatThrownBy(() -> cartService.addItemToCart(testCustomer.getId(), overStockReq))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Stok")
                .hasMessageContaining("tidak mencukupi");
    }

    @Test
    @DisplayName("TC-11: Order number sequence generation format EST-YYYYMMDD-XXXX")
    void testOrderNumberGeneration() {
        String orderNum1 = orderNumberService.generateOrderNumber();
        String orderNum2 = orderNumberService.generateOrderNumber();

        assertThat(orderNum1).matches("^EST-\\d{8}-\\d{4}$");
        assertThat(orderNum2).matches("^EST-\\d{8}-\\d{4}$");
        assertThat(orderNum1).isNotEqualTo(orderNum2);
    }

    @Test
    @DisplayName("TC-10: Checkout creates atomic order and reserves stock via single choke point")
    void testCheckoutAndStockReservation() {
        // 1. Add 5 meters of PVC to cart
        BigDecimal checkoutQty = new BigDecimal("5.0");
        BigDecimal initialReserved = meterProduct.getReservedQuantity();

        cartService.addItemToCart(testCustomer.getId(), new CartItemRequest(meterProduct.getId(), checkoutQty));

        // 2. Execute checkout
        CheckoutRequest checkoutReq = new CheckoutRequest(
                "Penerima Budi",
                "081234567890",
                FulfillmentMethod.DELIVERY,
                "Jl. Mawar Indah No. 5, Kebumen",
                PaymentMethod.BANK_TRANSFER,
                "Harap bungkus rapi"
        );

        CheckoutResponse response = checkoutService.checkout(testCustomer.getId(), checkoutReq);

        assertThat(response.getOrderNumber()).matches("^EST-\\d{8}-\\d{4}$");
        assertThat(response.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(response.getDeliveryFee()).isEqualByComparingTo("15000.00");
        assertThat(response.getTotalAmount()).isEqualByComparingTo(response.getSubtotal().add(new BigDecimal("15000.00")));

        // 3. Verify stock reservation updated in database via trigger
        entityManager.flush();
        entityManager.clear();
        Product reloadedProduct = productRepository.findById(meterProduct.getId()).orElseThrow();
        assertThat(reloadedProduct.getReservedQuantity())
                .isEqualByComparingTo(initialReserved.add(checkoutQty));
    }

    @Test
    @DisplayName("TC-16: Inventory movements trigger correct PostgreSQL stock mutations")
    void testInventoryMovements() {
        // 1. Stock In: 50 meters
        BigDecimal currentStock = meterProduct.getStockOnHand();
        StockMovement stockIn = inventoryService.stockIn(
                meterProduct, new BigDecimal("50"), "Kulakan tambahan", testCustomer
        );
        assertThat(stockIn.getMovementType()).isEqualTo(StockMovementType.STOCK_IN);

        entityManager.flush();
        entityManager.clear();
        Product p1 = productRepository.findById(meterProduct.getId()).orElseThrow();
        assertThat(p1.getStockOnHand()).isEqualByComparingTo(currentStock.add(new BigDecimal("50")));

        // 2. Stock Adjustment: set stock to exactly 500
        StockMovement adj = inventoryService.adjustStock(
                p1, new BigDecimal("500"), "Opname tahunan", testCustomer
        );
        assertThat(adj.getMovementType()).isEqualTo(StockMovementType.ADJUSTMENT);

        entityManager.flush();
        entityManager.clear();
        Product p2 = productRepository.findById(meterProduct.getId()).orElseThrow();
        assertThat(p2.getStockOnHand()).isEqualByComparingTo(new BigDecimal("500.000"));

        // 3. Direct Sale (Offline): 10 meters
        StockMovement sale = inventoryService.directSale(
                p2, new BigDecimal("10"), UUID.randomUUID(), testCustomer
        );
        assertThat(sale.getMovementType()).isEqualTo(StockMovementType.SALE);

        entityManager.flush();
        entityManager.clear();
        Product p3 = productRepository.findById(meterProduct.getId()).orElseThrow();
        assertThat(p3.getStockOnHand()).isEqualByComparingTo(new BigDecimal("490.000"));
    }
}
