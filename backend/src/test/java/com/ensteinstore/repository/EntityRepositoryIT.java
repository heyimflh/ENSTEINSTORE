package com.ensteinstore.repository;

import com.ensteinstore.entity.*;
import com.ensteinstore.entity.enums.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Fase 3 Integration Test:
 * 1. Validates Hibernate mapping against Flyway V1-V13 schema (ddl-auto=validate).
 * 2. Tests Repository operations, pessimistic locks, atomic order sequence, and relationships.
 * Run with: mvn verify
 */
@SpringBootTest
@ActiveProfiles("integration-test")
@Transactional
class EntityRepositoryIT {

    static PostgreSQLContainer<?> postgres;

    static {
        try {
            postgres = new PostgreSQLContainer<>("postgres:18-alpine")
                    .withDatabaseName("ensteinstore_test")
                    .withUsername("test_user")
                    .withPassword("test_password");
            postgres.start();
        } catch (Throwable t) {
            postgres = null;
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (postgres != null && postgres.isRunning()) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
            registry.add("spring.flyway.url", postgres::getJdbcUrl);
            registry.add("spring.flyway.user", postgres::getUsername);
            registry.add("spring.flyway.password", postgres::getPassword);
        }
    }

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private OrderNumberCounterRepository orderNumberCounterRepository;

    @Test
    @DisplayName("TC-02: Hibernate validation passed and seed categories/units loaded")
    void testCategoriesAndUnits() {
        List<Category> categories = categoryRepository.findAll();
        assertThat(categories).hasSizeGreaterThanOrEqualTo(5);

        Optional<Category> rainwear = categoryRepository.findBySlug("material-jas-hujan");
        assertThat(rainwear).isPresent();
        assertThat(rainwear.get().getName()).isEqualTo("Material Jas Hujan");

        List<Unit> units = unitRepository.findAll();
        assertThat(units).hasSizeGreaterThanOrEqualTo(3);

        Optional<Unit> meter = unitRepository.findByUnitSymbol("m");
        assertThat(meter).isPresent();
        assertThat(meter.get().getAllowDecimal()).isTrue();
    }

    @Test
    @DisplayName("TC-02: Product entity mapping and pessimistic locking")
    void testProductRepositoryAndLocking() {
        Optional<Product> productOpt = productRepository.findByProductCode("PRD-BHN-001");
        assertThat(productOpt).isPresent();
        Product product = productOpt.get();

        assertThat(product.getName()).isEqualTo("PVC Super Ketebalan 0.25");
        assertThat(product.getPrice()).isEqualByComparingTo(new BigDecimal("35000.00"));
        assertThat(product.getStockOnHand()).isGreaterThan(BigDecimal.ZERO);
        assertThat(product.getAvailableQuantity()).isGreaterThan(BigDecimal.ZERO);
        assertThat(product.hasAvailableStock(new BigDecimal("10.5"))).isTrue();

        // Test pessimistic lock query
        Optional<Product> locked = productRepository.findByIdWithLock(product.getId());
        assertThat(locked).isPresent();

        // Test multi-product ordered lock (deadlock prevention)
        List<Product> lockedList = productRepository.findAllByIdInWithLock(List.of(product.getId()));
        assertThat(lockedList).hasSize(1);
    }

