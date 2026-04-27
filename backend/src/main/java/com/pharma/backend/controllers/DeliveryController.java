package com.pharma.backend.controllers;

import com.pharma.backend.entity.DeliveryAssignment;
import com.pharma.backend.entity.ERole;
import com.pharma.backend.entity.Order;
import com.pharma.backend.entity.Role;
import com.pharma.backend.entity.User;
import com.pharma.backend.payload.response.MessageResponse;
import com.pharma.backend.repository.DeliveryAssignmentRepository;
import com.pharma.backend.repository.OrderRepository;
import com.pharma.backend.repository.RoleRepository;
import com.pharma.backend.repository.UserRepository;
import com.pharma.backend.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/delivery")
public class DeliveryController {

    @Autowired
    private DeliveryAssignmentRepository assignmentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    // ── ADMIN ENDPOINTS ───────────────────────────────────────────────────────

    /**
     * Admin: Assign an approved order to a delivery agent.
     * POST /api/delivery/assign
     * Body: { "orderId": 1, "agentId": 5 }
     */
    @PostMapping("/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignOrder(@RequestBody Map<String, Long> body) {
        Long orderId = body.get("orderId");
        Long agentId = body.get("agentId");

        if (orderId == null || agentId == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("orderId and agentId are required"));
        }

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Order not found"));
        }

        if (!"PAID".equals(order.getStatus()) && !"INITIATED".equals(order.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Order must be PAID or INITIATED before assigning to delivery agent"));
        }

        User agent = userRepository.findById(agentId).orElse(null);
        if (agent == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Delivery agent not found"));
        }

        // Check if already assigned
        Optional<DeliveryAssignment> existing = assignmentRepository.findByOrder_Id(orderId);
        DeliveryAssignment assignment = existing.orElse(new DeliveryAssignment());
        assignment.setOrder(order);
        assignment.setAgent(agent);
        assignment.setStatus("ASSIGNED");
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setUpdatedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        // Update order status
        order.setStatus("INITIATED");
        order.setDeliveryStatus("ASSIGNED");
        orderRepository.save(order);

        return ResponseEntity.ok(new MessageResponse("Order #" + orderId + " assigned to agent " + agent.getUsername()));
    }

    /**
     * Admin: Get all delivery agents.
     * GET /api/delivery/agents
     */
    @GetMapping("/agents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllAgents() {
        Role agentRole = roleRepository.findByName(ERole.ROLE_DELIVERY_AGENT).orElse(null);
        if (agentRole == null) {
            return ResponseEntity.ok(List.of());
        }
        List<User> agents = userRepository.findAll().stream()
                .filter(u -> u.getRoles().contains(agentRole))
                .collect(Collectors.toList());

        List<Map<String, Object>> result = agents.stream().map(a -> Map.<String, Object>of(
                "id", a.getId(),
                "username", a.getUsername(),
                "email", a.getEmail()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Admin: Get all delivery assignments.
     * GET /api/delivery/assignments
     */
    @GetMapping("/assignments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllAssignments() {
        return ResponseEntity.ok(assignmentRepository.findAll());
    }

    // ── DELIVERY AGENT ENDPOINTS ──────────────────────────────────────────────

    /**
     * Delivery Agent: Get orders assigned to the logged-in agent.
     * GET /api/delivery/orders
     */
    @GetMapping("/orders")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<?> getAssignedOrders() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        List<DeliveryAssignment> assignments = assignmentRepository.findByAgent_Id(userDetails.getId());
        return ResponseEntity.ok(assignments);
    }

    /**
     * Delivery Agent: Accept an assigned order.
     * PUT /api/delivery/{id}/accept
     */
    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<?> acceptOrder(@PathVariable Long id) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        DeliveryAssignment assignment = assignmentRepository.findById(id).orElse(null);
        if (assignment == null) {
            return ResponseEntity.notFound().build();
        }

        if (!assignment.getAgentId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Access denied"));
        }

        if (!"ASSIGNED".equals(assignment.getStatus())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Order is not in ASSIGNED state"));
        }

        assignment.setStatus("ACCEPTED");
        assignment.setUpdatedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        // Update order delivery status
        Order order = assignment.getOrder();
        order.setDeliveryStatus("ACCEPTED");
        orderRepository.save(order);

        return ResponseEntity.ok(new MessageResponse("Order accepted successfully"));
    }

    /**
     * Delivery Agent: Update delivery status.
     * PUT /api/delivery/{id}/status
     * Body: { "status": "OUT_FOR_DELIVERY" | "DELIVERED" }
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<?> updateDeliveryStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("status is required"));
        }

        // Validate allowed statuses
        if (!List.of("OUT_FOR_DELIVERY", "DELIVERED").contains(newStatus)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid status. Allowed: OUT_FOR_DELIVERY, DELIVERED"));
        }

        DeliveryAssignment assignment = assignmentRepository.findById(id).orElse(null);
        if (assignment == null) {
            return ResponseEntity.notFound().build();
        }

        if (!assignment.getAgentId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Access denied"));
        }

        assignment.setStatus(newStatus);
        assignment.setUpdatedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        // Sync order status
        Order order = assignment.getOrder();
        order.setDeliveryStatus(newStatus);
        if ("DELIVERED".equals(newStatus)) {
            order.setStatus("DELIVERED");
        } else if ("OUT_FOR_DELIVERY".equals(newStatus)) {
            order.setStatus("DISPATCHED");
        }
        orderRepository.save(order);

        return ResponseEntity.ok(new MessageResponse("Delivery status updated to " + newStatus));
    }

    /**
     * Delivery Agent: Get details of a specific assignment.
     * GET /api/delivery/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DELIVERY_AGENT') or hasRole('ADMIN')")
    public ResponseEntity<?> getAssignment(@PathVariable Long id) {
        return assignmentRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
