package com.pharma.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Order order;

    // Razorpay order id (rzp_order_id)
    private String razorpayOrderId;

    // Razorpay payment id returned after successful payment
    private String razorpayPaymentId;

    // Razorpay signature for verification
    private String razorpaySignature;

    private Double amount;

    // SUCCESS, FAILED, PENDING
    private String status = "PENDING";

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @Transient
    public Long getOrderId() {
        return order != null ? order.getId() : null;
    }
}
