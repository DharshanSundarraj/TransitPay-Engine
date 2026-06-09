package com.transitpay.engine.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "commuter_passes")
public class CommuterPass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String passUuid; // e.g., TNSTC-2026-X89B

    @Column(nullable = false)
    private String passengerName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal currentBalance;

    @Column(nullable = false)
    private LocalDateTime issuedAt;

    public CommuterPass() { this.issuedAt = LocalDateTime.now(); }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPassUuid() { return passUuid; }
    public void setPassUuid(String passUuid) { this.passUuid = passUuid; }
    public String getPassengerName() { return passengerName; }
    public void setPassengerName(String passengerName) { this.passengerName = passengerName; }
    public BigDecimal getCurrentBalance() { return currentBalance; }
    public void setCurrentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; }
}