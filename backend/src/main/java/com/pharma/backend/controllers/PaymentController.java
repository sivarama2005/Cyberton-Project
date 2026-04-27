package com.pharma.backend.controllers;

import com.pharma.backend.entity.Order;
import com.pharma.backend.entity.Payment;
import com.pharma.backend.payload.request.PaymentVerifyRequest;
import com.pharma.backend.payload.response.MessageResponse;
import com.pharma.backend.payload.response.PaymentOrderResponse;
import com.pharma.backend.repository.OrderRepository;
import com.pharma.backend.repository.PaymentRepository;
import com.pharma.backend.security.services.UserDetailsImpl;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * Creates a Razorpay order for the given internal order ID.
     * Called when user clicks "Proceed to Payment".
     */
    @PostMapping("/create-order")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createPaymentOrder(@RequestBody java.util.Map<String, Long> body) {
        Long orderId = body.get("orderId");
        if (orderId == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("orderId is required"));
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || !order.getUserId().equals(userDetails.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Order not found or access denied"));
        }

        if ("PAID".equals(order.getPaymentStatus())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Order is already paid"));
        }

        try {
            // Amount in paise (INR smallest unit)
            long amountInPaise = Math.round(order.getTotalAmount() * 100);

            // Build Razorpay order via REST API
            com.razorpay.RazorpayClient razorpayClient = new com.razorpay.RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "order_" + orderId);
            orderRequest.put("payment_capture", 1);

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String rzpOrderId = razorpayOrder.get("id");

            // Update order status to PENDING_PAYMENT
            order.setStatus("PENDING_PAYMENT");
            order.setPaymentStatus("PENDING_PAYMENT");
            orderRepository.save(order);

            // Save or update payment record
            Payment payment = paymentRepository.findByOrder_Id(orderId).orElse(new Payment());
            payment.setOrder(order);
            payment.setRazorpayOrderId(rzpOrderId);
            payment.setAmount(order.getTotalAmount());
            payment.setStatus("PENDING");
            payment.setCreatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            return ResponseEntity.ok(new PaymentOrderResponse(
                    rzpOrderId,
                    order.getTotalAmount(),
                    "INR",
                    orderId,
                    razorpayKeyId
            ));

        } catch (Exception e) {
            System.err.println("[PAYMENT] Error creating Razorpay order: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(new MessageResponse("Payment initiation failed: " + e.getMessage()));
        }
    }

    /**
     * Verifies Razorpay payment signature after successful payment on frontend.
     */
    @PostMapping("/verify")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> verifyPayment(@RequestBody PaymentVerifyRequest request) {
        try {
            // Verify HMAC-SHA256 signature
            String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            String generatedSignature = hmacSHA256(payload, razorpayKeySecret);

            if (!generatedSignature.equals(request.getRazorpaySignature())) {
                // Signature mismatch — mark payment as failed
                markPaymentFailed(request.getOrderId(), request.getRazorpayOrderId());
                return ResponseEntity.badRequest().body(new MessageResponse("Payment verification failed: invalid signature"));
            }

            // Signature valid — update payment and order
            Order order = orderRepository.findById(request.getOrderId()).orElse(null);
            if (order == null) {
                return ResponseEntity.badRequest().body(new MessageResponse("Order not found"));
            }

            order.setStatus("PAID");
            order.setPaymentStatus("PAID");
            orderRepository.save(order);

            Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                    .orElse(new Payment());
            payment.setOrder(order);
            payment.setRazorpayOrderId(request.getRazorpayOrderId());
            payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
            payment.setRazorpaySignature(request.getRazorpaySignature());
            payment.setAmount(order.getTotalAmount());
            payment.setStatus("SUCCESS");
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            return ResponseEntity.ok(new MessageResponse("Payment verified successfully. Order is confirmed."));

        } catch (Exception e) {
            System.err.println("[PAYMENT] Verification error: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(new MessageResponse("Payment verification error: " + e.getMessage()));
        }
    }

    /**
     * Called when payment fails on the frontend.
     */
    @PostMapping("/failure")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> handlePaymentFailure(@RequestBody java.util.Map<String, Object> body) {
        Long orderId = body.get("orderId") != null ? Long.valueOf(body.get("orderId").toString()) : null;
        String rzpOrderId = (String) body.get("razorpayOrderId");
        if (orderId != null) {
            markPaymentFailed(orderId, rzpOrderId);
        }
        return ResponseEntity.ok(new MessageResponse("Payment failure recorded."));
    }

    /**
     * Get payment details for an order (user can view their own).
     */
    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getPaymentByOrder(@PathVariable Long orderId) {
        return paymentRepository.findByOrder_Id(orderId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void markPaymentFailed(Long orderId, String rzpOrderId) {
        if (orderId == null) return;
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setStatus("FAILED");
            order.setPaymentStatus("FAILED");
            orderRepository.save(order);
        });
        if (rzpOrderId != null) {
            paymentRepository.findByRazorpayOrderId(rzpOrderId).ifPresent(payment -> {
                payment.setStatus("FAILED");
                payment.setUpdatedAt(LocalDateTime.now());
                paymentRepository.save(payment);
            });
        }
    }

    private String hmacSHA256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
