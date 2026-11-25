package com.ensteinstore.dto.response;

import java.math.BigDecimal;

public class TopProductResponse {
    private String productCode;
    private String productName;
    private String categoryName;
    private BigDecimal totalSold;
    private String unitSymbol;
    private BigDecimal totalRevenue;

    public TopProductResponse() {}

    public TopProductResponse(String productCode, String productName, String categoryName,
                              BigDecimal totalSold, String unitSymbol, BigDecimal totalRevenue) {
        this.productCode = productCode;
        this.productName = productName;
        this.categoryName = categoryName;
        this.totalSold = totalSold;
        this.unitSymbol = unitSymbol;
        this.totalRevenue = totalRevenue;
    }

    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public BigDecimal getTotalSold() { return totalSold; }
    public void setTotalSold(BigDecimal totalSold) { this.totalSold = totalSold; }

    public String getUnitSymbol() { return unitSymbol; }
    public void setUnitSymbol(String unitSymbol) { this.unitSymbol = unitSymbol; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
}
