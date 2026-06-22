package com.vsv.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users",
        uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false)
    private String password;

    /** "user" or "admin" — matches frontend role checks exactly */
    @Column(nullable = false, length = 20)
    private String role = "user";

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Constructors ──────────────────────────────────────────────────
    public User() {}

    public User(String name, String email, String password) {
        this.name     = name;
        this.email    = email;
        this.password = password;
    }

    // ── Getters & Setters ─────────────────────────────────────────────
    public Long          getId()                        { return id; }
    public void          setId(Long id)                 { this.id = id; }

    public String        getName()                      { return name; }
    public void          setName(String name)           { this.name = name; }

    public String        getEmail()                     { return email; }
    public void          setEmail(String email)         { this.email = email; }

    public String        getPassword()                  { return password; }
    public void          setPassword(String password)   { this.password = password; }

    public String        getRole()                      { return role; }
    public void          setRole(String role)           { this.role = role; }

    public String        getPhoneNumber()               { return phoneNumber; }
    public void          setPhoneNumber(String p)       { this.phoneNumber = p; }

    public String        getAddress()                   { return address; }
    public void          setAddress(String a)           { this.address = a; }

    public LocalDateTime getCreatedAt()                 { return createdAt; }
    public void          setCreatedAt(LocalDateTime t)  { this.createdAt = t; }
}