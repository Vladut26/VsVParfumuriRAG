package com.vsv.service;

import com.vsv.dto.OrderDtos.*;
import com.vsv.entity.Order;
import com.vsv.entity.OrderItem;
import com.vsv.repository.OrderRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    /** Only orders in these statuses can be cancelled by the user */
    private static final Set<Order.Status> CANCELLABLE =
            Set.of(Order.Status.PENDING, Order.Status.CONFIRMED);

    private final OrderRepository orderRepository;
    private final ProductService  productService;
    private final EmailService    emailService;  // nullable when email disabled

    public OrderService(OrderRepository orderRepository,
                        ProductService  productService,
                        @org.springframework.beans.factory.annotation.Autowired(required = false)
                        EmailService    emailService) {
        this.orderRepository = orderRepository;
        this.productService  = productService;
        this.emailService    = emailService;
    }

    public List<OrderResponse> getMyOrders(Long userId) {
        return orderRepository.findByUserIdWithItems(userId).stream()
                .map(this::toResponse).toList();
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllWithItems().stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public OrderResponse checkout(Long userId, CheckoutRequest req) {
        validateCheckout(req);

        for (CartItemRequest item : req.getItems()) {
            productService.decrementStock(item.getProductId(), item.getQuantity());
        }

        Order order = new Order();
        order.setUserId(userId);
        order.setFullName(req.getFullName());
        order.setEmail(req.getEmail());
        order.setPhone(req.getPhone());
        order.setAddress(req.getAddress());
        order.setCity(req.getCity());
        order.setPostalCode(req.getPostalCode());
        order.setPaymentMethod(req.getPaymentMethod());
        order.setPaymentIntentId(req.getPaymentIntentId());

        // Card payments start as CONFIRMED (already paid), others as PENDING
        if ("card".equals(req.getPaymentMethod()) && req.getPaymentIntentId() != null) {
            order.setStatus(Order.Status.CONFIRMED);
        } else {
            order.setStatus(Order.Status.PENDING);
        }

        BigDecimal total = BigDecimal.ZERO;
        for (CartItemRequest item : req.getItems()) {
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProductId(item.getProductId());
            oi.setProductName(item.getProductName());
            oi.setProductBrand(item.getProductBrand());
            oi.setProductImageUrl(item.getProductImageUrl());
            oi.setUnitPrice(item.getUnitPrice());
            oi.setQuantity(item.getQuantity());
            BigDecimal line = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            oi.setLineTotal(line);
            total = total.add(line);
            order.getItems().add(oi);
        }

        order.setTotalAmount(total);
        Order saved = orderRepository.save(order);
        log.info("Order created for user {} — total {} RON, payment={}",
                userId, total, req.getPaymentMethod());

        // Send confirmation email asynchronously (if email service is enabled)
        if (emailService != null) emailService.sendOrderConfirmation(saved);

        return toResponse(saved);
    }

    /**
     * Cancel an order — only the owning user, only if status is PENDING or CONFIRMED.
     * Restores stock for all items in the order.
     */
    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Comanda nu există."));

        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Nu poți anula comanda altui utilizator.");
        }

        if (!CANCELLABLE.contains(order.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Comanda nu mai poate fi anulată. Status actual: "
                            + order.getStatus().name());
        }

        // Restore stock for each item
        for (OrderItem item : order.getItems()) {
            try {
                productService.incrementStock(item.getProductId(), item.getQuantity());
            } catch (Exception e) {
                log.warn("Could not restore stock for product {} on order cancel: {}",
                        item.getProductId(), e.getMessage());
            }
        }

        order.setStatus(Order.Status.CANCELLED);
        log.info("Order {} cancelled by user {} — stock restored", orderId, userId);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, String status) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Comanda nu există."));
        try {
            order.setStatus(Order.Status.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status invalid: " + status);
        }
        return toResponse(orderRepository.save(order));
    }

    /**
     * Called by Stripe webhook when payment is confirmed.
     * Finds the order by paymentIntentId and marks it as CONFIRMED.
     */
    @Transactional
    public void confirmByPaymentIntent(String paymentIntentId) {
        orderRepository.findAll().stream()
                .filter(o -> paymentIntentId.equals(o.getPaymentIntentId()))
                .findFirst()
                .ifPresent(order -> {
                    if (order.getStatus() == Order.Status.PENDING) {
                        order.setStatus(Order.Status.CONFIRMED);
                        orderRepository.save(order);
                        log.info("Order {} confirmed via Stripe webhook (PI: {})",
                                order.getId(), paymentIntentId);
                    }
                });
    }

    private OrderResponse toResponse(Order o) {
        OrderResponse r = new OrderResponse();
        r.setId(o.getId());
        r.setStatus(o.getStatus().name());
        r.setFullName(o.getFullName());
        r.setEmail(o.getEmail());
        r.setPhone(o.getPhone());
        r.setAddress(o.getAddress());
        r.setCity(o.getCity());
        r.setPostalCode(o.getPostalCode());
        r.setPaymentMethod(o.getPaymentMethod());
        r.setPaymentIntentId(o.getPaymentIntentId());
        r.setTotalAmount(o.getTotalAmount());
        r.setCreatedAt(o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
        r.setUpdatedAt(o.getUpdatedAt() != null ? o.getUpdatedAt().toString() : null);
        r.setItems(o.getItems().stream().map(i -> {
            OrderItemResponse ir = new OrderItemResponse();
            ir.setProductId(i.getProductId());
            ir.setProductName(i.getProductName());
            ir.setProductBrand(i.getProductBrand());
            ir.setProductImageUrl(i.getProductImageUrl());
            ir.setUnitPrice(i.getUnitPrice());
            ir.setQuantity(i.getQuantity());
            ir.setLineTotal(i.getLineTotal());
            return ir;
        }).toList());
        return r;
    }

    private void validateCheckout(CheckoutRequest req) {
        if (req.getItems() == null || req.getItems().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coșul este gol.");
        if (req.getFullName() == null || req.getFullName().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Numele complet este obligatoriu.");
        if (req.getAddress() == null || req.getAddress().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Adresa este obligatorie.");
        if (req.getPhone() == null || req.getPhone().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefonul este obligatoriu.");
    }
}