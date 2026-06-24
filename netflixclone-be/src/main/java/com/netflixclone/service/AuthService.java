package com.netflixclone.service;

import com.netflixclone.dto.LoginRequestDTO;
import com.netflixclone.dto.LoginResponseDTO;
import com.netflixclone.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public LoginResponseDTO login(LoginRequestDTO dto) {
        // Delega a Spring Security: verifica username + password
        // Lancia BadCredentialsException in automatico se le credenziali sono errate
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword())
        );

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String token = jwtUtil.generateToken(userDetails);

        // Estrae il ruolo (es. "ROLE_ADMIN") e rimuove il prefisso
        String role = userDetails.getAuthorities().iterator().next()
                .getAuthority()
                .replace("ROLE_", "");

        return LoginResponseDTO.builder()
                .token(token)
                .username(userDetails.getUsername())
                .role(role)
                .build();
    }
}
