package com.ensteinstore.service;

import com.ensteinstore.dto.request.CategoryRequest;
import com.ensteinstore.dto.response.CategoryResponse;
import com.ensteinstore.entity.Category;
import com.ensteinstore.exception.DuplicateResourceException;
import com.ensteinstore.exception.ResourceNotFoundException;
import com.ensteinstore.repository.CategoryRepository;
import com.ensteinstore.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private static final Logger log = LoggerFactory.getLogger(CategoryService.class);

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    /**
     * Public: Get all active categories with active product count.
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByIsActiveTrue().stream()
                .map(cat -> {
                    long count = productRepository.countByCategoryIdAndIsActiveTrue(cat.getId());
                    return new CategoryResponse(
                            cat.getId(),
                            cat.getName(),
                            cat.getSlug(),
                            cat.getDescription(),
                            count,
                            cat.getIsActive()
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * Admin: Get all categories (both active and inactive) with total product count.
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategoriesForAdmin() {
        return categoryRepository.findAll().stream()
                .map(cat -> {
                    long count = productRepository.countByCategoryId(cat.getId());
                    return new CategoryResponse(
                            cat.getId(),
                            cat.getName(),
                            cat.getSlug(),
                            cat.getDescription(),
                            count,
                            cat.getIsActive() != null ? cat.getIsActive() : true
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * Public / Admin: Detail category by slug or UUID.
     */
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlugOrId(String slugOrId) {
        Category category = null;
        try {
            UUID id = UUID.fromString(slugOrId);
            category = categoryRepository.findById(id).orElse(null);
        } catch (IllegalArgumentException ignored) {
        }

        if (category == null) {
            category = categoryRepository.findBySlug(slugOrId)
                    .orElseThrow(() -> new ResourceNotFoundException("Kategori tidak ditemukan: " + slugOrId));
        }

        long count = productRepository.countByCategoryId(category.getId());
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                count,
                category.getIsActive() != null ? category.getIsActive() : true
        );
    }

    /**
     * Admin: Create a new category with unique name and slug.
     */
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String trimmedName = request.getName().trim();
        if (categoryRepository.existsByName(trimmedName)) {
            throw new DuplicateResourceException("Kategori dengan nama '" + trimmedName + "' sudah terdaftar.");
        }

        String slug = request.getSlug() != null && !request.getSlug().trim().isEmpty()
                ? generateSlug(request.getSlug().trim())
                : generateSlug(trimmedName);

        if (categoryRepository.existsBySlug(slug)) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 5);
        }

        Category category = new Category(
                trimmedName,
                slug,
                request.getDescription() != null ? request.getDescription().trim() : null
        );
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        Category saved = categoryRepository.save(category);
        log.info("Category created by admin: {} ({})", saved.getName(), saved.getSlug());
        return new CategoryResponse(saved.getId(), saved.getName(), saved.getSlug(), saved.getDescription(), 0, saved.getIsActive());
    }

    /**
     * Admin: Update an existing category.
     */
    @Transactional
    public CategoryResponse updateCategory(UUID id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori tidak ditemukan dengan ID: " + id));

        String trimmedName = request.getName().trim();
        categoryRepository.findByName(trimmedName).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Nama kategori '" + trimmedName + "' sudah digunakan oleh kategori lain.");
            }
        });

        category.setName(trimmedName);
        if (request.getSlug() != null && !request.getSlug().trim().isEmpty()) {
            String newSlug = generateSlug(request.getSlug().trim());
            categoryRepository.findBySlug(newSlug).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new DuplicateResourceException("Slug kategori '" + newSlug + "' sudah digunakan.");
                }
            });
            category.setSlug(newSlug);
        }

        category.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        Category updated = categoryRepository.save(category);
        long count = productRepository.countByCategoryId(updated.getId());
        log.info("Category updated by admin: {} ({})", updated.getName(), updated.getSlug());
        return new CategoryResponse(updated.getId(), updated.getName(), updated.getSlug(), updated.getDescription(), count, updated.getIsActive());
    }

    /**
     * Admin: Toggle active status of a category.
     */
    @Transactional
    public CategoryResponse toggleCategoryStatus(UUID id, Boolean isActive) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori tidak ditemukan dengan ID: " + id));

        boolean nextStatus = isActive != null ? isActive : !Boolean.TRUE.equals(category.getIsActive());
        category.setIsActive(nextStatus);
        Category saved = categoryRepository.save(category);

        long count = productRepository.countByCategoryId(saved.getId());
        log.info("Category status toggled: {} -> active={}", saved.getName(), nextStatus);
        return new CategoryResponse(saved.getId(), saved.getName(), saved.getSlug(), saved.getDescription(), count, saved.getIsActive());
    }

    /**
     * Admin: Soft-delete / deactivate category.
     */
    @Transactional
    public void deleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori tidak ditemukan dengan ID: " + id));
        category.setIsActive(false);
        categoryRepository.save(category);
        log.info("Category deactivated: {}", category.getName());
    }

    private String generateSlug(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "kategori-" + UUID.randomUUID().toString().substring(0, 8);
        }
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        return normalized.isEmpty() ? "kategori-" + UUID.randomUUID().toString().substring(0, 8) : normalized;
    }
}
