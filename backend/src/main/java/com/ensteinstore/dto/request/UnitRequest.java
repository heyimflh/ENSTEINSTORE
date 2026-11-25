package com.ensteinstore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UnitRequest {

    @NotBlank(message = "Nama satuan wajib diisi")
    @Size(max = 50, message = "Nama satuan maksimal 50 karakter")
    private String unitName;

    @NotBlank(message = "Simbol satuan wajib diisi")
    @Size(max = 20, message = "Simbol satuan maksimal 20 karakter")
    private String unitSymbol;

    private Boolean allowDecimal = false;

    public UnitRequest() {
    }

    public UnitRequest(String unitName, String unitSymbol, Boolean allowDecimal) {
        this.unitName = unitName;
        this.unitSymbol = unitSymbol;
        this.allowDecimal = allowDecimal != null ? allowDecimal : false;
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

    public Boolean getAllowDecimal() {
        return allowDecimal;
    }

    public void setAllowDecimal(Boolean allowDecimal) {
        this.allowDecimal = allowDecimal;
    }
}
