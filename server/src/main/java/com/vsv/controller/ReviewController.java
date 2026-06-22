package com.vsv.controller;

import com.vsv.dto.ReviewDtos;
import com.vsv.dto.ReviewDtos.*;
import com.vsv.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // GET /api/reviews/summary — all products summary for AI chatbot (public)
    @GetMapping("/summary")
    public ResponseEntity<List<ReviewDtos.ReviewSummary>> getSummary() {
        return ResponseEntity.ok(reviewService.getSummaryForAllProducts());
    }

    // GET /api/reviews/:productId — public
    @GetMapping("/{productId}")
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getReviews(productId));
    }

    // GET /api/reviews/:productId/stats — public
    @GetMapping("/{productId}/stats")
    public ResponseEntity<ReviewStats> getStats(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getStats(productId));
    }

    // POST /api/reviews/:productId — authenticated
    @PostMapping("/{productId}")
    public ResponseEntity<ReviewResponse> create(
            @PathVariable Long productId,
            @Valid @RequestBody CreateReviewRequest request,
            Authentication auth) {
        Long userId = Long.parseLong((String) auth.getCredentials());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(productId, userId, request));
    }

    // DELETE /api/reviews/:id — admin only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.ok(Map.of("message", "Recenzia a fost ștearsă."));
    }
}