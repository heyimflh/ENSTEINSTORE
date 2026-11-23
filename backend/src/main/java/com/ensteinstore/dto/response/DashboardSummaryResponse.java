package com.ensteinstore.dto.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class DashboardSummaryResponse {

    private SalesSummaryDto sales;
    private StockSummaryDto stock;
    private List<RecentOrderDto> recentOrders = new ArrayList<>();

    public DashboardSummaryResponse() {
    }

    public DashboardSummaryResponse(SalesSummaryDto sales, StockSummaryDto stock, List<RecentOrderDto> recentOrders) {
        this.sales = sales;
        this.stock = stock;
        this.recentOrders = recentOrders != null ? recentOrders : new ArrayList<>();
    }

    public SalesSummaryDto getSales() {
        return sales;
    }

    public void setSales(SalesSummaryDto sales) {
        this.sales = sales;
    }

    public StockSummaryDto getStock() {
        return stock;
    }

    public void setStock(StockSummaryDto stock) {
        this.stock = stock;
    }

    public List<RecentOrderDto> getRecentOrders() {
        return recentOrders;
    }

    public void setRecentOrders(List<RecentOrderDto> recentOrders) {
        this.recentOrders = recentOrders;
    }

    public static class SalesSummaryDto {
        private BigDecimal totalRevenue;
        private long totalOrders;
        private long paidOrders;
        private BigDecimal averageOrderValue;

        public SalesSummaryDto() {
        }

        public SalesSummaryDto(BigDecimal totalRevenue, long totalOrders, long paidOrders, BigDecimal averageOrderValue) {
            this.totalRevenue = totalRevenue;
            this.totalOrders = totalOrders;
            this.paidOrders = paidOrders;
            this.averageOrderValue = averageOrderValue;
        }

        public BigDecimal getTotalRevenue() {
            return totalRevenue;
        }

        public void setTotalRevenue(BigDecimal totalRevenue) {
            this.totalRevenue = totalRevenue;
        }

        public long getTotalOrders() {
            return totalOrders;
        }

        public void setTotalOrders(long totalOrders) {
            this.totalOrders = totalOrders;
        }

        public long getPaidOrders() {
            return paidOrders;
        }

        public void setPaidOrders(long paidOrders) {
            this.paidOrders = paidOrders;
        }

        public BigDecimal getAverageOrderValue() {
            return averageOrderValue;
        }

        public void setAverageOrderValue(BigDecimal averageOrderValue) {
            this.averageOrderValue = averageOrderValue;
        }
    }

    public static class StockSummaryDto {
        private long totalProducts;
        private long inStockProducts;
        private long lowStockProducts;
        private long outOfStockProducts;

        public StockSummaryDto() {
        }

        public StockSummaryDto(long totalProducts, long inStockProducts, long lowStockProducts, long outOfStockProducts) {
            this.totalProducts = totalProducts;
            this.inStockProducts = inStockProducts;
            this.lowStockProducts = lowStockProducts;
            this.outOfStockProducts = outOfStockProducts;
        }

        public long getTotalProducts() {
            return totalProducts;
        }

        public void setTotalProducts(long totalProducts) {
            this.totalProducts = totalProducts;
        }

        public long getInStockProducts() {
            return inStockProducts;
        }

        public void setInStockProducts(long inStockProducts) {
            this.inStockProducts = inStockProducts;
        }

        public long getLowStockProducts() {
            return lowStockProducts;
        }

        public void setLowStockProducts(long lowStockProducts) {
            this.lowStockProducts = lowStockProducts;
        }

        public long getOutOfStockProducts() {
            return outOfStockProducts;
        }

        public void setOutOfStockProducts(long outOfStockProducts) {
            this.outOfStockProducts = outOfStockProducts;
        }
    }

    public static class RecentOrderDto {
        private UUID id;
        private String orderNumber;
        private String customerName;
        private BigDecimal totalAmount;
        private String orderStatus;
        private OffsetDateTime orderDate;

        public RecentOrderDto() {
        }

        public RecentOrderDto(UUID id, String orderNumber, String customerName, BigDecimal totalAmount,
                              String orderStatus, OffsetDateTime orderDate) {
            this.id = id;
            this.orderNumber = orderNumber;
            this.customerName = customerName;
            this.totalAmount = totalAmount;
            this.orderStatus = orderStatus;
            this.orderDate = orderDate;
        }

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

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }

        public BigDecimal getTotalAmount() {
            return totalAmount;
        }

        public void setTotalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
        }

        public String getOrderStatus() {
            return orderStatus;
        }

        public void setOrderStatus(String orderStatus) {
            this.orderStatus = orderStatus;
        }

        public OffsetDateTime getOrderDate() {
            return orderDate;
        }

        public void setOrderDate(OffsetDateTime orderDate) {
            this.orderDate = orderDate;
        }
    }
}
