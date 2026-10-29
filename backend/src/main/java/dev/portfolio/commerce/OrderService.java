package dev.portfolio.commerce;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@org.springframework.validation.annotation.Validated
public class OrderService {
  public record Item(@NotNull @Positive Long productId, @Min(1) @Max(99) int quantity) {}

  public record Request(@NotEmpty @Size(max = 50) List<@NotNull @Valid Item> items) {}

  private final ProductRepository products;
  private final OrderRepository orders;

  public OrderService(ProductRepository p, OrderRepository o) {
    products = p;
    orders = o;
  }

  @Transactional
  public ShopOrder place(@NotNull @Valid Request request) {
    // A stable lock order prevents deadlocks across overlapping baskets.
    var quantities = new TreeMap<Long, Integer>();
    for (var item : request.items()) {
      int count = quantities.merge(item.productId(), item.quantity(), Integer::sum);
      if (count > 99)
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Máximo 99 unidades por producto");
    }
    var order = new ShopOrder();
    for (var entry : quantities.entrySet()) {
      var p =
          products
              .lock(entry.getKey())
              .orElseThrow(
                  () ->
                      new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
      if (p.stock < entry.getValue())
        throw new ResponseStatusException(
            HttpStatus.CONFLICT, "Existencias insuficientes: " + p.name);
      p.stock -= entry.getValue();
      order.items.add(new ShopOrder.Line(p, entry.getValue()));
      order.total = order.total.add(p.price.multiply(BigDecimal.valueOf(entry.getValue())));
    }
    return orders.save(order);
  }
}
