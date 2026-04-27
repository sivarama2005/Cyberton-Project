package com.pharma.backend.repository;

import com.pharma.backend.entity.DeliveryAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryAssignmentRepository extends JpaRepository<DeliveryAssignment, Long> {
    // agent is a @ManyToOne field → traverse with agent_Id
    List<DeliveryAssignment> findByAgent_Id(Long agentId);
    // order is a @OneToOne field → traverse with order_Id
    Optional<DeliveryAssignment> findByOrder_Id(Long orderId);
    List<DeliveryAssignment> findByStatus(String status);
}
