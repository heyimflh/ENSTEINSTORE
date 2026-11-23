package com.ensteinstore.service;

import com.ensteinstore.dto.response.DashboardSummaryResponse;
import com.ensteinstore.dto.response.DashboardSummaryResponse.RecentOrderDto;
import com.ensteinstore.dto.response.DashboardSummaryResponse.SalesSummaryDto;
import com.ensteinstore.dto.response.DashboardSummaryResponse.StockSummaryDto;
import com.ensteinstore.entity.Order;
import com.ensteinstore.entity.Product;
import com.ensteinstore.repository.OrderRepository;
import com.ensteinstore.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * Multithreaded Dashboard Service (PRD §8.8, AGENTS.md §4, TC-17).
 * Executes 3 parallel queries using CompletableFuture on an isolated thread pool executor.
 */
@Service
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    private final JdbcTemplate jdbcTemplate;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final Executor dashboardExecutor;

    public DashboardService(JdbcTemplate jdbcTemplate,
                            ProductRepository productRepository,
                            OrderRepository orderRepository,
                            @Qualifier("dashboardExecutor") Executor dashboardExecutor) {
        this.jdbcTemplate = jdbcTemplate;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.dashboardExecutor = dashboardExecutor;
    }

    /**
     * Aggregates dashboard metrics by fanning out 3 parallel async tasks (TC-17).
     */
    public DashboardSummaryResponse getDashboardSummary() {
        long startTime = System.currentTimeMillis();

        CompletableFuture<SalesSummaryDto> salesFuture =
                CompletableFuture.supplyAsync(this::calculateSalesSummary, dashboardExecutor);

        CompletableFuture<StockSummaryDto> stockFuture =
                CompletableFuture.supplyAsync(this::calculateStockSummary, dashboardExecutor);

        CompletableFuture<List<RecentOrderDto>> recentOrdersFuture =
                CompletableFuture.supplyAsync(this::fetchRecentOrders, dashboardExecutor);

        // Wait for all 3 tasks to complete concurrently
        CompletableFuture.allOf(salesFuture, stockFuture, recentOrdersFuture).join();

        SalesSummaryDto sales = salesFuture.join();
        StockSummaryDto stock = stockFuture.join();
        List<RecentOrderDto> recentOrders = recentOrdersFuture.join();

        log.info("Dashboard summary generated concurrently in {} ms", System.currentTimeMillis() - startTime);
        return new DashboardSummaryResponse(sales, stock, recentOrders);
    }

    /**
     * Query 1: Sales summary (total revenue, order count, AOV) (K13).
     */
    @Transactional(readOnly = true)
    public SalesSummaryDto calculateSalesSummary() {
        String sql = """
            SELECT
                COUNT(o.id) AS total_orders,
                COALESCE(COUNT(CASE WHEN p.status = 'PAID' AND o.order_status <> 'CANCELLED' THEN 1 END), 0) AS paid_orders,
                COALESCE(SUM(CASE WHEN p.status = 'PAID' AND o.order_status <> 'CANCELLED' THEN o.total_amount ELSE 0 END), 0) AS total_revenue
            FROM orders o
            LEFT JOIN payments p ON o.id = p.order_id
            """;

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            long totalOrders = rs.getLong("total_orders");
            long paidOrders = rs.getLong("paid_orders");
            BigDecimal totalRevenue = rs.getBigDecimal("total_revenue");
            if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

            BigDecimal aov = paidOrders > 0
                    ? totalRevenue.divide(BigDecimal.valueOf(paidOrders), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            return new SalesSummaryDto(totalRevenue, totalOrders, paidOrders, aov);
        });
    }

    /**
     * Query 2: Product & stock summary (in-stock, low-stock, out-of-stock).
     */
    @Transactional(readOnly = true)
    public StockSummaryDto calculateStockSummary() {
        List<Product> activeProducts = productRepository.findAllByIsActiveTrue();
        long total = activeProducts.size();
        long outOfStock = 0;
        long lowStock = 0;
        long inStock = 0;

        for (Product p : activeProducts) {
            BigDecimal stock = p.getStockOnHand() != null ? p.getStockOnHand() : BigDecimal.ZERO;
            if (stock.compareTo(BigDecimal.ZERO) <= 0) {
                outOfStock++;
            } else if (p.isLowStock()) {
                lowStock++;
            } else {
                inStock++;
            }
        }

        return new StockSummaryDto(total, inStock, lowStock, outOfStock);
    }

    /**
     * Query 3: 5 latest orders.
     */
    @Transactional(readOnly = true)
    public List<RecentOrderDto> fetchRecentOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc(PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(order -> new RecentOrderDto(
                        order.getId(),
                        order.getOrderNumber(),
                        order.getRecipientName(),
                        order.getTotalAmount(),
                        order.getOrderStatus().name(),
                        order.getOrderDate()
                ))
                .toList();
    }
}
