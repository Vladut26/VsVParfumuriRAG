package com.vsv.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    // ── Constructors ──────────────────────────────
    public Category() {}

    public Category(String name, String slug) {
        this.name = name;
        this.slug = slug;
    }

    // ── Getters & Setters ─────────────────────────
    public Long   getId()               { return id; }
    public void   setId(Long id)        { this.id = id; }

    public String getName()             { return name; }
    public void   setName(String name)  { this.name = name; }

    public String getSlug()             { return slug; }
    public void   setSlug(String slug)  { this.slug = slug; }
}