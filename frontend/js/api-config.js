/**
 * Jednotná základní URL pro volání blog API.
 * - Prázdná / nenastaveno = relativní cesty (stejná doména) — vhodné pro:
 *   - lokálně `npm start` (Node servíruje i frontend);
 *   - Vercel s proxy v `vercel.json` na Render (žádosti na `/api/*` jdou stejnou host doménou).
 * - Při volání API přímo z prohlížeče na jinou doménu (např. jen Render) nastavte
 *   před načtením modulů: <script>window.__ROMCA_API_BASE__ = "https://vas-backend.onrender.com";</script>
 *   (bez koncového lomítka) a v Renderu `CORS_ORIGIN` s doménou vašeho Vercelu.
 */
export function getApiBase() {
  if (typeof globalThis === "undefined") return "";
  const v = globalThis.__ROMCA_API_BASE__;
  if (v == null) return "";
  const s = String(v).trim();
  if (s === "" || s === "undefined") return "";
  return s.replace(/\/$/, "");
}

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const b = getApiBase();
  return b ? `${b}${p}` : p;
}