    @Test
    @DisplayName("TC-03: User inheritance (Customer, Admin) and polymorphic queries")
    void testUserInheritance() {
        // Seed admin exists
        Optional<Admin> admin = adminRepository.findByEmail("admin@ensteinstore.com");
        assertThat(admin).isPresent();
        assertThat(admin.get().getRole()).isEqualTo(Role.ADMIN);

        // Create new Customer
        Customer customer = new Customer(
                "Budi Konveksi",
                "budi@konveksi.test",
                "$2a$10$hashedpasswordxyz",
                "081234567890",
                "Jl. Merdeka No. 10",
                "Bandung"
        );
        Customer saved = customerRepository.save(customer);
        assertThat(saved.getId()).isNotNull();

        // Query via parent UserRepository
        Optional<User> userOpt = userRepository.findByEmail("budi@konveksi.test");
        assertThat(userOpt).isPresent();
        assertThat(userOpt.get().getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(userOpt.get()).isInstanceOf(Customer.class);
    }

    @Test
    @DisplayName("TC-04: Atomic Order Number Counter Generation")
    void testAtomicOrderNumberCounter() {
        LocalDate today = LocalDate.now();
        int seq1 = orderNumberCounterRepository.getNextOrderSequence(today);
        int seq2 = orderNumberCounterRepository.getNextOrderSequence(today);
        int seq3 = orderNumberCounterRepository.getNextOrderSequence(today);

        assertThat(seq2).isEqualTo(seq1 + 1);
        assertThat(seq3).isEqualTo(seq2 + 1);
    }

    @Test
    @DisplayName("TC-04: Cart & CartItem persistence with calculation")
    void testCartAndCartItems() {
        Customer customer = customerRepository.save(new Customer(
                "Siti Tailor", "siti@tailor.test", "pwdhash", "0811111111", "Jl. Mawar", "Kebumen"
        ));

        Product product = productRepository.findByProductCode("PRD-BHN-001").orElseThrow();

        Cart cart = new Cart(customer);
        cart.addItem(product, new BigDecimal("2.500"), product.getPrice());
        Cart savedCart = cartRepository.save(cart);

        assertThat(savedCart.getId()).isNotNull();
        assertThat(savedCart.getItems()).hasSize(1);
        assertThat(savedCart.calculateSubtotal())
                .isEqualByComparingTo(new BigDecimal("87500.00")); // 2.5 * 35,000 = 87,500
    }

    @Test
    @DisplayName("TC-04: Order, OrderItem, and Payment 1:1 relationship")
    void testOrderAndPayment() {
        Customer customer = customerRepository.save(new Customer(
                "Joko Konveksi", "joko@konveksi.test", "pwdhash", "0822222222", "Jl. Melati", "Solo"
        ));
        Product product = productRepository.findByProductCode("PRD-ALT-001").orElseThrow();

        Order order = new Order();
        order.setOrderNumber("EST-REPO-" + System.currentTimeMillis());
        order.setCustomer(customer);
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.PENDING_PAYMENT);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setFulfillmentMethod(FulfillmentMethod.DELIVERY);
        order.setRecipientName("Joko");
        order.setRecipientPhone("0822222222");
        order.setDeliveryAddress("Jl. Melati No. 5, Solo");
        order.setSubtotal(new BigDecimal("50000.00"));
        order.setDeliveryFee(new BigDecimal("15000.00"));
        order.setTotalAmount(new BigDecimal("65000.00"));
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setOrderDate(OffsetDateTime.now());

        OrderItem item = new OrderItem(
                order, product, product.getProductCode(), product.getName(),
                product.getUnit().getUnitSymbol(), new BigDecimal("100"), product.getPrice()
        );
        order.addItem(item);

        Order savedOrder = orderRepository.save(order);
        assertThat(savedOrder.getId()).isNotNull();
        assertThat(savedOrder.getItems()).hasSize(1);

        // Create Payment
        Payment payment = new Payment(savedOrder, PaymentMethod.BANK_TRANSFER, savedOrder.getTotalAmount());
        Payment savedPayment = paymentRepository.save(payment);
        assertThat(savedPayment.getId()).isNotNull();

        // Test payment locking
        Optional<Payment> lockedPayment = paymentRepository.findByOrderIdWithLock(savedOrder.getId());
        assertThat(lockedPayment).isPresent();
        assertThat(lockedPayment.get().getAmount()).isEqualByComparingTo(new BigDecimal("65000.00"));
    }

    @Test
    @DisplayName("TC-02: StockMovements audit trail exists")
    void testStockMovements() {
        Product product = productRepository.findByProductCode("PRD-BHN-001").orElseThrow();
        List<StockMovement> movements = stockMovementRepository.findAllByProductIdOrderByCreatedAtDesc(product.getId());
        assertThat(movements).isNotEmpty();
        assertThat(movements).anyMatch(m -> m.getMovementType() == StockMovementType.STOCK_IN);
    }
}
