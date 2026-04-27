package com.pharma.backend.config;

import com.pharma.backend.entity.Category;
import com.pharma.backend.entity.ERole;
import com.pharma.backend.entity.Medicine;
import com.pharma.backend.entity.Role;
import com.pharma.backend.repository.CategoryRepository;
import com.pharma.backend.repository.MedicineRepository;
import com.pharma.backend.repository.RoleRepository;
import com.pharma.backend.entity.User;
import com.pharma.backend.entity.Coupon;
import com.pharma.backend.repository.UserRepository;
import com.pharma.backend.repository.CouponRepository;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private CouponRepository couponRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        fixRolesColumnLength();   // ← widen VARCHAR before inserting new role
        seedRoles();
        seedAdmin();
        seedDeliveryAgent();
        seedCoupons();
        seedHealthPackages();
        seedCategoriesAndMedicines();
    }

    /**
     * Ensures the roles.name column is wide enough for ROLE_DELIVERY_AGENT (19 chars).
     * ddl-auto=update does NOT widen existing VARCHAR columns, so we do it explicitly.
     */
    private void fixRolesColumnLength() {
        try {
            entityManager.createNativeQuery(
                "ALTER TABLE roles MODIFY COLUMN name VARCHAR(30)"
            ).executeUpdate();
            System.out.println("[DataSeeder] roles.name column widened to VARCHAR(30).");
        } catch (Exception e) {
            // Ignore — column may already be wide enough or DB may not support it
            System.out.println("[DataSeeder] roles column alter skipped: " + e.getMessage());
        }
    }

    private void seedHealthPackages() {
        Category healthPackageCat = categoryRepository.findByName("Health Packages");
        if (healthPackageCat == null) {
            healthPackageCat = new Category();
            healthPackageCat.setName("Health Packages");
            healthPackageCat.setDescription("Full-body checkups and screening bundles.");
            healthPackageCat = categoryRepository.save(healthPackageCat);
        }

        if (medicineRepository.countByCategory(healthPackageCat) == 0) {
            Medicine m1 = new Medicine(null, "Basic Wellness Package", "Includes Blood Test, Urine Test, and basic vital check.", 999.0, 100, "1 Unit", "Package", false, healthPackageCat, null);
            Medicine m2 = new Medicine(null, "Diabetes Screening Bundle", "Comprehensive diabetes screening with HbA1c and glucose tests.", 1499.0, 50, "1 Unit", "Package", false, healthPackageCat, null);
            Medicine m3 = new Medicine(null, "Senior Citizen Package", "Full body checkup tailored for seniors, including heart and bone health.", 2499.0, 30, "1 Unit", "Package", false, healthPackageCat, null);
            medicineRepository.saveAll(Arrays.asList(m1, m2, m3));
            System.out.println("Health Packages seeded.");
        }
    }

    private void seedCoupons() {
        if (couponRepository.count() == 0) {
            Coupon c1 = new Coupon(null, "WELCOME10", "PERCENTAGE", 10.0, LocalDate.now().plusMonths(6), 0.0, null, 0);
            Coupon c2 = new Coupon(null, "FLAT100", "FLAT", 100.0, LocalDate.now().plusMonths(6), 500.0, null, 0);
            Coupon c3 = new Coupon(null, "WELLNESS20", "PERCENTAGE", 20.0, LocalDate.now().plusMonths(3), 1000.0, null, 0);
            couponRepository.saveAll(Arrays.asList(c1, c2, c3));
            System.out.println("Coupons seeded: WELCOME10, FLAT100, WELLNESS20");
        }
    }

    private void seedRoles() {
        if (roleRepository.count() == 0) {
            Role userRole = new Role(null, ERole.ROLE_USER);
            Role adminRole = new Role(null, ERole.ROLE_ADMIN);
            Role deliveryRole = new Role(null, ERole.ROLE_DELIVERY_AGENT);
            roleRepository.save(userRole);
            roleRepository.save(adminRole);
            roleRepository.save(deliveryRole);
        } else {
            // Ensure ROLE_DELIVERY_AGENT exists even on existing DBs
            if (roleRepository.findByName(ERole.ROLE_DELIVERY_AGENT).isEmpty()) {
                roleRepository.save(new Role(null, ERole.ROLE_DELIVERY_AGENT));
                System.out.println("ROLE_DELIVERY_AGENT seeded.");
            }
        }
    }

    private void seedAdmin() {
        if (!userRepository.existsByUsername("admin")) {
            Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            User admin = new User(null, "admin", encoder.encode("Ramireddy@2004"), "admin@pharma.com", roles, 0, null, 0, null, null);
            userRepository.save(admin);
            System.out.println("Admin user created with Ramireddy@2004.");
        } else {
            // Check if admin has ROLE_ADMIN
            User admin = userRepository.findByUsername("admin").get();
            Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN).get();
            if (!admin.getRoles().contains(adminRole)) {
                admin.getRoles().add(adminRole);
                userRepository.save(admin);
                System.out.println("Admin role granted to existing admin user.");
            }
        }
    }

    private void seedDeliveryAgent() {
        if (!userRepository.existsByUsername("delivery1")) {
            Role deliveryRole = roleRepository.findByName(ERole.ROLE_DELIVERY_AGENT)
                    .orElseThrow(() -> new RuntimeException("Error: ROLE_DELIVERY_AGENT not found."));
            Set<Role> roles = new HashSet<>();
            roles.add(deliveryRole);
            User agent = new User(null, "delivery1", encoder.encode("Delivery@123"),
                    "delivery1@pharma.com", roles, 0, null, 0, null, null);
            userRepository.save(agent);
            System.out.println("========================================");
            System.out.println("[SEED] Delivery Agent created:");
            System.out.println("       Username : delivery1");
            System.out.println("       Password : Delivery@123");
            System.out.println("       Email    : delivery1@pharma.com");
            System.out.println("========================================");
        }
    }
    
    private void seedCategoriesAndMedicines() {
        // Redundant - Now handled by the new DatabaseSeeder using CSV data
    }
}
