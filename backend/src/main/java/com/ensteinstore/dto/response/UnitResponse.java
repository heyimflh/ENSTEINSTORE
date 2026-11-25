package com.ensteinstore.dto.response;

import java.util.UUID;

public class UnitResponse {

    private UUID id;
    private String unitName;
    private String unitSymbol;
    private boolean allowDecimal;
    private long productCount;

    public UnitResponse() {
    }

    public UnitResponse(UUID id, String unitName, String unitSymbol, boolean allowDecimal) {
        this(id, unitName, unitSymbol, allowDecimal, 0L);
    }

    public UnitResponse(UUID id, String unitName, String unitSymbol, boolean allowDecimal, long productCount) {
        this.id = id;
        this.unitName = unitName;
        this.unitSymbol = unitSymbol;
        this.allowDecimal = allowDecimal;
        this.productCount = productCount;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUnitName() {
        return unitName;
    }

    public void setUnitName(String unitName) {
        this.unitName = unitName;
    }

    public String getUnitSymbol() {
        return unitSymbol;
    }

    public void setUnitSymbol(String unitSymbol) {
        this.unitSymbol = unitSymbol;
    }

    public boolean isAllowDecimal() {
        return allowDecimal;
    }

    public void setAllowDecimal(boolean allowDecimal) {
        this.allowDecimal = allowDecimal;
    }

    public long getProductCount() {
        return productCount;
    }

    public void setProductCount(long productCount) {
        this.productCount = productCount;
    }
}
