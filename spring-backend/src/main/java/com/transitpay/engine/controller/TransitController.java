package com.transitpay.engine.controller;

import com.transitpay.engine.dto.TicketRequest;
import com.transitpay.engine.model.Ticket;
import com.transitpay.engine.service.TransitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/staff", "/api/transit"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransitController {

    private final TransitService transitService;

    @GetMapping("/tickets")
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return ResponseEntity.ok(transitService.getAllTickets());
    }

    @GetMapping("/wallet/{cardId}")
    public ResponseEntity<?> getWalletInfo(@PathVariable String cardId) {
        try {
            Map<String, Object> walletInfo = transitService.getWalletInfoByCardId(cardId);
            return ResponseEntity.ok(walletInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping({"/ticket", "/issue-ticket"})
    public ResponseEntity<?> issueTicket(@RequestBody TicketRequest request) {
        try {
            Ticket ticket = transitService.issueTicket(request);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
