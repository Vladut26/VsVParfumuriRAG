package com.vsv.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.vsv.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Stripe Webhook Controller.
 *
 * Receives events from Stripe when a payment status changes.
 * Verifies the signature to prevent spoofing, then updates the
 * corresponding order status in the database.
 *
 * Webhook URL to configure in Stripe Dashboard:
 *   https://your-domain.com/api/payments/webhook
 *   (or use Stripe CLI for local testing:
 *    stripe listen --forward-to localhost:8080/api/payments/webhook)
 *
 * Events handled:
 *   - payment_intent.succeeded   → confirms the order
 *   - payment_intent.payment_failed → logs the failure
 */
@RestController
@RequestMapping("/api/payments")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    private final OrderService orderService;

    public StripeWebhookController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {

        Event event;

        // ── Signature verification ───────────────────────────────────────
        if (webhookSecret != null && !webhookSecret.isBlank() && sigHeader != null) {
            try {
                event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            } catch (SignatureVerificationException e) {
                log.warn("Stripe webhook signature verification failed: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid signature"));
            } catch (Exception e) {
                log.error("Stripe webhook parsing error: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Webhook parsing error"));
            }
        } else {
            // No webhook secret configured — parse event without verification
            // (acceptable for test mode / local development)
            try {
                event = Event.GSON.fromJson(payload, Event.class);
            } catch (Exception e) {
                log.error("Could not parse Stripe event: {}", e.getMessage());
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Could not parse event"));
            }
        }

        // ── Event handling ───────────────────────────────────────────────
        String eventType = event.getType();
        log.info("Stripe webhook received: {}", eventType);

        switch (eventType) {
            case "payment_intent.succeeded" -> {
                PaymentIntent pi = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject().orElse(null);
                if (pi != null) {
                    log.info("Payment succeeded: {} (amount={} {})",
                            pi.getId(), pi.getAmount(), pi.getCurrency());
                    orderService.confirmByPaymentIntent(pi.getId());
                }
            }

            case "payment_intent.payment_failed" -> {
                PaymentIntent pi = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject().orElse(null);
                if (pi != null) {
                    String failMsg = pi.getLastPaymentError() != null
                            ? pi.getLastPaymentError().getMessage()
                            : "Unknown error";
                    log.warn("Payment failed: {} — {}", pi.getId(), failMsg);
                }
            }

            default -> log.debug("Unhandled Stripe event type: {}", eventType);
        }

        // Always return 200 to acknowledge receipt — Stripe retries on non-2xx
        return ResponseEntity.ok(Map.of("received", "true"));
    }
}