package com.ensteinstore.controller;

import com.ensteinstore.dto.request.*;
import com.ensteinstore.entity.Category;
import com.ensteinstore.entity.Product;
import com.ensteinstore.entity.Unit;
import com.ensteinstore.entity.enums.OrderStatus;
import com.ensteinstore.entity.enums.PaymentMethod;
import com.ensteinstore.repository.CategoryRepository;
import com.ensteinstore.repository.ProductRepository;
import com.ensteinstore.repository.UnitRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("integration-test")
class AdminWorkflowIT {

    static PostgreSQLContainer<?> postgres;

    static {
        try {
            postgres = new PostgreSQLContainer<>("postgres:18-alpine")
                    .withDatabaseName("ensteinstore_test")
                    .withUsername("test_user")
                    .withPassword("test_password");
            postgres.start();
        } catch (Throwable t) {
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
        }
    }

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        cleanupTestData();
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        cleanupTestData();
    }

    private void cleanupTestData() {
        try {
            jdbcTemplate.execute("ALTER TABLE stock_movements DISABLE TRIGGER ALL");
            jdbcTemplate.update("DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE recipient_name = 'Pelanggan Toko Fisik')");
            jdbcTemplate.update("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE recipient_name = 'Pelanggan Toko Fisik')");
            jdbcTemplate.update("DELETE FROM orders WHERE recipient_name = 'Pelanggan Toko Fisik'");
            jdbcTemplate.update("DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE product_code LIKE 'PRD-ADM-%')");
            jdbcTemplate.update("DELETE FROM order_items WHERE product_id IN (SELECT id FROM products WHERE product_code LIKE 'PRD-ADM-%')");
            jdbcTemplate.update("DELETE FROM products WHERE product_code LIKE 'PRD-ADM-%'");
            jdbcTemplate.execute("ALTER TABLE stock_movements ENABLE TRIGGER ALL");
        } catch (Exception ignored) {
        }
    }

    private String obtainAdminToken() throws Exception {
        LoginRequest loginReq = new LoginRequest("admin@ensteinstore.com", "EnsteinAdmin2026!");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.get("token").asText();
    }

    @Test
    @DisplayName("End-to-End Admin Workflow: Product CRUD, Inventory, POS Sale, Dashboard & Reports")
    void fullAdminWorkflow() throws Exception {
        String token = obtainAdminToken();
        String authHeader = "Bearer " + token;

        Category category = categoryRepository.findAll().get(0);
        Unit unit = unitRepository.findAll().get(0);

        // 1. POST /api/admin/products (Create product)
        String uniqueCode = "PRD-ADM-" + System.currentTimeMillis() % 10000;
        CreateProductRequest createReq = new CreateProductRequest(
                uniqueCode,
                "Produk Tes Admin",
                "Deskripsi produk tes",
                category.getId(),
                unit.getId(),
                new BigDecimal("25000.00"),
                new BigDecimal("5.000"),
                null,
                true,
                true
        );

        MvcResult createResult = mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(uniqueCode)))
                .andExpect(jsonPath("$.stock", is(0)))
                .andReturn();

        String createdProductId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();
        UUID productUuid = UUID.fromString(createdProductId);

        // 2. PUT /api/admin/products/{id} (Update product)
        UpdateProductRequest updateReq = new UpdateProductRequest(
                "Produk Tes Admin Diperbarui",
                "Deskripsi diperbarui",
                category.getId(),
                unit.getId(),
                new BigDecimal("27500.00"),
                new BigDecimal("10.000"),
                null,
                false, // isFeatured
                true   // isActive
        );

        mockMvc.perform(put("/api/admin/products/" + createdProductId)
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Produk Tes Admin Diperbarui")))
                .andExpect(jsonPath("$.price", is(27500.0)));

        // 3. POST /api/admin/inventory/stock-in (Restock / kulakan via DB trigger)
        StockInRequest stockInReq = new StockInRequest(productUuid, new BigDecimal("50.000"), "Kulakan awal");
        mockMvc.perform(post("/api/admin/inventory/stock-in")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(stockInReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementType", is("STOCK_IN")))
                .andExpect(jsonPath("$.quantity", is(50.0)));

        // 4. POST /api/admin/inventory/adjustment (Stock opname via DB trigger)
        StockAdjustmentRequest adjustReq = new StockAdjustmentRequest(productUuid, new BigDecimal("45.000"), "Opname fisik");
        mockMvc.perform(post("/api/admin/inventory/adjustment")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementType", is("ADJUSTMENT")))
                .andExpect(jsonPath("$.stockAfter", is(45.0)));

        // 5. GET /api/admin/inventory/movements
        mockMvc.perform(get("/api/admin/inventory/movements")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", notNullValue()));

        // 6. POST /api/admin/offline-sales (POS in-store sale)
        OfflineSaleItemRequest itemReq = new OfflineSaleItemRequest(productUuid, new BigDecimal("5.000"));
        OfflineSaleRequest posReq = new OfflineSaleRequest(
                "Pelanggan Toko Fisik",
                "081299998888",
                PaymentMethod.CASH,
                Collections.singletonList(itemReq),
                "Penjualan langsung di kasir"
        );

        MvcResult posResult = mockMvc.perform(post("/api/admin/offline-sales")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(posReq)))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderStatus", is("COMPLETED")))
                .andExpect(jsonPath("$.orderType", is("OFFLINE")))
                .andReturn();

        String posOrderId = objectMapper.readTree(posResult.getResponse().getContentAsString()).get("id").asText();

        // 7. GET /api/admin/orders
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", notNullValue()));

        // 8. GET /api/admin/dashboard (Multithreaded CompletableFuture summary)
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sales", notNullValue()))
                .andExpect(jsonPath("$.stock", notNullValue()))
                .andExpect(jsonPath("$.recentOrders", notNullValue()));

        // 9. GET /api/admin/reports/sales/daily (CSV export)
        mockMvc.perform(get("/api/admin/reports/sales/daily")
                        .header("Authorization", authHeader)
                        .param("startDate", LocalDate.now().minusDays(7).toString())
                        .param("endDate", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("text/csv")));

        // 10. GET /api/admin/reports/inventory/stock (CSV export)
        mockMvc.perform(get("/api/admin/reports/inventory/stock")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("text/csv")));

        // 11. DELETE /api/admin/products/{id} (Deactivate product)
        mockMvc.perform(delete("/api/admin/products/" + createdProductId)
                        .header("Authorization", authHeader))
                .andExpect(status().isNoContent());
    }
}
