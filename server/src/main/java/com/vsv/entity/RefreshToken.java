package com.vsv.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, unique = true, length = 512)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public RefreshToken() {}

    public RefreshToken(Long userId, String token, Instant expiresAt) {
        this.userId    = userId;
        this.token     = token;
        this.expiresAt = expiresAt;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public Long    getId()                       { return id; }
    public void    setId(Long id)                { this.id = id; }
    public Long    getUserId()                   { return userId; }
    public void    setUserId(Long userId)        { this.userId = userId; }
    public String  getToken()                    { return token; }
    public void    setToken(String token)        { this.token = token; }
    public Instant getExpiresAt()                { return expiresAt; }
    public void    setExpiresAt(Instant t)       { this.expiresAt = t; }
    public Instant getCreatedAt()                { return createdAt; }
    public void    setCreatedAt(Instant t)       { this.createdAt = t; }
}