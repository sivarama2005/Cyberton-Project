package com.pharma.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    private Double totalAmount;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String contactNumber;

    // ORDER_CREATED, PENDING_PAYMENT, PAID, INITIATED, DISPATCHED, DELIVERED, CANCELLED, FAILED
    private String status = "ORDER_CREATED";

    // PENDING_PAYMENT, PAID, FAILED, COD
    private String paymentStatus = "PENDING_PAYMENT";

    // PENDING, ASSIGNED, ACCEPTED, OUT_FOR_DELIVERY, DELIVERED
    private String deliveryStatus = "PENDING";

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private Prescription prescription;

    private LocalDateTime createdAt = LocalDateTime.now();

    private Double discountAmount = 0.0;

    private String couponCode;

    private Integer pointsUsed = 0;

    // Expose user info for admin/delivery views without full user object
    @Transient
    public String getUserName() {
        return user != null ? user.getUsername() : null;
    }

    @Transient
    public String getUserEmail() {
        return user != null ? user.getEmail() : null;
    }

    @Transient
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }
}
