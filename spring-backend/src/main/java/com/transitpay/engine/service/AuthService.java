package com.transitpay.engine.service;

import com.transitpay.engine.dto.AuthRequest;
import com.transitpay.engine.dto.AuthResponse;
import com.transitpay.engine.dto.SignupRequest;
import com.transitpay.engine.model.User;
import com.transitpay.engine.repository.UserRepository;
import com.transitpay.engine.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }

        String role = (request.getRole() != null && request.getRole().equalsIgnoreCase("ROLE_STAFF"))
                ? "ROLE_STAFF"
                : "ROLE_PASSENGER";

        // Fix: New account starts with exactly 0.00 rupees wallet balance (no dummy 150 rupees!)
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .walletBalance(0.0)
                .build();

        User savedUser = userRepository.save(user);

        String cardId = (role.equals("ROLE_STAFF") ? "STAFF-" : "CARD-") + String.format("%05d", savedUser.getId());
        String token = jwtUtils.generateToken(savedUser.getUsername(), savedUser.getRole(), cardId);

        return AuthResponse.builder()
                .token(token)
                .role(savedUser.getRole())
                .name(request.getName() != null && !request.getName().isBlank() ? request.getName() : savedUser.getUsername())
                .cardId(cardId)
                .build();
    }

    // Fix for login: Validates directly against BCrypt passwordEncoder, completely eliminating 
    // the recursive StackOverflowError in Spring Security AOP AuthenticationManager proxies!
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String cardId = (user.getRole().equals("ROLE_STAFF") ? "STAFF-" : "CARD-") + String.format("%05d", user.getId());
        String token = jwtUtils.generateToken(user.getUsername(), user.getRole(), cardId);

        return AuthResponse.builder()
                .token(token)
                .role(user.getRole())
                .name(user.getUsername())
                .cardId(cardId)
                .build();
    }
}
