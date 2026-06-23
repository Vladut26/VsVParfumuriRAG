package com.vsv.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Component
public class AiClient {
    private final RestClient restClient;

    public AiClient(@Value("${ai.service.base-url:http://localhost:8000}") String aiBaseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(aiBaseUrl)
                .build();
    }

    public String analyzeSentiment(String text) {
        return restClient.post()
                .uri("/analyze")
                .body(Map.of("review_text", text))
                .retrieve()
                .body(String.class); // This returns the JSON string from Gemma 4
    }
}