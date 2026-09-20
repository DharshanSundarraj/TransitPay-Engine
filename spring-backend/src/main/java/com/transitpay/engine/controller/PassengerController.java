package com.transitpay.engine.controller;

import com.transitpay.engine.dto.DepositRequest;
import com.transitpay.engine.dto.PassengerProfileResponse;
import com.transitpay.engine.service.TransitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/passenger")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PassengerController {

    private final TransitService transitService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        try {
            PassengerProfileResponse profile = transitService.getPassengerProfile(authentication.getName());
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@RequestBody DepositRequest request, Authentication authentication) {
        try {
            Double newBalance = transitService.deposit(authentication.getName(), request.getAmount());
            return ResponseEntity.ok(Map.of("message", "Deposit successful", "walletBalance", newBalance));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
