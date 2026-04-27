package com.pharma.backend.controllers;

import com.pharma.backend.entity.User;
import com.pharma.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/rewards")
public class RewardController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/status")
    public ResponseEntity<?> getRewardStatus() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        boolean claimedToday = false;
        if (user.getLastLoginDate() != null && user.getLastLoginDate().equals(LocalDate.now())) {
            claimedToday = true;
        }

        Map<String, Object> response = new HashMap<>();
        response.put("loyaltyPoints", user.getLoyaltyPoints());
        response.put("loginStreak", user.getLoginStreak());
        response.put("claimedToday", claimedToday);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/claim-login")
    public ResponseEntity<?> claimLoginReward() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        LocalDate today = LocalDate.now();
        LocalDate lastLogin = user.getLastLoginDate();

        if (lastLogin != null && lastLogin.equals(today)) {
            return ResponseEntity.badRequest().body("Already claimed today");
        }

        int streak = user.getLoginStreak() == null ? 0 : user.getLoginStreak();
        
        // Calculate streak
        if (lastLogin != null && lastLogin.equals(today.minusDays(1))) {
            streak += 1;
        } else {
            streak = 1; // reset streak
        }

        // Calculate points
        int pointsToGive = 10;
        if (streak % 5 == 0) {
            pointsToGive += 50; // Bonus every 5 days
        }

        user.setLoginStreak(streak);
        user.setLastLoginDate(today);
        user.setLoyaltyPoints((user.getLoyaltyPoints() == null ? 0 : user.getLoyaltyPoints()) + pointsToGive);

        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Claimed successfully");
        response.put("pointsGiven", pointsToGive);
        response.put("newTotal", user.getLoyaltyPoints());
        response.put("currentStreak", streak);

        return ResponseEntity.ok(response);
    }
}
