package com.ensteinstore.service;

import com.ensteinstore.dto.request.LoginRequest;
import com.ensteinstore.dto.request.RegisterRequest;
import com.ensteinstore.dto.response.AuthResponse;
import com.ensteinstore.dto.response.UserProfileResponse;
import com.ensteinstore.entity.Customer;
import com.ensteinstore.entity.RevokedToken;
import com.ensteinstore.exception.EmailAlreadyExistsException;
import com.ensteinstore.repository.CustomerRepository;
import com.ensteinstore.repository.RevokedTokenRepository;
import com.ensteinstore.repository.UserRepository;
import com.ensteinstore.security.JwtTokenProvider;
import com.ensteinstore.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * Authentication & Token management service (FR-01, FR-02, FR-03, K12).
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final RevokedTokenRepository revokedTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       CustomerRepository customerRepository,
                       RevokedTokenRepository revokedTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.revokedTokenRepository = revokedTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
    }

    /**
     * FR-01: Public registration creates CUSTOMER account only (K12).
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        Customer customer = new Customer(
                request.getFullName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getPhone(),
                request.getAddress(),
                request.getCity()
        );

        Customer savedCustomer = customerRepository.save(customer);

        UserPrincipal principal = new UserPrincipal(savedCustomer);
        String token = jwtTokenProvider.generateToken(principal);

        UserProfileResponse userProfile = new UserProfileResponse(
                savedCustomer.getId(),
                savedCustomer.getFullName(),
                savedCustomer.getEmail(),
                savedCustomer.getRole().name(),
                savedCustomer.getPhone(),
                savedCustomer.getAddress(),
                savedCustomer.getCity()
        );

        return new AuthResponse(token, jwtTokenProvider.getExpirationMs(), userProfile);
    }

    /**
     * FR-02: Authenticate user credentials and issue JWT token.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Authenticate with Spring Security (throws BadCredentialsException on failure -> handled by GlobalExceptionHandler)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(principal);

        UserProfileResponse userProfile = new UserProfileResponse(
                principal.getId(),
                principal.getFullName(),
                principal.getEmail(),
                principal.getRole().name(),
                principal.getPhone(),
                principal.getAddress(),
                principal.getCity()
        );

        return new AuthResponse(token, jwtTokenProvider.getExpirationMs(), userProfile);
    }

    /**
     * FR-03: Logout user by blacklisting token jti into revoked_tokens table (K12).
     */
    @Transactional
    public void logout(String bearerToken) {
        if (bearerToken == null || bearerToken.isBlank()) {
            return;
        }

        String token = bearerToken.startsWith("Bearer ") ? bearerToken.substring(7) : bearerToken;

        try {
            if (jwtTokenProvider.validateToken(token)) {
                String jti = jwtTokenProvider.getJtiFromToken(token);
                OffsetDateTime expiresAt = jwtTokenProvider.getExpirationFromToken(token);

                if (jti != null && !revokedTokenRepository.existsByJti(jti)) {
                    revokedTokenRepository.save(new RevokedToken(jti, expiresAt));
                    log.info("Token with jti {} successfully revoked", jti);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to revoke token during logout: {}", e.getMessage());
        }
    }

    /**
     * Scheduled cleanup of expired revoked tokens every hour (K12).
     */
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanExpiredRevokedTokens() {
        int deleted = revokedTokenRepository.deleteExpiredTokens(OffsetDateTime.now());
        if (deleted > 0) {
            log.info("Cleaned up {} expired revoked tokens from blacklist", deleted);
        }
    }
}
