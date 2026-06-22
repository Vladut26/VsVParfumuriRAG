package com.vsv.service;

import com.vsv.dto.ProductDtos.*;
import com.vsv.entity.Product;
import com.vsv.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public ProductPage getProducts(String search, String category, int page, int size) {
        size = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, size);
        String   q   = (search == null || search.isBlank())     ? null : search.trim();
        String   cat = (category == null || category.isBlank()) ? null : category.trim();
        Page<Product> result = productRepository.findAllPaged(q, cat, pageable);
        List<ProductResponse> content = result.getContent().stream().map(this::toResponse).toList();
        return new ProductPage(content, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public ProductResponse getProductById(Long id) {
        return toResponse(findOrThrow(id));
    }

    /** Batch fetch — used by FavoritesView to avoid N+1 requests */
    public List<ProductResponse> getProductsByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        return productRepository.findAllByIds(ids).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest req) {
        Product p = new Product();
        applyRequest(p, req);
        return toResponse(productRepository.save(p));
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest req) {
        Product p = findOrThrow(id);
        applyRequest(p, req);
        return toResponse(productRepository.save(p));
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id))
            throw new EntityNotFoundException("Produsul nu există");
        productRepository.deleteById(id);
    }

    @Transactional
    public void decrementStock(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Produsul cu id=" + productId + " nu există."));
        int available = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        if (available < quantity) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Stoc insuficient pentru \"" + product.getName() + "\". "
                            + "Disponibil: " + available + ", solicitat: " + quantity + ".");
        }
        product.setStockQuantity(available - quantity);
        productRepository.save(product);
    }

    /** Restore stock when an order is cancelled */
    @Transactional
    public void incrementStock(Long productId, int quantity) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;   // product may have been deleted
        int current = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        product.setStockQuantity(current + quantity);
        productRepository.save(product);
    }

    private void applyRequest(Product p, ProductRequest req) {
        if (req.getName()        != null) p.setName(req.getName());
        if (req.getBrand()       != null) p.setBrand(req.getBrand());
        if (req.getPrice()       != null) p.setPrice(req.getPrice());
        if (req.getDescription() != null) p.setDescription(req.getDescription());
        if (req.getImageUrl()    != null) p.setImageUrl(req.getImageUrl());
        if (req.getImageUrls()   != null && !req.getImageUrls().isEmpty()) {
            p.setImageUrls(req.getImageUrls());
            // Also set primary imageUrl to first image if not explicitly set
            if (req.getImageUrl() == null) p.setImageUrl(req.getImageUrls().get(0));
        }
        if (req.getStock() != null) {
            if (req.getStock().getQuantity()  != null) p.setStockQuantity(req.getStock().getQuantity());
            if (req.getStock().getWarehouse() != null) p.setStockWarehouse(req.getStock().getWarehouse());
        }
        if (p.getStockQuantity()  == null) p.setStockQuantity(0);
        if (p.getStockWarehouse() == null) p.setStockWarehouse("Depozit Central");
        if (req.getCategory() != null) {
            if (req.getCategory().getName()     != null) p.setCategoryName(req.getCategory().getName());
            if (req.getCategory().getId()       != null) p.setCategoryId(req.getCategory().getId());
            if (req.getCategory().getFeatures() != null) p.setCategoryFeatures(req.getCategory().getFeatures());
        }
        if (p.getCategoryName() == null) {
            p.setCategoryName("Parfumuri");
            p.setCategoryId(UUID.randomUUID().toString());
        }
        if (req.getFeatures() != null && !req.getFeatures().isEmpty()) {
            p.setCategoryFeatures(req.getFeatures());
        }
    }

    private Product findOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Produsul nu a fost găsit."));
    }

    private ProductResponse toResponse(Product p) {
        ProductResponse r = new ProductResponse();
        r.setId(p.getId().toString());
        r.setName(p.getName());
        r.setBrand(p.getBrand());
        r.setPrice(p.getPrice());
        r.setDescription(p.getDescription());
        r.setImageUrl(p.getImageUrl());
        r.setImageUrls(p.getImageUrls());
        r.setCreatedAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
        r.setStock(new StockDto(p.getStockQuantity(), p.getStockWarehouse()));
        r.setCategory(new CategoryDto(p.getCategoryId(), p.getCategoryName(), p.getCategoryFeatures()));
        return r;
    }
}