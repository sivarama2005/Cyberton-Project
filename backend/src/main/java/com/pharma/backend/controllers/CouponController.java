package com.pharma.backend.controllers;

import com.pharma.backend.entity.Coupon;
import com.pharma.backend.repository.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    @Autowired
    private CouponRepository couponRepository;

    @GetMapping
    public ResponseEntity<?> getAllCoupons() {
        return ResponseEntity.ok(couponRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody Coupon coupon) {
        if (couponRepository.findByCode(coupon.getCode().toUpperCase()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Coupon code already exists"));
        }
        coupon.setCode(coupon.getCode().toUpperCase());
        if (coupon.getUsedCount() == null) coupon.setUsedCount(0);
        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCoupon(@PathVariable Long id, @RequestBody Coupon updated) {
        return couponRepository.findById(id).map(coupon -> {
            coupon.setDiscountType(updated.getDiscountType());
            coupon.setDiscountValue(updated.getDiscountValue());
            coupon.setExpiryDate(updated.getExpiryDate());
            coupon.setMinOrderAmount(updated.getMinOrderAmount());
            coupon.setUsageLimit(updated.getUsageLimit());
            return ResponseEntity.ok(couponRepository.save(coupon));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCoupon(@PathVariable Long id) {
        return couponRepository.findById(id).map(coupon -> {
            couponRepository.delete(coupon);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateCoupon(@RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        Double orderTotal = Double.valueOf(request.get("orderTotal").toString());

        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Coupon code is required"));
        }

        Optional<Coupon> couponOpt = couponRepository.findByCode(code.toUpperCase());
        if (couponOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid coupon code"));
        }

        Coupon coupon = couponOpt.get();

        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Coupon has expired"));
        }

        if (coupon.getMinOrderAmount() != null && orderTotal < coupon.getMinOrderAmount()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Minimum order amount of ₹" + coupon.getMinOrderAmount() + " not reached"));
        }

        if (coupon.getUsageLimit() != null && coupon.getUsedCount() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Coupon usage limit reached"));
        }

        double discount = 0;
        if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = orderTotal * (coupon.getDiscountValue() / 100.0);
        } else if ("FLAT".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = coupon.getDiscountValue();
        }

        // Discount cannot exceed order total
        if (discount > orderTotal) {
            discount = orderTotal;
        }

        Map<String, Object> response = new HashMap<>();
        response.put("code", coupon.getCode());
        response.put("discountAmount", discount);
        response.put("message", "Coupon applied successfully");

        return ResponseEntity.ok(response);
    }
}
