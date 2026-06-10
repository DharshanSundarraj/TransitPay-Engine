package com.transitpay.engine.controller;

import com.transitpay.engine.model.CommuterPass;
import com.transitpay.engine.model.FareReceipt;
import com.transitpay.engine.repository.CommuterPassRepository;
import com.transitpay.engine.service.TransitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transit")
@CrossOrigin(origins = "*") 
public class TransitController {

    @Autowired
    private TransitService transitService;

    @Autowired
    private CommuterPassRepository passRepository;

    @PostMapping("/issue-pass")
    public ResponseEntity<CommuterPass> issuePass(@RequestBody CommuterPass pass) {
        CommuterPass savedPass = transitService.issueNewPass(pass);
        return ResponseEntity.ok(savedPass);
    }

    @GetMapping("/pass/{uuid}")
    public ResponseEntity<CommuterPass> getPassByUuid(@PathVariable String uuid) {
        return passRepository.findByPassUuid(uuid)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pass/phone/{phone}")
    public ResponseEntity<CommuterPass> getPassByPhone(@PathVariable String phone) {
        return passRepository.findByPassengerPhone(phone)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pass/name/{name}")
    public ResponseEntity<CommuterPass> getPassByName(@PathVariable String name) {
        return passRepository.findByPassengerName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/authorize-fare")
    public ResponseEntity<?> authorizeFare(@RequestBody Map<String, Object> payload) {
        try {
            if (!payload.containsKey("passUuid") || !payload.containsKey("routeCode") || !payload.containsKey("fareAmount")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing processing keys in payload structure."));
            }

            String uuid = payload.get("passUuid").toString();
            String route = payload.get("routeCode").toString();
            Double amount = Double.valueOf(payload.get("fareAmount").toString());

            FareReceipt receipt = transitService.processFare(uuid, route, amount);
            return ResponseEntity.ok(receipt);
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "System parsing failure."));
        }
    }

    @GetMapping("/ledger/{passId}")
    public ResponseEntity<List<FareReceipt>> getLedger(@PathVariable Long passId) {
        List<FareReceipt> ledger = transitService.getLedgerHistory(passId);
        return ResponseEntity.ok(ledger);
    }
}