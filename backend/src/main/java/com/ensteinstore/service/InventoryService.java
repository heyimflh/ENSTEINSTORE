package com.ensteinstore.service;

import com.ensteinstore.entity.Product;
import com.ensteinstore.entity.StockMovement;
import com.ensteinstore.entity.User;
import com.ensteinstore.entity.enums.StockMovementType;
import com.ensteinstore.repository.StockMovementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Inventory Service (PRD §12, AGENTS.md §2 Rule 7).
 * Single choke point for all stock mutations via INSERT INTO stock_movements.
 * Never mutates products.stock_on_hand or reserved_quantity directly in Java.
 */
@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final StockMovementRepository stockMovementRepository;

    public InventoryService(StockMovementRepository stockMovementRepository) {
        this.stockMovementRepository = stockMovementRepository;
    }

    /**
     * Reserves stock for an order (PRD §12.2 RESERVE).
     * Increases reserved_quantity via trigger trg_apply_stock_movement.
     */
    @Transactional
    public StockMovement reserveStock(Product product, BigDecimal quantity, UUID orderId, User createdBy) {
        BigDecimal stockBefore = product.getStockOnHand();
        BigDecimal reservedBefore = product.getReservedQuantity();
        BigDecimal reservedAfter = reservedBefore.add(quantity);

        StockMovement movement = new StockMovement(
                product,
                StockMovementType.RESERVE,
                quantity,
                stockBefore,
                stockBefore,
                reservedBefore,
                reservedAfter,
                orderId,
                "ORDER",
                "Reservasi stok checkout pesanan #" + orderId,
                createdBy
        );

        log.info("Reserving {} units for product {} (order {})", quantity, product.getProductCode(), orderId);
        return stockMovementRepository.save(movement);
    }

    /**
     * Unreserves stock when an order is cancelled before payment (PRD §12.2 UNRESERVE).
     * Decreases reserved_quantity via trigger.
     */
    @Transactional
    public StockMovement unreserveStock(Product product, BigDecimal quantity, UUID orderId, String notes, User createdBy) {
        BigDecimal stockBefore = product.getStockOnHand();
        BigDecimal reservedBefore = product.getReservedQuantity();
        BigDecimal reservedAfter = reservedBefore.subtract(quantity).max(BigDecimal.ZERO);

        StockMovement movement = new StockMovement(
                product,
                StockMovementType.UNRESERVE,
                quantity,
                stockBefore,
                stockBefore,
                reservedBefore,
                reservedAfter,
                orderId,
                "ORDER",
                notes != null ? notes : "Pembatalan reservasi stok pesanan #" + orderId,
                createdBy
        );

        log.info("Unreserving {} units for product {} (order {})", quantity, product.getProductCode(), orderId);
        return stockMovementRepository.save(movement);
    }

    /**
     * Fulfills reservation upon verified payment (PRD §12.2 FULFILLMENT).
     * Decreases stock_on_hand AND reserved_quantity by the same amount via trigger.
     */
    @Transactional
    public StockMovement fulfillReservation(Product product, BigDecimal quantity, UUID orderId, User createdBy) {
        BigDecimal stockBefore = product.getStockOnHand();
        BigDecimal stockAfter = stockBefore.subtract(quantity);
        BigDecimal reservedBefore = product.getReservedQuantity();
        BigDecimal reservedAfter = reservedBefore.subtract(quantity).max(BigDecimal.ZERO);

        StockMovement movement = new StockMovement(
                product,
                StockMovementType.FULFILLMENT,
                quantity,
                stockBefore,
                stockAfter,
                reservedBefore,
                reservedAfter,
                orderId,
                "ORDER",
                "Pemenuhan reservasi pembayaran lunas pesanan #" + orderId,
                createdBy
        );

        log.info("Fulfilling reservation of {} units for product {} (order {})", quantity, product.getProductCode(), orderId);
        return stockMovementRepository.save(movement);
    }

    /**
     * Direct stock deduction for offline sales (PRD §12.2 SALE).
     * Decreases stock_on_hand directly without reservation step via trigger.
     */
    @Transactional
    public StockMovement directSale(Product product, BigDecimal quantity, UUID orderId, User createdBy) {
        BigDecimal stockBefore = product.getStockOnHand();
        BigDecimal stockAfter = stockBefore.subtract(quantity);
        BigDecimal reservedBefore = product.getReservedQuantity();

        StockMovement movement = new StockMovement(
                product,
                StockMovementType.SALE,
                quantity,
                stockBefore,
                stockAfter,
                reservedBefore,
                reservedBefore,
                orderId,
                "OFFLINE_SALE",
                "Penjualan langsung toko fisik (offline) pesanan #" + orderId,
                createdBy
        );

        log.info("Direct sale deduction of {} units for product {} (order {})", quantity, product.getProductCode(), orderId);
        return stockMovementRepository.save(movement);
    }

    /**
     * Incoming stock procurement (PRD §12.2 STOCK_IN).
     * Increases stock_on_hand via trigger.
     */
    @Transactional
    public StockMovement stockIn(Product product, BigDecimal quantity, String notes, User createdBy) {
        BigDecimal stockBefore = product.getStockOnHand();
        BigDecimal stockAfter = stockBefore.add(quantity);
        BigDecimal reservedBefore = product.getReservedQuantity();

        StockMovement movement = new StockMovement(
                product,
                StockMovementType.STOCK_IN,
                quantity,
                stockBefore,
                stockAfter,
                reservedBefore,
                reservedBefore,
                null,
                "PURCHASE",
                notes != null ? notes : "Penambahan stok masuk (restock/kulakan)",
                createdBy
        );

        log.info("Stock in of {} units for product {}", quantity, product.getProductCode());
        return stockMovementRepository.save(movement);
    }

    /**
     * Adjusts physical stock to a target quantity based on stock opname (PRD §12.2 ADJUSTMENT).
     * Trigger sets stock_on_hand = NEW.stock_after.
     */
    @Transactional
    public StockMovement adjustStock(Product product, BigDecimal newActualStock, String notes, User createdBy) {
        BigDecimal stockBefore = product.getStockOnHand();
        BigDecimal quantityDiff = newActualStock.subtract(stockBefore).abs();
        BigDecimal reservedBefore = product.getReservedQuantity();

        StockMovement movement = new StockMovement(
                product,
                StockMovementType.ADJUSTMENT,
                quantityDiff,
                stockBefore,
                newActualStock,
                reservedBefore,
                reservedBefore,
                null,
                "OPNAME",
                notes != null ? notes : "Penyesuaian stok fisik (stock opname)",
                createdBy
        );

        log.info("Adjusting stock for product {} from {} to {}", product.getProductCode(), stockBefore, newActualStock);
        return stockMovementRepository.save(movement);
    }

    /**
     * Returns stock when delivered or completed order is returned/refunded (PRD §12.2 RETURN).
     * Increases stock_on_hand via trigger.
     */
    @Transactional
    public StockMovement returnStock(Product product, BigDecimal quantity, UUID orderId, String notes, User createdBy) {
        BigDecimal stockBefore = product.getStockOnHand();
        BigDecimal stockAfter = stockBefore.add(quantity);
        BigDecimal reservedBefore = product.getReservedQuantity();

        StockMovement movement = new StockMovement(
                product,
                StockMovementType.RETURN,
                quantity,
                stockBefore,
                stockAfter,
                reservedBefore,
                reservedBefore,
                orderId,
                "RETURN",
                notes != null ? notes : "Pengembalian barang retur pesanan #" + orderId,
                createdBy
        );

        log.info("Return stock of {} units for product {} (order {})", quantity, product.getProductCode(), orderId);
        return stockMovementRepository.save(movement);
    }

    @Transactional(readOnly = true)
    public Page<StockMovement> getProductMovements(UUID productId, Pageable pageable) {
        return stockMovementRepository.findAllByProductIdOrderByCreatedAtDesc(productId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<StockMovement> getAllMovements(Pageable pageable) {
        return stockMovementRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
}
