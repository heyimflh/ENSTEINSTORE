package com.ensteinstore.service;

import com.ensteinstore.config.AppProperties;
import com.ensteinstore.dto.request.CheckoutRequest;
import com.ensteinstore.dto.response.CheckoutResponse;
import com.ensteinstore.dto.response.OrderItemResponse;
import com.ensteinstore.entity.*;
import com.ensteinstore.entity.enums.*;
import com.ensteinstore.exception.InsufficientStockException;
import com.ensteinstore.exception.InvalidCartException;
import com.ensteinstore.exception.UserNotFoundException;
import com.ensteinstore.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Checkout Service (PRD §8.4, §19.2, AGENTS.md Rule 5).
 * Executes checkout within an ACID @Transactional boundary with PESSIMISTIC_WRITE row locks
 * ordered by product ID ascending to prevent deadlocks and race conditions.
 */
@Service
public class CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutService.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final InventoryService inventoryService;
    private final OrderNumberService orderNumberService;
    private final AppProperties appProperties;

    public CheckoutService(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           ProductRepository productRepository,
                           OrderRepository orderRepository,
                           OrderItemRepository orderItemRepository,
                           PaymentRepository paymentRepository,
                           CustomerRepository customerRepository,
                           InventoryService inventoryService,
                           OrderNumberService orderNumberService,
                           AppProperties appProperties) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.inventoryService = inventoryService;
        this.orderNumberService = orderNumberService;
        this.appProperties = appProperties;
    }

    /**
     * Executes atomic checkout with pessimistic locking and stock reservation (TC-10).
     */
    @Transactional
    public CheckoutResponse checkout(UUID customerId, CheckoutRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new UserNotFoundException("Pelanggan tidak ditemukan dengan ID: " + customerId));

        Cart cart = cartRepository.findByCustomerIdAndStatus(customerId, CartStatus.ACTIVE)
                .orElseThrow(() -> new InvalidCartException("Keranjang belanja aktif tidak ditemukan."));

        List<CartItem> cartItems = cartItemRepository.findAllByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new InvalidCartException("Keranjang belanja kosong. Silakan pilih produk terlebih dahulu.");
        }

        // 1. Anti-Deadlock: Sort product IDs ascending and acquire PESSIMISTIC_WRITE locks (AGENTS.md Rule 5)
        List<UUID> productIds = cartItems.stream()
                .map(item -> item.getProduct().getId())
                .sorted()
                .toList();

        List<Product> lockedProducts = productRepository.findAllByIdInWithLock(productIds);
        Map<UUID, Product> productMap = lockedProducts.stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        // 2. Validate availability and calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            Product product = productMap.get(item.getProduct().getId());
            if (product == null || !Boolean.TRUE.equals(product.getIsActive())) {
                throw new InvalidCartException("Produk '" + item.getProduct().getName() + "' sudah tidak aktif.");
            }

            if (product.getAvailableQuantity().compareTo(item.getQuantity()) < 0) {
                throw new InsufficientStockException(
                        String.format("Stok '%s' tidak mencukupi saat checkout. Tersedia: %s, Diminta: %s",
                                product.getName(), product.getAvailableQuantity(), item.getQuantity())
                );
            }

            BigDecimal itemTotal = product.getPrice().multiply(item.getQuantity());
            subtotal = subtotal.add(itemTotal);
        }

        // 3. Calculate delivery fee & total
        BigDecimal deliveryFee = BigDecimal.ZERO;
        if (request.getFulfillmentMethod() == FulfillmentMethod.DELIVERY) {
            deliveryFee = appProperties.getDelivery().getFee();
            if (request.getDeliveryAddress() == null || request.getDeliveryAddress().isBlank()) {
                throw new InvalidCartException("Alamat pengiriman wajib diisi untuk metode Diantar (DELIVERY).");
            }
        }
        BigDecimal totalAmount = subtotal.add(deliveryFee);

        // 4. Generate atomic order number (EST-YYYYMMDD-XXXX)
        String orderNumber = orderNumberService.generateOrderNumber();
        OffsetDateTime paymentDeadline = OffsetDateTime.now().plusHours(appProperties.getPayment().getExpiryHours());

        // 5. Create Order
        Order order = new Order(
                orderNumber,
                customer,
                OrderType.ONLINE,
                OrderStatus.PENDING_PAYMENT,
                request.getFulfillmentMethod(),
                subtotal,
                deliveryFee,
                totalAmount,
                request.getRecipientName(),
                request.getRecipientPhone(),
                request.getDeliveryAddress()
        );
        order.setPaymentDeadline(paymentDeadline);
        order.setNotes(request.getNotes());
        Order savedOrder = orderRepository.save(order);

        // 6. Create OrderItems & Reserve Stock via InventoryService (single choke point)
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        for (CartItem cartItem : cartItems) {
            Product product = productMap.get(cartItem.getProduct().getId());
            BigDecimal itemSubtotal = product.getPrice().multiply(cartItem.getQuantity());

            OrderItem orderItem = new OrderItem(
                    savedOrder,
                    product,
                    cartItem.getQuantity(),
                    product.getPrice(),
                    itemSubtotal
            );
            orderItemRepository.save(orderItem);

            // Reserve stock (triggers trg_apply_stock_movement -> increases reserved_quantity)
            inventoryService.reserveStock(product, cartItem.getQuantity(), savedOrder.getId(), customer);

            itemResponses.add(new OrderItemResponse(
                    orderItem.getId(),
                    product.getId(),
                    product.getProductCode(),
                    product.getName(),
                    product.getImage(),
                    orderItem.getUnitPrice(),
                    orderItem.getQuantity(),
                    product.getUnit().getUnitName().toLowerCase(),
                    product.getUnit().getUnitSymbol(),
                    itemSubtotal
            ));
        }

        // 7. Create Payment record (PENDING)
        Payment payment = new Payment(
                savedOrder,
                totalAmount,
                request.getPaymentMethod(),
                PaymentStatus.PENDING
        );
        paymentRepository.save(payment);

        // 8. Convert Cart to CHECKED_OUT
        cart.setStatus(CartStatus.CHECKED_OUT);
        cartRepository.save(cart);

        log.info("Checkout successful. Created order {} (ID: {}) with {} items, total: {}",
                orderNumber, savedOrder.getId(), cartItems.size(), totalAmount);

        return new CheckoutResponse(
                savedOrder.getId(),
                savedOrder.getOrderNumber(),
                savedOrder.getOrderStatus(),
                payment.getPaymentStatus(),
                payment.getPaymentMethod(),
                savedOrder.getFulfillmentMethod(),
                subtotal,
                deliveryFee,
                totalAmount,
                paymentDeadline,
                itemResponses
        );
    }
}
