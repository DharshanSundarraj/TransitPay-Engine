package com.transitpay.engine.repository;

import com.transitpay.engine.model.CommuterPass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommuterPassRepository extends JpaRepository<CommuterPass, Long> {
    Optional<CommuterPass> findByPassUuid(String passUuid);
    Optional<CommuterPass> findByPassengerPhone(String passengerPhone);
    Optional<CommuterPass> findByPassengerName(String passengerName);
}