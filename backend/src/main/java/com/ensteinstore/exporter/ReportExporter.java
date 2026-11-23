package com.ensteinstore.exporter;

import java.io.IOException;
import java.io.OutputStream;
import java.util.List;

/**
 * Strategy Pattern for Report Exporting (PRD §19.1).
 */
public interface ReportExporter {

    String getFormat();

    String getContentType();

    void export(List<String> headers, List<List<Object>> rows, OutputStream outputStream) throws IOException;
}
