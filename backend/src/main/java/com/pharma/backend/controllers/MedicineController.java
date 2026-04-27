package com.pharma.backend.controllers;

import com.pharma.backend.entity.Medicine;
import com.pharma.backend.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Autowired
    private MedicineRepository medicineRepository;

    @GetMapping
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Medicine> getMedicineById(@PathVariable Long id) {
        return medicineRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    public List<Medicine> getMedicinesByCategory(@PathVariable Long categoryId) {
        return medicineRepository.findByCategoryId(categoryId);
    }

    @GetMapping("/search")
    public List<Medicine> searchMedicines(@RequestParam String query) {
        return medicineRepository.findByNameContainingIgnoreCase(query);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Medicine createMedicine(@RequestBody Medicine medicine) {
        return medicineRepository.save(medicine);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable Long id, @RequestBody Medicine medicineDetails) {
        return medicineRepository.findById(id)
                .map(medicine -> {
                    medicine.setName(medicineDetails.getName());
                    medicine.setDescription(medicineDetails.getDescription());
                    medicine.setPrice(medicineDetails.getPrice());
                    medicine.setStock(medicineDetails.getStock());
                    medicine.setDosage(medicineDetails.getDosage());
                    medicine.setPackaging(medicineDetails.getPackaging());
                    medicine.setRequiresPrescription(medicineDetails.getRequiresPrescription());
                    medicine.setCategory(medicineDetails.getCategory());
                    if (medicineDetails.getImageUrl() != null) {
                        medicine.setImageUrl(medicineDetails.getImageUrl());
                    }
                    return ResponseEntity.ok(medicineRepository.save(medicine));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Upload image for a specific medicine
    @PostMapping("/{id}/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadMedicineImage(@PathVariable Long id,
                                                  @RequestParam("file") MultipartFile file) {
        return medicineRepository.findById(id).map(medicine -> {
            try {
                String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
                String fileName = "medicine_" + id + "." + ext;
                Path uploadPath = Paths.get(uploadDir, "medicines");
                if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                String imageUrl = "/uploads/medicines/" + fileName;
                medicine.setImageUrl(imageUrl);
                medicineRepository.save(medicine);
                return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteMedicine(@PathVariable Long id) {
        return medicineRepository.findById(id)
                .map(medicine -> {
                    medicineRepository.delete(medicine);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
