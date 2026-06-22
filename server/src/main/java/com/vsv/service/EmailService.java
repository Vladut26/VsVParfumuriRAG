package com.vsv.service;

import com.vsv.entity.Order;
import com.vsv.entity.OrderItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;

/**
 * Sends transactional emails (order confirmations, status updates).
 *
 * Runs @Async so the checkout response isn't delayed by SMTP.
 * Disabled by default (vsv.email.enabled=false) for development.
 * To enable: set a Gmail app password and vsv.email.enabled=true.
 */
@Service
@ConditionalOnProperty(name = "vsv.email.enabled", havingValue = "true", matchIfMissing = false)
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${vsv.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${vsv.email.from:noreply@vsv-parfumuri.ro}")
    private String fromAddress;

    @Autowired(required = false)
    private JavaMailSender mailSender;


    /**
     * Send order confirmation email with HTML template.
     * Called asynchronously after a successful checkout.
     */
    @Async
    public void sendOrderConfirmation(Order order) {
        if (!emailEnabled) {
            log.info("Email disabled — skipping order confirmation for order #{}", order.getId());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(order.getEmail());
            helper.setSubject("VsV Parfumuri — Confirmare comandă #" + order.getId());
            helper.setText(buildOrderConfirmationHtml(order), true);

            mailSender.send(message);
            log.info("Order confirmation email sent to {} for order #{}",
                    order.getEmail(), order.getId());

        } catch (Exception e) {
            log.error("Failed to send order confirmation email for order #{}: {}",
                    order.getId(), e.getMessage());
        }
    }

    private String buildOrderConfirmationHtml(Order order) {
        StringBuilder items = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            items.append(String.format(
                    "<tr>" +
                            "  <td style='padding:8px 12px;border-bottom:1px solid #f0ece3;font-size:14px'>%s</td>" +
                            "  <td style='padding:8px 12px;border-bottom:1px solid #f0ece3;text-align:center;font-size:14px'>%d</td>" +
                            "  <td style='padding:8px 12px;border-bottom:1px solid #f0ece3;text-align:right;font-size:14px'>%s RON</td>" +
                            "</tr>",
                    item.getProductName(),
                    item.getQuantity(),
                    item.getLineTotal().setScale(2, BigDecimal.ROUND_HALF_UP)
            ));
        }

        return String.format("""
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#faf8f5;font-family:'Helvetica Neue',Arial,sans-serif">
            <div style="max-width:600px;margin:0 auto;padding:40px 20px">
              
              <!-- Header -->
              <div style="text-align:center;margin-bottom:32px">
                <span style="color:#C9A96E;font-size:24px">✦</span>
                <h1 style="font-family:Georgia,serif;font-size:24px;color:#1A1A1A;margin:8px 0 4px">
                  Comandă Confirmată
                </h1>
                <p style="color:#999;font-size:14px;margin:0">Comanda #%d a fost plasată cu succes</p>
              </div>

              <!-- Order details card -->
              <div style="background:white;border-radius:16px;padding:24px;border:1px solid #f0ece3">
                
                <!-- Delivery info -->
                <p style="font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:2px;font-weight:600;margin:0 0 12px">
                  Detalii Livrare
                </p>
                <p style="font-size:14px;color:#1A1A1A;margin:0 0 4px"><strong>%s</strong></p>
                <p style="font-size:13px;color:#666;margin:0 0 4px">%s</p>
                <p style="font-size:13px;color:#666;margin:0 0 4px">%s, %s %s</p>
                <p style="font-size:13px;color:#666;margin:0 0 20px">Tel: %s</p>

                <!-- Products table -->
                <p style="font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:2px;font-weight:600;margin:0 0 12px">
                  Produse Comandate
                </p>
                <table style="width:100%%;border-collapse:collapse">
                  <thead>
                    <tr style="background:#faf8f5">
                      <th style="padding:8px 12px;text-align:left;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Produs</th>
                      <th style="padding:8px 12px;text-align:center;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Cant.</th>
                      <th style="padding:8px 12px;text-align:right;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Preț</th>
                    </tr>
                  </thead>
                  <tbody>
                    %s
                  </tbody>
                </table>

                <!-- Total -->
                <div style="margin-top:16px;padding-top:16px;border-top:2px solid #f0ece3;text-align:right">
                  <span style="font-size:14px;color:#999">Total: </span>
                  <span style="font-size:22px;font-weight:bold;color:#1A1A1A">%s RON</span>
                </div>

                <!-- Payment method -->
                <p style="font-size:12px;color:#999;text-align:right;margin-top:4px">
                  Plată: %s
                </p>
              </div>

              <!-- Footer -->
              <div style="text-align:center;margin-top:32px">
                <p style="font-size:12px;color:#999;margin:0">
                  Mulțumim pentru comanda ta! Livrare estimată: 1-3 zile lucrătoare.
                </p>
                <p style="font-size:11px;color:#ccc;margin-top:16px">
                  © 2025 VsV Parfumuri — AI E-Commerce Platform
                </p>
              </div>
            </div>
            </body>
            </html>
            """,
                order.getId(),
                order.getFullName(),
                order.getEmail(),
                order.getAddress(), order.getCity(), order.getPostalCode() != null ? order.getPostalCode() : "",
                order.getPhone(),
                items.toString(),
                order.getTotalAmount().setScale(2, BigDecimal.ROUND_HALF_UP),
                order.getPaymentMethod() != null ? order.getPaymentMethod() : "N/A"
        );
    }
}