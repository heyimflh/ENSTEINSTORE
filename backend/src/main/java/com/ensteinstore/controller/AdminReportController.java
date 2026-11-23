package com.ensteinstore.controller;

import com.ensteinstore.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Reports", description = "Endpoints ekspor laporan keuangan dan inventaris dalam format CSV aman (TC-18)")
public class AdminReportController {

    private final ReportService reportService;

    public AdminReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales/daily")
    @Operation(summary = "Ekspor laporan penjualan harian (CSV)",
               description = "Mengunduh berkas CSV laporan penjualan harian berdasarkan rentang tanggal (WIB). Aman dari CSV injection.")
    public void exportDailySales(
            @Parameter(description = "Tanggal mulai (YYYY-MM-DD)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Tanggal akhir (YYYY-MM-DD)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=sales_daily_" + startDate + "_" + endDate + ".csv");
        reportService.exportDailySalesReport(startDate, endDate, response.getOutputStream());
    }

    @GetMapping("/sales/monthly")
    @Operation(summary = "Ekspor laporan penjualan bulanan (CSV)",
               description = "Mengunduh berkas CSV rekapitulasi penjualan bulanan untuk tahun tertentu.")
    public void exportMonthlySales(
            @Parameter(description = "Tahun laporan") @RequestParam int year,
            HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=sales_monthly_" + year + ".csv");
        reportService.exportMonthlySalesReport(year, response.getOutputStream());
    }

    @GetMapping("/products/top")
    @Operation(summary = "Ekspor laporan produk terlaris (CSV)",
               description = "Mengunduh berkas CSV daftar produk terlaris berdasarkan kuantitas terjual.")
    public void exportTopProducts(
            @Parameter(description = "Tanggal mulai (YYYY-MM-DD)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Tanggal akhir (YYYY-MM-DD)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Batas jumlah produk terlaris")
            @RequestParam(defaultValue = "10") int limit,
            HttpServletResponse response) throws IOException {
        if (startDate == null) startDate = LocalDate.now().minusMonths(1);
        if (endDate == null) endDate = LocalDate.now();

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=top_products_" + startDate + "_" + endDate + ".csv");
        reportService.exportTopProductsReport(startDate, endDate, limit, response.getOutputStream());
    }

    @GetMapping("/inventory/stock")
    @Operation(summary = "Ekspor laporan stok inventaris (CSV)",
               description = "Mengunduh berkas CSV rekapitulasi stok fisik, reservasi, dan status ketersediaan seluruh produk.")
    public void exportStock(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=inventory_stock_" + LocalDate.now() + ".csv");
        reportService.exportStockReport(response.getOutputStream());
    }
}
