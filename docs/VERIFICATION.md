# Verificación para publicación

29 de octubre de 2026, America/Bogota.

- Se comprobó que el remoto `origin` es `https://github.com/SantiagoCasallas/mini-commerce.git` y que su rama principal coincide con el commit local inicial.
- Se recuperaron los fuentes de la primera versión, ausentes del árbol de trabajo y del commit inicial. Se conserva la implementación de catálogo, carrito y pedidos transaccionales.
- Se retiraron del seguimiento de Git las dependencias, compilados y cachés existentes. No se borraron sus archivos locales ni se reescribió el historial remoto.
- `git check-ignore` verifica exclusión de `node_modules`, `dist`, `target`, `.env`, `.vercel` y configuración pública generada.
- Build Angular en modo Vercel con una URL HTTPS de prueba: correcto. La URL utilizada valida la compilación, no corresponde a un backend desplegado.
- Instalación limpia con `npm ci`: correcta con el lockfile regenerado desde el registro oficial.
- Cuatro pruebas de configuración: origen local, variable obligatoria en Vercel, origen HTTPS válido y rechazo de URLs con credenciales/rutas/HTTP.
- Suite Spring Boot en H2: ocho pruebas, sin errores ni fallos. Incluye reglas de compra y comprobación de CORS para un origen permitido y uno rechazado.
- Misma suite en PostgreSQL 17.6: ocho pruebas, sin errores ni fallos; incluye la transacción y la competencia por la última unidad.
- La configuración de CI conserva comprobaciones en PostgreSQL y build Docker. No se ha ejecutado GitHub Actions desde este entorno.
- Docker no está disponible aquí; no se comprobó la construcción de imágenes ni la ejecución de Compose.
- Vercel, Render y Neon aún no tienen recursos configurados por esta tarea. No se ha verificado un pedido desde un dominio público.

Consultar los pasos que requieren cuentas, secretos y URLs en [DEPLOYMENT.md](DEPLOYMENT.md). Autenticación, historial, administración e idempotencia continúan pendientes.
