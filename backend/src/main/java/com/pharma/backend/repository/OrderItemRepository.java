package com.pharma.backend.repository;

import com.pharma.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    // order is a @ManyToOne field → traverse with order_Id
    List<OrderItem> findByOrder_Id(Long orderId);
}
