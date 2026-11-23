package com.ensteinstore.security;

import com.ensteinstore.config.AppProperties;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;

/**
 * JWT Token Provider handling HS256 token generation, signing, and verification (PRD §15.2, K12).
 * Uses Nimbus JOSE JWT with secret and TTL from AppProperties.
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final AppProperties appProperties;
    private final byte[] secretKeyBytes;

    public JwtTokenProvider(AppProperties appProperties) {
        this.appProperties = appProperties;
        String secret = appProperties.getJwt().getSecret();
        // Ensure secret is at least 256 bits (32 bytes) for HS256
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(bytes, 0, padded, 0, bytes.length);
            this.secretKeyBytes = padded;
        } else {
            this.secretKeyBytes = bytes;
        }
    }

    public String generateToken(UserPrincipal principal) {
        try {
            JWSSigner signer = new MACSigner(secretKeyBytes);

            Instant now = Instant.now();
            Instant expiry = now.plusMillis(appProperties.getJwt().getExpirationMs());
            String jti = UUID.randomUUID().toString();

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(principal.getId().toString())
                    .claim("email", principal.getEmail())
                    .claim("role", principal.getRole().name())
                    .jwtID(jti)
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(expiry))
                    .build();

            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            log.error("Failed to generate JWT token: ", e);
            throw new RuntimeException("Gagal membuat token autentikasi.", e);
        }
    }

    public boolean validateToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(secretKeyBytes);

            if (!signedJWT.verify(verifier)) {
                log.warn("Invalid JWT signature.");
                return false;
            }

            Date expiration = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (expiration == null || expiration.before(new Date())) {
                log.warn("JWT token has expired.");
                return false;
            }

            return true;
        } catch (ParseException | JOSEException e) {
            log.warn("JWT parsing/validation failed: {}", e.getMessage());
            return false;
        }
    }

    public SignedJWT parseToken(String token) {
        try {
            return SignedJWT.parse(token);
        } catch (ParseException e) {
            throw new IllegalArgumentException("Format token tidak valid.", e);
        }
    }

    public UUID getUserIdFromToken(String token) {
        try {
            String sub = parseToken(token).getJWTClaimsSet().getSubject();
            return UUID.fromString(sub);
        } catch (ParseException e) {
            throw new IllegalArgumentException("Gagal membaca subject token.", e);
        }
    }

    public String getEmailFromToken(String token) {
        try {
            return parseToken(token).getJWTClaimsSet().getStringClaim("email");
        } catch (ParseException e) {
            throw new IllegalArgumentException("Gagal membaca email token.", e);
        }
    }

    public String getRoleFromToken(String token) {
        try {
            return parseToken(token).getJWTClaimsSet().getStringClaim("role");
        } catch (ParseException e) {
            throw new IllegalArgumentException("Gagal membaca role token.", e);
        }
    }

    public String getJtiFromToken(String token) {
        try {
            return parseToken(token).getJWTClaimsSet().getJWTID();
        } catch (ParseException e) {
            throw new IllegalArgumentException("Gagal membaca jti token.", e);
        }
    }

    public OffsetDateTime getExpirationFromToken(String token) {
        try {
            Date exp = parseToken(token).getJWTClaimsSet().getExpirationTime();
            return exp.toInstant().atZone(ZoneId.of("Asia/Jakarta")).toOffsetDateTime();
        } catch (ParseException e) {
            throw new IllegalArgumentException("Gagal membaca waktu kedaluwarsa token.", e);
        }
    }

    public long getExpirationMs() {
        return appProperties.getJwt().getExpirationMs();
    }
}
