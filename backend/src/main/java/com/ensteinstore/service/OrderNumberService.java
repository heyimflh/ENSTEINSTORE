package com.ensteinstore.service;

import com.ensteinstore.repository.OrderNumberCounterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Service for generating unique atomic order numbers (EST-YYYYMMDD-XXXX) (PRD §13.5, K9, AGENTS.md §4).
 * Uses PostgreSQL INSERT ... ON CONFLICT DO UPDATE ... RETURNING on order_number_counters table.
 */
@Service
public class OrderNumberService {

    private static final ZoneId STORE_ZONE = ZoneId.of("Asia/Jakarta");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final OrderNumberCounterRepository counterRepository;

    public OrderNumberService(OrderNumberCounterRepository counterRepository) {
        this.counterRepository = counterRepository;
    }

    /**
     * Generates atomic unique order number in Asia/Jakarta timezone.
     */
    @Transactional
    public String generateOrderNumber() {
        LocalDate today = LocalDate.now(STORE_ZONE);
        int sequence = counterRepository.getNextOrderSequence(today);
        String datePart = today.format(DATE_FORMATTER);
        return String.format("EST-%s-%04d", datePart, sequence);
    }
}
