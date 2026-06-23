package com.vsv.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class ChatDtos {

    private ChatDtos() {}

    public static class HistoryMessage {
        private String role;
        private String content;

        public HistoryMessage() {}
        public String getRole()                  { return role; }
        public void   setRole(String role)       { this.role = role; }
        public String getContent()               { return content; }
        public void   setContent(String content) { this.content = content; }
    }

    public static class ChatRequest {
        @NotBlank(message = "Mesajul nu poate fi gol.")
        @Size(max = 2000, message = "Mesajul este prea lung.")
        private String message;

        private List<HistoryMessage> history;

        public ChatRequest() {}
        public String               getMessage()                        { return message; }
        public void                 setMessage(String msg)              { this.message = msg; }
        public List<HistoryMessage> getHistory()                        { return history; }
        public void                 setHistory(List<HistoryMessage> h)  { this.history = h; }
    }

    public static class RecommendedProduct {
        private Long   id;
        private String name;
        private String brand;
        private Double price;
        private String imageUrl;
        private String category;
        private Boolean inStock;

        public RecommendedProduct() {}
        public Long    getId()                          { return id; }
        public void    setId(Long id)                   { this.id = id; }
        public String  getName()                        { return name; }
        public void    setName(String name)             { this.name = name; }
        public String  getBrand()                       { return brand; }
        public void    setBrand(String brand)           { this.brand = brand; }
        public Double  getPrice()                       { return price; }
        public void    setPrice(Double price)           { this.price = price; }
        public String  getImageUrl()                    { return imageUrl; }
        public void    setImageUrl(String imageUrl)     { this.imageUrl = imageUrl; }
        public String  getCategory()                    { return category; }
        public void    setCategory(String category)     { this.category = category; }
        public Boolean getInStock()                     { return inStock; }
        public void    setInStock(Boolean inStock)      { this.inStock = inStock; }
    }

    public static class ChatResponse {
        private String reply;
        private List<RecommendedProduct> products;

        public ChatResponse() {}
        public ChatResponse(String reply) { this.reply = reply; }
        public String                    getReply()                                  { return reply; }
        public void                      setReply(String reply)                      { this.reply = reply; }
        public List<RecommendedProduct>  getProducts()                               { return products; }
        public void                      setProducts(List<RecommendedProduct> p)     { this.products = p; }
    }
}