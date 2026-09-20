package com.transitpay.engine.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "fare_ledger")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FareReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "card_id", nullable = false)
    private String cardId;

    @Column(nullable = false)
    private String type; // "DEPOSIT" or "TICKET_PURCHASE"

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private Long timestamp;
}
