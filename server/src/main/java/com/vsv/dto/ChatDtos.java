package com.vsv.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class ChatDtos {

    private ChatDtos() {}

    public static class HistoryMessage {
        private String role;     // "user" | "assistant"
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
        public List<HistoryMessage> getHistory()                       { return history; }
        public void                 setHistory(List<HistoryMessage> h)  { this.history = h; }
    }

    public static class ChatResponse {
        private String reply;

        public ChatResponse() {}
        public ChatResponse(String reply) { this.reply = reply; }
        public String getReply()              { return reply; }
        public void   setReply(String reply)  { this.reply = reply; }
    }
}