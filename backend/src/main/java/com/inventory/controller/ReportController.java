package com.inventory.controller;

import com.inventory.repository.ExpenseRepository;
import com.inventory.repository.ProductRepository;
import com.inventory.repository.SaleItemRepository;
import com.inventory.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ExpenseRepository expenseRepository;
    private final ProductRepository productRepository;

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        Map<String, Object> month = summary(monthStart, today);
        return Map.of(
                "today", summary(today, today),
                "month", month,
                "activeProducts", productRepository.findByActiveTrue().size(),
                "lowStockCount", productRepository.findLowStockProducts().size(),
                "lowStockProducts", productRepository.findLowStockProducts(),
                "recentSales", saleRepository.findTop10ByOrderByCreatedAtDesc()
        );
    }

    @GetMapping("/daily")
    public Map<String, Object> daily(@RequestParam LocalDate date) {
        return summary(date, date);
    }

    @GetMapping("/monthly")
    public Map<String, Object> monthly(@RequestParam int year, @RequestParam int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        return summary(start, start.withDayOfMonth(start.lengthOfMonth()));
    }

    @GetMapping("/yearly")
    public Map<String, Object> yearly(@RequestParam int year) {
        return summary(LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31));
    }

    @GetMapping("/profit-loss")
    public Map<String, Object> profitLoss(@RequestParam LocalDate start, @RequestParam LocalDate end) {
        return summary(start, end);
    }

    @GetMapping("/top-products")
    public List<Map<String, Object>> topProducts(@RequestParam LocalDate start, @RequestParam LocalDate end) {
        return saleItemRepository.findTopSellingProducts(start.atStartOfDay(), end.atTime(LocalTime.MAX))
                .stream()
                .map(row -> Map.of("productId", row[0], "name", row[1], "quantity", row[2]))
                .toList();
    }

    private Map<String, Object> summary(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        BigDecimal revenue = saleRepository.getTotalRevenueByPeriod(start, end);
        BigDecimal cogs = saleItemRepository.getTotalCostByPeriod(start, end);
        BigDecimal expenses = expenseRepository.getTotalExpenseByPeriod(startDate, endDate);
        BigDecimal grossProfit = revenue.subtract(cogs);
        BigDecimal netProfit = grossProfit.subtract(expenses);
        return Map.of(
                "start", startDate,
                "end", endDate,
                "revenue", revenue,
                "cogs", cogs,
                "grossProfit", grossProfit,
                "expenses", expenses,
                "netProfit", netProfit,
                "salesCount", saleRepository.countSalesByPeriod(start, end)
        );
    }
}
