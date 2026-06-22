package com.vsv.service;

import com.vsv.dto.UserDtos.*;
import com.vsv.entity.User;
import com.vsv.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class UserService {

    private static final Set<String> VALID_ROLES = Set.of("admin", "user");

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // GET /api/users — admin only
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    // GET /api/users/me — own profile
    public UserResponse getMyProfile(Long userId) {
        return toResponse(findOrThrow(userId));
    }

    // PUT /api/users/me — update own profile (name, phone, address)
    @Transactional
    public UserResponse updateMyProfile(Long userId, UpdateProfileRequest req) {
        User user = findOrThrow(userId);

        if (req.getName()        != null && !req.getName().isBlank())
            user.setName(req.getName().trim());
        if (req.getPhoneNumber() != null)
            user.setPhoneNumber(req.getPhoneNumber().trim());
        if (req.getAddress()     != null)
            user.setAddress(req.getAddress().trim());

        return toResponse(userRepository.save(user));
    }

    // PUT /api/users/:userId/role — admin only
    @Transactional
    public void updateUserRole(Long userId, UpdateRoleRequest req) {
        if (req.getRole() == null || !VALID_ROLES.contains(req.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Rol invalid. Trebuie să fie \"admin\" sau \"user\".");
        }
        User user = findOrThrow(userId);
        user.setRole(req.getRole());
        userRepository.save(user);
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utilizatorul nu există."));
    }

    private UserResponse toResponse(User u) {
        UserResponse r = new UserResponse();
        r.setId(u.getId().toString());
        r.setName(u.getName());
        r.setEmail(u.getEmail());
        r.setRole(u.getRole());
        r.setPhoneNumber(u.getPhoneNumber());
        r.setAddress(u.getAddress());
        r.setCreatedAt(u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
        return r;
    }
}