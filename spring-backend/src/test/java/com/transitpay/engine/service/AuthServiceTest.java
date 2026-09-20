package com.transitpay.engine.service;

import com.transitpay.engine.dto.AuthRequest;
import com.transitpay.engine.dto.AuthResponse;
import com.transitpay.engine.dto.SignupRequest;
import com.transitpay.engine.model.User;
import com.transitpay.engine.repository.UserRepository;
import com.transitpay.engine.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        reset(userRepository, passwordEncoder, jwtUtils);
    }

    @Test
    void signup_shouldCreatePassengerUserWithToken() {
        SignupRequest request = new SignupRequest("alice", "secret", "Alice", "ROLE_PASSENGER");
        User savedUser = User.builder()
                .id(7L)
                .username("alice")
                .password("encoded-secret")
                .role("ROLE_PASSENGER")
                .walletBalance(0.0)
                .build();

        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(passwordEncoder.encode("secret")).thenReturn("encoded-secret");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtils.generateToken("alice", "ROLE_PASSENGER", "CARD-00007")).thenReturn("token-123");

        AuthResponse response = authService.signup(request);

        assertAll(
                () -> assertEquals("token-123", response.getToken()),
                () -> assertEquals("ROLE_PASSENGER", response.getRole()),
                () -> assertEquals("Alice", response.getName()),
                () -> assertEquals("CARD-00007", response.getCardId())
        );
        verify(userRepository).save(any(User.class));
    }

    @Test
    void signup_shouldRejectDuplicateUsername() {
        SignupRequest request = new SignupRequest("alice", "secret", "Alice", "ROLE_PASSENGER");
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.signup(request));

        assertEquals("Username is already taken", ex.getMessage());
    }

    @Test
    void login_shouldAuthenticateValidCredentials() {
        AuthRequest request = new AuthRequest("alice", "secret");
        User user = User.builder()
                .id(11L)
                .username("alice")
                .password("encoded-secret")
                .role("ROLE_STAFF")
                .walletBalance(12.5)
                .build();

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "encoded-secret")).thenReturn(true);
        when(jwtUtils.generateToken("alice", "ROLE_STAFF", "STAFF-00011")).thenReturn("staff-token");

        AuthResponse response = authService.login(request);

        assertAll(
                () -> assertEquals("staff-token", response.getToken()),
                () -> assertEquals("ROLE_STAFF", response.getRole()),
                () -> assertEquals("alice", response.getName()),
                () -> assertEquals("STAFF-00011", response.getCardId())
        );
    }

    @Test
    void login_shouldRejectInvalidPassword() {
        AuthRequest request = new AuthRequest("alice", "wrong");
        User user = User.builder()
                .id(11L)
                .username("alice")
                .password("encoded-secret")
                .role("ROLE_PASSENGER")
                .walletBalance(0.0)
                .build();

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded-secret")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }
}
