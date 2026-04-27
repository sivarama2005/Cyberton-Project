package com.pharma.backend.controllers;

import com.pharma.backend.entity.ERole;
import com.pharma.backend.entity.Role;
import com.pharma.backend.entity.User;
import com.pharma.backend.payload.request.ForgotPasswordRequest;
import com.pharma.backend.payload.request.LoginRequest;
import com.pharma.backend.payload.request.ResetPasswordRequest;
import com.pharma.backend.payload.request.SignupRequest;
import com.pharma.backend.payload.request.VerifyOtpRequest;
import com.pharma.backend.payload.response.JwtResponse;
import com.pharma.backend.payload.response.MessageResponse;
import com.pharma.backend.repository.RoleRepository;
import com.pharma.backend.repository.UserRepository;
import com.pharma.backend.security.jwt.JwtUtils;
import com.pharma.backend.security.services.UserDetailsImpl;
import com.pharma.backend.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    EmailService emailService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User(null, signUpRequest.getUsername(),
                encoder.encode(signUpRequest.getPassword()),
                signUpRequest.getEmail(),
                new HashSet<>(),
                0, null, 0, null, null);

        Set<String> strRoles = signUpRequest.getRoles();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null) {
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            roles.add(userRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                    case "admin":
                        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(adminRole);
                        break;
                    case "delivery_agent":
                        Role deliveryRole = roleRepository.findByName(ERole.ROLE_DELIVERY_AGENT)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(deliveryRole);
                        break;
                    default:
                        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(userRole);
                }
            });
        }

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                // Generate 6-digit OTP
                String otp = String.format("%06d", new Random().nextInt(999999));
                user.setResetToken(otp);
                user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(10));
                userRepository.save(user);
                // Always log OTP to console so it works even if email fails
                System.out.println("========================================");
                System.out.println("[OTP] Email: " + user.getEmail() + " | OTP: " + otp);
                System.out.println("========================================");
                // Send email synchronously so we can see the exact error
                try {
                    emailService.sendOtpEmail(user.getEmail(), otp);
                } catch (Exception mailEx) {
                    System.err.println("[OTP-MAIL-ERROR] " + mailEx.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("[FORGOT-PASSWORD] Error: " + e.getMessage());
        }
        // Always return 200 to avoid email enumeration
        return ResponseEntity.ok(new MessageResponse("OTP sent if that email is registered."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP."));
            }
            User user = userOpt.get();
            if (user.getResetToken() == null || !user.getResetToken().equals(request.getOtp())) {
                return ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP."));
            }
            if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(new MessageResponse("OTP has expired. Please request a new one."));
            }
            return ResponseEntity.ok(new MessageResponse("OTP verified."));
        } catch (Exception e) {
            System.err.println("[VERIFY-OTP] Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(new MessageResponse("Verification failed. Please try again."));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Invalid request."));
            }
            User user = userOpt.get();
            if (user.getResetToken() == null || !user.getResetToken().equals(request.getOtp())) {
                return ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP."));
            }
            if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(new MessageResponse("OTP has expired. Please request a new one."));
            }
            user.setPassword(encoder.encode(request.getNewPassword()));
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            return ResponseEntity.ok(new MessageResponse("Password updated successfully. You can now log in."));
        } catch (Exception e) {
            System.err.println("[RESET-PASSWORD] Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(new MessageResponse("Password reset failed. Please try again."));
        }
    }
}
