package com.vsv.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Component
public class AiClient {
    private final RestClient restClient;

    public AiClient() {
        this.restClient = RestClient.builder()
                .baseUrl("http://localhost:8000") // Your Python FastAPI port
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