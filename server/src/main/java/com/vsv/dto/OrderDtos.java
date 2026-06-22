package com.vsv.dto;

import java.math.BigDecimal;
import java.util.List;

public final class OrderDtos {

    private OrderDtos() {}

    // ── Cart item sent from frontend ──────────────────────────────────────
    public static class CartItemRequest {
        private Long       productId;
        private String     productName;
        private String     productBrand;
        private String     productImageUrl;
        private BigDecimal unitPrice;
        private Integer    quantity;

        public CartItemRequest() {}

        public Long       getProductId()                      { return productId; }
        public void       setProductId(Long id)               { this.productId = id; }
        public String     getProductName()                    { return productName; }
        public void       setProductName(String name)         { this.productName = name; }
        public String     getProductBrand()                   { return productBrand; }
        public void       setProductBrand(String brand)       { this.productBrand = brand; }
        public String     getProductImageUrl()                { return productImageUrl; }
        public void       setProductImageUrl(String url)      { this.productImageUrl = url; }
        public BigDecimal getUnitPrice()                      { return unitPrice; }
        public void       setUnitPrice(BigDecimal price)      { this.unitPrice = price; }
        public Integer    getQuantity()                       { return quantity; }
        public void       setQuantity(Integer qty)            { this.quantity = qty; }
    }

    // ── Checkout request body ─────────────────────────────────────────────
    public static class CheckoutRequest {
        private String              fullName;
        private String              email;
        private String              phone;
        private String              address;
        private String              city;
        private String              postalCode;
        private String              paymentMethod;
        private String              paymentIntentId;
        private List<CartItemRequest> items;

        public CheckoutRequest() {}

        public String              getFullName()                        { return fullName; }
        public void                setFullName(String n)                { this.fullName = n; }
        public String              getEmail()                           { return email; }
        public void                setEmail(String e)                   { this.email = e; }
        public String              getPhone()                           { return phone; }
        public void                setPhone(String p)                   { this.phone = p; }
        public String              getAddress()                         { return address; }
        public void                setAddress(String a)                 { this.address = a; }
        public String              getCity()                            { return city; }
        public void                setCity(String c)                    { this.city = c; }
        public String              getPostalCode()                      { return postalCode; }
        public void                setPostalCode(String pc)             { this.postalCode = pc; }
        public String              getPaymentMethod()                   { return paymentMethod; }
        public void                setPaymentMethod(String pm)          { this.paymentMethod = pm; }
        public String              getPaymentIntentId()                 { return paymentIntentId; }
        public void                setPaymentIntentId(String id)        { this.paymentIntentId = id; }
        public List<CartItemRequest> getItems()                         { return items; }
        public void                setItems(List<CartItemRequest> items){ this.items = items; }
    }

    // ── Order item in responses ───────────────────────────────────────────
    public static class OrderItemResponse {
        private Long       productId;
        private String     productName;
        private String     productBrand;
        private String     productImageUrl;
        private BigDecimal unitPrice;
        private Integer    quantity;
        private BigDecimal lineTotal;

        public OrderItemResponse() {}

        public Long       getProductId()                      { return productId; }
        public void       setProductId(Long id)               { this.productId = id; }
        public String     getProductName()                    { return productName; }
        public void       setProductName(String name)         { this.productName = name; }
        public String     getProductBrand()                   { return productBrand; }
        public void       setProductBrand(String brand)       { this.productBrand = brand; }
        public String     getProductImageUrl()                { return productImageUrl; }
        public void       setProductImageUrl(String url)      { this.productImageUrl = url; }
        public BigDecimal getUnitPrice()                      { return unitPrice; }
        public void       setUnitPrice(BigDecimal price)      { this.unitPrice = price; }
        public Integer    getQuantity()                       { return quantity; }
        public void       setQuantity(Integer qty)            { this.quantity = qty; }
        public BigDecimal getLineTotal()                      { return lineTotal; }
        public void       setLineTotal(BigDecimal total)      { this.lineTotal = total; }
    }

    // ── Full order response ───────────────────────────────────────────────
    public static class OrderResponse {
        private Long                   id;
        private String                 status;
        private String                 fullName;
        private String                 email;
        private String                 phone;
        private String                 address;
        private String                 city;
        private String                 postalCode;
        private String                 paymentMethod;
        private String                 paymentIntentId;
        private BigDecimal             totalAmount;
        private List<OrderItemResponse> items;
        private String                 createdAt;
        private String                 updatedAt;

        public OrderResponse() {}

        public Long                    getId()                           { return id; }
        public void                    setId(Long id)                    { this.id = id; }
        public String                  getStatus()                       { return status; }
        public void                    setStatus(String status)          { this.status = status; }
        public String                  getFullName()                     { return fullName; }
        public void                    setFullName(String n)             { this.fullName = n; }
        public String                  getEmail()                        { return email; }
        public void                    setEmail(String e)                { this.email = e; }
        public String                  getPhone()                        { return phone; }
        public void                    setPhone(String p)                { this.phone = p; }
        public String                  getAddress()                      { return address; }
        public void                    setAddress(String a)              { this.address = a; }
        public String                  getCity()                         { return city; }
        public void                    setCity(String c)                 { this.city = c; }
        public String                  getPostalCode()                   { return postalCode; }
        public void                    setPostalCode(String pc)          { this.postalCode = pc; }
        public String                  getPaymentMethod()                { return paymentMethod; }
        public void                    setPaymentMethod(String pm)       { this.paymentMethod = pm; }
        public String                  getPaymentIntentId()              { return paymentIntentId; }
        public void                    setPaymentIntentId(String id)     { this.paymentIntentId = id; }
        public BigDecimal              getTotalAmount()                   { return totalAmount; }
        public void                    setTotalAmount(BigDecimal t)      { this.totalAmount = t; }
        public List<OrderItemResponse> getItems()                        { return items; }
        public void                    setItems(List<OrderItemResponse> i){ this.items = i; }
        public String                  getCreatedAt()                    { return createdAt; }
        public void                    setCreatedAt(String t)            { this.createdAt = t; }
        public String                  getUpdatedAt()                    { return updatedAt; }
        public void                    setUpdatedAt(String t)            { this.updatedAt = t; }
    }

    // ── Favorite response ─────────────────────────────────────────────────
    public static class FavoriteResponse {
        private Long   productId;
        private String addedAt;

        public FavoriteResponse() {}
        public FavoriteResponse(Long productId, String addedAt) {
            this.productId = productId;
            this.addedAt   = addedAt;
        }

        public Long   getProductId()              { return productId; }
        public void   setProductId(Long id)        { this.productId = id; }
        public String getAddedAt()                 { return addedAt; }
        public void   setAddedAt(String t)         { this.addedAt = t; }
    }
}