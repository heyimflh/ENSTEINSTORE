package com.ensteinstore.service;

import com.ensteinstore.dto.request.CartItemRequest;
import com.ensteinstore.dto.response.CartItemResponse;
import com.ensteinstore.dto.response.CartResponse;
import com.ensteinstore.entity.Cart;
import com.ensteinstore.entity.CartItem;
import com.ensteinstore.entity.Customer;
import com.ensteinstore.entity.Product;
import com.ensteinstore.entity.enums.CartStatus;
import com.ensteinstore.exception.*;
import com.ensteinstore.repository.CartItemRepository;
import com.ensteinstore.repository.CartRepository;
import com.ensteinstore.repository.CustomerRepository;
import com.ensteinstore.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for Cart and Cart Item Operations (PRD §8.3, K10, Rule 4).
 */
@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       ProductRepository productRepository,
                       CustomerRepository customerRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
    }

    /**
     * Retrieves or creates an ACTIVE cart for a customer.
     */
    @Transactional
    public Cart getOrCreateActiveCart(UUID customerId) {
        return cartRepository.findByCustomerIdAndStatus(customerId, CartStatus.ACTIVE)
                .orElseGet(() -> {
                    Customer customer = customerRepository.findById(customerId)
                            .orElseThrow(() -> new UserNotFoundException("Pelanggan tidak ditemukan dengan ID: " + customerId));
                    Cart newCart = new Cart(customer, CartStatus.ACTIVE);
                    return cartRepository.save(newCart);
                });
    }

    /**
     * Adds an item to the customer's active cart.
     * Validates allowDecimal constraint (K10, TC-08) and available stock.
     */
    @Transactional
    public CartResponse addItemToCart(UUID customerId, CartItemRequest request) {
        Cart cart = getOrCreateActiveCart(customerId);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ProductNotFoundException("Produk tidak ditemukan dengan ID: " + request.getProductId()));

        if (!Boolean.TRUE.equals(product.getIsActive())) {
            throw new ProductNotFoundException("Produk tidak aktif atau sudah tidak dijual.");
        }

        validateUnitDecimal(product, request.getQuantity());

        // Check if item already exists in cart
        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
        BigDecimal totalDesiredQty;

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            totalDesiredQty = existingItem.getQuantity().add(request.getQuantity());

            if (product.getAvailableQuantity().compareTo(totalDesiredQty) < 0) {
                throw new InsufficientStockException(
                        String.format("Stok '%s' tidak mencukupi. Tersedia: %s, Total di keranjang: %s",
                                product.getName(), product.getAvailableQuantity(), totalDesiredQty)
                );
            }

            existingItem.setQuantity(totalDesiredQty);
            existingItem.setPriceAtAdd(product.getPrice());
            cartItemRepository.save(existingItem);
        } else {
            totalDesiredQty = request.getQuantity();

            if (product.getAvailableQuantity().compareTo(totalDesiredQty) < 0) {
                throw new InsufficientStockException(
                        String.format("Stok '%s' tidak mencukupi. Tersedia: %s, Diminta: %s",
                                product.getName(), product.getAvailableQuantity(), totalDesiredQty)
                );
            }

            CartItem newItem = new CartItem(cart, product, totalDesiredQty, product.getPrice());
            cart.addItem(newItem);
            cartItemRepository.save(newItem);
        }

        return getCartSummary(customerId);
    }

    /**
     * Updates the quantity of an existing item in the cart.
     */
    @Transactional
    public CartResponse updateItemQuantity(UUID customerId, UUID cartItemId, BigDecimal newQuantity) {
        if (newQuantity == null || newQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            return removeItemFromCart(customerId, cartItemId);
        }

        Cart cart = getOrCreateActiveCart(customerId);
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item keranjang tidak ditemukan dengan ID: " + cartItemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new ForbiddenResourceException("Item ini bukan milik keranjang Anda.");
        }

        Product product = cartItem.getProduct();
        validateUnitDecimal(product, newQuantity);

        if (product.getAvailableQuantity().compareTo(newQuantity) < 0) {
            throw new InsufficientStockException(
                    String.format("Stok '%s' tidak mencukupi. Tersedia: %s, Diminta: %s",
                            product.getName(), product.getAvailableQuantity(), newQuantity)
            );
        }

        cartItem.setQuantity(newQuantity);
        cartItemRepository.save(cartItem);

        return getCartSummary(customerId);
    }

    /**
     * Removes an item from the cart.
     */
    @Transactional
    public CartResponse removeItemFromCart(UUID customerId, UUID cartItemId) {
        Cart cart = getOrCreateActiveCart(customerId);
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item keranjang tidak ditemukan dengan ID: " + cartItemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new ForbiddenResourceException("Item ini bukan milik keranjang Anda.");
        }

        cart.removeItem(cartItem);
        cartItemRepository.delete(cartItem);

        return getCartSummary(customerId);
    }

    /**
     * Clears all items in the active cart.
     */
    @Transactional
    public void clearCart(UUID customerId) {
        Cart cart = getOrCreateActiveCart(customerId);
        cartItemRepository.deleteAllByCartId(cart.getId());
        cart.getItems().clear();
    }

    /**
     * Returns full cart summary with dynamic stock availability flags.
     */
    @Transactional(readOnly = true)
    public CartResponse getCartSummary(UUID customerId) {
        Cart cart = cartRepository.findByCustomerIdAndStatus(customerId, CartStatus.ACTIVE)
                .orElse(null);

        if (cart == null) {
            return new CartResponse(null, new ArrayList<>(), 0, BigDecimal.ZERO);
        }

        List<CartItem> items = cartItemRepository.findAllByCartId(cart.getId());
        List<CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem item : items) {
            Product product = item.getProduct();
            BigDecimal itemSubtotal = product.getPrice().multiply(item.getQuantity());
            subtotal = subtotal.add(itemSubtotal);

            BigDecimal availableStock = product.getAvailableQuantity();
            boolean isAvailable = Boolean.TRUE.equals(product.getIsActive()) &&
                    availableStock.compareTo(item.getQuantity()) >= 0;

            String unitNameLower = product.getUnit().getUnitName().toLowerCase();

            CartItemResponse response = new CartItemResponse(
                    item.getId(),
                    product.getId(),
                    product.getProductCode(),
                    product.getName(),
                    product.getImage(),
                    product.getPrice(),
                    item.getQuantity(),
                    unitNameLower,
                    product.getUnit().getUnitSymbol(),
                    Boolean.TRUE.equals(product.getUnit().getAllowDecimal()),
                    itemSubtotal,
                    availableStock,
                    isAvailable
            );

            itemResponses.add(response);
        }

        return new CartResponse(cart.getId(), itemResponses, itemResponses.size(), subtotal);
    }

    /**
     * Validates if the quantity complies with the unit's allowDecimal constraint (TC-08, K10).
     */
    private void validateUnitDecimal(Product product, BigDecimal quantity) {
        boolean allowDecimal = Boolean.TRUE.equals(product.getUnit().getAllowDecimal());
        if (!allowDecimal && quantity.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
            throw new InvalidUnitQuantityException(
                    String.format("Satuan '%s' tidak mengizinkan jumlah desimal. Nilai yang dimasukkan: %s",
                            product.getUnit().getUnitName(), quantity)
            );
        }
    }
}
