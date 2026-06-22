package com.vsv.controller;

import com.vsv.dto.ProductDtos.*;
import com.vsv.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // GET /api/products?search=&page=0&size=12
    @GetMapping
    public ResponseEntity<ProductPage> getAll(
            @RequestParam(required = false, defaultValue = "")  String search,
            @RequestParam(required = false, defaultValue = "")  String category,
            @RequestParam(required = false, defaultValue = "0")  int    page,
            @RequestParam(required = false, defaultValue = "12") int    size) {
        return ResponseEntity.ok(productService.getProducts(search, category, page, size));
    }

    // GET /api/products/:id
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    // POST /api/products/batch — fetch multiple products by ID (for FavoritesView)
    @PostMapping("/batch")
    public ResponseEntity<List<ProductResponse>> getBatch(@RequestBody List<Long> ids) {
        return ResponseEntity.ok(productService.getProductsByIds(ids));
    }

    // POST /api/products — admin only
    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProduct(request));
    }

    // PUT /api/products/:id
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    // DELETE /api/products/:id
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(Map.of("message", "Produs șters cu succes"));
    }
}