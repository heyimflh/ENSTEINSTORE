package com.ensteinstore.service;

import com.ensteinstore.dto.response.CategoryResponse;
import com.ensteinstore.entity.Category;
import com.ensteinstore.exception.ResourceNotFoundException;
import com.ensteinstore.repository.CategoryRepository;
import com.ensteinstore.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

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
                            count
                    );
                })
                .collect(Collectors.toList());
    }

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

        long count = productRepository.countByCategoryIdAndIsActiveTrue(category.getId());
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                count
        );
    }
}
