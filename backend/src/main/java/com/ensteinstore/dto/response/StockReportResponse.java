package com.ensteinstore.dto.response;

import java.math.BigDecimal;

public class StockReportResponse {
    private String productCode;
    private String productName;
    private String categoryName;
    private BigDecimal stockOnHand;
    private BigDecimal reservedQuantity;
    private BigDecimal availableQuantity;
    private String unitName;
    private BigDecimal price;
    private String status;

    public StockReportResponse() {}

    public StockReportResponse(String productCode, String productName, String categoryName,
                               BigDecimal stockOnHand, BigDecimal reservedQuantity, BigDecimal availableQuantity,
                               String unitName, BigDecimal price, String status) {
        this.productCode = productCode;
        this.productName = productName;
        this.categoryName = categoryName;
        this.stockOnHand = stockOnHand;
        this.reservedQuantity = reservedQuantity;
        this.availableQuantity = availableQuantity;
        this.unitName = unitName;
        this.price = price;
        this.status = status;
    }

    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public BigDecimal getStockOnHand() { return stockOnHand; }
    public void setStockOnHand(BigDecimal stockOnHand) { this.stockOnHand = stockOnHand; }

    public BigDecimal getReservedQuantity() { return reservedQuantity; }
    public void setReservedQuantity(BigDecimal reservedQuantity) { this.reservedQuantity = reservedQuantity; }

    public BigDecimal getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(BigDecimal availableQuantity) { this.availableQuantity = availableQuantity; }

    public String getUnitName() { return unitName; }
    public void setUnitName(String unitName) { this.unitName = unitName; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
