package com.ensteinstore.exporter;

import org.springframework.stereotype.Component;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * CSV implementation of ReportExporter with Formula Injection (CSV Injection) protection (PRD §18, AGENTS.md §4, TC-18).
 */
@Component
public class CsvReportExporter implements ReportExporter {

    private static final String CSV_INJECTION_CHARS = "=+-@\t\r";

    @Override
    public String getFormat() {
        return "csv";
    }

    @Override
    public String getContentType() {
        return "text/csv; charset=UTF-8";
    }

    @Override
    public void export(List<String> headers, List<List<Object>> rows, OutputStream outputStream) throws IOException {
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8));

        // Write UTF-8 BOM for Microsoft Excel compatibility
        outputStream.write(0xEF);
        outputStream.write(0xBB);
        outputStream.write(0xBF);

        // Write headers
        writeLine(writer, headers);

        // Write data rows
        if (rows != null) {
            for (List<Object> row : rows) {
                List<String> sanitizedRow = row.stream()
                        .map(this::sanitizeCellValue)
                        .toList();
                writeLine(writer, sanitizedRow);
            }
        }

        writer.flush();
    }

    /**
     * Sanitizes cell values to prevent CSV Injection (Formula Injection).
     * If the string begins with '=', '+', '-', '@', '\t', or '\r', prepends a single quote.
     */
    public String sanitizeCellValue(Object value) {
        if (value == null) {
            return "";
        }
        String str = value.toString();
        if (str.isEmpty()) {
            return "";
        }

        char firstChar = str.charAt(0);
        if (CSV_INJECTION_CHARS.indexOf(firstChar) >= 0) {
            // Guard against CSV formula execution in spreadsheet software
            return "'" + str;
        }

        return str;
    }

    private void writeLine(BufferedWriter writer, List<?> cells) throws IOException {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append(escapeSpecialChars(cells.get(i).toString()));
        }
        writer.write(sb.toString());
        writer.newLine();
    }

    private String escapeSpecialChars(String data) {
        String escapedData = data.replaceAll("\\R", " ");
        if (data.contains(",") || data.contains("\"") || data.contains("'") || data.contains("\n")) {
            data = data.replace("\"", "\"\"");
            escapedData = "\"" + data + "\"";
        }
        return escapedData;
    }
}
