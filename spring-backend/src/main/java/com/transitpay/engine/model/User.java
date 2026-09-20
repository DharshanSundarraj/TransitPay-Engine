package com.transitpay.engine.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // e.g. "ROLE_PASSENGER", "ROLE_STAFF"

    // Real wallet balance initialized to 0.0 - NO dummy/hardcoded 150 rupees
    @Column(name = "wallet_balance", nullable = false)
    @Builder.Default
    private Double walletBalance = 0.0;
}
