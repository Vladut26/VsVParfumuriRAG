package com.vsv.service;

import com.vsv.dto.ReviewDtos;
import com.vsv.dto.ReviewDtos.*;
import com.vsv.entity.Review;
import com.vsv.entity.User;
import com.vsv.repository.ReviewRepository;
import com.vsv.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final UserRepository   userRepository;
    private final RestClient       restClient;
    @Value("${ai.service.base-url:http://localhost:8000}")
    private String aiBaseUrl;

    public ReviewService(ReviewRepository reviewRepository,
                         UserRepository userRepository,
                         RestClient.Builder restClientBuilder) {
        this.reviewRepository = reviewRepository;
        this.userRepository   = userRepository;
        this.restClient       = restClientBuilder.build();
    }

    // GET /api/reviews/:productId
    public List<ReviewResponse> getReviews(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream().map(this::toResponse).toList();
    }

    // GET /api/reviews/:productId/stats
    public ReviewStats getStats(Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        if (reviews.isEmpty()) return new ReviewStats(0, 0.0);
        double avg = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        return new ReviewStats(reviews.size(), Math.round(avg * 10.0) / 10.0);
    }

    // POST /api/reviews/:productId
    @Transactional
    public ReviewResponse createReview(Long productId, Long userId,
                                       CreateReviewRequest req) {
        if (reviewRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ai lăsat deja o recenzie pentru acest produs.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Utilizatorul nu există."));

        Review review = new Review();
        review.setProductId(productId);
        review.setUserId(userId);
        review.setUserName(user.getName());
        review.setRating(req.getRating());
        review.setComment(req.getComment());
        // Sentiment will be filled async by Ollama
        review.setSentiment("pending");

        Review saved = reviewRepository.save(review);

        // Trigger async AI analysis — doesn't block the HTTP response
        analyzeAsync(saved.getId(), req.getComment());

        return toResponse(saved);
    }

    // GET /api/reviews/summary — for AI chatbot, aggregated stats per product
    public List<ReviewDtos.ReviewSummary> getSummaryForAllProducts() {
        List<Review> all = reviewRepository.findAll();
        return all.stream()
                .collect(java.util.stream.Collectors.groupingBy(Review::getProductId))
                .entrySet().stream()
                .map(entry -> {
                    Long productId   = entry.getKey();
                    List<Review> reviews = entry.getValue();
                    double avg = reviews.stream()
                            .mapToInt(Review::getRating).average().orElse(0.0);
                    avg = Math.round(avg * 10.0) / 10.0;

                    // Dominant sentiment
                    String dominant = reviews.stream()
                            .filter(r -> r.getSentiment() != null && !r.getSentiment().equals("pending"))
                            .collect(java.util.stream.Collectors.groupingBy(
                                    Review::getSentiment, java.util.stream.Collectors.counting()))
                            .entrySet().stream()
                            .max(java.util.Map.Entry.comparingByValue())
                            .map(java.util.Map.Entry::getKey)
                            .orElse("mixt");

                    return new ReviewDtos.ReviewSummary(productId, reviews.size(), avg, dominant);
                })
                .toList();
    }

    // DELETE /api/reviews/:id — admin only
    @Transactional
    public void deleteReview(Long reviewId) {
        if (!reviewRepository.existsById(reviewId))
            throw new EntityNotFoundException("Recenzia nu există.");
        reviewRepository.deleteById(reviewId);
    }

    /**
     * Calls the Python /analyze endpoint asynchronously after the review is saved.
     * Updates the review with sentiment data when the AI responds.
     * If Ollama is offline, the review stays with sentiment="pending".
     */
    @Async
    @Transactional
    public void analyzeAsync(Long reviewId, String comment) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = restClient.post()
                    .uri(aiBaseUrl+"/analyze")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("comment", comment))
                    .retrieve()
                    .body(Map.class);

            if (result == null) return;

            Review review = reviewRepository.findById(reviewId).orElse(null);
            if (review == null) return;

            review.setSentiment((String) result.getOrDefault("sentiment", "mixed"));
            review.setSentimentScore(
                    result.get("score") instanceof Number n ? n.intValue() : 3);
            review.setSentimentSummary((String) result.getOrDefault("summary", ""));
            reviewRepository.save(review);

            log.info("Sentiment analysis complete for review {}: {} ({})",
                    reviewId, review.getSentiment(), review.getSentimentScore());

        } catch (Exception e) {
            log.warn("Sentiment analysis failed for review {} — Ollama offline? {}",
                    reviewId, e.getMessage());
        }
    }

    private ReviewResponse toResponse(Review r) {
        ReviewResponse res = new ReviewResponse();
        res.setId(r.getId());
        res.setProductId(r.getProductId());
        res.setUserId(r.getUserId());
        res.setUserName(r.getUserName());
        res.setRating(r.getRating());
        res.setComment(r.getComment());
        res.setSentiment(r.getSentiment());
        res.setSentimentScore(r.getSentimentScore());
        res.setSentimentSummary(r.getSentimentSummary());
        res.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
        return res;
    }
}