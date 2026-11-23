package com.ensteinstore;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.ActiveProfiles;

/**
 * Smoke test: verifies Spring context loads successfully on the 'integration-test' profile
 * (which connects to PostgreSQL 18). Runs as an integration test (*IT suffix) via Failsafe,
 * NOT by Surefire, to avoid requiring a database on every `mvn test` run.
 *
 * TC-01 prerequisite: if context loads, all beans (security, JPA, Flyway) are wired correctly.
 */
@SpringBootTest(webEnvironment = WebEnvironment.MOCK)
@ActiveProfiles("integration-test")
class EnsteinStoreApplicationIT {

    @Test
    void contextLoads() {
        // If this test passes, the entire Spring application context bootstrapped successfully:
        // - SecurityConfig, JwtAuthenticationFilter, CustomUserDetailsService
        // - All 14 JPA Repositories, Flyway V1-V13 validated
        // - AppProperties, StoreConfigController, GlobalExceptionHandler
    }
}
