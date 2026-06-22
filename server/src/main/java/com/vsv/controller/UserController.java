package com.vsv.controller;

import com.vsv.dto.UserDtos.*;
import com.vsv.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/users/me — own profile (any authenticated user)
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(Authentication auth) {
        Long userId = Long.parseLong((String) auth.getCredentials());
        return ResponseEntity.ok(userService.getMyProfile(userId));
    }

    // PUT /api/users/me — update own profile
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication auth) {
        Long userId = Long.parseLong((String) auth.getCredentials());
        return ResponseEntity.ok(userService.updateMyProfile(userId, request));
    }

    // GET /api/users — admin only (URL guard in SecurityConfig + method guard here)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAll() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // PUT /api/users/:userId/role — admin only
    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateRole(
            @PathVariable Long userId,
            @RequestBody UpdateRoleRequest request) {
        userService.updateUserRole(userId, request);
        return ResponseEntity.ok(
                Map.of("message", "Rolul utilizatorului a fost actualizat cu succes."));
    }
}