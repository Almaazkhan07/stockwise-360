package com.inventory.controller;

import com.inventory.entity.Product;
import com.inventory.entity.Sale;
import com.inventory.entity.SaleItem;
import com.inventory.entity.User;
import com.inventory.repository.ProductRepository;
import com.inventory.repository.SaleRepository;
import com.inventory.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {
    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<Sale> all() {
        return saleRepository.findAll();
    }

    @GetMapping("/{id}")
    public Sale byId(@PathVariable Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sale not found"));
    }

    @GetMapping("/recent")
    public List<Sale> recent() {
        return saleRepository.findTop10ByOrderByCreatedAtDesc();
    }

    @GetMapping("/pending")
    public List<Sale> pending() {
        return saleRepository.findByPaymentStatusOrderByCreatedAtDesc(Sale.PaymentStatus.PENDING);
    }

    @GetMapping("/range")
    public List<Sale> range(@RequestParam LocalDate start, @RequestParam LocalDate end) {
        return saleRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start.atStartOfDay(), end.atTime(LocalTime.MAX));
    }

    @PostMapping
    @Transactional
    public Sale create(@RequestBody SaleRequest request, Authentication auth) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A sale needs at least one item");
        }

        Sale sale = Sale.builder()
                .invoiceNumber(nextInvoiceNumber())
                .customerName(blankDefault(request.getCustomerName(), "Walk-in Customer"))
                .customerPhone(request.getCustomerPhone())
                .discountPercent(defaultMoney(request.getDiscountPercent()))
                .taxPercent(defaultMoney(request.getTaxPercent()))
                .paymentMethod(request.getPaymentMethod() == null ? Sale.PaymentMethod.CASH : request.getPaymentMethod())
                .notes(request.getNotes())
                .createdBy(currentUser(auth))
                .saleItems(new ArrayList<>())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (SaleItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
            int quantity = itemRequest.getQuantity() == null ? 0 : itemRequest.getQuantity();
            if (quantity <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be greater than zero");
            }
            if (product.getStockQuantity() < quantity) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient stock for " + product.getName());
            }

            product.setStockQuantity(product.getStockQuantity() - quantity);
            productRepository.save(product);

            BigDecimal unitPrice = itemRequest.getUnitPrice() == null ? product.getSellingPrice() : itemRequest.getUnitPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
            subtotal = subtotal.add(lineTotal);

            SaleItem saleItem = SaleItem.builder()
                    .sale(sale)
                    .product(product)
                    .quantity(quantity)
                    .unitPrice(unitPrice)
                    .costPrice(product.getBuyingPrice())
                    .totalPrice(lineTotal)
                    .build();
            sale.getSaleItems().add(saleItem);
        }

        BigDecimal discountAmount = subtotal.multiply(sale.getDiscountPercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal taxable = subtotal.subtract(discountAmount);
        BigDecimal taxAmount = taxable.multiply(sale.getTaxPercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = taxable.add(taxAmount);
        BigDecimal paid = defaultMoney(request.getAmountPaid());

        sale.setSubtotal(subtotal);
        sale.setDiscountAmount(discountAmount);
        sale.setTaxAmount(taxAmount);
        sale.setTotalAmount(total);
        sale.setAmountPaid(paid);
        sale.setBalanceDue(balanceDue(total, paid));
        sale.setPaymentStatus(paymentStatus(total, paid));

        return saleRepository.save(sale);
    }

    @PatchMapping("/{id}/payment")
    public Sale payment(@PathVariable Long id, @RequestBody Map<String, String> input) {
        Sale sale = byId(id);
        BigDecimal paid = new BigDecimal(input.getOrDefault("amountPaid", sale.getAmountPaid().toString()));
        sale.setAmountPaid(paid);
        sale.setBalanceDue(balanceDue(sale.getTotalAmount(), paid));
        sale.setPaymentStatus(paymentStatus(sale.getTotalAmount(), paid));
        if (input.containsKey("paymentMethod")) {
            sale.setPaymentMethod(Sale.PaymentMethod.valueOf(input.get("paymentMethod")));
        }
        return saleRepository.save(sale);
    }

    private Sale.PaymentStatus paymentStatus(BigDecimal total, BigDecimal paid) {
        if (paid.compareTo(total) >= 0) return Sale.PaymentStatus.PAID;
        if (paid.compareTo(BigDecimal.ZERO) > 0) return Sale.PaymentStatus.PARTIAL;
        return Sale.PaymentStatus.PENDING;
    }

    private BigDecimal balanceDue(BigDecimal total, BigDecimal paid) {
        BigDecimal balance = total.subtract(paid);
        return balance.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : balance;
    }

    private String nextInvoiceNumber() {
        return "INV-" + LocalDate.now().getYear() + "-" + String.format("%04d", saleRepository.count() + 1);
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String blankDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByUsername(auth.getName()).orElseThrow();
    }

    @Data
    public static class SaleRequest {
        private String customerName;
        private String customerPhone;
        private BigDecimal discountPercent;
        private BigDecimal taxPercent;
        private BigDecimal amountPaid;
        private Sale.PaymentMethod paymentMethod;
        private String notes;
        private List<SaleItemRequest> items;
    }

    @Data
    public static class SaleItemRequest {
        private Long productId;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}
