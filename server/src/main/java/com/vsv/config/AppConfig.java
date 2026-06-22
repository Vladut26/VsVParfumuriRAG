package com.vsv.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class AppConfig {

    /**
     * Pre-configured RestClient.Builder used by all services that call the Python AI gateway.
     * Spring Boot 4 auto-configures a RestClient.Builder bean; we customize timeouts here.
     */
    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder()
                .requestInitializer(request ->
                        request.getHeaders().set("User-Agent", "vsv-backend/1.0")
                );
    }
}