package com.pharma.backend.controllers;

import com.pharma.backend.entity.Order;
import com.pharma.backend.entity.Prescription;
import com.pharma.backend.repository.OrderRepository;
import com.pharma.backend.repository.PrescriptionRepository;
import com.pharma.backend.repository.OrderItemRepository;
import com.pharma.backend.repository.MedicineRepository;
import com.pharma.backend.entity.OrderItem;
import com.pharma.backend.entity.Medicine;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private OrderRepository orderRepository;

    @PostMapping("/upload/{orderId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> uploadPrescription(@PathVariable Long orderId, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a file to upload");
        }

        // ── File Type Validation ──────────────────────────────────────
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String contentType  = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        boolean validExtension = originalName.endsWith(".jpg") || originalName.endsWith(".jpeg")
                || originalName.endsWith(".png") || originalName.endsWith(".pdf");
        boolean validMime = contentType.contains("image/jpeg") || contentType.contains("image/png")
                || contentType.contains("application/pdf");

        if (!validExtension || !validMime) {
            return ResponseEntity.badRequest()
                    .body("Invalid file type. Only JPG, PNG, and PDF are accepted.");
        }

        // ── File Size Validation (min 10KB, max 5MB) ──────────────────
        if (file.getSize() < 10_000) {
            return ResponseEntity.badRequest()
                    .body("File is too small to be a valid prescription (minimum 10KB).");
        }
        if (file.getSize() > 5_000_000) {
            return ResponseEntity.badRequest()
                    .body("File exceeds maximum allowed size of 5MB.");
        }

        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return ResponseEntity.badRequest().body("Order not found");
        }

        // ── Check order belongs to this user and needs prescription ───
        Order order = orderOpt.get();
        boolean hasPrescriptionMedicine = orderItemRepository.findByOrder_Id(orderId)
                .stream()
                .anyMatch(item -> item.getMedicine() != null && Boolean.TRUE.equals(item.getMedicine().getRequiresPrescription()));

        if (!hasPrescriptionMedicine) {
            return ResponseEntity.badRequest()
                    .body("This order does not contain any prescription-required medicines.");
        }

        try {
            Path uploadPath = Paths.get(uploadDir, "prescriptions");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = StringUtils.cleanPath(System.currentTimeMillis() + "_" + file.getOriginalFilename());
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            Prescription prescription = new Prescription();
            prescription.setOrder(order);
            // Store as a relative URL path so frontend can load it directly
            prescription.setFilePath("/uploads/prescriptions/" + fileName);
            prescription.setStatus("PENDING");

            prescriptionRepository.save(prescription);

            return ResponseEntity.ok("File uploaded successfully. Pending admin review.");

        } catch (IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Could not store file. Error: " + ex.getMessage());
        }
    }

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @PutMapping("/{id}/validate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> validatePrescription(@PathVariable Long id, @RequestBody String status) {
        final String finalStatus = status.replace("\"", "");
        return prescriptionRepository.findById(id).map(prescription -> {
            prescription.setStatus(finalStatus);
            prescriptionRepository.save(prescription);
            
            if ("VALIDATED".equals(finalStatus)) {
                Order order = prescription.getOrder();
                if (!"APPROVED".equals(order.getStatus())) {
                     deductStockForOrder(order);
                }
                order.setStatus("APPROVED");
                orderRepository.save(order);
            } else if ("REJECTED".equals(finalStatus)) {
                Order order = prescription.getOrder();
                order.setStatus("CANCELLED");
                orderRepository.save(order);
            }
            return ResponseEntity.ok(prescription);
        }).orElse(ResponseEntity.notFound().build());
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
}
