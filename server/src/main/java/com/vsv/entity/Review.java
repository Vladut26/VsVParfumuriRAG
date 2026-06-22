package com.vsv.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name", nullable = false, length = 120)
    private String userName;

    @Column(nullable = false)
    private Integer rating;   // 1-5

    @Column(columnDefinition = "TEXT", nullable = false)
    private String comment;

    // AI analysis fields — filled by Ollama after submission
    @Column(length = 20)
    private String sentiment;  // "positive" | "negative" | "mixed"

    @Column(name = "sentiment_score")
    private Integer sentimentScore;  // 1-5

    @Column(name = "sentiment_summary", columnDefinition = "TEXT")
    private String sentimentSummary;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    public Review() {}

    public Long          getId()                          { return id; }
    public void          setId(Long id)                   { this.id = id; }
    public Long          getProductId()                   { return productId; }
    public void          setProductId(Long p)             { this.productId = p; }
    public Long          getUserId()                      { return userId; }
    public void          setUserId(Long u)                { this.userId = u; }
    public String        getUserName()                    { return userName; }
    public void          setUserName(String n)            { this.userName = n; }
    public Integer       getRating()                      { return rating; }
    public void          setRating(Integer r)             { this.rating = r; }
    public String        getComment()                     { return comment; }
    public void          setComment(String c)             { this.comment = c; }
    public String        getSentiment()                   { return sentiment; }
    public void          setSentiment(String s)           { this.sentiment = s; }
    public Integer       getSentimentScore()              { return sentimentScore; }
    public void          setSentimentScore(Integer s)     { this.sentimentScore = s; }
    public String        getSentimentSummary()            { return sentimentSummary; }
    public void          setSentimentSummary(String s)    { this.sentimentSummary = s; }
    public LocalDateTime getCreatedAt()                   { return createdAt; }
    public void          setCreatedAt(LocalDateTime t)    { this.createdAt = t; }
}