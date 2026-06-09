package com.transitpay.engine.controller;

import com.transitpay.engine.model.CommuterPass;
import com.transitpay.engine.model.FareLedger;
import com.transitpay.engine.repository.LedgerRepository;
import com.transitpay.engine.repository.PassRepository;
import com.transitpay.engine.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transit")
@CrossOrigin(origins = "*")
public class TransitController {
    private final TransactionService transactionService;
    private final PassRepository passRepo;
    private final LedgerRepository ledgerRepo;

    public TransitController(TransactionService transactionService, PassRepository passRepo, LedgerRepository ledgerRepo) {
        this.transactionService = transactionService;
        this.passRepo = passRepo;
        this.ledgerRepo = ledgerRepo;
    }

    @PostMapping("/issue-pass")
    public CommuterPass issuePass(@RequestBody CommuterPass pass) {
        return passRepo.save(pass);
    }

    @GetMapping("/pass/{uuid}")
    public CommuterPass getPassInfo(@PathVariable String uuid) {
        return passRepo.findByPassUuid(uuid);
    }

    @GetMapping("/ledger/{passId}")
    public List<FareLedger> getAuditLog(@PathVariable Long passId) {
        return ledgerRepo.findByCommuterPassIdOrderByTransactionTimeDesc(passId);
    }

    @PostMapping("/authorize-fare")
    public ResponseEntity<?> authorizeFare(@RequestBody Map<String, Object> payload) {
        try {
            String uuid = payload.get("passUuid").toString();
            String route = payload.get("routeCode").toString();
            java.math.BigDecimal amount = new java.math.BigDecimal(payload.get("fareAmount").toString());
            
            FareLedger receipt = transactionService.processRouteFare(uuid, route, amount);
            return ResponseEntity.ok(receipt);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}