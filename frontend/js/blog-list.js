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
const blogPagePath = isCs ? "/cs/blog.html" : "/blog.html";
const readLabel = isCs ? "Přečíst článek →" : "Read post →";
const loadMsg = isCs ? "Načítám…" : "Loading…";
const emptyApi = isCs
  ? `Zatím žádné články na webu, nebo server neběží. <a href="/admin.html">Administrace</a> (po spuštění <code>npm start</code>).`
  : `No posts on the site yet, or the server is not running. <a href="/admin.html">Admin</a> (after <code>npm start</code>).`;
const offlineMsg = isCs
  ? `Nedaří se spojit s blogem. Otevřete stránky přes <code>npm start</code> (viz BLOG-ADMIN.md), nebo si přečtěte texty na <a href="https://anuradha.blog" target="_blank" rel="noopener">anuradha.blog</a>.`
  : `Cannot reach the blog. Open the site via <code>npm start</code> (see BLOG-ADMIN.md), or read on <a href="https://anuradha.blog" target="_blank" rel="noopener">anuradha.blog</a>.`;
const singleNotFound = isCs ? "Článek nenalezen." : "Article not found.";
const backLabel = isCs ? "← Zpět na seznam článků" : "← Back to blog list";
const moreLabel = isCs ? "Další články" : "More from the blog";

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
  const basePath = isCs ? "/cs/blog" : "/blog";
  const href = `${basePath}?slug=${encodeURIComponent(post.slug)}`;
  return `
  <a href="${href}" class="blog-card">
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

/**
 * Slug se podporuje ve dvou podobách:
 * 1) `?slug=…` (preferováno — funguje i bez rewrite)
 * 2) `/blog/:slug` / `/cs/blog/:slug` (rewrite ve vercel.json na /blog.html?slug=:slug)
 */
function getSelectedSlug() {
  const params = new URLSearchParams(window.location.search);
  let s = params.get("slug");
  if (s != null && String(s).trim() !== "") {
    return decodeURIComponent(String(s).trim());
  }
  const path = window.location.pathname || "";
  const match = path.match(/^\/(?:cs\/)?blog\/([^/]+)\/?$/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return "";
}

function singlePost(post) {
  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString(isCs ? "cs-CZ" : "en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const hero = post.heroImage
    ? `<img src="${esc(post.heroImage)}" alt="" style="width:100%; border-radius:1rem; margin-bottom:1rem;" />`
    : "";
  const gallery = Array.isArray(post.gallery) && post.gallery.length
    ? `<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:.75rem; margin-top:1.25rem;">
        ${post.gallery
          .map(
            (u) =>
              `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(
                u
              )}" alt="" style="width:100%; border-radius:.75rem;" /></a>`
          )
          .join("")}
      </div>`
    : "";
  return `
    <article style="grid-column:1/-1; max-width: 820px; margin: 0 auto; padding: 0 .5rem;">
      <p><a href="${blogPagePath}">${backLabel}</a></p>
      ${hero}
      <div class="blog-meta">${esc(date || "—")} · ${esc(post.category || (isCs ? "Deník" : "Journal"))}</div>
      <h2 style="margin-top:.35rem">${esc(post.title || "")}</h2>
      ${post.subtitle ? `<p style="opacity:.85">${esc(post.subtitle)}</p>` : ""}
      <div class="prose">${post.bodyHtml || ""}</div>
      ${gallery}
    </article>`;
}

async function run() {
  if (!root) return;
  const slug = getSelectedSlug();
  const loadEl = root.querySelector(".blog-loading");
  if (loadEl) loadEl.textContent = loadMsg;

  if (slug) {
    try {
      const [postResp, listResp] = await Promise.all([
        fetch(apiUrl(`/api/post/${encodeURIComponent(slug)}`), { method: "GET" }),
        fetch(apiUrl("/api/posts"), { method: "GET" }).catch(() => null),
      ]);
      if (!postResp.ok) {
        root.innerHTML = `<p style="grid-column:1/-1; text-align:center; color: var(--color-ink-soft)">${singleNotFound}</p>`;
        return;
      }
      const post = await postResp.json();
      let moreHtml = "";
      if (listResp && listResp.ok) {
        try {
          const all = await listResp.json();
          if (Array.isArray(all)) {
            const others = all.filter((p) => p && p.slug && p.slug !== post.slug).slice(0, 6);
            if (others.length) {
              moreHtml = `
                <section class="blog-more" style="grid-column:1/-1; margin-top:4rem;">
                  <div class="section-title" style="margin-bottom:1.5rem;">
                    <h2 style="font-style: italic; text-align:center;">${moreLabel}</h2>
                  </div>
                  <div class="blog-grid">${others.map((p) => card(p)).join("")}</div>
                </section>`;
            }
          }
        } catch {}
      }
      root.innerHTML = singlePost(post) + moreHtml;
    } catch {
      root.innerHTML = `<p style="grid-column:1/-1; text-align:center; color: var(--color-ink-soft)">${offlineMsg}</p>`;
    }
    return;
  }

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
