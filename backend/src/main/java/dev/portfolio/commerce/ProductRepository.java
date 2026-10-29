package dev.portfolio.commerce;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
  @Query(
      "select p from Product p where (:q = '' or lower(p.name) like lower(concat('%',:q,'%'))) and"
          + " (:category = '' or p.category = :category)")
  Page<Product> search(@Param("q") String q, @Param("category") String category, Pageable pageable);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select p from Product p where p.id=:id")
  Optional<Product> lock(@Param("id") Long id);

  @Query("select distinct p.category from Product p order by p.category")
  List<String> categories();
}
