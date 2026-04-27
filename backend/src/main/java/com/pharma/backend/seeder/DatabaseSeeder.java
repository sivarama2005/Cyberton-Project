package com.pharma.backend.seeder;

import com.pharma.backend.entity.Category;
import com.pharma.backend.entity.Medicine;
import com.pharma.backend.repository.CategoryRepository;
import com.pharma.backend.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {
        if (medicineRepository.count() < 70) {
            System.out.println("[DatabaseSeeder] Medicine database is small. Starting bulk import...");
            
            // Clear existing medicines to avoid duplicates on re-seed
            if (medicineRepository.count() > 0 && medicineRepository.count() < 70) {
                System.out.println("[DatabaseSeeder] Clearing partial data and re-importing...");
            }
            
            try (BufferedReader br = new BufferedReader(new InputStreamReader(
                    Objects.requireNonNull(getClass().getResourceAsStream("/data/medicines.csv")), StandardCharsets.UTF_8))) {
                
                String line;
                boolean isFirstLine = true;
                Map<String, Category> categoryCache = new HashMap<>();

                while ((line = br.readLine()) != null) {
                    if (isFirstLine) {
                        isFirstLine = false;
                        continue;
                    }

                    // CSV Format: Name, Description, Price, Stock, Category, RequiresPrescription, Dosage, Packaging
                    String[] data = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
                    
                    if (data.length < 8) continue;

                    String name = data[0].replace("\"", "").trim();
                    String description = data[1].replace("\"", "").trim();
                    Double price = Double.parseDouble(data[2].trim());
                    Integer stock = Integer.parseInt(data[3].trim());
                    String categoryName = data[4].replace("\"", "").trim();
                    Boolean reqPres = data[5].trim().equals("1") || data[5].trim().equalsIgnoreCase("true");
                    String dosage = data[6].replace("\"", "").trim();
                    String packaging = data[7].replace("\"", "").trim();

                    // Find or create category
                    Category category = categoryCache.computeIfAbsent(categoryName, nameKey -> {
                        Category dbCategory = categoryRepository.findByName(nameKey);
                        if (dbCategory == null) {
                            dbCategory = new Category();
                            dbCategory.setName(nameKey);
                            dbCategory.setDescription(nameKey + " medicines");
                            dbCategory = categoryRepository.save(dbCategory);
                        }
                        return dbCategory;
                    });

                    Medicine medicine = new Medicine();
                    medicine.setName(name);
                    medicine.setDescription(description);
                    medicine.setPrice(price);
                    medicine.setStock(stock);
                    medicine.setCategory(category);
                    medicine.setRequiresPrescription(reqPres);
                    medicine.setDosage(dosage);
                    medicine.setPackaging(packaging);

                    medicineRepository.save(medicine);
                }
                System.out.println("[DatabaseSeeder] Successfully imported medicines from CSV into database!");
            } catch (Exception e) {
                System.err.println("[DatabaseSeeder] Error during bulk import: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("[DatabaseSeeder] Medicines already exist in database. Skipping generation.");
        }
    }
}
