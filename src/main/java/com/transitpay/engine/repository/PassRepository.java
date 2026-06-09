package com.transitpay.engine.repository;
import com.transitpay.engine.model.CommuterPass;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PassRepository extends JpaRepository<CommuterPass, Long> {
    CommuterPass findByPassUuid(String passUuid);
}