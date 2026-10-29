# Mini Commerce

Tienda de demostración para portafolio full stack junior: **Angular 21, Java 21, Spring Boot 3.5 y PostgreSQL 17**. Precios en COP. No procesa pagos ni envíos reales.

## Entregas

| Entrega | Alcance                                                                                                      | Estado       |
| ------- | ------------------------------------------------------------------------------------------------------------ | ------------ |
| 1       | Catálogo con búsqueda, categorías, paginación, detalle, carrito flotante y confirmación de pedidos simulados | Implementado |
| 2       | Autenticación e historial privado por usuario                                                                | Pendiente    |
| 3       | Administración de productos y permisos                                                                       | Pendiente    |

El servidor calcula los precios con `BigDecimal`, valida stock y crea pedidos en una transacción. Bloquea los productos por ID ascendente para evitar ventas simultáneas de la última unidad. Guarda los precios históricos en las líneas del pedido. Flyway crea el esquema y carga 12 productos de demostración.

## Publicación: GitHub + Vercel + Render + Neon

**Vercel sirve Angular; Render ejecuta Spring Boot; Neon almacena PostgreSQL.** Vercel no ejecuta el JAR de esta aplicación como un servidor Java permanente.

Consulta [la guía paso a paso](docs/DEPLOYMENT.md). Incluye variables, configuración de Vercel y comprobaciones posteriores. El despliegue remoto sigue pendiente hasta crear los recursos y configurar sus URLs.

- Vercel: Root Directory **`frontend`**. Node **24.x**. El archivo `frontend/vercel.json` define instalación, build, carpeta de salida y fallback SPA.
- Variable pública de Vercel: **`API_BASE_URL=https://TU-BACKEND.onrender.com`**, sin `/api`. Cambiarla requiere un nuevo build.
- Render: Root Directory **`backend`**, runtime Docker y Dockerfile `./Dockerfile`.
- Variables privadas en Render: `DATABASE_URL` (formato JDBC), `DATABASE_USER`, `DATABASE_PASSWORD`.
- Variable en Render: `CORS_ALLOWED_ORIGINS=https://TU-FRONTEND.vercel.app`. Solo permite los orígenes explícitos; previews adicionales se configuran por separado.

**No coloques credenciales de PostgreSQL en Vercel ni en el código Angular.** `API_BASE_URL` se incorpora al bundle público. Un `.env` no se carga automáticamente con Angular; usa las variables del panel de Vercel o `export` en tu terminal.

## Ejecutar localmente

Con Docker y Compose:

```bash
cp .env.example .env
docker compose up --build
```

Abrir <http://localhost:8080>. El Dockerfile raíz integra Angular y Spring Boot en un solo contenedor; Compose añade PostgreSQL con volumen persistente. Esta modalidad conserva `/api` en el mismo origen y no requiere variables de Vercel.

Sin Docker: instalar JDK 21, Maven 3.9+, Node 24, npm y PostgreSQL 17. Crear una base `mini_commerce` y un usuario con permisos sobre ella.

```bash
cd backend
export DATABASE_URL='jdbc:postgresql://localhost:5432/mini_commerce'
export DATABASE_USER='commerce'
export DATABASE_PASSWORD='commerce'
mvn spring-boot:run
```

En otra terminal:

```bash
cd frontend
npm ci
npm start
```

Abrir <http://localhost:4200>. El proxy de Angular redirige `/api` al puerto 8080. En desarrollo, dejar `API_BASE_URL` sin definir para utilizar este proxy.

## API

| Método | Ruta                                       | Descripción                                          |
| ------ | ------------------------------------------ | ---------------------------------------------------- |
| GET    | `/api/products?q=&category=&page=0&size=8` | Catálogo; páginas desde 0, tamaño 1–48               |
| GET    | `/api/products/{id}`                       | Detalle o 404                                        |
| GET    | `/api/categories`                          | Categorías                                           |
| POST   | `/api/orders`                              | Pedido simulado; 201, UUID, fecha, líneas y total    |
| GET    | `/api/health`                              | Estado del proceso, sin consulta profunda de la base |

```bash
curl -X POST http://localhost:8080/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":1,"quantity":2}]}'
```

El cliente envía IDs y cantidades enteras de 1 a 99. Hasta 50 líneas; duplicados consolidados. Campos desconocidos, incluidos precios de cliente, se rechazan con 400. Stock insuficiente devuelve 409; productos inexistentes, 404. Si falla una línea, la transacción revierte el pedido y todos los descuentos.

## Verificar

```bash
cd frontend
npm ci
npm run test:config
npm run build
cd ../backend
mvn verify
```

Las pruebas rápidas usan H2. Para comprobar bloqueos reales, ejecutar la misma suite con una **base PostgreSQL exclusiva de pruebas**:

```bash
mvn test \
  -Dspring.datasource.url=jdbc:postgresql://localhost:5432/mini_commerce_test \
  -Dspring.datasource.driver-class-name=org.postgresql.Driver \
  -Dspring.datasource.username=commerce \
  -Dspring.datasource.password=commerce
```

La suite borra pedidos y ajusta inventario: nunca apuntarla a la demo pública ni a una base con datos reales. CI también ejecuta PostgreSQL 17 y construye la imagen Docker.

## Estructura

```text
frontend/           Angular, ilustraciones SVG, pruebas de configuración y vercel.json
backend/            API, reglas de compra, Flyway, pruebas y Dockerfile de API
.github/workflows/  CI de frontend, backend y PostgreSQL
Dockerfile          Aplicación integrada para desarrollo o alojamiento propio
compose.yaml        Aplicación integrada + PostgreSQL
render.yaml         Backend independiente para Render
```

## Límites conocidos

- Sin autenticación, historial por usuario ni panel administrativo. No existe una lista pública de pedidos.
- Carrito en memoria: se pierde al recargar. Añadir productos no reserva existencias.
- Sin claves de idempotencia: si se pierde la respuesta de un pedido ya confirmado, repetir el POST podría duplicarlo.
- Sin correos, pagos, envíos, impuestos, carga de imágenes ni reposición automática del inventario demo.
- Los pedidos son públicos y anónimos. Limitar solicitudes y definir reinicio de datos antes de mantener una demo abierta durante mucho tiempo.
- No hay suite automatizada de navegador ni de carga. Docker y despliegue remoto requieren verificación en los proveedores.
- Las cuentas gratuitas tienen cuotas y arranques en frío; revisar las condiciones vigentes de cada proveedor.

Los archivos generados y dependencias se excluyen con `.gitignore`. Si estaban en commits anteriores, el nuevo commit los retira del estado actual; permanecen en el historial anterior, que no se reescribe.
