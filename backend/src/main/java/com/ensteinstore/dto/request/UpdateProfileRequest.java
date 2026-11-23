package com.ensteinstore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @NotBlank(message = "Nama lengkap wajib diisi")
    @Size(max = 100, message = "Nama lengkap maksimal 100 karakter")
    private String fullName;

    @Size(max = 20, message = "Nomor telepon maksimal 20 karakter")
    private String phone;

    private String address;

    @Size(max = 100, message = "Nama kota maksimal 100 karakter")
    private String city;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String fullName, String phone, String address, String city) {
        this.fullName = fullName;
        this.phone = phone;
        this.address = address;
        this.city = city;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }
}
