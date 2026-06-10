package com.transitpay.engine.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fare_ledger")
public class FareReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "commuter_pass_id", nullable = false)
    private CommuterPass commuterPass;

    @Column(name = "route_code", nullable = false)
    private String routeCode;

    @Column(name = "fare_deducted", nullable = false)
    private Double fareDeducted;

    @Column(name = "transaction_time", updatable = false)
    private LocalDateTime transactionTime = LocalDateTime.now();

    public FareReceipt() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CommuterPass getCommuterPass() { return commuterPass; }
    public void setCommuterPass(CommuterPass commuterPass) { this.commuterPass = commuterPass; }

    public String getRouteCode() { return routeCode; }
    public void setRouteCode(String routeCode) { this.routeCode = routeCode; }

    public Double getFareDeducted() { return fareDeducted; }
    public void setFareDeducted(Double fareDeducted) { this.fareDeducted = fareDeducted; }

    public LocalDateTime getTransactionTime() { return transactionTime; }
    public void setTransactionTime(LocalDateTime transactionTime) { this.transactionTime = transactionTime; }
}