package com.ensteinstore.security;

import com.ensteinstore.dto.request.LoginRequest;
import com.ensteinstore.dto.request.RegisterRequest;
import com.ensteinstore.dto.request.UpdateProfileRequest;
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

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * TC-05, TC-06, TC-07 Integration Tests for Spring Security + JWT Authentication.
 *
 * NOTE: This test class does NOT use @Transactional intentionally.
 * AuthenticationManager.authenticate() opens a NEW transaction inside the SecurityFilterChain
 * (via CustomUserDetailsService). If the test method is wrapped in @Transactional, the
 * registered user written in that same transaction is NOT yet committed when authenticate() runs
 * in a separate READ_COMMITTED transaction — causing spurious 401 failures.
 *
 * Instead, we use @BeforeEach JdbcTemplate cleanup to remove test-specific data, keeping
 * the test suite idempotent and isolated.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("integration-test")
class AuthIntegrationIT {

    /**
     * Attempt to start Testcontainers. Falls back to null (live PostgreSQL) if Docker is unavailable.
     * When null, @DynamicPropertySource does nothing and spring.datasource.url from
     * application-integration-test.yml (localhost:5432) is used instead.
     */
    static PostgreSQLContainer<?> postgres;

    static {
        try {
            postgres = new PostgreSQLContainer<>("postgres:18-alpine")
                    .withDatabaseName("ensteinstore_test")
                    .withUsername("test_user")
                    .withPassword("test_password");
            postgres.start();
        } catch (Throwable t) {
            // Docker not available — fall back to live PostgreSQL on localhost:5432
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
    private JdbcTemplate jdbcTemplate;

    private MockMvc mockMvc;

    // Test-specific emails to clean up before each test run (idempotency)
    private static final String[] TEST_EMAILS = {
        "ahmad.penjahit@test.com",
        "short@test.com",
        "siti.busana@test.com",
        "rudi@test.com"
    };

    @BeforeEach
    void setup() {
        this.mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // Clean up test users from previous runs to ensure test idempotency
        // Uses parameterized IN clause with explicit cast to avoid ambiguity
        for (String email : TEST_EMAILS) {
            jdbcTemplate.update(
                "DELETE FROM users WHERE email = ?", email
            );
        }
    }

    @Test
    @DisplayName("TC-05: Registration success and duplicate email rejection")
    void testRegistration() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Ahmad Penjahit",
                "ahmad.penjahit@test.com",
                "PasswordRahasia123!",
                "081399887766",
                "Jl. Konveksi No. 8",
                "Kebumen"
        );

        // 1. Success registration -> 201 Created
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("ahmad.penjahit@test.com"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"));

        // 2. Duplicate registration -> 400 Bad Request with EMAIL_ALREADY_EXISTS code
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("sudah terdaftar")));
    }

    @Test
    @DisplayName("TC-05: Registration validation failure for short password")
    void testRegistrationValidation() throws Exception {
        RegisterRequest invalid = new RegisterRequest(
                "User Pendek",
                "short@test.com",
                "12345", // < 8 characters
                "0812345",
                "Alamat",
                "Kota"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    @DisplayName("TC-06: Customer & Seed Admin login success")
    void testLoginSuccess() throws Exception {
        // 1. Register customer first (committed immediately — no @Transactional wrapper)
        RegisterRequest reg = new RegisterRequest(
                "Siti Busana", "siti.busana@test.com", "PasswordKuat123!", "0812345678", "Jl. Melati", "Kebumen"
        );
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        // 2. Login customer — data is now committed, visible to authenticate()
        LoginRequest login = new LoginRequest("siti.busana@test.com", "PasswordKuat123!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"));

        // 3. Login Seed Admin (admin@ensteinstore.com / EnsteinAdmin2026!) — from V13 seed
        LoginRequest adminLogin = new LoginRequest("admin@ensteinstore.com", "EnsteinAdmin2026!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    @DisplayName("TC-06: Login failure returns generic error message")
    void testLoginInvalidCredentials() throws Exception {
        LoginRequest wrongPassword = new LoginRequest("admin@ensteinstore.com", "WrongPassword123!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPassword)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Email atau password salah."));
    }

    @Test
    @DisplayName("TC-07: Protected endpoints, Profile management, and Logout token revocation")
    void testProtectedEndpointsAndLogout() throws Exception {
        // 1. Unauthenticated request to /api/me -> 401
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized());

        // 2. Register & obtain token (committed immediately)
        RegisterRequest reg = new RegisterRequest(
                "Rudi Konveksi", "rudi@test.com", "RudiPassword123!", "0877777777", "Jl. Anggrek", "Solo"
        );
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode root = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String token = root.get("token").asText();

        // 3. Authenticated request to /api/me -> 200 OK
        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Rudi Konveksi"))
                .andExpect(jsonPath("$.email").value("rudi@test.com"));

        // 4. Customer attempting to access Admin endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // 5. Update Profile via PUT /api/me
        UpdateProfileRequest update = new UpdateProfileRequest(
                "Rudi Konveksi Updated", "0899999999", "Jl. Anggrek No. 99", "Solo Baru"
        );
        mockMvc.perform(put("/api/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Rudi Konveksi Updated"))
                .andExpect(jsonPath("$.phone").value("0899999999"))
                .andExpect(jsonPath("$.address").value("Jl. Anggrek No. 99"));

        // 6. Logout (Revoke Token)
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("dicabut")));

        // 7. Request to /api/me with the revoked token -> 401 Unauthorized
        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }
}
