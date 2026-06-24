package com.netflixclone.controller;

import com.netflixclone.dto.LoginRequestDTO;
import com.netflixclone.dto.LoginResponseDTO;
import com.netflixclone.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/login
     * Body: { "username": "admin", "password": "admin123" }
     * Response: { "token": "eyJ...", "username": "admin", "role": "ADMIN" }
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody @Valid LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }
}
