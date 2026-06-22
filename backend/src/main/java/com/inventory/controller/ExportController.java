package com.inventory.controller;

import com.inventory.entity.Product;
import com.inventory.entity.Sale;
import com.inventory.entity.SaleItem;
import com.inventory.repository.ExpenseRepository;
import com.inventory.repository.ProductRepository;
import com.inventory.repository.SaleItemRepository;
import com.inventory.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/exports")
@RequiredArgsConstructor
public class ExportController {
    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ExpenseRepository expenseRepository;

    @GetMapping("/products.csv")
    public ResponseEntity<byte[]> productsCsv() {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{"SKU", "Product", "Category", "Stock", "Minimum Stock", "Cost Price", "Selling Price"});
        for (Product product : productRepository.findByActiveTrue()) {
            rows.add(new String[]{
                    value(product.getSku()),
                    value(product.getName()),
                    product.getCategory() == null ? "" : value(product.getCategory().getName()),
                    value(product.getStockQuantity()),
                    value(product.getMinimumStock()),
                    value(product.getBuyingPrice()),
                    value(product.getSellingPrice())
            });
        }
        return download(csv(rows), "stockwise-360-inventory.csv", "text/csv");
    }

    @GetMapping("/products.pdf")
    public ResponseEntity<byte[]> productsPdf() {
        List<String> lines = new ArrayList<>();
        lines.add("StockWise 360 Inventory Export");
        lines.add("Generated: " + LocalDate.now());
        lines.add("");
        for (Product product : productRepository.findByActiveTrue()) {
            lines.add(product.getSku() + " | " + product.getName() + " | Stock: " + product.getStockQuantity()
                    + " | Price: Rs. " + product.getSellingPrice());
        }
        return pdf(lines, "stockwise-360-inventory.pdf");
    }

    @GetMapping("/sales.csv")
    public ResponseEntity<byte[]> salesCsv() {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{"Invoice", "Customer", "Phone", "Subtotal", "Tax", "Total", "Paid", "Balance", "Status", "Created At"});
        for (Sale sale : saleRepository.findAll()) {
            rows.add(new String[]{
                    value(sale.getInvoiceNumber()),
                    value(sale.getCustomerName()),
                    value(sale.getCustomerPhone()),
                    value(sale.getSubtotal()),
                    value(sale.getTaxAmount()),
                    value(sale.getTotalAmount()),
                    value(sale.getAmountPaid()),
                    value(sale.getBalanceDue()),
                    value(sale.getPaymentStatus()),
                    value(sale.getCreatedAt())
            });
        }
        return download(csv(rows), "stockwise-360-sales.csv", "text/csv");
    }

    @GetMapping("/sales.pdf")
    public ResponseEntity<byte[]> salesPdf() {
        List<String> lines = new ArrayList<>();
        lines.add("StockWise 360 Sales Export");
        lines.add("Generated: " + LocalDate.now());
        lines.add("");
        for (Sale sale : saleRepository.findAll()) {
            lines.add(sale.getInvoiceNumber() + " | " + sale.getCustomerName() + " | Total: Rs. "
                    + sale.getTotalAmount() + " | " + sale.getPaymentStatus());
        }
        return pdf(lines, "stockwise-360-sales.pdf");
    }

    @GetMapping("/reports/profit-loss.csv")
    public ResponseEntity<byte[]> profitLossCsv(@RequestParam LocalDate start, @RequestParam LocalDate end) {
        Summary summary = summary(start, end);
        List<String[]> rows = List.of(
                new String[]{"Metric", "Amount"},
                new String[]{"Revenue", value(summary.revenue())},
                new String[]{"COGS", value(summary.cogs())},
                new String[]{"Gross Profit", value(summary.grossProfit())},
                new String[]{"Expenses", value(summary.expenses())},
                new String[]{"Net Profit", value(summary.netProfit())},
                new String[]{"Sales Count", value(summary.salesCount())}
        );
        return download(csv(rows), "stockwise-360-profit-loss.csv", "text/csv");
    }

    @GetMapping("/reports/profit-loss.pdf")
    public ResponseEntity<byte[]> profitLossPdf(@RequestParam LocalDate start, @RequestParam LocalDate end) {
        Summary summary = summary(start, end);
        List<String> lines = List.of(
                "StockWise 360 Profit & Loss Report",
                "Period: " + start + " to " + end,
                "",
                "Revenue: Rs. " + summary.revenue(),
                "COGS: Rs. " + summary.cogs(),
                "Gross Profit: Rs. " + summary.grossProfit(),
                "Expenses: Rs. " + summary.expenses(),
                "Net Profit: Rs. " + summary.netProfit(),
                "Sales Count: " + summary.salesCount()
        );
        return pdf(lines, "stockwise-360-profit-loss.pdf");
    }

    @GetMapping("/invoice/{id}.html")
    public ResponseEntity<byte[]> invoiceHtml(@PathVariable Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sale not found"));
        StringBuilder rows = new StringBuilder();
        for (SaleItem item : sale.getSaleItems()) {
            rows.append("<tr><td>").append(escapeHtml(item.getProduct().getName())).append("</td><td>")
                    .append(item.getQuantity()).append("</td><td>Rs. ").append(item.getUnitPrice())
                    .append("</td><td>Rs. ").append(item.getTotalPrice()).append("</td></tr>");
        }
        String html = """
                <!doctype html>
                <html><head><meta charset="utf-8"><title>Invoice %s</title>
                <style>body{font-family:Arial,sans-serif;margin:32px;color:#172033}.invoice{max-width:760px;margin:auto}
                h1{margin-bottom:4px}.top{display:flex;justify-content:space-between;border-bottom:2px solid #172033;padding-bottom:16px}
                table{width:100%%;border-collapse:collapse;margin-top:24px}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}
                .totals{margin-left:auto;margin-top:24px;width:280px}.totals div{display:flex;justify-content:space-between;padding:6px 0}
                .total{font-size:20px;font-weight:bold;border-top:2px solid #172033}@media print{button{display:none}}</style></head>
                <body><main class="invoice"><button onclick="print()">Print / Save PDF</button><section class="top">
                <div><h1>StockWise 360</h1><p>Business Inventory Invoice</p></div>
                <div><strong>%s</strong><p>%s</p></div></section>
                <p><strong>Customer:</strong> %s<br><strong>Phone:</strong> %s<br><strong>Status:</strong> %s</p>
                <table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>%s</tbody></table>
                <section class="totals"><div><span>Subtotal</span><span>Rs. %s</span></div><div><span>Tax</span><span>Rs. %s</span></div>
                <div class="total"><span>Total</span><span>Rs. %s</span></div><div><span>Paid</span><span>Rs. %s</span></div>
                <div><span>Balance</span><span>Rs. %s</span></div></section></main></body></html>
                """.formatted(
                sale.getInvoiceNumber(),
                sale.getInvoiceNumber(),
                sale.getCreatedAt(),
                escapeHtml(sale.getCustomerName()),
                escapeHtml(sale.getCustomerPhone()),
                sale.getPaymentStatus(),
                rows,
                sale.getSubtotal(),
                sale.getTaxAmount(),
                sale.getTotalAmount(),
                sale.getAmountPaid(),
                sale.getBalanceDue()
        );
        return download(html.getBytes(StandardCharsets.UTF_8), sale.getInvoiceNumber() + ".html", "text/html");
    }

    @GetMapping("/invoice/{id}.pdf")
    public ResponseEntity<byte[]> invoicePdf(@PathVariable Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sale not found"));
        List<String> lines = new ArrayList<>();
        lines.add("StockWise 360 Invoice");
        lines.add("Invoice: " + sale.getInvoiceNumber());
        lines.add("Customer: " + sale.getCustomerName());
        lines.add("Phone: " + sale.getCustomerPhone());
        lines.add("Status: " + sale.getPaymentStatus());
        lines.add("");
        for (SaleItem item : sale.getSaleItems()) {
            lines.add(item.getProduct().getName() + " | Qty " + item.getQuantity() + " | Rate Rs. "
                    + item.getUnitPrice() + " | Total Rs. " + item.getTotalPrice());
        }
        lines.add("");
        lines.add("Subtotal: Rs. " + sale.getSubtotal());
        lines.add("Tax: Rs. " + sale.getTaxAmount());
        lines.add("Total: Rs. " + sale.getTotalAmount());
        lines.add("Paid: Rs. " + sale.getAmountPaid());
        lines.add("Balance: Rs. " + sale.getBalanceDue());
        return pdf(lines, sale.getInvoiceNumber() + ".pdf");
    }

    private Summary summary(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        BigDecimal revenue = saleRepository.getTotalRevenueByPeriod(start, end);
        BigDecimal cogs = saleItemRepository.getTotalCostByPeriod(start, end);
        BigDecimal expenses = expenseRepository.getTotalExpenseByPeriod(startDate, endDate);
        BigDecimal grossProfit = revenue.subtract(cogs);
        BigDecimal netProfit = grossProfit.subtract(expenses);
        return new Summary(revenue, cogs, expenses, grossProfit, netProfit, saleRepository.countSalesByPeriod(start, end));
    }

    private ResponseEntity<byte[]> pdf(List<String> lines, String filename) {
        return download(SimplePdf.create(lines), filename, "application/pdf");
    }

    private ResponseEntity<byte[]> download(byte[] bytes, String filename, String mediaType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(mediaType));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    private byte[] csv(List<String[]> rows) {
        StringBuilder builder = new StringBuilder();
        for (String[] row : rows) {
            for (int i = 0; i < row.length; i++) {
                if (i > 0) builder.append(',');
                builder.append('"').append(row[i].replace("\"", "\"\"")).append('"');
            }
            builder.append('\n');
        }
        return builder.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String value(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private record Summary(BigDecimal revenue, BigDecimal cogs, BigDecimal expenses, BigDecimal grossProfit,
                           BigDecimal netProfit, Long salesCount) {}
}
