package com.ensteinstore.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("integration-test")
class CatalogControllerIT {

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

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("GET /api/products - Mengambil katalog produk dengan paginasi dan filter")
    void getProducts_ShouldReturnPagedProducts() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("page", "0")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", notNullValue()))
                .andExpect(jsonPath("$.page", is(0)))
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("GET /api/products?query=... - Pencarian produk berdasarkan nama/kode")
    void searchProducts_ShouldReturnMatchingProducts() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("query", "PVC")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/products/featured - Mengambil produk unggulan beranda")
    void getFeaturedProducts_ShouldReturnFeaturedList() throws Exception {
        mockMvc.perform(get("/api/products/featured")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(Iterable.class)));
    }

    @Test
    @DisplayName("GET /api/products/{idOrCode} - Detail produk berdasarkan kode produk")
    void getProductByCode_ExistingCode_ShouldReturnProduct() throws Exception {
        mockMvc.perform(get("/api/products/PRD-BHN-001")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("PRD-BHN-001")))
                .andExpect(jsonPath("$.name", notNullValue()))
                .andExpect(jsonPath("$.price", notNullValue()))
                .andExpect(jsonPath("$.unit", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/products/{idOrCode} - Produk tidak ditemukan menghasilkan 404")
    void getProductByCode_NonExistent_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/products/PRD-NON-EXISTENT-999")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("PRODUCT_NOT_FOUND")));
    }

    @Test
    @DisplayName("GET /api/categories - Mengambil seluruh kategori lengkap dengan productCount")
    void getAllCategories_ShouldReturnCategoryList() throws Exception {
        mockMvc.perform(get("/api/categories")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].name", notNullValue()))
                .andExpect(jsonPath("$[0].slug", notNullValue()))
                .andExpect(jsonPath("$[0].productCount", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("GET /api/categories/{slugOrId} - Detail kategori berdasarkan slug")
    void getCategoryBySlug_ShouldReturnCategoryDetail() throws Exception {
        mockMvc.perform(get("/api/categories/material-jas-hujan")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug", is("material-jas-hujan")))
                .andExpect(jsonPath("$.name", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/units - Mengambil daftar master satuan produk")
    void getAllUnits_ShouldReturnUnitList() throws Exception {
        mockMvc.perform(get("/api/units")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].unitName", notNullValue()))
                .andExpect(jsonPath("$[0].unitSymbol", notNullValue()));
    }
}
