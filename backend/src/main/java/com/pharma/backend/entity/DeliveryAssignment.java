package com.pharma.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agent_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User agent;

    // ASSIGNED, ACCEPTED, OUT_FOR_DELIVERY, DELIVERED
    private String status = "ASSIGNED";

    private LocalDateTime assignedAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @Transient
    public Long getOrderId() {
        return order != null ? order.getId() : null;
    }

    @Transient
    public Long getAgentId() {
        return agent != null ? agent.getId() : null;
    }

    @Transient
    public String getAgentName() {
        return agent != null ? agent.getUsername() : null;
    }

    @Transient
    public String getDeliveryAddress() {
        return order != null ? order.getAddress() : null;
    }

    @Transient
    public String getContactNumber() {
        return order != null ? order.getContactNumber() : null;
    }

    @Transient
    public String getUserName() {
        return order != null ? order.getUserName() : null;
    }
}
