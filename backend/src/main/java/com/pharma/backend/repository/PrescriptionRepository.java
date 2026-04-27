package com.pharma.backend.repository;

import com.pharma.backend.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    // order is a @OneToOne field → traverse with order_Id
    Optional<Prescription> findByOrder_Id(Long orderId);
}
