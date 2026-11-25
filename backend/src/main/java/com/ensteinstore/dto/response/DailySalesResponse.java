package com.ensteinstore.dto.response;

import java.math.BigDecimal;

public class DailySalesResponse {
    private String date;
    private long totalOrders;
    private long paidOrders;
    private BigDecimal revenue;

    public DailySalesResponse() {}

    public DailySalesResponse(String date, long totalOrders, long paidOrders, BigDecimal revenue) {
        this.date = date;
        this.totalOrders = totalOrders;
        this.paidOrders = paidOrders;
        this.revenue = revenue;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public long getPaidOrders() { return paidOrders; }
    public void setPaidOrders(long paidOrders) { this.paidOrders = paidOrders; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
}
