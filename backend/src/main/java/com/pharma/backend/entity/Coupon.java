package com.pharma.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String discountType; // "PERCENTAGE" or "FLAT"

    @Column(nullable = false)
    private Double discountValue;

    private LocalDate expiryDate;

    private Double minOrderAmount = 0.0;

    private Integer usageLimit; // null means unlimited

    private Integer usedCount = 0;
}
