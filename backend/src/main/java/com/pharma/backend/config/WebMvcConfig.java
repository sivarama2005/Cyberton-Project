package com.pharma.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import com.pharma.backend.security.RateLimitingInterceptor;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Resolve the upload directory to an absolute path (works on Windows & Linux)
        Path uploadsDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        String uploadsAbsPath = uploadsDir.toString().replace("\\", "/");

        // Ensure path ends with /
        if (!uploadsAbsPath.endsWith("/")) {
            uploadsAbsPath += "/";
        }

        // Serve /uploads/** from the configured upload directory
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:///" + uploadsAbsPath)
                // Also serve from classpath static folder as fallback
                .addResourceLocations("classpath:/static/uploads/");
    }

    @Autowired
    private RateLimitingInterceptor rateLimitingInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitingInterceptor)
                .addPathPatterns("/api/**");
    }
}
