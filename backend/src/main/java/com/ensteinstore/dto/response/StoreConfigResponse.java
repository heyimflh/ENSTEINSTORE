package com.ensteinstore.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class StoreConfigResponse {
    private String storeName;
    private String owner;
    private String tagline;
    private String subtagline;
    private String phone;
    private String whatsapp;
    private String email;
    private String address;
    private String hours;
    private BigDecimal deliveryFee;
    private int paymentExpiryHours;
    private boolean simulationEnabled;
    private long maxUploadBytes;
    private List<Map<String, String>> bankAccounts;
    private List<Map<String, String>> ewallets;

    public StoreConfigResponse() {
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getTagline() {
        return tagline;
    }

    public void setTagline(String tagline) {
        this.tagline = tagline;
    }

    public String getSubtagline() {
        return subtagline;
    }

    public void setSubtagline(String subtagline) {
        this.subtagline = subtagline;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getWhatsapp() {
        return whatsapp;
    }

    public void setWhatsapp(String whatsapp) {
        this.whatsapp = whatsapp;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getHours() {
        return hours;
    }

    public void setHours(String hours) {
        this.hours = hours;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(BigDecimal deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public int getPaymentExpiryHours() {
        return paymentExpiryHours;
    }

    public void setPaymentExpiryHours(int paymentExpiryHours) {
        this.paymentExpiryHours = paymentExpiryHours;
    }

    public boolean isSimulationEnabled() {
        return simulationEnabled;
    }

    public void setSimulationEnabled(boolean simulationEnabled) {
        this.simulationEnabled = simulationEnabled;
    }

    public long getMaxUploadBytes() {
        return maxUploadBytes;
    }

    public void setMaxUploadBytes(long maxUploadBytes) {
        this.maxUploadBytes = maxUploadBytes;
    }

    public List<Map<String, String>> getBankAccounts() {
        return bankAccounts;
    }

    public void setBankAccounts(List<Map<String, String>> bankAccounts) {
        this.bankAccounts = bankAccounts;
    }

    public List<Map<String, String>> getEwallets() {
        return ewallets;
    }

    public void setEwallets(List<Map<String, String>> ewallets) {
        this.ewallets = ewallets;
    }
}
