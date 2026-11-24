package com.ensteinstore.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Web MVC Configuration for ENSTEINSTORE.
 * Serves uploaded static files (such as transfer proofs and product images) from app.upload.dir.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AppProperties appProperties;

    public WebConfig(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path configuredPath = Paths.get(appProperties.getUpload().getDir()).toAbsolutePath().normalize();
        Path rootUploadsPath = Paths.get("uploads").toAbsolutePath().normalize();
        Path backendUploadsPath = Paths.get("backend", "uploads").toAbsolutePath().normalize();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(
                        "file:" + configuredPath.toString().replace("\\", "/") + "/",
                        "file:" + rootUploadsPath.toString().replace("\\", "/") + "/",
                        "file:" + backendUploadsPath.toString().replace("\\", "/") + "/",
                        "file:./uploads/",
                        "file:./backend/uploads/"
                )
                .setCachePeriod(3600);
    }
}
