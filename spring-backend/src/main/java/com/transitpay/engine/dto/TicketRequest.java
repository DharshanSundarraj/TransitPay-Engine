package com.transitpay.engine.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketRequest {
    private String cardId;
    private String busNumber;
    private String boardingStage;
    private String alightingStage;
    private String route;
    private Double amount;
    private Integer passengerCount;
}
