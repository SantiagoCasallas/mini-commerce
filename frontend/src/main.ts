import {
  Component,
  OnInit,
  signal,
  computed,
  effect,
  HostListener,
} from "@angular/core";
import { API_BASE_URL } from "./generated/api-config";
import { bootstrapApplication } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  illustration: string;
}
interface Catalog {
  items: Product[];
  page: number;
  totalPages: number;
  totalItems: number;
}
interface Receipt {
  id: string;
  total: number;
  items: { name: string; quantity: number; unitPrice: number }[];
}
@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule],
  template: `
    <header>
      <a class="brand" href="/" aria-label="Mini Commerce inicio"
        ><span class="brand-icon">m.</span> mini<span>commerce</span></a
      >
      <nav>
        <a href="#catalogo">Explorar colección ↗</a
        ><span class="demo-tag">PROYECTO DEMO</span
        ><button class="cart-trigger" (click)="cartOpen.set(true)">
          Bolsa <span>{{ count() }}</span>
        </button>
      </nav>
    </header>
    <main>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">MENOS RUIDO. MÁS ESENCIA.</p>
          <h1>Pequeñas cosas.<br /><em>Mejores días.</em></h1>
          <p>
            Objetos que hacen más fácil lo cotidiano.<br />Una selección
            pequeña, elegida con intención.
          </p>
          <a class="primary" href="#catalogo"
            >Encuentra tu próximo favorito <span>↗</span></a
          >
          <div class="hero-note">
            <span>✳</span> Diseño útil. Sin complicaciones.
          </div>
        </div>
        <div class="hero-art">
          <div class="orbit-label">EL FAVORITO DEL MES</div>
          <img
            src="/products/headphones.svg"
            alt="Auriculares Studio en verde oliva"
          />
          <div class="hero-product">
            <div>
              <small>UN MOMENTO PARA TI</small
              ><strong>Auriculares Studio</strong>
            </div>
            <span>01 / 12</span>
          </div>
          <div class="art-circle"></div>
        </div>
      </section>
      <section class="benefits">
        <span>◎ <b>Selección con intención</b></span
        ><span>◇ <b>Diseño para todos los días</b></span
        ><span>↺ <b>Compra simulada, sin cargos</b></span>
      </section>
      <section id="catalogo" class="catalog">
        <div class="section-title">
          <div>
            <p class="eyebrow">LA COLECCIÓN</p>
            <h2>Encuentra eso que va contigo.</h2>
          </div>
          <span>{{ catalog().totalItems }} objetos, muchas posibilidades</span>
        </div>
        <div class="filters">
          <div class="categories">
            <button [class.active]="category() === ''" (click)="filter('')">
              Todos
            </button>
            @for (c of categories(); track c) {
              <button [class.active]="category() === c" (click)="filter(c)">
                {{ c }}
              </button>
            }
          </div>
          <label class="search"
            ><span>⌕</span
            ><input
              aria-label="Buscar productos"
              placeholder="Busca algo especial…"
              [value]="query()"
              (input)="search($event)"
            /><kbd>↵</kbd></label
          >
        </div>
        @if (error()) {
          <div class="notice" role="alert">
            {{ error() }} <button (click)="load()">Reintentar</button>
          </div>
        }
        @if (loading()) {
          <p class="state" role="status">Preparando la colección…</p>
        } @else {
          <div class="grid">
            @for (p of catalog().items; track p.id) {
              <article class="product">
                <button
                  class="product-art"
                  [class]="'product-art tone-' + (p.id % 4)"
                  (click)="openProduct(p.id)"
                  [attr.aria-label]="'Ver ' + p.name"
                >
                  @if (p.stock === 0) {
                    <span class="badge">AGOTADO</span>
                  } @else if (p.id === 1) {
                    <span class="badge">FAVORITO</span>
                  }
                  <img [src]="image(p)" [alt]="p.name" loading="lazy" /><span
                    class="view"
                    >Ver detalle ↗</span
                  >
                </button>
                <div class="product-info">
                  <div>
                    <small>{{ p.category }}</small
                    ><button class="product-name" (click)="openProduct(p.id)">
                      {{ p.name }}</button
                    ><span class="price">{{ money(p.price) }}</span>
                  </div>
                  <button
                    class="add"
                    [disabled]="p.stock === 0"
                    (click)="add(p)"
                    [attr.aria-label]="'Agregar ' + p.name"
                  >
                    +
                  </button>
                </div>
              </article>
            } @empty {
              <p class="state">
                No encontramos productos. Prueba otra búsqueda.
              </p>
            }
          </div>
        }
        @if (catalog().totalPages > 1) {
          <div class="pagination">
            <button (click)="go(-1)" [disabled]="page() === 0 || loading()">
              ← Anterior</button
            ><span>{{ page() + 1 }} / {{ catalog().totalPages }}</span
            ><button
              (click)="go(1)"
              [disabled]="page() + 1 >= catalog().totalPages || loading()"
            >
              Siguiente →
            </button>
          </div>
        }
      </section>
      <section class="closing">
        <span>HECHO PARA LO COTIDIANO</span>
        <h2>Lo simple también se siente especial.</h2>
        <p>
          Explora, elige y prueba. Esta tienda es una experiencia de
          demostración.
        </p>
      </section>
    </main>
    <footer>
      <a class="brand" href="/">mini<span>commerce</span></a
      ><span>Angular + Spring Boot + PostgreSQL</span
      ><span>Portafolio full stack · Sin pagos reales</span>
    </footer>
    @if (count() > 0 && !cartOpen()) {
      <button class="floating-cart" (click)="cartOpen.set(true)">
        Tu bolsa · {{ count() }} <span>{{ money(total()) }} ↗</span>
      </button>
    }
    @if (detail()) {
      <div class="overlay" (click)="detail.set(null)">
        <section
          class="detail panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-name"
          (click)="$event.stopPropagation()"
          (keydown.escape)="detail.set(null)"
        >
          <button
            class="close"
            autofocus
            (click)="detail.set(null)"
            aria-label="Cerrar detalle"
          >
            ×</button
          ><img [src]="image(detail()!)" [alt]="detail()!.name" />
          <div>
            <p class="eyebrow">{{ detail()!.category }}</p>
            <h2 id="detail-name">{{ detail()!.name }}</h2>
            <p>{{ detail()!.description }}</p>
            <h3>{{ money(detail()!.price) }}</h3>
            <p>{{ detail()!.stock }} unidades disponibles</p>
            <button
              class="primary"
              [disabled]="detail()!.stock === 0"
              (click)="add(detail()!)"
            >
              Agregar a mi bolsa +
            </button>
          </div>
        </section>
      </div>
    }
    @if (cartOpen()) {
      <div class="overlay drawer-overlay" (click)="cartOpen.set(false)">
        <aside
          class="drawer panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-title"
          (click)="$event.stopPropagation()"
          (keydown.escape)="cartOpen.set(false)"
        >
          <div class="drawer-head">
            <div>
              <p class="eyebrow">TUS FAVORITOS</p>
              <h2 id="cart-title">
                Tu bolsa <small>({{ count() }})</small>
              </h2>
            </div>
            <button
              class="close"
              autofocus
              (click)="cartOpen.set(false)"
              aria-label="Cerrar bolsa"
            >
              ×
            </button>
          </div>
          @if (receipt()) {
            <div class="receipt" role="status">
              <span class="success-icon">✓</span>
              <h2>¡Pedido confirmado!</h2>
              <p>
                Tu compra fue simulada. No se realizó ningún cargo ni envío.
              </p>
              <small>REFERENCIA</small><code>{{ receipt()!.id }}</code>
              @for (line of receipt()!.items; track $index) {
                <p>
                  {{ line.quantity }} × {{ line.name }}
                  <b>{{ money(line.unitPrice * line.quantity) }}</b>
                </p>
              }
              <h3>Total: {{ money(receipt()!.total) }}</h3>
              <button
                class="primary"
                (click)="receipt.set(null); cartOpen.set(false)"
              >
                Seguir explorando ↗
              </button>
            </div>
          } @else {
            <div class="cart-lines">
              @for (line of cart(); track line.product.id) {
                <div class="cart-line">
                  <img [src]="image(line.product)" [alt]="line.product.name" />
                  <div>
                    <strong>{{ line.product.name }}</strong>
                    <p>{{ money(line.product.price) }}</p>
                    <div class="quantity">
                      <button
                        [disabled]="sending()"
                        (click)="quantity(line.product.id, -1)"
                        [attr.aria-label]="'Reducir ' + line.product.name"
                      >
                        −</button
                      ><span>{{ line.quantity }}</span
                      ><button
                        [disabled]="
                          sending() ||
                          line.quantity >= line.product.stock ||
                          line.quantity >= 99
                        "
                        (click)="quantity(line.product.id, 1)"
                        [attr.aria-label]="'Aumentar ' + line.product.name"
                      >
                        +</button
                      ><button
                        class="remove"
                        [disabled]="sending()"
                        (click)="remove(line.product.id)"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              } @empty {
                <p class="state">Tu bolsa está esperando algo especial.</p>
              }
            </div>
            @if (checkoutError()) {
              <p class="notice" role="alert">{{ checkoutError() }}</p>
            }
            <div class="cart-bottom">
              <div class="subtotal">
                <span>Total estimado</span><strong>{{ money(total()) }}</strong>
              </div>
              <p>
                Precios en COP. El servidor verifica el total y las existencias
                al confirmar. Sin envío ni pago real.
              </p>
              <button
                class="primary"
                [disabled]="!count() || sending()"
                (click)="checkout()"
              >
                {{ sending() ? "Confirmando…" : "Confirmar pedido simulado" }} ↗
              </button>
            </div>
          }
        </aside>
      </div>
    }
    <div class="toast" role="status" aria-live="polite">{{ toast() }}</div>
  `,
})
export class App implements OnInit {
  catalog = signal<Catalog>({
    items: [],
    page: 0,
    totalPages: 0,
    totalItems: 0,
  });
  categories = signal<string[]>([]);
  query = signal("");
  category = signal("");
  page = signal(0);
  loading = signal(true);
  error = signal("");
  detail = signal<Product | null>(null);
  cartOpen = signal(false);
  cart = signal<{ product: Product; quantity: number }[]>([]);
  receipt = signal<Receipt | null>(null);
  sending = signal(false);
  checkoutError = signal("");
  toast = signal("");
  count = computed(() => this.cart().reduce((n, l) => n + l.quantity, 0));
  total = computed(() =>
    this.cart().reduce((n, l) => n + l.product.price * l.quantity, 0),
  );
  private requestId = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private toastTimer?: ReturnType<typeof setTimeout>;
  private previousFocus: HTMLElement | null = null;
  constructor() {
    effect(() => {
      const open = this.cartOpen() || !!this.detail();
      if (open) {
        this.previousFocus = document.activeElement as HTMLElement;
        setTimeout(() =>
          document.querySelector<HTMLElement>(".panel button")?.focus(),
        );
      } else {
        this.previousFocus?.focus();
      }
    });
  }
  @HostListener("document:keydown", ["$event"]) onDialogKey(
    event: KeyboardEvent,
  ) {
    const panel = document.querySelector<HTMLElement>(".panel");
    if (!panel) return;
    if (event.key === "Escape") {
      this.detail.set(null);
      this.cartOpen.set(false);
    }
    if (event.key !== "Tab") return;
    const nodes = panel.querySelectorAll<HTMLElement>(
      'button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]',
    );
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (!panel.contains(document.activeElement)) {
      first?.focus();
      event.preventDefault();
    } else if (event.shiftKey && document.activeElement === first) {
      last?.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first?.focus();
      event.preventDefault();
    }
  }
  async ngOnInit() {
    await this.load();
    try {
      this.categories.set(await this.api("/categories"));
    } catch {}
  }
  money(n: number) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);
  }
  image(p: Product) {
    return "/products/" + p.illustration + ".svg";
  }
  async api(path: string, options?: RequestInit) {
    const r = await fetch(API_BASE_URL + path, options);
    if (!r.ok) {
      let message = "No se pudo conectar con la tienda. Intenta de nuevo.";
      try {
        message = (await r.json()).detail || message;
      } catch {}
      throw new Error(message);
    }
    return r.json();
  }
  async load() {
    const id = ++this.requestId;
    this.loading.set(true);
    this.error.set("");
    try {
      const data = await this.api(
        "/products?" +
          new URLSearchParams({
            q: this.query(),
            category: this.category(),
            page: String(this.page()),
            size: "8",
          }),
      );
      if (id === this.requestId) this.catalog.set(data);
    } catch (e) {
      if (id === this.requestId) this.error.set((e as Error).message);
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }
  filter(c: string) {
    this.category.set(c);
    this.page.set(0);
    void this.load();
  }
  search(e: Event) {
    this.query.set((e.target as HTMLInputElement).value);
    this.page.set(0);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.load(), 300);
  }
  go(delta: number) {
    this.page.update((p) => p + delta);
    void this.load();
  }
  async openProduct(id: number) {
    try {
      this.detail.set(await this.api("/products/" + id));
    } catch (e) {
      this.notify((e as Error).message);
    }
  }
  add(p: Product) {
    if (this.sending()) return;
    this.receipt.set(null);
    const existing = this.cart().find((l) => l.product.id === p.id);
    if ((existing?.quantity || 0) >= Math.min(p.stock, 99)) {
      this.notify("No hay más unidades disponibles.");
      return;
    }
    this.cart.update((lines) =>
      existing
        ? lines.map((l) =>
            l.product.id === p.id
              ? { product: p, quantity: l.quantity + 1 }
              : l,
          )
        : [...lines, { product: p, quantity: 1 }],
    );
    this.notify("Agregado a tu bolsa");
  }
  quantity(id: number, delta: number) {
    this.cart.update((lines) =>
      lines
        .map((l) =>
          l.product.id === id
            ? {
                ...l,
                quantity: Math.min(l.quantity + delta, l.product.stock, 99),
              }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }
  remove(id: number) {
    this.cart.update((lines) => lines.filter((l) => l.product.id !== id));
  }
  notify(message: string) {
    clearTimeout(this.toastTimer);
    this.toast.set(message);
    this.toastTimer = setTimeout(() => this.toast.set(""), 3000);
  }
  async checkout() {
    if (this.sending() || !this.count()) return;
    this.sending.set(true);
    this.checkoutError.set("");
    try {
      const receipt = await this.api("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: this.cart().map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
          })),
        }),
      });
      this.receipt.set(receipt);
      this.cart.set([]);
      await this.load();
    } catch (e) {
      this.checkoutError.set(
        (e as Error).message + " Puedes ajustar la bolsa antes de reintentar.",
      );
    } finally {
      this.sending.set(false);
    }
  }
}
bootstrapApplication(App).catch(console.error);
