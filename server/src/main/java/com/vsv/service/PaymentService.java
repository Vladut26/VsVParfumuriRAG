package com.vsv.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Stripe Payment Service.
 *
 * Creates PaymentIntents for card payments.
 * In test mode, no real money is charged — use test card 4242 4242 4242 4242.
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${stripe.currency:ron}")
    private String currency;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
        log.info("Stripe initialized (test mode: {})",
                secretKey != null && secretKey.startsWith("sk_test_"));
    }

    /**
     * Create a PaymentIntent for the given amount.
     *
     * @param amountInBani Amount in smallest currency unit (bani for RON, cents for USD).
     *                     e.g. 45099 = 450.99 RON
     * @param description  Order description shown in Stripe dashboard
     * @param customerEmail Customer email for Stripe receipt
     * @return Map with clientSecret (for frontend) and paymentIntentId (for order record)
     */
    public Map<String, String> createPaymentIntent(
            long amountInBani,
            String description,
            String customerEmail) {

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInBani)
                    .setCurrency(currency)
                    .setDescription(description)
                    .setReceiptEmail(customerEmail)
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .putMetadata("platform", "vsv-parfumuri")
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);

            log.info("PaymentIntent created: {} for {} {} ({})",
                    intent.getId(),
                    amountInBani, currency.toUpperCase(),
                    customerEmail);

            return Map.of(
                    "clientSecret",    intent.getClientSecret(),
                    "paymentIntentId", intent.getId()
            );

        } catch (StripeException e) {
            log.error("Stripe error: {} (code: {})", e.getMessage(), e.getCode());
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Eroare la procesarea plății: " + e.getMessage()
            );
        }
    }
}