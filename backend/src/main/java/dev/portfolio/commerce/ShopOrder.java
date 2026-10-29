package dev.portfolio.commerce;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "orders")
public class ShopOrder {
  @Id public UUID id = UUID.randomUUID();
  public Instant createdAt = Instant.now();

  @Column(precision = 12, scale = 2)
  public BigDecimal total = BigDecimal.ZERO;

  public String status = "SIMULATED";

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
  @OrderColumn(name = "position")
  public List<Line> items = new ArrayList<>();

  @Embeddable
  public static class Line {
    public Long productId;
    public String name;

    @Column(precision = 12, scale = 2)
    public BigDecimal unitPrice;

    public int quantity;

    protected Line() {}

    Line(Product p, int q) {
      productId = p.id;
      name = p.name;
      unitPrice = p.price;
      quantity = q;
    }
  }
}
