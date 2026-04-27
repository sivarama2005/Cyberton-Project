package com.pharma.backend.repository;

import com.pharma.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // order is a @OneToOne field → traverse with order_Id
    Optional<Payment> findByOrder_Id(Long orderId);
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
}
