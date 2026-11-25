package com.ensteinstore.dto.response;

import java.time.OffsetDateTime;
import java.util.UUID;

public class UserProfileResponse {

    private UUID id;
    private String fullName;
    private String email;
    private String role;
    private String phone;
    private String address;
    private String city;
    private OffsetDateTime createdAt;

    public UserProfileResponse() {
    }

    public UserProfileResponse(UUID id, String fullName, String email, String role,
            String phone, String address, String city) {
        this(id, fullName, email, role, phone, address, city, null);
    }

    public UserProfileResponse(UUID id, String fullName, String email, String role,
            String phone, String address, String city, OffsetDateTime createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
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

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
