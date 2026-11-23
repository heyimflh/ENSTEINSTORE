package com.ensteinstore.service;

import com.ensteinstore.exporter.CsvReportExporter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TC-18: Unit tests for CsvReportExporter and Formula Injection protection (AGENTS.md §4).
 */
class CsvReportExporterTest {

    private CsvReportExporter exporter;

    @BeforeEach
    void setUp() {
        exporter = new CsvReportExporter();
    }

    @Test
    @DisplayName("TC-18: Anti-CSV Injection prepends single quote on formula triggers")
    void testAntiCsvInjection() {
        // Cells starting with '=', '+', '-', '@' must be neutralized
        assertThat(exporter.sanitizeCellValue("=cmd|'/C calc'!A0")).isEqualTo("'=cmd|'/C calc'!A0");
        assertThat(exporter.sanitizeCellValue("+12345")).isEqualTo("'+12345");
        assertThat(exporter.sanitizeCellValue("-2000")).isEqualTo("'-2000");
        assertThat(exporter.sanitizeCellValue("@SUM(A1:A10)")).isEqualTo("'@SUM(A1:A10)");

        // Safe normal text should remain unchanged
        assertThat(exporter.sanitizeCellValue("Kain PVC Super")).isEqualTo("Kain PVC Super");
        assertThat(exporter.sanitizeCellValue("150000")).isEqualTo("150000");
        assertThat(exporter.sanitizeCellValue(null)).isEqualTo("");
    }

    @Test
    @DisplayName("TC-18: CSV export produces valid UTF-8 BOM output with escaped commas and quotes")
    void testExportCsv() throws IOException {
        List<String> headers = Arrays.asList("Nama Produk", "Harga", "Kategori");
        List<List<Object>> rows = Arrays.asList(
                Arrays.asList("PVC, Ketebalan 0.25", 50000, "Material Jas Hujan"),
                Arrays.asList("=1+1 Injection Test", 25000, "Resleting"),
                Arrays.asList("Kancing \"Snap\" Hitam", 1000, "Kancing")
        );

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        exporter.export(headers, rows, baos);

        byte[] bytes = baos.toByteArray();
        // Verify UTF-8 BOM
        assertThat(bytes[0]).isEqualTo((byte) 0xEF);
        assertThat(bytes[1]).isEqualTo((byte) 0xBB);
        assertThat(bytes[2]).isEqualTo((byte) 0xBF);

        String csvContent = new String(bytes, 3, bytes.length - 3, StandardCharsets.UTF_8);

        // Check header and escaped content
        assertThat(csvContent).contains("Nama Produk,Harga,Kategori");
        assertThat(csvContent).contains("\"PVC, Ketebalan 0.25\"");
        assertThat(csvContent).contains("'=1+1 Injection Test");
        assertThat(csvContent).contains("\"Kancing \"\"Snap\"\" Hitam\"");
    }
}
