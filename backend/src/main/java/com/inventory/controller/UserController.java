package com.inventory.controller;

import com.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    @GetMapping
    public List<Map<String, Object>> all() {
        return userRepository.findAll().stream().map(AuthController::userView).toList();
    }
}
