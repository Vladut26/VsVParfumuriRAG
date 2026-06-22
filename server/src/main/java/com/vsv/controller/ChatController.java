package com.vsv.controller;

import com.vsv.dto.ChatDtos.ChatRequest;
import com.vsv.dto.ChatDtos.ChatResponse;
import com.vsv.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // POST /api/chat — public (chatbot available to all visitors)
    @PostMapping
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(chatService.chat(request));
    }
}