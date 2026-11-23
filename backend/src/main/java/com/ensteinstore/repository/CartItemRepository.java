package com.ensteinstore.repository;

import com.ensteinstore.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    Optional<CartItem> findByCartIdAndProductId(UUID cartId, UUID productId);
    List<CartItem> findAllByCartId(UUID cartId);
    void deleteByCartIdAndProductId(UUID cartId, UUID productId);
    void deleteAllByCartId(UUID cartId);
}
