package com.vsv.service;

import com.vsv.dto.ChatDtos.ChatRequest;
import com.vsv.dto.ChatDtos.ChatResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Forwards chat requests to the Python AI service.
 *
 * Timeout set to 120s to accommodate:
 *   - Gemini primary model retry (8s wait)
 *   - Fallback model switch
 *   - Actual Gemini generation time
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    @Value("${ai.service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    private final RestClient restClient;

    public ChatService(RestClient.Builder restClientBuilder) {
        // Custom timeout: connect 5s, read 120s (covers retries + fallback)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(120_000);

        this.restClient = restClientBuilder
                .requestFactory(factory)
                .build();
    }

    public ChatResponse chat(ChatRequest request) {
        try {
            ChatResponse response = restClient.post()
                    .uri(aiServiceBaseUrl + "/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(ChatResponse.class);

            if (response == null || response.getReply() == null || response.getReply().isBlank()) {
                log.warn("AI service returned empty reply");
                return new ChatResponse(
                        "Îmi pare rău, nu am putut genera un răspuns. Încearcă din nou.");
            }
            return response;

        } catch (ResourceAccessException e) {
            log.warn("AI service unreachable or timed out: {}", e.getMessage());
            return new ChatResponse(
                    "Asistentul AI este momentan offline. Te rugăm să încerci din nou.");
        } catch (RestClientException e) {
            log.error("AI service error: {}", e.getMessage());
            return new ChatResponse(
                    "A apărut o eroare cu asistentul AI. Încearcă din nou.");
        }
    }
}