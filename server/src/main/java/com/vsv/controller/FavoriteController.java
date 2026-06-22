package com.vsv.controller;

import com.vsv.dto.OrderDtos.FavoriteResponse;
import com.vsv.service.FavoriteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public ResponseEntity<List<FavoriteResponse>> getMyFavorites(Authentication auth) {
        return ResponseEntity.ok(favoriteService.getFavorites(getUserId(auth)));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<FavoriteResponse> addFavorite(@PathVariable Long productId,
                                                        Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(favoriteService.addFavorite(getUserId(auth), productId));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Map<String, String>> removeFavorite(@PathVariable Long productId,
                                                              Authentication auth) {
        favoriteService.removeFavorite(getUserId(auth), productId);
        return ResponseEntity.ok(Map.of("message", "Produsul a fost eliminat de la favorite."));
    }

    private Long getUserId(Authentication auth) {
        if (auth == null || auth.getCredentials() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Trebuie să fii autentificat.");
        }
        try {
            return Long.parseLong(auth.getCredentials().toString());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Token invalid.");
        }
    }
}