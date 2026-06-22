package com.vsv.dto;

import jakarta.validation.constraints.*;

public final class ReviewDtos {

    private ReviewDtos() {}

    // POST /api/reviews/:productId
    public static class CreateReviewRequest {
        @NotNull(message = "Rating-ul este obligatoriu.")
        @Min(value = 1, message = "Rating-ul minim este 1.")
        @Max(value = 5, message = "Rating-ul maxim este 5.")
        private Integer rating;

        @NotBlank(message = "Comentariul este obligatoriu.")
        @Size(min = 10, max = 2000,
                message = "Comentariul trebuie să aibă între 10 și 2000 de caractere.")
        private String comment;

        public CreateReviewRequest() {}
        public Integer getRating()                 { return rating; }
        public void    setRating(Integer r)        { this.rating = r; }
        public String  getComment()                { return comment; }
        public void    setComment(String c)        { this.comment = c; }
    }

    // Full review response (includes AI sentiment)
    public static class ReviewResponse {
        private Long    id;
        private Long    productId;
        private Long    userId;
        private String  userName;
        private Integer rating;
        private String  comment;
        private String  sentiment;
        private Integer sentimentScore;
        private String  sentimentSummary;
        private String  createdAt;

        public ReviewResponse() {}
        public Long    getId()                         { return id; }
        public void    setId(Long id)                  { this.id = id; }
        public Long    getProductId()                  { return productId; }
        public void    setProductId(Long p)            { this.productId = p; }
        public Long    getUserId()                     { return userId; }
        public void    setUserId(Long u)               { this.userId = u; }
        public String  getUserName()                   { return userName; }
        public void    setUserName(String n)           { this.userName = n; }
        public Integer getRating()                     { return rating; }
        public void    setRating(Integer r)            { this.rating = r; }
        public String  getComment()                    { return comment; }
        public void    setComment(String c)            { this.comment = c; }
        public String  getSentiment()                  { return sentiment; }
        public void    setSentiment(String s)          { this.sentiment = s; }
        public Integer getSentimentScore()             { return sentimentScore; }
        public void    setSentimentScore(Integer s)    { this.sentimentScore = s; }
        public String  getSentimentSummary()           { return sentimentSummary; }
        public void    setSentimentSummary(String s)   { this.sentimentSummary = s; }
        public String  getCreatedAt()                  { return createdAt; }
        public void    setCreatedAt(String t)          { this.createdAt = t; }
    }

    // Per-product summary for AI chatbot injection
    public static class ReviewSummary {
        private Long   productId;
        private long   totalReviews;
        private double averageRating;
        private String dominantSentiment;  // most frequent sentiment

        public ReviewSummary() {}
        public ReviewSummary(Long productId, long total, double avg, String sentiment) {
            this.productId         = productId;
            this.totalReviews      = total;
            this.averageRating     = avg;
            this.dominantSentiment = sentiment;
        }
        public Long   getProductId()                          { return productId; }
        public void   setProductId(Long p)                    { this.productId = p; }
        public long   getTotalReviews()                       { return totalReviews; }
        public void   setTotalReviews(long t)                 { this.totalReviews = t; }
        public double getAverageRating()                      { return averageRating; }
        public void   setAverageRating(double a)              { this.averageRating = a; }
        public String getDominantSentiment()                  { return dominantSentiment; }
        public void   setDominantSentiment(String s)          { this.dominantSentiment = s; }
    }

    // Stats summary for product
    public static class ReviewStats {
        private long   totalReviews;
        private double averageRating;

        public ReviewStats() {}
        public ReviewStats(long total, double avg) {
            this.totalReviews  = total;
            this.averageRating = avg;
        }
        public long   getTotalReviews()               { return totalReviews; }
        public void   setTotalReviews(long t)         { this.totalReviews = t; }
        public double getAverageRating()              { return averageRating; }
        public void   setAverageRating(double a)      { this.averageRating = a; }
    }
}