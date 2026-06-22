package com.vsv.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 100)
    private String brand;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "image_urls_raw", columnDefinition = "TEXT")
    private String imageUrlsRaw;

    @Column(name = "stock_quantity")
    private Integer stockQuantity = 0;

    @Column(name = "stock_warehouse", length = 150)
    private String stockWarehouse;

    @Column(name = "category_id", length = 100)
    private String categoryId;

    @Column(name = "category_name", length = 100)
    private String categoryName = "Parfumuri";

    @Column(name = "category_features_raw", columnDefinition = "TEXT")
    private String categoryFeaturesRaw;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Transient
    public List<String> getImageUrls() {
        if (imageUrlsRaw == null || imageUrlsRaw.isBlank()) {
            // Fallback: return single imageUrl if no multi-image data
            return imageUrl != null ? List.of(imageUrl) : new ArrayList<>();
        }
        return new ArrayList<>(List.of(imageUrlsRaw.split("\\|")));
    }

    @Transient
    public List<String> getCategoryFeatures() {
        if (categoryFeaturesRaw == null || categoryFeaturesRaw.isBlank()) return new ArrayList<>();
        return new ArrayList<>(List.of(categoryFeaturesRaw.split("\\|")));
    }

    @Transient
    public void setCategoryFeatures(List<String> features) {
        this.categoryFeaturesRaw = (features == null || features.isEmpty())
                ? null
                : String.join("|", features);
    }



    @Transient
    public void setImageUrls(List<String> urls) {
        this.imageUrlsRaw = (urls == null || urls.isEmpty())
                ? null
                : String.join("|", urls);
    }

    // ── Constructors ──────────────────────────────────────────────────
    public Product() {}

    // ── Getters & Setters ─────────────────────────────────────────────
    public Long          getId()                              { return id; }
    public void          setId(Long id)                       { this.id = id; }

    public String        getName()                            { return name; }
    public void          setName(String name)                 { this.name = name; }

    public String        getBrand()                           { return brand; }
    public void          setBrand(String brand)               { this.brand = brand; }

    public BigDecimal    getPrice()                           { return price; }
    public void          setPrice(BigDecimal price)           { this.price = price; }

    public String        getDescription()                     { return description; }
    public void          setDescription(String d)             { this.description = d; }

    public String        getImageUrl()                        { return imageUrl; }
    public void          setImageUrl(String url)              { this.imageUrl = url; }

    public Integer       getStockQuantity()                   { return stockQuantity; }
    public void          setStockQuantity(Integer q)          { this.stockQuantity = q; }

    public String        getStockWarehouse()                  { return stockWarehouse; }
    public void          setStockWarehouse(String w)          { this.stockWarehouse = w; }

    public String        getCategoryId()                      { return categoryId; }
    public void          setCategoryId(String id)             { this.categoryId = id; }

    public String        getCategoryName()                    { return categoryName; }
    public void          setCategoryName(String n)            { this.categoryName = n; }

    public String        getCategoryFeaturesRaw()             { return categoryFeaturesRaw; }
    public void          setCategoryFeaturesRaw(String raw)   { this.categoryFeaturesRaw = raw; }

    public String        getImageUrlsRaw()                   { return imageUrlsRaw; }
    public void          setImageUrlsRaw(String raw)            { this.imageUrlsRaw = raw; }

    public LocalDateTime getCreatedAt()                       { return createdAt; }
    public void          setCreatedAt(LocalDateTime t)        { this.createdAt = t; }
}