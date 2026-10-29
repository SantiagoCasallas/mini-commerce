package dev.portfolio.commerce;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {
  @Id public Long id;
  public String name;
  public String description;
  public String category;

  @Column(precision = 12, scale = 2)
  public BigDecimal price;

  public int stock;
  public String illustration;

  protected Product() {}
}
