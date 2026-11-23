package com.ensteinstore.entity;

import com.ensteinstore.entity.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

/**
 * Admin entity extending User (PRD §13.4.3, §19.1).
 */
@Entity
@Table(name = "admins")
public class Admin extends User {

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime adminCreatedAt = OffsetDateTime.now();

    public Admin() {
        super();
        setRole(Role.ADMIN);
    }

    public Admin(String fullName, String email, String passwordHash, String phone) {
        super(fullName, email, passwordHash, phone, Role.ADMIN);
        this.adminCreatedAt = OffsetDateTime.now();
    }

    public OffsetDateTime getAdminCreatedAt() {
        return adminCreatedAt;
    }

    public void setAdminCreatedAt(OffsetDateTime adminCreatedAt) {
        this.adminCreatedAt = adminCreatedAt;
    }
}
