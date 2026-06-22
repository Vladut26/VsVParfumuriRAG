package com.vsv.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class UserDtos {

    private UserDtos() {}

    // GET /api/users
    public static class UserResponse {
        private String id;
        private String name;
        private String email;
        private String role;
        private String phoneNumber;
        private String address;
        private String createdAt;
        private Object password = null;

        public UserResponse() {}
        public String getId()                      { return id; }
        public void   setId(String id)             { this.id = id; }
        public String getName()                    { return name; }
        public void   setName(String n)            { this.name = n; }
        public String getEmail()                   { return email; }
        public void   setEmail(String e)           { this.email = e; }
        public String getRole()                    { return role; }
        public void   setRole(String r)            { this.role = r; }
        public String getPhoneNumber()             { return phoneNumber; }
        public void   setPhoneNumber(String p)     { this.phoneNumber = p; }
        public String getAddress()                 { return address; }
        public void   setAddress(String a)         { this.address = a; }
        public String getCreatedAt()               { return createdAt; }
        public void   setCreatedAt(String t)       { this.createdAt = t; }
        public Object getPassword()                { return password; }
    }

    // PUT /api/users/me — update own profile
    public static class UpdateProfileRequest {
        @NotBlank(message = "Numele este obligatoriu.")
        @Size(min = 3, max = 120, message = "Numele trebuie să aibă între 3 și 120 de caractere.")
        private String name;

        @Size(max = 30, message = "Numărul de telefon este prea lung.")
        private String phoneNumber;

        @Size(max = 255, message = "Adresa este prea lungă.")
        private String address;

        public UpdateProfileRequest() {}
        public String getName()                    { return name; }
        public void   setName(String n)            { this.name = n; }
        public String getPhoneNumber()             { return phoneNumber; }
        public void   setPhoneNumber(String p)     { this.phoneNumber = p; }
        public String getAddress()                 { return address; }
        public void   setAddress(String a)         { this.address = a; }
    }

    // PUT /api/users/:userId/role
    public static class UpdateRoleRequest {
        private String role;

        public UpdateRoleRequest() {}
        public String getRole()               { return role; }
        public void   setRole(String role)    { this.role = role; }
    }
}