package com.transitpay.engine.service;

import com.transitpay.engine.model.CommuterPass;
import com.transitpay.engine.model.FareLedger;
import com.transitpay.engine.repository.LedgerRepository;
import com.transitpay.engine.repository.PassRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
public class TransactionService {
    private final PassRepository passRepo;
    private final LedgerRepository ledgerRepo;

    public TransactionService(PassRepository passRepo, LedgerRepository ledgerRepo) {
        this.passRepo = passRepo;
        this.ledgerRepo = ledgerRepo;
    }

    @Transactional
    public FareLedger processRouteFare(String passUuid, String routeCode, BigDecimal fareAmount) {
        CommuterPass pass = passRepo.findByPassUuid(passUuid);
        if (pass == null) throw new RuntimeException("INVALID PASS: UUID not found in system.");
        if (pass.getCurrentBalance().compareTo(fareAmount) < 0) {
            throw new RuntimeException("INSUFFICIENT FUNDS: Balance is ₹" + pass.getCurrentBalance());
        }

        // Deduct Balance
        pass.setCurrentBalance(pass.getCurrentBalance().subtract(fareAmount));
        passRepo.save(pass);

        // Record Ledger
        FareLedger ledger = new FareLedger();
        ledger.setCommuterPass(pass);
        ledger.setRouteCode(routeCode);
        ledger.setFareDeducted(fareAmount);
        return ledgerRepo.save(ledger);
    }
}