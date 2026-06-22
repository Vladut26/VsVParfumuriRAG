package com.vsv.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Builds a concise product-catalog snippet used to ground the AI chatbot.
 * Fetches the top 20 products (name + price) and formats them as plain text.
 */
@Service
public class ProductContextService {

    private final JdbcTemplate jdbc;

    public ProductContextService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public String buildCatalogContext() {
        try {
            List<Map<String, Object>> rows = jdbc.queryForList(
                    "SELECT name, price FROM products ORDER BY created_at DESC LIMIT 20"
            );

            if (rows.isEmpty()) return "";

            return rows.stream()
                    .map(r -> "- " + r.get("name") + " ($" + r.get("price") + ")")
                    .collect(Collectors.joining("\n"));

        } catch (Exception e) {
            // Non-critical: chatbot works without catalog context
            return "";
        }
    }
}