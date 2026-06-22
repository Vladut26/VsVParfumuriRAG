package com.vsv.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    public enum Status { PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    // Delivery details snapshot
    @Column(name = "full_name",  nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    // Payment info (no real card data — just method label)
    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    /** Stripe PaymentIntent ID — null for cash/transfer orders */
    @Column(name = "payment_intent_id", length = 255)
    private String paymentIntentId;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    @PreUpdate
    protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    public Order() {}

    public Long          getId()                            { return id; }
    public void          setId(Long id)                     { this.id = id; }
    public Long          getUserId()                        { return userId; }
    public void          setUserId(Long userId)             { this.userId = userId; }
    public Status        getStatus()                        { return status; }
    public void          setStatus(Status status)           { this.status = status; }
    public String        getFullName()                      { return fullName; }
    public void          setFullName(String fullName)       { this.fullName = fullName; }
    public String        getEmail()                         { return email; }
    public void          setEmail(String email)             { this.email = email; }
    public String        getPhone()                         { return phone; }
    public void          setPhone(String phone)             { this.phone = phone; }
    public String        getAddress()                       { return address; }
    public void          setAddress(String address)         { this.address = address; }
    public String        getCity()                          { return city; }
    public void          setCity(String city)               { this.city = city; }
    public String        getPostalCode()                    { return postalCode; }
    public void          setPostalCode(String postalCode)   { this.postalCode = postalCode; }
    public String        getPaymentMethod()                 { return paymentMethod; }
    public void          setPaymentMethod(String pm)        { this.paymentMethod = pm; }
    public String        getPaymentIntentId()               { return paymentIntentId; }
    public void          setPaymentIntentId(String id)      { this.paymentIntentId = id; }
    public BigDecimal    getTotalAmount()                   { return totalAmount; }
    public void          setTotalAmount(BigDecimal total)   { this.totalAmount = total; }
    public List<OrderItem> getItems()                       { return items; }
    public void          setItems(List<OrderItem> items)    { this.items = items; }
    public LocalDateTime getCreatedAt()                     { return createdAt; }
    public void          setCreatedAt(LocalDateTime t)      { this.createdAt = t; }
    public LocalDateTime getUpdatedAt()                     { return updatedAt; }
    public void          setUpdatedAt(LocalDateTime t)      { this.updatedAt = t; }
}