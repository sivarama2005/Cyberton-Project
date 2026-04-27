package com.pharma.backend.repository;

import com.pharma.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // user is a @ManyToOne field, so we traverse with user_Id
    List<Order> findByUser_Id(Long userId);
}
