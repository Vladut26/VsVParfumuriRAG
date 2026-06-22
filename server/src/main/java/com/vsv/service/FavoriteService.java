package com.vsv.service;

import com.vsv.dto.OrderDtos.FavoriteResponse;
import com.vsv.entity.Favorite;
import com.vsv.repository.FavoriteRepository;
import com.vsv.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ProductRepository  productRepository;

    public FavoriteService(FavoriteRepository favoriteRepository,
                           ProductRepository  productRepository) {
        this.favoriteRepository = favoriteRepository;
        this.productRepository  = productRepository;
    }

    /** GET /api/favorites — returns list of productIds for this user */
    public List<FavoriteResponse> getFavorites(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(f -> new FavoriteResponse(
                        f.getProductId(),
                        f.getCreatedAt().toString()))
                .toList();
    }

    /** POST /api/favorites/:productId — toggle add */
    @Transactional
    public FavoriteResponse addFavorite(Long userId, Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new EntityNotFoundException("Produsul nu există.");
        }
        if (favoriteRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Produsul este deja la favorite.");
        }
        Favorite saved = favoriteRepository.save(new Favorite(userId, productId));
        return new FavoriteResponse(saved.getProductId(), saved.getCreatedAt().toString());
    }

    /** DELETE /api/favorites/:productId */
    @Transactional
    public void removeFavorite(Long userId, Long productId) {
        if (!favoriteRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new EntityNotFoundException("Produsul nu este la favorite.");
        }
        favoriteRepository.deleteByUserIdAndProductId(userId, productId);
    }
}