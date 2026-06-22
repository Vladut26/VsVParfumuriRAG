package com.vsv.controller;

import com.vsv.dto.AuthDtos.*;
import com.vsv.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // POST /api/auth/refresh  — get new access token using refresh token
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    // POST /api/auth/logout  — revoke refresh token
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(Authentication auth) {
        if (auth != null) {
            Long userId = Long.parseLong((String) auth.getCredentials());
            authService.logout(userId);
        }
        return ResponseEntity.ok(Map.of("message", "Delogare reușită."));
    }
}