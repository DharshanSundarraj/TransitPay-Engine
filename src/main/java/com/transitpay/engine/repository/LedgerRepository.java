package com.transitpay.engine.repository;
import com.transitpay.engine.model.FareLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface LedgerRepository extends JpaRepository<FareLedger, Long> {
    List<FareLedger> findByCommuterPassIdOrderByTransactionTimeDesc(Long passId);
}