package com.ensteinstore.entity;

import com.ensteinstore.entity.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

/**
 * Customer entity extending User (PRD §13.4.2, §19.1).
 */
@Entity
@Table(name = "customers")
public class Customer extends User {

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime customerCreatedAt = OffsetDateTime.now();

    public Customer() {
        super();
        setRole(Role.CUSTOMER);
    }

    public Customer(String fullName, String email, String passwordHash, String phone, String address, String city) {
        super(fullName, email, passwordHash, phone, Role.CUSTOMER);
        this.address = address;
        this.city = city;
        this.customerCreatedAt = OffsetDateTime.now();
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

    public OffsetDateTime getCustomerCreatedAt() {
        return customerCreatedAt;
    }

    public void setCustomerCreatedAt(OffsetDateTime customerCreatedAt) {
        this.customerCreatedAt = customerCreatedAt;
    }
}
