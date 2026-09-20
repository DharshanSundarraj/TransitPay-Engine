package com.transitpay.engine.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "commuter_passes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommuterPass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "card_id", nullable = false)
    private String cardId;

    @Column(name = "pass_type", nullable = false)
    private String passType;

    @Column(name = "valid_until", nullable = false)
    private Long validUntil;

    @Column(nullable = false)
    private String status;
}
