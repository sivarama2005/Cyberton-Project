package com.pharma.backend.controllers;

import com.pharma.backend.entity.Medicine;
import com.pharma.backend.entity.Order;
import com.pharma.backend.entity.OrderItem;
import com.pharma.backend.entity.User;
import com.pharma.backend.payload.request.OrderRequest;
import com.pharma.backend.repository.MedicineRepository;
import com.pharma.backend.repository.OrderItemRepository;
import com.pharma.backend.repository.OrderRepository;
import com.pharma.backend.repository.UserRepository;
import com.pharma.backend.security.services.UserDetailsImpl;
import com.pharma.backend.entity.Coupon;
import com.pharma.backend.repository.CouponRepository;
import com.pharma.backend.service.SmsService;
import com.pharma.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SmsService smsService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private CouponRepository couponRepository;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest orderRequest) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        Order order = new Order();
        order.setUser(user);
        order.setStatus("ORDER_CREATED");
        order.setPaymentStatus("PENDING_PAYMENT");
        
        double originalAmount = orderRequest.getTotalAmount();
        double discountAmount = 0.0;
        
        // 1. Process Coupon
        if (orderRequest.getCouponCode() != null && !orderRequest.getCouponCode().trim().isEmpty()) {
            Optional<Coupon> couponOpt = couponRepository.findByCode(orderRequest.getCouponCode().toUpperCase());
            if (couponOpt.isPresent()) {
                Coupon coupon = couponOpt.get();
                boolean valid = true;
                if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now().toLocalDate())) valid = false;
                if (coupon.getMinOrderAmount() != null && originalAmount < coupon.getMinOrderAmount()) valid = false;
                if (coupon.getUsageLimit() != null && coupon.getUsedCount() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) valid = false;
                
                if (valid) {
                    double couponDiscount = 0;
                    if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
                        couponDiscount = originalAmount * (coupon.getDiscountValue() / 100.0);
                    } else if ("FLAT".equalsIgnoreCase(coupon.getDiscountType())) {
                        couponDiscount = coupon.getDiscountValue();
                    }
                    if (couponDiscount > originalAmount) couponDiscount = originalAmount;
                    
                    discountAmount += couponDiscount;
                    order.setCouponCode(coupon.getCode());
                    
                    coupon.setUsedCount((coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) + 1);
                    couponRepository.save(coupon);
                }
            }
        }
        
        // 2. Process Points (10 points = ₹1)
        int pointsUsed = orderRequest.getPointsUsed() != null ? orderRequest.getPointsUsed() : 0;
        int currentPoints = user.getLoyaltyPoints() == null ? 0 : user.getLoyaltyPoints();
        if (pointsUsed > 0 && pointsUsed <= currentPoints) {
            double pointsDiscount = pointsUsed / 10.0; // 10 points = ₹1
            if (pointsDiscount > (originalAmount - discountAmount)) {
                pointsDiscount = originalAmount - discountAmount;
                pointsUsed = (int) (pointsDiscount * 10);
            }
            discountAmount += pointsDiscount;
            order.setPointsUsed(pointsUsed);
            user.setLoyaltyPoints(currentPoints - pointsUsed);
        }
        
        double finalAmount = originalAmount - discountAmount;
        if (finalAmount < 0) finalAmount = 0;
        
        // 3. Award new points based on final paid amount (1 point per 100 INR)
        int newPoints = (int) (finalAmount / 100);
        user.setLoyaltyPoints((user.getLoyaltyPoints() == null ? 0 : user.getLoyaltyPoints()) + newPoints);
        userRepository.save(user);

        order.setTotalAmount(finalAmount);
        order.setDiscountAmount(discountAmount);
        order.setAddress(orderRequest.getAddress());
        order.setContactNumber(orderRequest.getContactNumber());
        order.setCreatedAt(LocalDateTime.now());

        Order savedOrder = orderRepository.save(order);

        orderRequest.getItems().forEach(itemReq -> {
            Optional<Medicine> medOpt = medicineRepository.findById(itemReq.getMedicineId());
            if (medOpt.isPresent()) {
                Medicine medicine = medOpt.get();
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(savedOrder);
                orderItem.setMedicine(medicine);
                orderItem.setQuantity(itemReq.getQuantity());
                orderItem.setPrice(itemReq.getPrice());
                orderItemRepository.save(orderItem);
            }
        });

        // 4. Send Confirmation Email — wrapped so email failure never breaks the order
        List<OrderItem> savedItems = orderItemRepository.findByOrder_Id(savedOrder.getId());
        if (user.getEmail() != null) {
            try {
                emailService.sendOrderConfirmation(user.getEmail(), savedOrder, savedItems);
            } catch (Exception emailEx) {
                System.err.println("[ORDER] Email failed but order was saved: " + emailEx.getMessage());
            }
        }

        return ResponseEntity.ok(savedOrder);
    }

    @GetMapping("/user")
    @PreAuthorize("hasRole('USER')")
    public List<Order> getUserOrders() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return orderRepository.findByUser_Id(userDetails.getId());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody String status) {
        try {
            // Extract status if wrapped in quotes from JSON
            final String finalStatus = status.replace("\"", "");
            
            return orderRepository.findById(id)
                    .map(order -> {
                        // Inventory Update logic: Deduct only when transitioning to INITIATED
                        if (!"INITIATED".equals(order.getStatus()) && "INITIATED".equals(finalStatus)) {
                             deductStockForOrder(order);
                        }
                        order.setStatus(finalStatus);
                        Order updatedOrder = orderRepository.saveAndFlush(order);
                        
                        // Send SMS notification to user
                        if (updatedOrder.getContactNumber() != null && !updatedOrder.getContactNumber().isEmpty()) {
                            smsService.sendOrderStatusUpdate(updatedOrder.getContactNumber(), updatedOrder.getId(), finalStatus);
                        }
                        // Send Email notification to user
                        if (updatedOrder.getUser() != null && updatedOrder.getUser().getEmail() != null) {
                            emailService.sendOrderStatusUpdate(updatedOrder.getUser().getEmail(), updatedOrder.getId(), finalStatus);
                        }
                        
                        return ResponseEntity.ok(new com.pharma.backend.payload.response.MessageResponse("Order status updated successfully to " + finalStatus));
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new com.pharma.backend.payload.response.MessageResponse("Error updating status: " + e.getMessage()));
        }
    }

    private void deductStockForOrder(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrder_Id(order.getId());
        for (OrderItem item : items) {
            Medicine medicine = item.getMedicine();
            if (medicine != null && medicine.getStock() >= item.getQuantity()) {
                medicine.setStock(medicine.getStock() - item.getQuantity());
                medicineRepository.save(medicine);
            }
        }
    }

    // User cancels their own PENDING order — refunds coupon usage + loyalty points
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Order order = orderRepository.findById(id).orElse(null);

        if (order == null || !order.getUser().getId().equals(userDetails.getId())) {
            return ResponseEntity.badRequest().body(new com.pharma.backend.payload.response.MessageResponse("Order not found or access denied."));
        }
        if (!"ORDER_CREATED".equals(order.getStatus()) && !"PENDING_PAYMENT".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body(new com.pharma.backend.payload.response.MessageResponse("Only ORDER_CREATED or PENDING_PAYMENT orders can be cancelled."));
        }

        User user = order.getUser();

        // 1. Refund loyalty points that were used
        if (order.getPointsUsed() != null && order.getPointsUsed() > 0) {
            int refundedPoints = order.getPointsUsed();
            user.setLoyaltyPoints((user.getLoyaltyPoints() == null ? 0 : user.getLoyaltyPoints()) + refundedPoints);
        }

        // 2. Reverse the points that were earned on this order
        double paidAmount = order.getTotalAmount() != null ? order.getTotalAmount() : 0;
        int earnedPoints = (int) (paidAmount / 100);
        int currentPoints = user.getLoyaltyPoints() == null ? 0 : user.getLoyaltyPoints();
        user.setLoyaltyPoints(Math.max(0, currentPoints - earnedPoints));

        // 3. Refund coupon usage count
        if (order.getCouponCode() != null && !order.getCouponCode().isEmpty()) {
            couponRepository.findByCode(order.getCouponCode()).ifPresent(coupon -> {
                if (coupon.getUsedCount() != null && coupon.getUsedCount() > 0) {
                    coupon.setUsedCount(coupon.getUsedCount() - 1);
                    couponRepository.save(coupon);
                }
            });
        }

        userRepository.save(user);
        order.setStatus("CANCELLED");
        orderRepository.save(order);

        return ResponseEntity.ok(new com.pharma.backend.payload.response.MessageResponse("Order cancelled. Points and coupon usage refunded."));
    }

    @PostMapping("/{id}/reorder")    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> reorder(@PathVariable Long id) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Order oldOrder = orderRepository.findById(id).orElse(null);
        
        if (oldOrder == null || !oldOrder.getUser().getId().equals(userDetails.getId())) {
             return ResponseEntity.badRequest().body("Order not found or access denied.");
        }

        List<OrderItem> oldItems = orderItemRepository.findByOrder_Id(oldOrder.getId());
        
        Order newOrder = new Order();
        newOrder.setUser(oldOrder.getUser());
        newOrder.setStatus("ORDER_CREATED");
        newOrder.setPaymentStatus("PENDING_PAYMENT");
        newOrder.setTotalAmount(oldOrder.getTotalAmount());
        newOrder.setAddress(oldOrder.getAddress());
        newOrder.setContactNumber(oldOrder.getContactNumber());
        newOrder.setCreatedAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(newOrder);

        oldItems.forEach(oldItem -> {
             OrderItem newItem = new OrderItem();
             newItem.setOrder(savedOrder);
             newItem.setMedicine(oldItem.getMedicine());
             newItem.setQuantity(oldItem.getQuantity());
             newItem.setPrice(oldItem.getPrice());
             orderItemRepository.save(newItem);
        });

        return ResponseEntity.ok(savedOrder);
    }
}
