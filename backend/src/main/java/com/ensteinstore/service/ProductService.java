package com.ensteinstore.service;

import com.ensteinstore.dto.request.CreateProductRequest;
import com.ensteinstore.dto.request.UpdateProductRequest;
import com.ensteinstore.dto.response.PagedResponse;
import com.ensteinstore.dto.response.ProductResponse;
import com.ensteinstore.entity.Category;
import com.ensteinstore.entity.Product;
import com.ensteinstore.entity.Unit;
import com.ensteinstore.exception.DuplicateResourceException;
import com.ensteinstore.exception.ProductNotFoundException;
import com.ensteinstore.exception.ResourceNotFoundException;
import com.ensteinstore.repository.CategoryRepository;
import com.ensteinstore.repository.ProductRepository;
import com.ensteinstore.repository.UnitRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for Product Catalog & Management (PRD §7, §13.4.6, K8, K9).
 */
@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          UnitRepository unitRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.unitRepository = unitRepository;
    }

    /**
     * Search and filter products with pagination and sorting.
     */
    @Transactional(readOnly = true)
    public PagedResponse<ProductResponse> getProducts(String query,
                                                      UUID categoryId,
                                                      String categorySlug,
                                                      Boolean featured,
                                                      Boolean isNew,
                                                      Boolean activeOnly,
                                                      String sort,
                                                      int page,
                                                      int size) {
        Sort sortObj = resolveSort(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);

        Specification<Product> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Active filter: default true unless admin explicitly asks for all
            if (activeOnly == null || Boolean.TRUE.equals(activeOnly)) {
                predicates.add(cb.isTrue(root.get("isActive")));
            }

            // Keyword search (name or productCode)
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), pattern);
                Predicate codeLike = cb.like(cb.lower(root.get("productCode")), pattern);
                predicates.add(cb.or(nameLike, codeLike));
            }

            // Category filter by ID
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            // Category filter by Slug
            if (categorySlug != null && !categorySlug.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("category").get("slug"), categorySlug.trim()));
            }

            // Featured filter
            if (featured != null) {
                predicates.add(cb.equal(root.get("isFeatured"), featured));
            }

            // Is New filter (products created in the last 14 days)
            if (Boolean.TRUE.equals(isNew)) {
                OffsetDateTime fourteenDaysAgo = OffsetDateTime.now().minusDays(14);
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fourteenDaysAgo));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        List<ProductResponse> content = productPage.getContent().stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                content,
                productPage.getNumber(),
                productPage.getSize(),
                productPage.getTotalElements(),
                productPage.getTotalPages(),
                productPage.isLast()
        );
    }

    /**
     * Finds product by UUID or product_code (K9).
     */
    @Transactional(readOnly = true)
    public ProductResponse getProductByIdOrCode(String idOrCode) {
        Product product = findEntityByIdOrCode(idOrCode);
        return ProductResponse.fromEntity(product);
    }

    /**
     * Retrieves featured products for homepage.
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> getFeaturedProducts() {
        return productRepository.findAllByIsActiveTrueAndIsFeaturedTrue().stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Admin: Creates a new product.
     */
    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        if (productRepository.existsByProductCode(request.getProductCode())) {
            throw new DuplicateResourceException("Kode produk '" + request.getProductCode() + "' sudah digunakan.");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori tidak ditemukan dengan ID: " + request.getCategoryId()));

        Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Satuan tidak ditemukan dengan ID: " + request.getUnitId()));

        Product product = new Product(
                request.getProductCode(),
                request.getName(),
                request.getDescription(),
                category,
                unit,
                request.getPrice(),
                request.getMinimumStock(),
                request.getImage(),
                request.getIsFeatured()
        );

        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        }

        Product saved = productRepository.save(product);
        log.info("Product created: {} - {}", saved.getProductCode(), saved.getName());
        return ProductResponse.fromEntity(saved);
    }

    /**
     * Admin: Updates an existing product.
     */
    @Transactional
    public ProductResponse updateProduct(UUID id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Produk tidak ditemukan dengan ID: " + id));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori tidak ditemukan dengan ID: " + request.getCategoryId()));

        Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Satuan tidak ditemukan dengan ID: " + request.getUnitId()));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategory(category);
        product.setUnit(unit);
        product.setPrice(request.getPrice());
        product.setMinimumStock(request.getMinimumStock());
        product.setImage(request.getImage());

        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        }
        if (request.getIsFeatured() != null) {
            product.setIsFeatured(request.getIsFeatured());
        }

        Product updated = productRepository.save(product);
        log.info("Product updated: {} - {}", updated.getProductCode(), updated.getName());
        return ProductResponse.fromEntity(updated);
    }

    /**
     * Admin: Deactivates (soft delete) a product.
     */
    @Transactional
    public void deactivateProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Produk tidak ditemukan dengan ID: " + id));
        product.setIsActive(false);
        productRepository.save(product);
        log.info("Product deactivated: {}", product.getProductCode());
    }

    private Product findEntityByIdOrCode(String idOrCode) {
        try {
            UUID id = UUID.fromString(idOrCode);
            return productRepository.findById(id)
                    .orElseGet(() -> productRepository.findByProductCode(idOrCode)
                            .orElseThrow(() -> new ProductNotFoundException("Produk '" + idOrCode + "' tidak ditemukan.")));
        } catch (IllegalArgumentException e) {
            return productRepository.findByProductCode(idOrCode)
                    .orElseThrow(() -> new ProductNotFoundException("Produk '" + idOrCode + "' tidak ditemukan."));
        }
    }

    private Sort resolveSort(String sort) {
        if (sort == null) return Sort.by(Sort.Direction.DESC, "createdAt");
        return switch (sort.toLowerCase()) {
            case "harga-rendah", "price-asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "harga-tinggi", "price-desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "terpopuler", "popular" -> Sort.by(Sort.Direction.DESC, "name"); // or sales count
            case "nama-asc" -> Sort.by(Sort.Direction.ASC, "name");
            case "nama-desc" -> Sort.by(Sort.Direction.DESC, "name");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }
}
