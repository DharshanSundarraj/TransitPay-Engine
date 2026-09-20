package com.transitpay.engine.repository;

import com.transitpay.engine.model.CommuterPass;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommuterPassRepository extends JpaRepository<CommuterPass, Long> {
    List<CommuterPass> findByCardId(String cardId);
}
