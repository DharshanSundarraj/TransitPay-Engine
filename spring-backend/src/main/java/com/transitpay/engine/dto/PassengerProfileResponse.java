package com.transitpay.engine.dto;

import com.transitpay.engine.model.FareReceipt;
import com.transitpay.engine.model.Ticket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PassengerProfileResponse {
    private String name;
    private String cardId;
    private Double walletBalance;
    private List<Ticket> tickets;
    private List<FareReceipt> transactions;
}
