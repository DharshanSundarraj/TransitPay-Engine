package com.transitpay.engine.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fare_ledger")
public class FareLedger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pass_id", nullable = false)
    @JsonIgnore
    private CommuterPass commuterPass;

    @Column(nullable = false)
    private String routeCode;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fareDeducted;

    @Column(nullable = false)
    private LocalDateTime transactionTime;

    public FareLedger() { this.transactionTime = LocalDateTime.now(); }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CommuterPass getCommuterPass() { return commuterPass; }
    public void setCommuterPass(CommuterPass commuterPass) { this.commuterPass = commuterPass; }
    public String getRouteCode() { return routeCode; }
    public void setRouteCode(String routeCode) { this.routeCode = routeCode; }
    public BigDecimal getFareDeducted() { return fareDeducted; }
    public void setFareDeducted(BigDecimal fareDeducted) { this.fareDeducted = fareDeducted; }
    public LocalDateTime getTransactionTime() { return transactionTime; }
    public void setTransactionTime(LocalDateTime transactionTime) { this.transactionTime = transactionTime; }
}