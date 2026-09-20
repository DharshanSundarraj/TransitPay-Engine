package com.transitpay.engine.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "card_id", nullable = false)
    private String cardId;

    @Column(name = "bus_number", nullable = false)
    private String busNumber;

    @Column(name = "boarding_stage")
    private String boardingStage;

    @Column(name = "alighting_stage")
    private String alightingStage;

    @Column(name = "route", nullable = false)
    private String route;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private Long timestamp;
}
