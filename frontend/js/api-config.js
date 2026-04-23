/**
 * Základní URL pro všechna volání blog API (admin, seznam, článek).
 * - Na Vercel (*.vercel.app) → produkční backend na Renderu.
 * - Jinak (typicky `npm start` / jedna doména) → stejný původ jako stránka.
 */
const RENDER_API_ORIGIN = "https://romcaom.onrender.com";

function computeApiBase() {
  if (typeof window === "undefined" || !window.location) {
    return "";
  }
  const h = window.location.hostname;
  if (h === "vercel.app" || h.endsWith(".vercel.app")) {
    return RENDER_API_ORIGIN.replace(/\/$/, "");
  }
  return window.location.origin.replace(/\/$/, "");
}

/** Sjednocená base URL; na klientu vyhodnocená pri načtení modulu. */
export const API_BASE_URL = typeof window !== "undefined" ? computeApiBase() : "";

export function getApiBase() {
  if (typeof window === "undefined" || !window.location) {
    return "";
  }
  return computeApiBase();
}

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const b = getApiBase();
  return b ? `${b}${p}` : p;
}
