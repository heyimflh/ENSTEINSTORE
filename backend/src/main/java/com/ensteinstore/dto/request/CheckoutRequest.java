package com.ensteinstore.dto.request;

import com.ensteinstore.entity.enums.FulfillmentMethod;
import com.ensteinstore.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class CheckoutRequest {

    @NotBlank(message = "Nama penerima wajib diisi")
    private String recipientName;

    @NotBlank(message = "Nomor telepon penerima wajib diisi")
    @Pattern(regexp = "^[0-9+ -]{8,20}$", message = "Format nomor telepon tidak valid")
    private String recipientPhone;

    @NotNull(message = "Metode pemenuhan pesanan (FulfillmentMethod) wajib dipilih")
    private FulfillmentMethod fulfillmentMethod;

    private String deliveryAddress;

    @NotNull(message = "Metode pembayaran (PaymentMethod) wajib dipilih")
    private PaymentMethod paymentMethod;

    private String notes;

    public CheckoutRequest() {
    }

    public CheckoutRequest(String recipientName, String recipientPhone, FulfillmentMethod fulfillmentMethod,
                           String deliveryAddress, PaymentMethod paymentMethod, String notes) {
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.fulfillmentMethod = fulfillmentMethod;
        this.deliveryAddress = deliveryAddress;
        this.paymentMethod = paymentMethod;
        this.notes = notes;
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

    public FulfillmentMethod getFulfillmentMethod() {
        return fulfillmentMethod;
    }

    public void setFulfillmentMethod(FulfillmentMethod fulfillmentMethod) {
        this.fulfillmentMethod = fulfillmentMethod;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
