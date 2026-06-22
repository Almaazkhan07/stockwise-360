package com.inventory.config;

import com.inventory.entity.Category;
import com.inventory.entity.Expense;
import com.inventory.entity.Product;
import com.inventory.entity.Sale;
import com.inventory.entity.SaleItem;
import com.inventory.entity.User;
import com.inventory.repository.ExpenseRepository;
import com.inventory.repository.CategoryRepository;
import com.inventory.repository.ProductRepository;
import com.inventory.repository.SaleRepository;
import com.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ExpenseRepository expenseRepository;
    private final SaleRepository saleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                    .username("admin")
                    .email("admin@stockwise360.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .fullName("System Admin")
                    .role(User.Role.ADMIN)
                    .active(true)
                    .build());
            System.out.println(">>> Default admin created: admin / Admin@123");
        }

        if (!categoryRepository.existsByName("General")) {
            categoryRepository.save(Category.builder().name("General").description("Default category").build());
        }

        seedDemoData();
    }

    private void seedDemoData() {
        List<Category> categories = seedCategories();
        seedProducts(categories);
        seedExpenses();
        seedSales();
    }

    private List<Category> seedCategories() {
        List<Category> categories = new ArrayList<>();
        String[][] demoCategories = {
                {"General", "Default category"},
                {"Grocery", "Daily grocery and staples"},
                {"Beverages", "Drinks and packaged beverages"},
                {"Personal Care", "Health and personal care"},
                {"Household", "Household cleaning and utilities"},
                {"Stationery", "Office and school supplies"}
        };

        for (String[] item : demoCategories) {
            Category category = categoryRepository.findByName(item[0])
                    .orElseGet(() -> categoryRepository.save(Category.builder()
                            .name(item[0])
                            .description(item[1])
                            .build()));
            categories.add(category);
        }
        return categories;
    }

    private void seedProducts(List<Category> categories) {
        String[] names = {
                "Basmati Rice 5kg", "Wheat Flour 10kg", "Sugar 1kg", "Salt 1kg", "Sunflower Oil 1L",
                "Toor Dal 1kg", "Chana Dal 1kg", "Red Chilli Powder", "Turmeric Powder", "Garam Masala",
                "Tea Powder 500g", "Instant Coffee", "Mineral Water 1L", "Orange Juice", "Cola Bottle",
                "Energy Drink", "Milk 1L", "Curd 500g", "Butter 100g", "Cheese Slices",
                "Toothpaste", "Toothbrush", "Bath Soap", "Shampoo", "Hand Wash",
                "Face Wash", "Hair Oil", "Body Lotion", "Detergent Powder", "Dishwash Liquid",
                "Floor Cleaner", "Toilet Cleaner", "Garbage Bags", "Tissue Box", "Notebook",
                "Ball Pen Pack", "Pencil Box", "Marker Set", "A4 Paper Ream", "Stapler",
                "Glue Stick", "Scissors", "Calculator", "Envelope Pack", "Biscuits",
                "Chips Packet", "Namkeen Mix", "Chocolate Bar", "Bread Loaf", "Egg Tray"
        };

        for (int i = 0; i < names.length; i++) {
            String sku = "DEMO-" + String.format("%03d", i + 1);
            if (productRepository.existsBySku(sku)) {
                continue;
            }

            BigDecimal cost = BigDecimal.valueOf(20 + (i * 7L) % 180);
            BigDecimal price = cost.add(BigDecimal.valueOf(10 + (i * 3L) % 60));
            productRepository.save(Product.builder()
                    .name(names[i])
                    .sku(sku)
                    .category(categories.get(i % categories.size()))
                    .buyingPrice(cost)
                    .sellingPrice(price)
                    .stockQuantity(25 + (i * 4) % 90)
                    .minimumStock(10 + (i % 8))
                    .unit(i % 5 == 0 ? "kg" : "pcs")
                    .description("Demo stock item for testing")
                    .active(true)
                    .build());
        }

        System.out.println(">>> Demo products ready: " + productRepository.count());
    }

    private void seedExpenses() {
        if (expenseRepository.count() > 0) {
            return;
        }

        User admin = userRepository.findByUsername("admin").orElseThrow();
        Expense.ExpenseCategory[] categories = Expense.ExpenseCategory.values();
        for (int i = 0; i < 12; i++) {
            expenseRepository.save(Expense.builder()
                    .title("Demo expense " + (i + 1))
                    .description("Seeded monthly operating expense")
                    .category(categories[i % categories.length])
                    .amount(BigDecimal.valueOf(450 + (i * 225L)))
                    .expenseDate(LocalDate.now().minusDays(i * 2L))
                    .createdBy(admin)
                    .build());
        }
    }

    private void seedSales() {
        if (saleRepository.count() > 0) {
            return;
        }

        User admin = userRepository.findByUsername("admin").orElseThrow();
        List<Product> products = productRepository.findByActiveTrue();
        int saleCount = Math.min(10, products.size() / 2);

        for (int i = 0; i < saleCount; i++) {
            Product first = products.get(i * 2);
            Product second = products.get(i * 2 + 1);
            int firstQty = 1 + (i % 3);
            int secondQty = 1 + ((i + 1) % 2);

            Sale sale = Sale.builder()
                    .invoiceNumber("INV-DEMO-" + String.format("%04d", i + 1))
                    .customerName("Demo Customer " + (i + 1))
                    .customerPhone("99900000" + String.format("%02d", i + 1))
                    .discountPercent(BigDecimal.ZERO)
                    .discountAmount(BigDecimal.ZERO)
                    .taxPercent(BigDecimal.valueOf(5))
                    .paymentMethod(Sale.PaymentMethod.CASH)
                    .createdBy(admin)
                    .saleItems(new ArrayList<>())
                    .build();

            BigDecimal subtotal = BigDecimal.ZERO;
            subtotal = subtotal.add(addSaleItem(sale, first, firstQty));
            subtotal = subtotal.add(addSaleItem(sale, second, secondQty));

            BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(5)).divide(BigDecimal.valueOf(100));
            BigDecimal total = subtotal.add(tax);
            BigDecimal paid = i % 4 == 0 ? total.subtract(BigDecimal.valueOf(50)) : total;

            sale.setSubtotal(subtotal);
            sale.setTaxAmount(tax);
            sale.setTotalAmount(total);
            sale.setAmountPaid(paid);
            sale.setBalanceDue(total.subtract(paid));
            sale.setPaymentStatus(paid.compareTo(total) >= 0 ? Sale.PaymentStatus.PAID : Sale.PaymentStatus.PARTIAL);
            saleRepository.save(sale);
        }
    }

    private BigDecimal addSaleItem(Sale sale, Product product, int quantity) {
        BigDecimal total = product.getSellingPrice().multiply(BigDecimal.valueOf(quantity));
        product.setStockQuantity(product.getStockQuantity() - quantity);
        productRepository.save(product);

        sale.getSaleItems().add(SaleItem.builder()
                .sale(sale)
                .product(product)
                .quantity(quantity)
                .unitPrice(product.getSellingPrice())
                .costPrice(product.getBuyingPrice())
                .totalPrice(total)
                .build());
        return total;
    }
}
