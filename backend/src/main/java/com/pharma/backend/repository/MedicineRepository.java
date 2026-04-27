package com.pharma.backend.repository;

import com.pharma.backend.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByCategoryId(Long categoryId);
    List<Medicine> findByNameContainingIgnoreCase(String name);
    long countByCategory(com.pharma.backend.entity.Category category);
}
