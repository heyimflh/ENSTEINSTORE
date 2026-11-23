package com.ensteinstore.service;

import com.ensteinstore.dto.request.OfflineSaleItemRequest;
import com.ensteinstore.dto.request.OfflineSaleRequest;
import com.ensteinstore.dto.response.OrderDetailResponse;
import com.ensteinstore.dto.response.OrderItemResponse;
import com.ensteinstore.dto.response.PaymentResponse;
import com.ensteinstore.entity.*;
import com.ensteinstore.entity.enums.*;
import com.ensteinstore.exception.*;
import com.ensteinstore.repository.OrderItemRepository;
import com.ensteinstore.repository.OrderRepository;
import com.ensteinstore.repository.PaymentRepository;
import com.ensteinstore.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service for Order Lifecycle, Offline Sales, and Cancellations (PRD §8.6, §8.7, §11, TC-14, TC-15).
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final OrderStateMachine orderStateMachine;
    private final OrderNumberService orderNumberService;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        PaymentRepository paymentRepository,
                        ProductRepository productRepository,
                        InventoryService inventoryService,
                        OrderStateMachine orderStateMachine,
                        OrderNumberService orderNumberService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
        this.orderStateMachine = orderStateMachine;
        this.orderNumberService = orderNumberService;
    }

    /**
     * Finds order by UUID or order number (without '#') (K9).
     */
    @Transactional(readOnly = true)
    public OrderDetailResponse getOrderDetail(String idOrNumber, User currentUser) {
        Order order = findOrderByIdOrNumber(idOrNumber);

        // Security check: Customer can only view their own orders
        if (currentUser.getRole() == Role.CUSTOMER) {
            if (order.getCustomer() == null || !order.getCustomer().getId().equals(currentUser.getId())) {
                throw new ForbiddenResourceException("Anda tidak memiliki izin untuk melihat rincian pesanan ini.");
            }
        }

        return mapToOrderDetailResponse(order);
    }

    /**
     * Customer order list (paginated).
     */
    @Transactional(readOnly = true)
    public Page<OrderDetailResponse> getCustomerOrders(UUID customerId, Pageable pageable) {
        return orderRepository.findAllByCustomerIdOrderByOrderDateDesc(customerId, pageable)
                .map(this::mapToOrderDetailResponse);
    }

    /**
     * Admin all orders list (paginated).
     */
    @Transactional(readOnly = true)
    public Page<OrderDetailResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAllByOrderByOrderDateDesc(pageable)
                .map(this::mapToOrderDetailResponse);
    }

    /**
     * Cancels an order and triggers stock release rollback (PRD §8.6, K2, TC-14).
     */
    @Transactional
    public OrderDetailResponse cancelOrder(String idOrNumber, String reason, User user) {
        Order order = findOrderByIdOrNumber(idOrNumber);

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new InvalidOrderStatusException("Pesanan ini sudah dibatalkan sebelumnya.");
        }

        if (order.getOrderStatus() == OrderStatus.COMPLETED) {
            throw new InvalidOrderStatusException("Pesanan yang sudah selesai (COMPLETED) tidak dapat dibatalkan.");
        }

        // Security check
        if (user.getRole() == Role.CUSTOMER) {
            if (order.getCustomer() == null || !order.getCustomer().getId().equals(user.getId())) {
                throw new ForbiddenResourceException("Anda tidak berhak membatalkan pesanan ini.");
            }
            if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
                throw new InvalidOrderStatusException("Pelanggan hanya dapat membatalkan pesanan yang belum dibayar (PENDING_PAYMENT).");
            }
        }

        orderStateMachine.validateTransition(order.getOrderStatus(), OrderStatus.CANCELLED);

        // Release or return stock
        List<OrderItem> items = order.getItems() != null ? order.getItems() : orderItemRepository.findAllByOrderId(order.getId());

        if (order.getOrderStatus() == OrderStatus.PENDING_PAYMENT) {
            // Unreserve stock (trigger UNRESERVE decreases reserved_quantity)
            for (OrderItem item : items) {
                inventoryService.unreserveStock(item.getProduct(), item.getQuantity(), order.getId(), reason, user);
            }

            // Expire payment
            paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
                if (payment.getPaymentStatus() == PaymentStatus.PENDING || payment.getPaymentStatus() == PaymentStatus.WAITING_VERIFICATION) {
                    payment.setPaymentStatus(PaymentStatus.EXPIRED);
                    paymentRepository.save(payment);
                }
            });
        } else if (order.getOrderStatus() == OrderStatus.PROCESSING) {
            // Processing order cancelled by admin -> return actual stock (trigger RETURN increases stock_on_hand)
            for (OrderItem item : items) {
                inventoryService.returnStock(item.getProduct(), item.getQuantity(), order.getId(), reason, user);
            }
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason != null ? reason : "Dibatalkan oleh " + user.getRole());
        order.setCancelledAt(OffsetDateTime.now());
        Order updated = orderRepository.save(order);

        log.info("Order {} cancelled by {}. Reason: {}", order.getOrderNumber(), user.getEmail(), reason);
        return mapToOrderDetailResponse(updated);
    }

    /**
     * Admin updates order status following State Machine transitions (PRD §11).
     */
    @Transactional
    public OrderDetailResponse updateOrderStatus(UUID orderId, OrderStatus newStatus, Admin admin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan tidak ditemukan dengan ID: " + orderId));

        orderStateMachine.validateTransition(order.getOrderStatus(), newStatus, order.getFulfillmentMethod());

        order.setOrderStatus(newStatus);
        Order updated = orderRepository.save(order);

        log.info("Admin {} updated order {} status to {}", admin.getId(), order.getOrderNumber(), newStatus);
        return mapToOrderDetailResponse(updated);
    }

    /**
     * Creates an offline sale for store counter transactions (PRD §8.7, TC-15).
     * Order is created directly as COMPLETED, payment as PAID, and stock deducted via SALE trigger.
     */
    @Transactional
    public OrderDetailResponse createOfflineSale(OfflineSaleRequest request, Admin admin) {
        // 1. Anti-Deadlock: Sort product IDs and lock rows
        List<UUID> productIds = request.getItems().stream()
                .map(OfflineSaleItemRequest::getProductId)
                .sorted()
                .toList();

        List<Product> lockedProducts = productRepository.findAllByIdInWithLock(productIds);
        Map<UUID, Product> productMap = lockedProducts.stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        // 2. Validate availability and calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OfflineSaleItemRequest itemReq : request.getItems()) {
            Product product = productMap.get(itemReq.getProductId());
            if (product == null || !Boolean.TRUE.equals(product.getIsActive())) {
                throw new ProductNotFoundException("Produk ID '" + itemReq.getProductId() + "' tidak ditemukan atau tidak aktif.");
            }

            if (product.getAvailableQuantity().compareTo(itemReq.getQuantity()) < 0) {
                throw new InsufficientStockException(
                        String.format("Stok '%s' tidak mencukupi untuk penjualan offline. Tersedia: %s, Diminta: %s",
                                product.getName(), product.getAvailableQuantity(), itemReq.getQuantity())
                );
            }

            BigDecimal itemTotal = product.getPrice().multiply(itemReq.getQuantity());
            subtotal = subtotal.add(itemTotal);
        }

        // 3. Generate atomic order number
        String orderNumber = orderNumberService.generateOrderNumber();

        // 4. Create COMPLETED Order
        String customerName = request.getCustomerName() != null && !request.getCustomerName().isBlank()
                ? request.getCustomerName()
                : "Pelanggan Toko (Offline)";

        Order order = new Order(
                orderNumber,
                null, // No registered customer for anonymous walk-in sales
                OrderType.OFFLINE,
                OrderStatus.COMPLETED,
                FulfillmentMethod.IN_STORE,
                subtotal,
                BigDecimal.ZERO, // No delivery fee for offline counter pickup
                subtotal,
                customerName,
                request.getCustomerPhone(),
                "Toko Enstein Kebumen (Penjualan Langsung)"
        );
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setNotes(request.getNotes());
        order.setCreatedByAdmin(admin);
        Order savedOrder = orderRepository.save(order);

        // 5. Create OrderItems & Deduct Stock via SALE trigger (single choke point)
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        for (OfflineSaleItemRequest itemReq : request.getItems()) {
            Product product = productMap.get(itemReq.getProductId());
            BigDecimal itemSubtotal = product.getPrice().multiply(itemReq.getQuantity());

            OrderItem orderItem = new OrderItem(
                    savedOrder,
                    product,
                    itemReq.getQuantity(),
                    product.getPrice(),
                    itemSubtotal
            );
            orderItemRepository.save(orderItem);

            // Direct SALE deduction (triggers trg_apply_stock_movement -> decreases stock_on_hand)
            inventoryService.directSale(product, itemReq.getQuantity(), savedOrder.getId(), admin);

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

        // 6. Create PAID Payment record
        Payment payment = new Payment(
                savedOrder,
                subtotal,
                request.getPaymentMethod(),
                PaymentStatus.PAID
        );
        payment.setPaidAt(OffsetDateTime.now());
        payment.setVerifiedByAdmin(admin);
        paymentRepository.save(payment);

        log.info("Created offline sale order {} with total {}", orderNumber, subtotal);

        PaymentResponse paymentResponse = new PaymentResponse(
                payment.getId(),
                payment.getPaymentMethod(),
                payment.getPaymentStatus(),
                payment.getAmount(),
                null,
                payment.getSubmittedAt(),
                payment.getPaidAt(),
                null
        );

        return new OrderDetailResponse(
                savedOrder.getId(),
                savedOrder.getOrderNumber(),
                savedOrder.getOrderType(),
                savedOrder.getOrderStatus(),
                savedOrder.getFulfillmentMethod(),
                savedOrder.getSubtotal(),
                savedOrder.getDeliveryFee(),
                savedOrder.getTotalAmount(),
                savedOrder.getRecipientName(),
                savedOrder.getRecipientPhone(),
                savedOrder.getDeliveryAddress(),
                savedOrder.getOrderDate(),
                savedOrder.getPaymentDeadline(),
                savedOrder.getCancelledAt(),
                savedOrder.getCancellationReason(),
                savedOrder.getNotes(),
                itemResponses,
                paymentResponse
        );
    }

    private Order findOrderByIdOrNumber(String idOrNumber) {
        if (idOrNumber == null || idOrNumber.isBlank()) {
            throw new ResourceNotFoundException("Identifier pesanan tidak boleh kosong.");
        }

        // Strip '#' prefix if present from frontend UI (K9)
        String cleanIdOrNumber = idOrNumber.startsWith("#") ? idOrNumber.substring(1) : idOrNumber;

        UUID uuid = null;
        try {
            uuid = UUID.fromString(cleanIdOrNumber);
        } catch (IllegalArgumentException ignored) {
            // Not a UUID, search by orderNumber
        }

        return orderRepository.findByIdOrOrderNumber(uuid, cleanIdOrNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan tidak ditemukan dengan nomor/ID: " + idOrNumber));
    }

    private OrderDetailResponse mapToOrderDetailResponse(Order order) {
        List<OrderItem> items = order.getItems() != null && !order.getItems().isEmpty()
                ? order.getItems()
                : orderItemRepository.findAllByOrderId(order.getId());

        List<OrderItemResponse> itemResponses = items.stream().map(item -> new OrderItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getProductCode(),
                item.getProduct().getName(),
                item.getProduct().getImage(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getProduct().getUnit().getUnitName().toLowerCase(),
                item.getProduct().getUnit().getUnitSymbol(),
                item.getSubtotal()
        )).toList();

        PaymentResponse paymentResponse = paymentRepository.findByOrderId(order.getId())
                .map(p -> new PaymentResponse(
                        p.getId(),
                        p.getPaymentMethod(),
                        p.getPaymentStatus(),
                        p.getAmount(),
                        p.getTransferProofUrl(),
                        p.getSubmittedAt(),
                        p.getPaidAt(),
                        p.getRejectionReason()
                )).orElse(null);

        return new OrderDetailResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getOrderType(),
                order.getOrderStatus(),
                order.getFulfillmentMethod(),
                order.getSubtotal(),
                order.getDeliveryFee(),
                order.getTotalAmount(),
                order.getRecipientName(),
                order.getRecipientPhone(),
                order.getDeliveryAddress(),
                order.getOrderDate(),
                order.getPaymentDeadline(),
                order.getCancelledAt(),
                order.getCancellationReason(),
                order.getNotes(),
                itemResponses,
                paymentResponse
        );
    }
}
