package com.vsv.service;

import com.vsv.dto.AuthDtos.*;
import com.vsv.entity.RefreshToken;
import com.vsv.entity.User;
import com.vsv.repository.RefreshTokenRepository;
import com.vsv.repository.UserRepository;
import com.vsv.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    private final UserRepository         userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder        passwordEncoder;
    private final JwtUtils               jwtUtils;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils) {
        this.userRepository         = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder        = passwordEncoder;
        this.jwtUtils               = jwtUtils;
    }

    // ── Register ──────────────────────────────────────────────────────
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Acest email este deja folosit.");
        }
        User user = new User(req.getName(), req.getEmail(),
                passwordEncoder.encode(req.getPassword()));
        user.setRole("user");
        User saved = userRepository.save(user);
        log.info("Registered user id={}", saved.getId());
        return buildAuthResponse("Cont creat și autentificat!", saved);
    }

    // ── Login ─────────────────────────────────────────────────────────
    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Email sau parolă incorectă."));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Email sau parolă incorectă.");
        }
        log.info("Login success user id={}", user.getId());
        return buildAuthResponse("Autentificare reușită!", user);
    }

    // ── Refresh ───────────────────────────────────────────────────────
    @Transactional
    public AuthResponse refresh(RefreshRequest req) {
        RefreshToken rt = refreshTokenRepository.findByToken(req.getRefreshToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Refresh token invalid."));

        if (rt.isExpired()) {
            refreshTokenRepository.delete(rt);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Refresh token expirat. Te rugăm să te autentifici din nou.");
        }

        User user = userRepository.findById(rt.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Utilizatorul nu mai există."));

        // Rotate refresh token — delete old, issue new
        refreshTokenRepository.delete(rt);
        return buildAuthResponse("Token reînnoit.", user);
    }

    // ── Logout ────────────────────────────────────────────────────────
    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
        log.info("Logged out user id={}", userId);
    }

    // ── Helpers ───────────────────────────────────────────────────────
    private AuthResponse buildAuthResponse(String message, User user) {
        String accessToken  = jwtUtils.generateToken(
                user.getId().toString(), user.getEmail(), user.getRole());

        String rawRefresh   = UUID.randomUUID().toString();
        Instant expiresAt   = Instant.now().plusMillis(refreshExpirationMs);
        refreshTokenRepository.deleteByUserId(user.getId()); // one active token per user
        refreshTokenRepository.save(new RefreshToken(user.getId(), rawRefresh, expiresAt));

        return new AuthResponse(
                message,
                accessToken,
                rawRefresh,
                new UserPayload(user.getId().toString(), user.getName(),
                        user.getEmail(), user.getRole())
        );
    }
}