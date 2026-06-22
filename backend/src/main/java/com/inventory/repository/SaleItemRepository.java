package com.inventory.repository;

import com.inventory.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {
    @Query("SELECT si.product.id, si.product.name, SUM(si.quantity) as totalQty FROM SaleItem si WHERE si.sale.createdAt BETWEEN :start AND :end GROUP BY si.product.id, si.product.name ORDER BY totalQty DESC")
    List<Object[]> findTopSellingProducts(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(si.costPrice * si.quantity), 0) FROM SaleItem si WHERE si.sale.createdAt BETWEEN :start AND :end")
    BigDecimal getTotalCostByPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
