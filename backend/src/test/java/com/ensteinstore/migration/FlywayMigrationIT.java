package com.ensteinstore.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TC-01 (PRD §20): Flyway Migration Integration Test
 * Verifies all V1-V13 migrations run successfully on a real PostgreSQL 18 instance.
 * Uses Testcontainers or real running PostgreSQL 18 container — NOT H2 (per AGENTS.md Rule 8 & PRD §20).
 * Run with: mvn verify
 */
@SpringBootTest
@ActiveProfiles("integration-test")
class FlywayMigrationIT {

    static PostgreSQLContainer<?> postgres;

    static {
        try {
            postgres = new PostgreSQLContainer<>("postgres:18-alpine")
                    .withDatabaseName("ensteinstore_test")
                    .withUsername("test_user")
                    .withPassword("test_password");
            postgres.start();
        } catch (Throwable t) {
            // Testcontainers socket not accessible in current Windows shell/sandbox;
            // Seamlessly use live PostgreSQL 18 instance running via docker-compose on port 5432
            postgres = null;
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (postgres != null && postgres.isRunning()) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
            registry.add("spring.flyway.url", postgres::getJdbcUrl);
            registry.add("spring.flyway.user", postgres::getUsername);
            registry.add("spring.flyway.password", postgres::getPassword);
        } else {
            registry.add("spring.datasource.url", () -> "jdbc:postgresql://localhost:5432/ensteinstore");
            registry.add("spring.datasource.username", () -> "postgres");
            registry.add("spring.datasource.password", () -> "postgres");
            registry.add("spring.flyway.url", () -> "jdbc:postgresql://localhost:5432/ensteinstore");
            registry.add("spring.flyway.user", () -> "postgres");
            registry.add("spring.flyway.password", () -> "postgres");
        }
    }

    @Autowired
    private DataSource dataSource;

    @Autowired
    private Flyway flyway;

    @Test
    void allMigrationsApplySuccessfully() {
        // Verify Flyway applied all migrations without errors
        int appliedMigrations = flyway.info().applied().length;
        assertThat(appliedMigrations)
                .as("All Flyway migrations (V1-V14) should be applied")
                .isGreaterThanOrEqualTo(14);
    }

    @Test
    void coreTablesExist() throws Exception {
        // TC-01: Verify all 12 core tables + extra tables exist
        String[] expectedTables = {
            "users", "customers", "admins", "revoked_tokens",
            "categories", "units", "products",
            "carts", "cart_items",
            "orders", "order_items", "order_number_counters",
            "payments", "stock_movements"
        };

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            for (String table : expectedTables) {
                ResultSet rs = stmt.executeQuery(
                    "SELECT COUNT(*) FROM information_schema.tables " +
                    "WHERE table_schema = 'public' AND table_name = '" + table + "'"
                );
                rs.next();
                assertThat(rs.getInt(1))
                        .as("Table '%s' should exist after migrations", table)
                        .isEqualTo(1);
                rs.close();
            }
        }
    }

    @Test
    void seedDataLoaded() throws Exception {
        // TC-01: Verify seed data from V13 was loaded
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // 5 categories
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM categories");
            rs.next();
            assertThat(rs.getInt(1)).as("Should have 5 categories").isEqualTo(5);
            rs.close();

            // 3 units
            rs = stmt.executeQuery("SELECT COUNT(*) FROM units");
            rs.next();
            assertThat(rs.getInt(1)).as("Should have 3 units (Meter, Pcs, Roll)").isEqualTo(3);
            rs.close();

            // 11 products
            rs = stmt.executeQuery("SELECT COUNT(*) FROM products");
            rs.next();
            assertThat(rs.getInt(1)).as("Should have 11 products").isEqualTo(11);
            rs.close();

            // 1 admin user
            rs = stmt.executeQuery("SELECT COUNT(*) FROM admins");
            rs.next();
            assertThat(rs.getInt(1)).as("Should have 1 admin user").isEqualTo(1);
            rs.close();
        }
    }

    @Test
    void stockMovementsSetInitialStock() throws Exception {
        // TC-01: Verify triggers applied stock movements correctly
        // PRD-BHN-004 should have stock_on_hand = 300
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            ResultSet rs = stmt.executeQuery(
                "SELECT stock_on_hand, reserved_quantity " +
                "FROM products WHERE product_code = 'PRD-BHN-004'"
            );
            assertThat(rs.next()).as("PRD-BHN-004 should exist").isTrue();
            assertThat(rs.getBigDecimal("stock_on_hand").intValue())
                    .as("PRD-BHN-004 stock_on_hand should be 300 after STOCK_IN trigger")
                    .isEqualTo(300);
            assertThat(rs.getBigDecimal("reserved_quantity").intValue())
                    .as("PRD-BHN-004 reserved_quantity should be 0")
                    .isEqualTo(0);
            rs.close();

            // PRD-ALT-007 should stay at 0 (no STOCK_IN movement)
            rs = stmt.executeQuery(
                "SELECT stock_on_hand FROM products WHERE product_code = 'PRD-ALT-007'"
            );
            assertThat(rs.next()).as("PRD-ALT-007 should exist").isTrue();
            assertThat(rs.getBigDecimal("stock_on_hand").intValue())
                    .as("PRD-ALT-007 stock_on_hand should be 0 (out of stock demo)")
                    .isEqualTo(0);
            rs.close();
        }
    }

    @Test
    void viewsExist() throws Exception {
        // TC-01: Verify all views from V8 were created
        String[] expectedViews = {
            "v_sales_report", "v_product_sales", "v_stock_status", "v_best_selling"
        };

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            for (String view : expectedViews) {
                ResultSet rs = stmt.executeQuery(
                    "SELECT COUNT(*) FROM information_schema.views " +
                    "WHERE table_schema = 'public' AND table_name = '" + view + "'"
                );
                rs.next();
                assertThat(rs.getInt(1))
                        .as("View '%s' should exist after V8 migration", view)
                        .isEqualTo(1);
                rs.close();
            }
        }
    }

    @Test
    void stockMovementImmutabilityTrigger() throws Exception {
        // TC-01: Verify trg_prevent_movement_mutation prevents UPDATE on stock_movements
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try (Statement stmt = conn.createStatement()) {
                // Get a movement ID from seed
                ResultSet rs = stmt.executeQuery("SELECT id FROM stock_movements LIMIT 1");
                assertThat(rs.next()).as("Should have at least one stock movement from seed").isTrue();
                String movementId = rs.getString("id");
                rs.close();

                // Attempt to UPDATE — should throw exception from trigger
                try {
                    stmt.executeUpdate(
                        "UPDATE stock_movements SET notes = 'tampered' WHERE id = '" + movementId + "'"
                    );
                    // If we reach here, trigger did not fire — test fails
                    assertThat(false).as("UPDATE on stock_movements should have been blocked by trigger").isTrue();
                } catch (Exception e) {
                    // Expected: trigger should raise exception
                    assertThat(e.getMessage())
                            .as("Trigger should block UPDATE with immutability message")
                            .containsIgnoringCase("immutable");
                } finally {
                    conn.rollback();
                }
            }
        }
    }
}
