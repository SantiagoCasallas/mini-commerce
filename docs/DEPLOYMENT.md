# Publicar Mini Commerce

Arquitectura: **GitHub → Vercel (Angular) + Render (Spring Boot) + Neon (PostgreSQL)**.

## 1. GitHub

Repositorio configurado: <https://github.com/SantiagoCasallas/mini-commerce>.

Se recuperaron los fuentes de la primera versión y se añadió `.gitignore` para excluir `node_modules`, `dist`, `target`, cachés, `.env`, `.vercel` y configuración generada de API. Los archivos de ejemplo `.env.example` sí se incluyen. Retirar archivos del seguimiento no los borra de tu disco ni elimina sus commits anteriores.

Si haces cambios posteriores:

```bash
git add .
git commit -m "Describe el cambio"
git push origin main
```

No añadas `.env` con `git add -f`. No hace falta subir compilados: los proveedores construyen desde los fuentes.

## 2. PostgreSQL en Neon

1. Crear un proyecto gratuito en [Neon](https://neon.com/docs/introduction), con PostgreSQL 17.
2. Guardar host, base, usuario y contraseña. Nunca subirlos a GitHub.
3. Para Spring, convertir la conexión al formato JDBC:

```text
DATABASE_URL=jdbc:postgresql://HOST/BASE?sslmode=require
DATABASE_USER=USUARIO
DATABASE_PASSWORD=CONTRASEÑA
```

`DATABASE_URL` no debe contener `postgresql://usuario:clave@...`. Las credenciales se configuran por separado. Para migraciones, se recomienda el host directo de la base; el pool de la aplicación tiene un máximo de cinco conexiones.

## 3. API en Render

1. Crear un **Web Service** conectado al repositorio de GitHub.
2. Elegir runtime **Docker**, plan **Free**, rama **main** y Root Directory **`backend`**.
3. Dockerfile Path **`./Dockerfile`**. No usar un comando Node ni desplegar el frontend como este servicio.
4. Configurar las tres variables de base de datos del paso anterior.
5. Añadir `CORS_ALLOWED_ORIGINS` inicialmente con el dominio Vercel deseado si ya lo conoces. Si no, dejarla vacía y configurarla después del paso 4. La API seguirá accesible por curl; el navegador cruzado esperará el origen autorizado.
6. Health Check Path: **`/api/health`**. Render define `PORT` automáticamente.
7. Desplegar. Verificar `https://TU-API.onrender.com/api/health` y `/api/products`. Flyway crea tablas y datos demo al arrancar la primera vez.

También puedes importar el Blueprint `render.yaml` desde Render. Contiene las mismas opciones y pide configurar los secretos.

## 4. Angular en Vercel

1. Entrar a [Vercel](https://vercel.com/new), conectar GitHub y elegir `SantiagoCasallas/mini-commerce`.
2. Configurar **Root Directory: `frontend`**, **Framework: Angular**, **Node.js: 24.x**.
3. El archivo `frontend/vercel.json` establece:

| Campo            | Valor                        |
| ---------------- | ---------------------------- |
| Install Command  | `npm ci`                     |
| Build Command    | `npm run build`              |
| Output Directory | `dist/mini-commerce/browser` |

4. Añadir la variable **`API_BASE_URL`** con `https://TU-API.onrender.com`, **sin `/api`**, sin credenciales y sin rutas. Marcar al menos el entorno **Production**. Marcar Preview si también quieres construir vistas previas.
5. Desplegar. Copiar el dominio de producción estable asignado, por ejemplo `https://mini-commerce-TU-CUENTA.vercel.app`.
6. En Render, configurar **`CORS_ALLOWED_ORIGINS`** con ese origen exacto, **sin barra final** y sin rutas, y aplicar los cambios/reiniciar el servicio.
7. Abrir la URL de Vercel y comprobar la compra completa.

El build de Vercel se detiene con un error claro si falta `API_BASE_URL`. Se genera `src/generated/api-config.ts` antes de compilar. Ese archivo no se sube a GitHub; el origen de la API sí queda visible en el JavaScript público. Cambiar la variable requiere volver a desplegar Vercel. No poner contraseñas ni tokens en ella.

Para permitir un dominio propio o una preview específica, añadir orígenes explícitos separados por comas en Render:

```text
CORS_ALLOWED_ORIGINS=https://dominio-principal.vercel.app,https://tienda.example.com
```

No se autorizan automáticamente todos los dominios `*.vercel.app`. Una preview con URL nueva necesita autorización explícita si debe consumir esta API.

## 5. Comprobaciones posteriores

- Catálogo: aparecen 12 productos y funcionan búsqueda, categorías y segunda página.
- Detalle y carrito: cantidades, eliminación y producto agotado.
- Pedido: confirmación con UUID y total del servidor; después disminuyen existencias.
- Refrescar la página en Vercel no devuelve 404.
- Consola del navegador: sin errores CORS. Si los hay, revisar que el origen del navegador sea idéntico a `CORS_ALLOWED_ORIGINS` y que Render haya reiniciado.
- Si las peticiones apuntan a un host antiguo, corregir `API_BASE_URL` y reconstruir Vercel.
- Si el frontend recibe HTML en lugar de JSON, revisar que no se haya publicado sin URL de backend.
- Si Render devuelve error de base, revisar URL JDBC, credenciales y logs de Flyway.

La primera petición puede tardar por arranque en frío. [Render Free](https://render.com/docs/free) suspende servicios inactivos y su PostgreSQL gratuito tiene caducidad; esta guía usa una base separada en Neon. Revisar cuotas en [Neon](https://neon.com/docs/introduction/plans) y [Vercel](https://vercel.com/docs/plans/hobby) antes de confirmar cada recurso. No activar servicios de pago para seguir esta guía.

## Estado

Los archivos de configuración y fuentes están preparados. Crear cuentas, aceptar términos, configurar secretos y obtener las URLs de Render/Neon/Vercel requieren tu intervención. No considerar el sistema publicado hasta comprobar el pedido desde la URL pública de Vercel.

Documentación oficial: [builds de Vercel](https://vercel.com/docs/builds/configure-a-build), [vercel.json](https://vercel.com/docs/project-configuration/vercel-json), [runtimes de Vercel](https://vercel.com/docs/functions/runtimes).
