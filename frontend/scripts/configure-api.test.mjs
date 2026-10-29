import { test } from "node:test";
import assert from "node:assert/strict";
import { apiBaseUrl } from "./configure-api.mjs";

test("desarrollo y Docker conservan la API del mismo origen", () => {
  assert.equal(apiBaseUrl({}), "/api");
});
test("Vercel requiere un backend explícito", () => {
  assert.throws(() => apiBaseUrl({ VERCEL: "1" }), /API_BASE_URL/);
});
test("genera la URL pública de API a partir del origen", () => {
  assert.equal(
    apiBaseUrl({ API_BASE_URL: " https://mini-api.onrender.com/ " }),
    "https://mini-api.onrender.com/api",
  );
});
test("rechaza secretos, HTTP y rutas que duplicarían /api", () => {
  for (const value of [
    "http://example.com",
    "https://user:secret@example.com",
    "https://example.com/api",
    "https://example.com?secret=x",
    "https://example.com/#x",
  ]) {
    assert.throws(() => apiBaseUrl({ API_BASE_URL: value }));
  }
});
