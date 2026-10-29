package dev.portfolio.commerce;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "app.cors.allowed-origins=https://mini-commerce.vercel.app")
@AutoConfigureMockMvc
class OrderIntegrationTest {
  @Autowired OrderService service;
  @Autowired JdbcTemplate jdbc;
  @Autowired MockMvc mvc;

  @BeforeEach
  void reset() {
    jdbc.update("delete from order_items");
    jdbc.update("delete from orders");
    jdbc.update("update products set stock=10 where id in (1,2)");
  }

  OrderService.Request basket(OrderService.Item... items) {
    return new OrderService.Request(List.of(items));
  }

  @Test
  void serverCalculatesPricesAndMergesDuplicateProducts() {
    var order = service.place(basket(new OrderService.Item(1L, 2), new OrderService.Item(1L, 1)));
    assertEquals(0, new BigDecimal("567000.00").compareTo(order.total));
    assertEquals(1, order.items.size());
    assertEquals(3, order.items.getFirst().quantity);
    assertEquals(7, jdbc.queryForObject("select stock from products where id=1", Integer.class));
    jdbc.update("update products set price=190000 where id=1");
    assertEquals(0, new BigDecimal("189000.00").compareTo(order.items.getFirst().unitPrice));
    jdbc.update("update products set price=189000 where id=1");
  }

  @Test
  void insufficientStockRollsBackEarlierDeductions() {
    assertThrows(
        Exception.class,
        () -> service.place(basket(new OrderService.Item(1L, 1), new OrderService.Item(2L, 11))));
    assertEquals(10, jdbc.queryForObject("select stock from products where id=1", Integer.class));
    assertEquals(0, jdbc.queryForObject("select count(*) from orders", Integer.class));
  }

  @Test
  void missingProductRollsBack() {
    assertThrows(
        Exception.class,
        () -> service.place(basket(new OrderService.Item(1L, 1), new OrderService.Item(999L, 1))));
    assertEquals(10, jdbc.queryForObject("select stock from products where id=1", Integer.class));
  }

  @Test
  void mergedQuantityCannotExceedLimit() {
    assertThrows(
        Exception.class,
        () -> service.place(basket(new OrderService.Item(1L, 60), new OrderService.Item(1L, 60))));
  }

  @Test
  void onlyOneBuyerGetsLastUnit() throws Exception {
    jdbc.update("update products set stock=1 where id=1");
    var ready = new CountDownLatch(2);
    var start = new CountDownLatch(1);
    try (var pool = Executors.newFixedThreadPool(2)) {
      Callable<Boolean> buy =
          () -> {
            ready.countDown();
            start.await();
            try {
              service.place(basket(new OrderService.Item(1L, 1)));
              return true;
            } catch (org.springframework.web.server.ResponseStatusException e) {
              assertEquals(409, e.getStatusCode().value());
              return false;
            }
          };
      var a = pool.submit(buy);
      var b = pool.submit(buy);
      assertTrue(ready.await(5, TimeUnit.SECONDS));
      start.countDown();
      assertNotEquals(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS));
    }
    assertEquals(0, jdbc.queryForObject("select stock from products where id=1", Integer.class));
    assertEquals(1, jdbc.queryForObject("select count(*) from orders", Integer.class));
  }

  @Test
  void rejectsInvalidPayloadsAndClientPrices() throws Exception {
    for (String body :
        List.of(
            "{}",
            "{\"items\":[null]}",
            "{\"items\":[{\"productId\":1,\"quantity\":1.5}]}",
            "{\"items\":[]}",
            "{\"items\":[{\"productId\":1,\"quantity\":0}]}",
            "{\"items\":[{\"productId\":1,\"quantity\":-1}]}",
            "{\"items\":[{\"productId\":1,\"quantity\":100}]}",
            "{\"items\":[{\"productId\":1,\"quantity\":1,\"price\":1}]}"))
      mvc.perform(post("/api/orders").contentType("application/json").content(body))
          .andExpect(status().isBadRequest());
  }

  @Test
  void catalogAndCheckoutContract() throws Exception {
    mvc.perform(
            get("/api/products").param("q", "Studio").param("category", "Audio").param("size", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalItems").value(1))
        .andExpect(jsonPath("$.items[0].name").value("Auriculares Studio"));
    mvc.perform(get("/api/products").param("page", "-1")).andExpect(status().isBadRequest());
    mvc.perform(get("/api/products/999")).andExpect(status().isNotFound());
    mvc.perform(
            post("/api/orders")
                .contentType("application/json")
                .content("{\"items\":[{\"productId\":1,\"quantity\":2}]}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.total").value(378000))
        .andExpect(jsonPath("$.status").value("SIMULATED"));
  }

  @Test
  void corsAllowsOnlyConfiguredFrontend() throws Exception {
    mvc.perform(
            options("/api/orders")
                .header("Origin", "https://mini-commerce.vercel.app")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "content-type"))
        .andExpect(status().isOk())
        .andExpect(
            header().string("Access-Control-Allow-Origin", "https://mini-commerce.vercel.app"));
    mvc.perform(
            options("/api/orders")
                .header("Origin", "https://untrusted.example")
                .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isForbidden())
        .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
  }
}
