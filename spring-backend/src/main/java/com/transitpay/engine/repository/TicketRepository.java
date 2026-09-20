package com.transitpay.engine.repository;

import com.transitpay.engine.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByCardIdOrderByTimestampDesc(String cardId);
    List<Ticket> findAllByOrderByTimestampDesc();
}
