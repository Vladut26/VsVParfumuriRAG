package com.vsv.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    // POST /api/auth/register
    public static class RegisterRequest {
        @NotBlank(message = "Numele este obligatoriu.")
        @Size(min = 3, message = "Numele trebuie să aibă minim 3 caractere.")
        private String name;

        @NotBlank(message = "Email-ul este obligatoriu.")
        @Email(message = "Email invalid.")
        private String email;

        @NotBlank(message = "Parola este obligatorie.")
        @Size(min = 6, message = "Parola trebuie să aibă minim 6 caractere.")
        private String password;

        public RegisterRequest() {}
        public String getName()                  { return name; }
        public void   setName(String name)       { this.name = name; }
        public String getEmail()                 { return email; }
        public void   setEmail(String email)     { this.email = email; }
        public String getPassword()              { return password; }
        public void   setPassword(String p)      { this.password = p; }
    }

    // POST /api/auth/login
    public static class LoginRequest {
        @NotBlank(message = "Email-ul este obligatoriu.")
        @Email(message = "Email invalid.")
        private String email;

        @NotBlank(message = "Parola este obligatorie.")
        private String password;

        public LoginRequest() {}
        public String getEmail()                 { return email; }
        public void   setEmail(String email)     { this.email = email; }
        public String getPassword()              { return password; }
        public void   setPassword(String p)      { this.password = p; }
    }

    // POST /api/auth/refresh
    public static class RefreshRequest {
        @NotBlank(message = "Refresh token-ul este obligatoriu.")
        private String refreshToken;

        public RefreshRequest() {}
        public String getRefreshToken()              { return refreshToken; }
        public void   setRefreshToken(String token)  { this.refreshToken = token; }
    }

    // Auth response — includes both access + refresh tokens
    public static class AuthResponse {
        private String      message;
        private String      token;
        private String      refreshToken;
        private UserPayload user;

        public AuthResponse() {}
        public AuthResponse(String message, String token, String refreshToken, UserPayload user) {
            this.message      = message;
            this.token        = token;
            this.refreshToken = refreshToken;
            this.user         = user;
        }

        public String      getMessage()                     { return message; }
        public void        setMessage(String m)             { this.message = m; }
        public String      getToken()                       { return token; }
        public void        setToken(String t)               { this.token = t; }
        public String      getRefreshToken()                { return refreshToken; }
        public void        setRefreshToken(String rt)       { this.refreshToken = rt; }
        public UserPayload getUser()                        { return user; }
        public void        setUser(UserPayload u)           { this.user = u; }
    }

    // Nested user payload
    public static class UserPayload {
        private String id;
        private String name;
        private String email;
        private String role;

        public UserPayload() {}
        public UserPayload(String id, String name, String email, String role) {
            this.id    = id;
            this.name  = name;
            this.email = email;
            this.role  = role;
        }

        public String getId()                    { return id; }
        public void   setId(String id)           { this.id = id; }
        public String getName()                  { return name; }
        public void   setName(String name)       { this.name = name; }
        public String getEmail()                 { return email; }
        public void   setEmail(String email)     { this.email = email; }
        public String getRole()                  { return role; }
        public void   setRole(String role)       { this.role = role; }
    }
}