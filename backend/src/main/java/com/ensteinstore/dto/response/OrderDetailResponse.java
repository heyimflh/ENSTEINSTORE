package com.ensteinstore.dto.response;

import com.ensteinstore.entity.enums.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class OrderDetailResponse {

    private UUID id;
    private String orderNumber;
    private OrderType orderType;
    private OrderStatus orderStatus;
    private FulfillmentMethod fulfillmentMethod;
    private BigDecimal subtotal;
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;
    private String recipientName;
    private String recipientPhone;
    private String deliveryAddress;
    private OffsetDateTime orderDate;
    private OffsetDateTime paymentDeadline;
    private OffsetDateTime cancelledAt;
    private String cancellationReason;
    private String notes;
    private List<OrderItemResponse> items = new ArrayList<>();
    private PaymentResponse payment;

    public OrderDetailResponse() {
    }

    public OrderDetailResponse(UUID id, String orderNumber, OrderType orderType, OrderStatus orderStatus,
                               FulfillmentMethod fulfillmentMethod, BigDecimal subtotal, BigDecimal deliveryFee,
                               BigDecimal totalAmount, String recipientName, String recipientPhone,
                               String deliveryAddress, OffsetDateTime orderDate, OffsetDateTime paymentDeadline,
                               OffsetDateTime cancelledAt, String cancellationReason, String notes,
                               List<OrderItemResponse> items, PaymentResponse payment) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.orderType = orderType;
        this.orderStatus = orderStatus;
        this.fulfillmentMethod = fulfillmentMethod;
        this.subtotal = subtotal;
        this.deliveryFee = deliveryFee;
        this.totalAmount = totalAmount;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.deliveryAddress = deliveryAddress;
        this.orderDate = orderDate;
        this.paymentDeadline = paymentDeadline;
        this.cancelledAt = cancelledAt;
        this.cancellationReason = cancellationReason;
        this.notes = notes;
        this.items = items != null ? items : new ArrayList<>();
        this.payment = payment;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public OrderType getOrderType() {
        return orderType;
    }

    public void setOrderType(OrderType orderType) {
        this.orderType = orderType;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public FulfillmentMethod getFulfillmentMethod() {
        return fulfillmentMethod;
    }

    public void setFulfillmentMethod(FulfillmentMethod fulfillmentMethod) {
        this.fulfillmentMethod = fulfillmentMethod;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(BigDecimal deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public OffsetDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(OffsetDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public OffsetDateTime getPaymentDeadline() {
        return paymentDeadline;
    }

    public void setPaymentDeadline(OffsetDateTime paymentDeadline) {
        this.paymentDeadline = paymentDeadline;
    }

    public OffsetDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(OffsetDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponse> items) {
        this.items = items;
    }

    public PaymentResponse getPayment() {
        return payment;
    }

    public void setPayment(PaymentResponse payment) {
        this.payment = payment;
    }
}
