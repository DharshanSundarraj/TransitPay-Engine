package com.transitpay.engine.repository;

import com.transitpay.engine.model.FareReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FareReceiptRepository extends JpaRepository<FareReceipt, Long> {
    List<FareReceipt> findByCardIdOrderByTimestampDesc(String cardId);
}
