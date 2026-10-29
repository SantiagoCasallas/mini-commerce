package dev.portfolio.commerce;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
@Validated
public class Api {
  private final ProductRepository products;
  private final OrderService orders;

  public Api(ProductRepository p, OrderService o) {
    products = p;
    orders = o;
  }

  public record Catalog(List<Product> items, int page, int totalPages, long totalItems) {}

  @GetMapping("/products")
  public Catalog products(
      @RequestParam(defaultValue = "") @Size(max = 100) String q,
      @RequestParam(defaultValue = "") @Size(max = 60) String category,
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "8") @Min(1) @Max(48) int size) {
    var result = products.search(q.trim(), category, PageRequest.of(page, size, Sort.by("id")));
    return new Catalog(
        result.getContent(), page, result.getTotalPages(), result.getTotalElements());
  }

  @GetMapping("/products/{id}")
  public Product product(@PathVariable Long id) {
    return products
        .findById(id)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
  }

  @GetMapping("/categories")
  public List<String> categories() {
    return products.categories();
  }

  @GetMapping("/health")
  public Map<String, String> health() {
    return Map.of("status", "UP");
  }

  @PostMapping("/orders")
  @ResponseStatus(HttpStatus.CREATED)
  public ShopOrder order(@Valid @RequestBody OrderService.Request request) {
    return orders.place(request);
  }
}
