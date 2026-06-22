package com.inventory.controller;

import com.inventory.entity.Category;
import com.inventory.entity.Product;
import com.inventory.repository.CategoryRepository;
import com.inventory.repository.ProductRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping
    public List<Product> all() {
        return productRepository.findByActiveTrue();
    }

    @GetMapping("/{id}")
    public Product byId(@PathVariable Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    @PostMapping
    public Product create(@RequestBody ProductRequest request) {
        return productRepository.save(apply(Product.builder().active(true).build(), request));
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @RequestBody ProductRequest request) {
        Product product = byId(id);
        return productRepository.save(apply(product, request));
    }

    @DeleteMapping("/{id}")
    public Product deactivate(@PathVariable Long id) {
        Product product = byId(id);
        product.setActive(false);
        return productRepository.save(product);
    }

    @GetMapping("/low-stock")
    public List<Product> lowStock() {
        return productRepository.findLowStockProducts();
    }

    @GetMapping("/search")
    public List<Product> search(@RequestParam String keyword) {
        return productRepository.searchProducts(keyword);
    }

    private Product apply(Product product, ProductRequest request) {
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        }
        product.setName(request.getName());
        product.setSku(request.getSku());
        product.setCategory(category);
        product.setBuyingPrice(defaultMoney(request.getBuyingPrice()));
        product.setSellingPrice(defaultMoney(request.getSellingPrice()));
        product.setStockQuantity(request.getStockQuantity() == null ? 0 : request.getStockQuantity());
        product.setMinimumStock(request.getMinimumStock() == null ? 0 : request.getMinimumStock());
        product.setUnit(request.getUnit());
        product.setDescription(request.getDescription());
        return product;
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    @Data
    public static class ProductRequest {
        private String name;
        private String sku;
        private Long categoryId;
        private BigDecimal buyingPrice;
        private BigDecimal sellingPrice;
        private Integer stockQuantity;
        private Integer minimumStock;
        private String unit;
        private String description;
    }
}
