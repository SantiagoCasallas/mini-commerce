import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export function apiBaseUrl(env) {
  const input = env.API_BASE_URL?.trim();
  if (!input) {
    if (env.VERCEL === "1") {
      throw new Error(
        "Configura API_BASE_URL en Vercel con el origen HTTPS del backend (ejemplo: https://tu-api.onrender.com) y vuelve a desplegar.",
      );
    }
    return "/api";
  }
  const url = new URL(input);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(
      "API_BASE_URL debe ser un origen HTTPS sin credenciales, ruta, parámetros ni /api.",
    );
  }
  return url.origin + "/api";
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const baseUrl = apiBaseUrl(process.env);
  const directory = new URL("../src/generated/", import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(
    new URL("api-config.ts", directory),
    `// Generado por scripts/configure-api.mjs. No incluir secretos.\nexport const API_BASE_URL = ${JSON.stringify(baseUrl)};\n`,
  );
  console.log("Configuración pública de API preparada.");
}
