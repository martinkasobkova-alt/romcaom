import { apiUrl } from "./api-config.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainFromHtml(h) {
  const d = document.createElement("div");
  d.innerHTML = h || "";
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}

const isCs = document.body.dataset.lang === "cs";
const blogBase = isCs ? "/cs/blog" : "/blog";
const readLabel = isCs ? "Přečíst článek →" : "Read post →";
const loadMsg = isCs ? "Načítám…" : "Loading…";
const emptyApi = isCs
  ? `Zatím žádné články na webu, nebo server neběží. <a href="/admin.html">Administrace</a> (po spuštění <code>npm start</code>).`
  : `No posts on the site yet, or the server is not running. <a href="/admin.html">Admin</a> (after <code>npm start</code>).`;
const offlineMsg = isCs
  ? `Nedaří se spojit s blogem. Otevřete stránky přes <code>npm start</code> (viz BLOG-ADMIN.md), nebo si přečtěte texty na <a href="https://anuradha.blog" target="_blank" rel="noopener">anuradha.blog</a>.`
  : `Cannot reach the blog. Open the site via <code>npm start</code> (see BLOG-ADMIN.md), or read on <a href="https://anuradha.blog" target="_blank" rel="noopener">anuradha.blog</a>.`;

function card(post) {
  const img = post.heroImage || "https://anuradha.blog/wp-content/uploads/2025/07/photo_2025-07-29_15-42-17.jpg";
  const lead = (post.subtitle || plainFromHtml(post.bodyHtml) || "").slice(0, 200);
  const dots = lead.length >= 200 ? "…" : "";
  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString(isCs ? "cs-CZ" : "en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  return `
  <a href="${blogBase}/${encodeURIComponent(post.slug)}" class="blog-card">
    <div class="blog-image" style="background-image: url('${esc(img).replace(/'/g, "&#39;")}')"></div>
    <div class="blog-content">
      <div class="blog-meta">${esc(date || "—")} · ${esc(post.category || (isCs ? "Deník" : "Journal"))}</div>
      <h3>${esc(post.title || "")}</h3>
      <p>${esc(lead + dots)}</p>
      <span class="blog-card-link">${readLabel}</span>
    </div>
  </a>`;
}

const root = document.getElementById("blog-site-list");
const template = document.getElementById("blog-fallback-cards");

async function run() {
  if (!root) return;
  const loadEl = root.querySelector(".blog-loading");
  if (loadEl) loadEl.textContent = loadMsg;
  try {
    const r = await fetch(apiUrl("/api/posts"), { method: "GET" });
    if (!r.ok) throw new Error("api");
    const posts = await r.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      root.innerHTML = `
        <p style="grid-column:1/-1; text-align:center; color: var(--color-ink-soft); max-width: 32rem; margin: 0 auto">
          ${emptyApi}
        </p>`;
      return;
    }
    root.innerHTML = posts.map((p) => card(p)).join("");
  } catch {
    if (template && template.content?.firstElementChild) {
      root.replaceChildren(template.content.firstElementChild.cloneNode(true));
    } else {
      root.innerHTML = `<p style="grid-column:1/-1; text-align:center; color: var(--color-ink-soft)">
        ${offlineMsg}
      </p>`;
    }
  }
}

run();
