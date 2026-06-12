package com.transitpay.engine.service;

import com.transitpay.engine.model.CommuterPass;
import com.transitpay.engine.model.FareReceipt;
import com.transitpay.engine.repository.CommuterPassRepository;
import com.transitpay.engine.repository.FareReceiptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TransitService {

    @Autowired
    private CommuterPassRepository passRepository;

    @Autowired
    private FareReceiptRepository receiptRepository;

    public CommuterPass issueNewPass(CommuterPass newPass) {
        return passRepository.save(newPass);
    }

    @Transactional
    public FareReceipt processFare(String passUuid, String routeCode, Double fareAmount) {
        CommuterPass pass = passRepository.findByPassUuid(passUuid)
                .orElseThrow(() -> new RuntimeException("Invalid Commuter Pass UUID"));

        if (pass.getCurrentBalance() < fareAmount) {
            throw new RuntimeException("Insufficient Balance. Please Top-Up.");
        }

        pass.setCurrentBalance(pass.getCurrentBalance() - fareAmount);
        passRepository.save(pass);

        FareReceipt receipt = new FareReceipt();
        receipt.setCommuterPass(pass);
        receipt.setRouteCode(routeCode);
        receipt.setFareDeducted(fareAmount);

        return receiptRepository.save(receipt);
    }

    // NEW: Enterprise Top-Up Logic
    @Transactional
    public CommuterPass topUpBalance(String passUuid, Double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Top-up amount must be greater than zero.");
        }

        CommuterPass pass = passRepository.findByPassUuid(passUuid)
                .orElseThrow(() -> new RuntimeException("Invalid Commuter Pass UUID"));

        pass.setCurrentBalance(pass.getCurrentBalance() + amount);
        return passRepository.save(pass);
    }

    public List<FareReceipt> getLedgerHistory(Long passId) {
        return receiptRepository.findByCommuterPassIdOrderByTransactionTimeDesc(passId);
    }
}