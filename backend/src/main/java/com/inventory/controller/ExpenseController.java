package com.inventory.controller;

import com.inventory.entity.Expense;
import com.inventory.entity.User;
import com.inventory.repository.ExpenseRepository;
import com.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<Expense> all() {
        return expenseRepository.findAll();
    }

    @GetMapping("/{id}")
    public Expense byId(@PathVariable Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found"));
    }

    @GetMapping("/range")
    public List<Expense> range(@RequestParam LocalDate start, @RequestParam LocalDate end) {
        return expenseRepository.findByExpenseDateBetweenOrderByExpenseDateDesc(start, end);
    }

    @PostMapping
    public Expense create(@RequestBody Expense expense, Authentication auth) {
        expense.setCreatedBy(currentUser(auth));
        return expenseRepository.save(expense);
    }

    @PutMapping("/{id}")
    public Expense update(@PathVariable Long id, @RequestBody Expense input) {
        Expense expense = byId(id);
        expense.setTitle(input.getTitle());
        expense.setDescription(input.getDescription());
        expense.setCategory(input.getCategory());
        expense.setAmount(input.getAmount());
        expense.setExpenseDate(input.getExpenseDate());
        return expenseRepository.save(expense);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        expenseRepository.deleteById(id);
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByUsername(auth.getName()).orElseThrow();
    }
}
