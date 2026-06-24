package com.netflixclone.config;

import com.netflixclone.model.Role;
import com.netflixclone.model.User;
import com.netflixclone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        createUserIfNotExists("admin", "admin@cinevault.it", "admin123", Role.ADMIN);
        createUserIfNotExists("user",  "user@cinevault.it",  "user123",  Role.USER);
    }

    private void createUserIfNotExists(String username, String email, String password, Role role) {
        if (!userRepository.existsByUsername(username)) {
            User user = User.builder()
                    .username(username)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .role(role)
                    .build();
            userRepository.save(user);
            log.info("Utente creato → {} ({})", username, role);
        }
    }
}
