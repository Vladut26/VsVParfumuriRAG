package com.vsv.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public final class ProductDtos {

    private ProductDtos() {}

    public static class StockDto {
        @Min(value = 0, message = "Stocul nu poate fi negativ.")
        private Integer quantity;
        private String  warehouse;

        public StockDto() {}
        public StockDto(Integer quantity, String warehouse) {
            this.quantity  = quantity;
            this.warehouse = warehouse;
        }
        public Integer getQuantity()               { return quantity; }
        public void    setQuantity(Integer q)      { this.quantity = q; }
        public String  getWarehouse()              { return warehouse; }
        public void    setWarehouse(String w)      { this.warehouse = w; }
    }

    public static class CategoryDto {
        private String       id;
        private String       name;
        private List<String> features;

        public CategoryDto() {}
        public CategoryDto(String id, String name, List<String> features) {
            this.id       = id;
            this.name     = name;
            this.features = features;
        }
        public String       getId()                      { return id; }
        public void         setId(String id)             { this.id = id; }
        public String       getName()                    { return name; }
        public void         setName(String name)         { this.name = name; }
        public List<String> getFeatures()                { return features; }
        public void         setFeatures(List<String> f)  { this.features = f; }
    }

    // POST /api/products  &  PUT /api/products/:id
    public static class ProductRequest {
        @NotBlank(message = "Numele produsului este obligatoriu.")
        @Size(min = 2, max = 255, message = "Numele trebuie să aibă între 2 și 255 de caractere.")
        private String name;

        @Size(max = 100, message = "Brand-ul poate avea maxim 100 de caractere.")
        private String brand;

        @NotNull(message = "Prețul este obligatoriu.")
        @DecimalMin(value = "0.01", message = "Prețul trebuie să fie mai mare decât 0.")
        @Digits(integer = 8, fraction = 2, message = "Preț invalid.")
        private BigDecimal price;

        private String description;

        @Pattern(regexp = "^(https?://.*)?$",
                message = "URL-ul imaginii trebuie să înceapă cu http:// sau https://")
        private String imageUrl;
        private List<String> imageUrls;

        @Valid
        private StockDto    stock;
        private CategoryDto category;
        private List<String> features;

        public ProductRequest() {}
        public String       getName()                     { return name; }
        public void         setName(String n)             { this.name = n; }
        public String       getBrand()                    { return brand; }
        public void         setBrand(String b)            { this.brand = b; }
        public BigDecimal   getPrice()                    { return price; }
        public void         setPrice(BigDecimal p)        { this.price = p; }
        public String       getDescription()              { return description; }
        public void         setDescription(String d)      { this.description = d; }
        public String       getImageUrl()                 { return imageUrl; }
        public void         setImageUrl(String u)         { this.imageUrl = u; }
        public List<String> getImageUrls()                { return imageUrls; }
        public void         setImageUrls(List<String> u)  { this.imageUrls = u; }
        public StockDto     getStock()                    { return stock; }
        public void         setStock(StockDto s)          { this.stock = s; }
        public CategoryDto  getCategory()                 { return category; }
        public void         setCategory(CategoryDto c)    { this.category = c; }
        public List<String> getFeatures()                 { return features; }
        public void         setFeatures(List<String> f)   { this.features = f; }
    }

    // Paginated product list response
    public static class ProductPage {
        private List<ProductResponse> content;
        private int                   page;
        private int                   size;
        private long                  totalElements;
        private int                   totalPages;
        private boolean               last;

        public ProductPage() {}
        public ProductPage(List<ProductResponse> content, int page, int size,
                           long totalElements, int totalPages, boolean last) {
            this.content       = content;
            this.page          = page;
            this.size          = size;
            this.totalElements = totalElements;
            this.totalPages    = totalPages;
            this.last          = last;
        }
        public List<ProductResponse> getContent()                             { return content; }
        public void                  setContent(List<ProductResponse> c)     { this.content = c; }
        public int                   getPage()                                { return page; }
        public void                  setPage(int p)                           { this.page = p; }
        public int                   getSize()                                { return size; }
        public void                  setSize(int s)                           { this.size = s; }
        public long                  getTotalElements()                        { return totalElements; }
        public void                  setTotalElements(long t)                 { this.totalElements = t; }
        public int                   getTotalPages()                           { return totalPages; }
        public void                  setTotalPages(int t)                     { this.totalPages = t; }
        public boolean               isLast()                                  { return last; }
        public void                  setLast(boolean l)                       { this.last = l; }
    }

    // Full product response
    public static class ProductResponse {
        private String      id;
        private String      name;
        private String      brand;
        private BigDecimal  price;
        private String      description;
        private String       imageUrl;
        private List<String> imageUrls;
        private String       createdAt;
        private StockDto    stock;
        private CategoryDto category;

        public ProductResponse() {}
        public String      getId()                        { return id; }
        public void        setId(String id)               { this.id = id; }
        public String      getName()                      { return name; }
        public void        setName(String n)              { this.name = n; }
        public String      getBrand()                     { return brand; }
        public void        setBrand(String b)             { this.brand = b; }
        public BigDecimal  getPrice()                     { return price; }
        public void        setPrice(BigDecimal p)         { this.price = p; }
        public String      getDescription()               { return description; }
        public void        setDescription(String d)       { this.description = d; }
        public String       getImageUrl()                  { return imageUrl; }
        public void         setImageUrl(String u)          { this.imageUrl = u; }
        public List<String> getImageUrls()                 { return imageUrls; }
        public void         setImageUrls(List<String> u)   { this.imageUrls = u; }
        public String      getCreatedAt()                 { return createdAt; }
        public void        setCreatedAt(String t)         { this.createdAt = t; }
        public StockDto    getStock()                     { return stock; }
        public void        setStock(StockDto s)           { this.stock = s; }
        public CategoryDto getCategory()                  { return category; }
        public void        setCategory(CategoryDto c)     { this.category = c; }
    }
}