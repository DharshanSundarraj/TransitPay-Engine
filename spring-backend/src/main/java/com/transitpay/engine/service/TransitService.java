package com.transitpay.engine.service;

import com.transitpay.engine.dto.PassengerProfileResponse;
import com.transitpay.engine.dto.TicketRequest;
import com.transitpay.engine.model.FareReceipt;
import com.transitpay.engine.model.Ticket;
import com.transitpay.engine.model.User;
import com.transitpay.engine.repository.FareReceiptRepository;
import com.transitpay.engine.repository.TicketRepository;
import com.transitpay.engine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TransitService {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final FareReceiptRepository fareReceiptRepository;

    private Long parseUserIdFromCardId(String cardId) {
        if (cardId == null || cardId.trim().isEmpty()) {
            throw new IllegalArgumentException("Card ID cannot be empty");
        }
        String clean = cardId.trim();

        // 1. Check if identifier directly matches a username
        User userByUsername = userRepository.findByUsername(clean).orElse(null);
        if (userByUsername != null) {
            return userByUsername.getId();
        }

        // 2. Try parsing numeric ID (e.g., "CARD-00003", "00003", "3")
        try {
            String num = clean.replaceAll("[^0-9]", "");
            if (!num.isEmpty()) {
                Long id = Long.parseLong(num);
                if (userRepository.existsById(id)) {
                    return id;
                }
            }
        } catch (Exception ignored) {}

        throw new IllegalArgumentException("Card ID or User not found: " + cardId);
    }

    public PassengerProfileResponse getPassengerProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        String cardId = "CARD-" + String.format("%05d", user.getId());
        List<Ticket> tickets = ticketRepository.findByCardIdOrderByTimestampDesc(cardId);
        List<FareReceipt> receipts = fareReceiptRepository.findByCardIdOrderByTimestampDesc(cardId);

        return PassengerProfileResponse.builder()
                .name(user.getUsername())
                .cardId(cardId)
                .walletBalance(user.getWalletBalance())
                .tickets(tickets)
                .transactions(receipts)
                .build();
    }

    @Transactional
    public Double deposit(String username, Double amount) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Deposit amount must be positive");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        double newBalance = user.getWalletBalance() + amount;
        user.setWalletBalance(newBalance);
        userRepository.save(user);

        String cardId = "CARD-" + String.format("%05d", user.getId());

        FareReceipt receipt = FareReceipt.builder()
                .cardId(cardId)
                .type("DEPOSIT")
                .amount(amount)
                .timestamp(System.currentTimeMillis())
                .build();
        fareReceiptRepository.save(receipt);

        return newBalance;
    }

    public Map<String, Object> getWalletInfoByCardId(String cardId) {
        Long userId = parseUserIdFromCardId(cardId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Card not registered with any commuter"));

        Map<String, Object> result = new HashMap<>();
        result.put("name", user.getUsername());
        result.put("cardId", "CARD-" + String.format("%05d", user.getId()));
        result.put("walletBalance", user.getWalletBalance());
        return result;
    }

    @Transactional
    public Ticket issueTicket(TicketRequest request) {
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new IllegalArgumentException("Invalid ticket amount");
        }

        Long userId = parseUserIdFromCardId(request.getCardId());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found: " + request.getCardId()));

        if (user.getWalletBalance() < request.getAmount()) {
            throw new IllegalStateException("Insufficient wallet balance. Current balance: ₹" 
                    + String.format("%.2f", user.getWalletBalance()) 
                    + ", Required: ₹" + String.format("%.2f", request.getAmount()));
        }

        user.setWalletBalance(user.getWalletBalance() - request.getAmount());
        userRepository.save(user);

        Ticket ticket = Ticket.builder()
                .cardId("CARD-" + String.format("%05d", user.getId()))
                .busNumber(request.getBusNumber())
                .boardingStage(request.getBoardingStage())
                .alightingStage(request.getAlightingStage())
                .route(request.getRoute() != null ? request.getRoute() : (request.getBoardingStage() + " -> " + request.getAlightingStage()))
                .amount(request.getAmount())
                .timestamp(System.currentTimeMillis())
                .build();
        Ticket savedTicket = ticketRepository.save(ticket);

        FareReceipt receipt = FareReceipt.builder()
                .cardId(ticket.getCardId())
                .type("TICKET_PURCHASE")
                .amount(request.getAmount())
                .timestamp(ticket.getTimestamp())
                .build();
        fareReceiptRepository.save(receipt);

        return savedTicket;
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAllByOrderByTimestampDesc();
    }
}
