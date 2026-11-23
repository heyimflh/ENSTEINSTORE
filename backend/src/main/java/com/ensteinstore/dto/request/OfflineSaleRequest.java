package com.ensteinstore.dto.request;

import com.ensteinstore.entity.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class OfflineSaleRequest {

    private String customerName;
    private String customerPhone;

    @NotNull(message = "Metode pembayaran wajib dipilih")
    private PaymentMethod paymentMethod;

    @NotEmpty(message = "Item penjualan tidak boleh kosong")
    @Valid
    private List<OfflineSaleItemRequest> items;

    private String notes;

    public OfflineSaleRequest() {
    }

    public OfflineSaleRequest(String customerName, String customerPhone, PaymentMethod paymentMethod,
                              List<OfflineSaleItemRequest> items, String notes) {
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.paymentMethod = paymentMethod;
        this.items = items;
        this.notes = notes;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public List<OfflineSaleItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OfflineSaleItemRequest> items) {
        this.items = items;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
