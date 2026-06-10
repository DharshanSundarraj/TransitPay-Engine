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
        Optional<CommuterPass> passOpt = passRepository.findByPassUuid(passUuid);
        
        if (passOpt.isEmpty()) {
            throw new RuntimeException("Invalid Commuter Pass UUID");
        }

        CommuterPass pass = passOpt.get();

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

    public List<FareReceipt> getLedgerHistory(Long passId) {
        return receiptRepository.findByCommuterPassIdOrderByTransactionTimeDesc(passId);
    }
}