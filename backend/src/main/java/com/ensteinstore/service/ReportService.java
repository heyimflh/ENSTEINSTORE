package com.ensteinstore.service;

import com.ensteinstore.dto.response.DailySalesResponse;
import com.ensteinstore.dto.response.MonthlySalesResponse;
import com.ensteinstore.dto.response.StockReportResponse;
import com.ensteinstore.dto.response.TopProductResponse;
import com.ensteinstore.entity.Product;
import com.ensteinstore.exporter.CsvReportExporter;
import com.ensteinstore.repository.ProductRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Report Generation Service (PRD §18, K13, TC-18).
 * Base timezone: Asia/Jakarta. Valid sale criteria: payment_status='PAID' AND order_status<>'CANCELLED'.
 */
@Service
public class ReportService {

    private final JdbcTemplate jdbcTemplate;
    private final ProductRepository productRepository;
    private final CsvReportExporter csvReportExporter;

    public ReportService(JdbcTemplate jdbcTemplate,
                         ProductRepository productRepository,
                         CsvReportExporter csvReportExporter) {
        this.jdbcTemplate = jdbcTemplate;
        this.productRepository = productRepository;
        this.csvReportExporter = csvReportExporter;
    }

    /**
     * Daily sales data (PRD §18.2).
     */
    @Transactional(readOnly = true)
    public List<DailySalesResponse> getDailySalesData(LocalDate startDate, LocalDate endDate) {
        String sql = """
            SELECT
                DATE(o.order_date AT TIME ZONE 'Asia/Jakarta') AS report_date,
                COUNT(o.id) AS total_orders,
                COALESCE(COUNT(CASE WHEN p.status = 'PAID' AND o.order_status <> 'CANCELLED' THEN 1 END), 0) AS paid_orders,
                COALESCE(SUM(CASE WHEN p.status = 'PAID' AND o.order_status <> 'CANCELLED' THEN o.total_amount ELSE 0 END), 0) AS revenue
            FROM orders o
            LEFT JOIN payments p ON o.id = p.order_id
            WHERE DATE(o.order_date AT TIME ZONE 'Asia/Jakarta') BETWEEN ? AND ?
            GROUP BY DATE(o.order_date AT TIME ZONE 'Asia/Jakarta')
            ORDER BY report_date ASC
            """;

        List<DailySalesResponse> list = new ArrayList<>();
        jdbcTemplate.query(sql, rs -> {
            list.add(new DailySalesResponse(
                    rs.getString("report_date"),
                    rs.getLong("total_orders"),
                    rs.getLong("paid_orders"),
                    rs.getBigDecimal("revenue")
            ));
        }, startDate, endDate);
        return list;
    }

    /**
     * Daily sales report CSV (PRD §18.2).
     */
    @Transactional(readOnly = true)
    public void exportDailySalesReport(LocalDate startDate, LocalDate endDate, OutputStream outputStream) throws IOException {
        List<DailySalesResponse> data = getDailySalesData(startDate, endDate);
        List<String> headers = Arrays.asList("Tanggal", "Total Pesanan", "Pesanan Lunas", "Total Pendapatan (Rp)");
        List<List<Object>> rows = new ArrayList<>();
        for (DailySalesResponse item : data) {
            rows.add(Arrays.asList(
                    item.getDate(),
                    item.getTotalOrders(),
                    item.getPaidOrders(),
                    item.getRevenue()
            ));
        }
        csvReportExporter.export(headers, rows, outputStream);
    }

    /**
     * Monthly sales data (PRD §18.2).
     */
    @Transactional(readOnly = true)
    public List<MonthlySalesResponse> getMonthlySalesData(int year) {
        String sql = """
            SELECT
                TO_CHAR(o.order_date AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM') AS report_month,
                COUNT(o.id) AS total_orders,
                COALESCE(COUNT(CASE WHEN p.status = 'PAID' AND o.order_status <> 'CANCELLED' THEN 1 END), 0) AS paid_orders,
                COALESCE(SUM(CASE WHEN p.status = 'PAID' AND o.order_status <> 'CANCELLED' THEN o.total_amount ELSE 0 END), 0) AS revenue
            FROM orders o
            LEFT JOIN payments p ON o.id = p.order_id
            WHERE EXTRACT(YEAR FROM o.order_date AT TIME ZONE 'Asia/Jakarta') = ?
            GROUP BY TO_CHAR(o.order_date AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM')
            ORDER BY report_month ASC
            """;

        List<MonthlySalesResponse> list = new ArrayList<>();
        jdbcTemplate.query(sql, rs -> {
            list.add(new MonthlySalesResponse(
                    rs.getString("report_month"),
                    rs.getLong("total_orders"),
                    rs.getLong("paid_orders"),
                    rs.getBigDecimal("revenue")
            ));
        }, year);
        return list;
    }

