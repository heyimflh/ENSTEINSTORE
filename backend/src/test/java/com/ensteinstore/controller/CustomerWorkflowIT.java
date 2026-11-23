package com.ensteinstore.controller;

import com.ensteinstore.dto.request.CartItemRequest;
import com.ensteinstore.dto.request.CheckoutRequest;
import com.ensteinstore.dto.request.LoginRequest;
import com.ensteinstore.dto.request.RegisterRequest;
import com.ensteinstore.entity.Product;
import com.ensteinstore.entity.enums.FulfillmentMethod;
import com.ensteinstore.entity.enums.PaymentMethod;
import com.ensteinstore.entity.enums.SimulationOutcome;
import com.ensteinstore.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("integration-test")
class CustomerWorkflowIT {

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
    private ProductRepository productRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

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
            jdbcTemplate.update("DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE recipient_name = 'Workflow Customer')");
            jdbcTemplate.update("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE recipient_name = 'Workflow Customer')");
            jdbcTemplate.update("DELETE FROM orders WHERE recipient_name = 'Workflow Customer'");
            jdbcTemplate.update("DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE customer_id IN (SELECT id FROM users WHERE email = 'customer_wf@test.com'))");
            jdbcTemplate.update("DELETE FROM carts WHERE customer_id IN (SELECT id FROM users WHERE email = 'customer_wf@test.com')");
            jdbcTemplate.update("DELETE FROM stock_movements WHERE created_by_id IN (SELECT id FROM users WHERE email = 'customer_wf@test.com')");
            jdbcTemplate.update("DELETE FROM customers WHERE id IN (SELECT id FROM users WHERE email = 'customer_wf@test.com')");
            jdbcTemplate.update("DELETE FROM users WHERE email = 'customer_wf@test.com'");
            jdbcTemplate.update("UPDATE products SET stock_on_hand = 200.000, reserved_quantity = 0.000 WHERE product_code = 'PRD-BHN-002'");
            jdbcTemplate.execute("ALTER TABLE stock_movements ENABLE TRIGGER ALL");
        } catch (Exception ignored) {
        }
    }

    private String obtainCustomerToken(String email, String password, String name) throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                name, email, password, "08123456789", "Jl. Flamboyan No. 12", "Surabaya"
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)));

        LoginRequest loginReq = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.get("token").asText();
    }

    @Test
    @DisplayName("End-to-End Customer Workflow: Cart -> Checkout -> Simulation -> Cancel")
    void fullCustomerWorkflow() throws Exception {
        String token = obtainCustomerToken("customer_wf@test.com", "Password123!", "Workflow Customer");
        String authHeader = "Bearer " + token;

        Product product = productRepository.findByProductCode("PRD-BHN-002")
                .orElseThrow(() -> new IllegalStateException("PRD-BHN-002 seed not found"));

        // 1. GET /api/cart (empty at first)
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems", is(0)));

        // 2. POST /api/cart/items (add item)
        CartItemRequest addReq = new CartItemRequest(product.getId(), new BigDecimal("2.000"));
        MvcResult addResult = mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems", is(1)))
                .andExpect(jsonPath("$.items[0].productCode", is("PRD-BHN-002")))
                .andReturn();

        JsonNode cartJson = objectMapper.readTree(addResult.getResponse().getContentAsString());
        String itemId = cartJson.get("items").get(0).get("id").asText();

        // 3. PUT /api/cart/items/{itemId} (update quantity)
        CartItemRequest updateReq = new CartItemRequest(product.getId(), new BigDecimal("3.000"));
        mockMvc.perform(put("/api/cart/items/" + itemId)
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity", is(3.0)));

        // 4. POST /api/checkout (checkout)
        CheckoutRequest checkoutReq = new CheckoutRequest(
                "Workflow Customer",
                "08123456789",
                FulfillmentMethod.PICKUP,
                "Jl. Flamboyan No. 12",
                PaymentMethod.SIMULATED,
                "Catatan tes pesanan"
        );

        MvcResult checkoutResult = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber", startsWith("EST-")))
                .andExpect(jsonPath("$.orderStatus", is("PENDING_PAYMENT")))
                .andReturn();

        JsonNode checkoutJson = objectMapper.readTree(checkoutResult.getResponse().getContentAsString());
        String orderId = checkoutJson.get("orderId").asText();
        String orderNumber = checkoutJson.get("orderNumber").asText();

        // 5. GET /api/orders/{idOrNumber}
        mockMvc.perform(get("/api/orders/" + orderNumber)
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber", is(orderNumber)))
                .andExpect(jsonPath("$.items", hasSize(1)));

        // 6. POST /api/payments/{orderId}/simulate (Simulate payment)
        mockMvc.perform(post("/api/payments/" + orderId + "/simulate")
                        .header("Authorization", authHeader)
                        .param("outcome", "SUCCESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PAID")));

        // 7. Verify order status transitioned to PROCESSING
        mockMvc.perform(get("/api/orders/" + orderId)
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderStatus", is("PROCESSING")));

        // 8. Test cancellation workflow with a second order
        // Add item to cart again
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk());

        MvcResult checkoutResult2 = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String orderId2 = objectMapper.readTree(checkoutResult2.getResponse().getContentAsString()).get("orderId").asText();

        // Cancel pending order
        mockMvc.perform(post("/api/orders/" + orderId2 + "/cancel")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderStatus", is("CANCELLED")));
    }
}
