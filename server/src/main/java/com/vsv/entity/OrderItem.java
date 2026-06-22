package com.vsv.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Snapshot of product data at time of order — never changes
    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "product_brand", length = 100)
    private String productBrand;

    @Column(name = "product_image_url", length = 1000)
    private String productImageUrl;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    public OrderItem() {}

    public Long       getId()                            { return id; }
    public void       setId(Long id)                     { this.id = id; }
    public Order      getOrder()                         { return order; }
    public void       setOrder(Order order)              { this.order = order; }
    public Long       getProductId()                     { return productId; }
    public void       setProductId(Long productId)       { this.productId = productId; }
    public String     getProductName()                   { return productName; }
    public void       setProductName(String name)        { this.productName = name; }
    public String     getProductBrand()                  { return productBrand; }
    public void       setProductBrand(String brand)      { this.productBrand = brand; }
    public String     getProductImageUrl()               { return productImageUrl; }
    public void       setProductImageUrl(String url)     { this.productImageUrl = url; }
    public BigDecimal getUnitPrice()                     { return unitPrice; }
    public void       setUnitPrice(BigDecimal price)     { this.unitPrice = price; }
    public Integer    getQuantity()                      { return quantity; }
    public void       setQuantity(Integer qty)           { this.quantity = qty; }
    public BigDecimal getLineTotal()                     { return lineTotal; }
    public void       setLineTotal(BigDecimal total)     { this.lineTotal = total; }
}