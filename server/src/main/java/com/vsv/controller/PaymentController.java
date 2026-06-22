package com.vsv.controller;

import com.vsv.service.PaymentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Value("${stripe.publishable-key}")
    private String publishableKey;

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Returns the Stripe publishable key for frontend initialization.
     * This key is safe to expose — it can only create tokens, not charge cards.
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        return ResponseEntity.ok(Map.of("publishableKey", publishableKey));
    }

    /**
     * Creates a Stripe PaymentIntent.
     * Called by the frontend before confirming card payment.
     */
    @PostMapping("/create-intent")
    public ResponseEntity<Map<String, String>> createIntent(
            @Valid @RequestBody CreateIntentRequest request) {

        // Convert RON to bani (smallest unit) — Stripe expects integers
        long amountInBani = Math.round(request.amount * 100);

        Map<String, String> result = paymentService.createPaymentIntent(
                amountInBani,
                "Comandă VsV Parfumuri",
                request.email
        );

        return ResponseEntity.ok(result);
    }

    // ── Request DTO ──────────────────────────────────────────────────────────
    public static class CreateIntentRequest {
        @Min(value = 1, message = "Suma trebuie să fie cel puțin 1 RON.")
        private double amount;

        @NotBlank(message = "Email-ul este obligatoriu.")
        private String email;

        public CreateIntentRequest() {}
        public double getAmount()              { return amount; }
        public void   setAmount(double a)      { this.amount = a; }
        public String getEmail()               { return email; }
        public void   setEmail(String e)       { this.email = e; }
    }
}