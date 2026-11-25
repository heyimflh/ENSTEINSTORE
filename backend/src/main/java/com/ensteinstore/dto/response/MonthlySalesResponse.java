package com.ensteinstore.dto.response;

import java.math.BigDecimal;

public class MonthlySalesResponse {
    private String month;
    private long totalOrders;
    private long paidOrders;
    private BigDecimal revenue;

    public MonthlySalesResponse() {}

    public MonthlySalesResponse(String month, long totalOrders, long paidOrders, BigDecimal revenue) {
        this.month = month;
        this.totalOrders = totalOrders;
        this.paidOrders = paidOrders;
        this.revenue = revenue;
    }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }

    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public long getPaidOrders() { return paidOrders; }
    public void setPaidOrders(long paidOrders) { this.paidOrders = paidOrders; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
}
