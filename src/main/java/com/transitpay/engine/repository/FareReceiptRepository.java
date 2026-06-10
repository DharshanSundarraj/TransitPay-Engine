package com.transitpay.engine.repository;

import com.transitpay.engine.model.FareReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FareReceiptRepository extends JpaRepository<FareReceipt, Long> {
    List<FareReceipt> findByCommuterPassIdOrderByTransactionTimeDesc(Long commuterPassId);
}