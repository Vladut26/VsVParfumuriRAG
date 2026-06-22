package com.vsv.repository;

import com.vsv.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
        SELECT p FROM Product p
        WHERE (:q IS NULL OR :q = ''
               OR LOWER(p.name)         LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(p.brand)        LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(p.categoryName) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:category IS NULL OR :category = ''
               OR LOWER(p.categoryName) = LOWER(:category))
        ORDER BY p.createdAt DESC
    """)
    Page<Product> findAllPaged(
            @Param("q")        String query,
            @Param("category") String category,
            Pageable pageable
    );

    @Query("SELECT p FROM Product p WHERE p.id IN :ids")
    List<Product> findAllByIds(@Param("ids") List<Long> ids);
}