    /**
     * Monthly sales report CSV (PRD §18.2).
     */
    @Transactional(readOnly = true)
    public void exportMonthlySalesReport(int year, OutputStream outputStream) throws IOException {
        List<MonthlySalesResponse> data = getMonthlySalesData(year);
        List<String> headers = Arrays.asList("Bulan", "Total Pesanan", "Pesanan Lunas", "Total Pendapatan (Rp)");
        List<List<Object>> rows = new ArrayList<>();
        for (MonthlySalesResponse item : data) {
            rows.add(Arrays.asList(
                    item.getMonth(),
                    item.getTotalOrders(),
                    item.getPaidOrders(),
                    item.getRevenue()
            ));
        }
        csvReportExporter.export(headers, rows, outputStream);
    }

    /**
     * Top selling products data (PRD §18.2).
     */
    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopProductsData(LocalDate startDate, LocalDate endDate, int limit) {
        String sql = """
            SELECT
                p.product_code,
                p.name AS product_name,
                c.name AS category_name,
                u.unit_symbol,
                COALESCE(SUM(oi.quantity), 0) AS total_sold,
                COALESCE(SUM(oi.subtotal), 0) AS total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN payments pay ON o.id = pay.order_id
            JOIN products p ON oi.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            JOIN units u ON p.unit_id = u.id
            WHERE pay.status = 'PAID'
              AND o.order_status <> 'CANCELLED'
              AND DATE(o.order_date AT TIME ZONE 'Asia/Jakarta') BETWEEN ? AND ?
            GROUP BY p.product_code, p.name, c.name, u.unit_symbol
            ORDER BY total_sold DESC
            LIMIT ?
            """;

        List<TopProductResponse> list = new ArrayList<>();
        jdbcTemplate.query(sql, rs -> {
            list.add(new TopProductResponse(
                    rs.getString("product_code"),
                    rs.getString("product_name"),
                    rs.getString("category_name"),
                    rs.getBigDecimal("total_sold"),
                    rs.getString("unit_symbol"),
                    rs.getBigDecimal("total_revenue")
            ));
        }, startDate, endDate, limit);
        return list;
    }

    /**
     * Top selling products report CSV (PRD §18.2).
     */
    @Transactional(readOnly = true)
    public void exportTopProductsReport(LocalDate startDate, LocalDate endDate, int limit, OutputStream outputStream) throws IOException {
        List<TopProductResponse> data = getTopProductsData(startDate, endDate, limit);
        List<String> headers = Arrays.asList(
                "Kode Produk", "Nama Produk", "Kategori", "Jumlah Terjual", "Satuan", "Total Penjualan (Rp)"
        );
        List<List<Object>> rows = new ArrayList<>();
        for (TopProductResponse item : data) {
            rows.add(Arrays.asList(
                    item.getProductCode(),
                    item.getProductName(),
                    item.getCategoryName(),
                    item.getTotalSold(),
                    item.getUnitSymbol(),
                    item.getTotalRevenue()
            ));
        }
        csvReportExporter.export(headers, rows, outputStream);
    }

    /**
     * Current inventory stock data (PRD §18.2).
     */
    @Transactional(readOnly = true)
    public List<StockReportResponse> getStockReportData() {
        List<Product> products = productRepository.findAll();
        List<StockReportResponse> list = new ArrayList<>();

        for (Product p : products) {
            String status = p.getStockOnHand().compareTo(BigDecimal.ZERO) <= 0
                    ? "Habis (Out of Stock)"
                    : (p.isLowStock() ? "Menipis (Low Stock)" : "Tersedia");

            list.add(new StockReportResponse(
                    p.getProductCode(),
                    p.getName(),
                    p.getCategory() != null ? p.getCategory().getName() : "-",
                    p.getStockOnHand(),
                    p.getReservedQuantity(),
                    p.getAvailableQuantity(),
                    p.getUnit() != null ? p.getUnit().getUnitName() : "-",
                    p.getPrice(),
                    status
            ));
        }
        return list;
    }

    /**
     * Current inventory stock report CSV (PRD §18.2).
     */
    @Transactional(readOnly = true)
    public void exportStockReport(OutputStream outputStream) throws IOException {
        List<StockReportResponse> data = getStockReportData();
        List<String> headers = Arrays.asList(
                "Kode Produk", "Nama Produk", "Kategori", "Stok Fisik", "Terreservasi",
                "Stok Tersedia", "Satuan", "Harga Satuan (Rp)", "Status Stok"
        );
        List<List<Object>> rows = new ArrayList<>();

        for (StockReportResponse item : data) {
            rows.add(Arrays.asList(
                    item.getProductCode(),
                    item.getProductName(),
                    item.getCategoryName(),
                    item.getStockOnHand(),
                    item.getReservedQuantity(),
                    item.getAvailableQuantity(),
                    item.getUnitName(),
                    item.getPrice(),
                    item.getStatus()
            ));
        }

        csvReportExporter.export(headers, rows, outputStream);
    }
}
