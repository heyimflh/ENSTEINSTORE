package com.ensteinstore.dto.response;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CartResponse {

    private UUID id;
    private List<CartItemResponse> items = new ArrayList<>();
    private int totalItems;
    private BigDecimal subtotal;

    public CartResponse() {
        this.items = new ArrayList<>();
        this.subtotal = BigDecimal.ZERO;
    }

    public CartResponse(UUID id, List<CartItemResponse> items, int totalItems, BigDecimal subtotal) {
        this.id = id;
        this.items = items != null ? items : new ArrayList<>();
        this.totalItems = totalItems;
        this.subtotal = subtotal != null ? subtotal : BigDecimal.ZERO;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public List<CartItemResponse> getItems() {
        return items;
    }

    public void setItems(List<CartItemResponse> items) {
        this.items = items;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}
