package com.transitpay.engine.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private final JwtUtils jwtUtils = new JwtUtils();

    @Test
    void generateToken_shouldContainExpectedClaims() {
        String token = jwtUtils.generateToken("alice", "ROLE_PASSENGER", "CARD-00001");

        assertAll(
                () -> assertEquals("alice", jwtUtils.extractUsername(token)),
                () -> assertEquals("ROLE_PASSENGER", jwtUtils.extractRole(token)),
                () -> assertEquals("CARD-00001", jwtUtils.extractCardId(token)),
                () -> assertTrue(jwtUtils.validateToken(token))
        );
    }

    @Test
    void validateToken_shouldRejectMalformedToken() {
        assertFalse(jwtUtils.validateToken("not-a-valid-jwt"));
    }
}
