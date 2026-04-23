import { apiUrl } from "./api-config.js";

const isCs = document.body.dataset.lang === "cs";

const blogListHref = isCs ? "/cs/blog.html" : "/blog.html";
const contactHref = isCs ? "/cs/contact.html" : "/contact.html";

const L = isCs
  ? {
      back: "← Zpět na všechny články",
      defaultCat: "Deník",
      stayTitle: "Zůstaňme v kontaktu",
      stayText: "Napište mi nebo prohlédněte služby, když vás něco osloví.",
      contactBtn: "Kontakt",
      missAddr: "Chybí adresa článku",
      blog: "Blog",
      notFound: "Článek nenalezen",
      notFoundP: "Možná není zveřejněný, nebo neběží server.",
      loadErr: "Tento článek se nepodařilo načíst",
      loadErrP:
        "Otevřete stránky přes lokální server (<code>npm start</code>), aby byl k dispozici blog API, nebo článek najdete na <a href=\"https://anuradha.blog\" target=\"_blank\" rel=\"noopener\">anuradha.blog</a>.",
    }
  : {
      back: "← Back to all posts",
      defaultCat: "Journal",
      stayTitle: "Stay in touch",
      stayText: "Write to me or explore services when something calls to you.",
      contactBtn: "Contact",
      missAddr: "Missing article address",
      blog: "Blog",
      notFound: "Article not found",
      notFoundP: "It may be unpublished, or the server is not running.",
      loadErr: "Cannot load this article",
      loadErrP:
        "Make sure the site is opened through the local server (<code>npm start</code>) so the blog API is available, or the article is still on <a href=\"https://anuradha.blog\" target=\"_blank\" rel=\"noopener\">anuradha.blog</a>.",
    };

function getSlug() {
  const q = new URLSearchParams(location.search).get("slug");
  if (q != null && String(q).trim() !== "") {
    return decodeURIComponent(String(q).trim());
  }
  const p = location.pathname;
  if (p.startsWith("/cs/blog/")) {
    return decodeURIComponent(p.replace(/^\/cs\/blog\//, "").split("/")[0] || "");
  }
  if (p.startsWith("/blog/")) {
    return decodeURIComponent(p.replace(/^\/blog\//, "").split("/")[0] || "");
  }
  return "";
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(isCs ? "cs-CZ" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function buildHtml(post) {
  const hasHero = post.heroImage;
  const heroClass = "post-hero" + (hasHero ? " post-hero--photo" : "");
  const style = hasHero
    ? ` style="--post-hero-bg: url('${post.heroImage.replace(/'/g, "%27")}')"`
    : "";
  const gallery =
    post.gallery && post.gallery.length
      ? `<div class="post-gallery container">${post.gallery
          .map(
            (u) =>
              `<a href="${escapeAttr(u)}" target="_blank" rel="noopener"><img src="${escapeAttr(
                u
              )}" alt="" loading="lazy" /></a>`
          )
          .join("")}</div>`
      : "";
  return `
  <section class="${heroClass}"${style}>
    <div class="container">
      <a href="${blogListHref}" class="post-back">${L.back}</a>
      <div class="post-meta">${formatDate(
        post.createdAt
      )} · ${escapeHtml(post.category || L.defaultCat)} · Anuradha</div>
      <h1>${escapeHtml(post.title)}</h1>
      <p class="post-hero-lead">${escapeHtml(post.subtitle || "")}</p>
    </div>
  </section>
  <section class="post-body reveal">
    <div class="container">
      <div class="prose post-prose" id="postProse"></div>
      ${gallery}
    </div>
  </section>
  <section class="newsletter-inline reveal">
    <div class="container">
      <div class="newsletter-inline-inner">
        <h3>${L.stayTitle}</h3>
        <p>${L.stayText}</p>
        <a href="${contactHref}" class="btn btn-primary">${L.contactBtn}</a>
      </div>
    </div>
  </section>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function initRevealIn(root) {
  const nodes = root.querySelectorAll(".reveal");
  if (!nodes.length) return;
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  nodes.forEach((n) => io.observe(n));
}

const slug = getSlug();
const shell = document.getElementById("postShell");

if (!shell) {
  // no-op
} else if (!slug) {
  shell.innerHTML = `<p class="container" style="padding:3rem">${L.missAddr}. <a href="${blogListHref}">${L.blog}</a></p>`;
} else {
  fetch(apiUrl(`/api/post/${encodeURIComponent(slug)}`))
    .then((r) => (r.ok ? r.json() : null))
    .then((post) => {
      if (!post) {
        shell.innerHTML = `
          <div class="container" style="padding: 3rem; text-align: center">
            <h1>${L.notFound}</h1>
            <p>${L.notFoundP}</p>
            <p><a href="${blogListHref}">← ${L.blog}</a></p>
          </div>`;
        document.title = (isCs ? "Nenalezeno" : "Not found") + " | Beyond Limits";
        return;
      }
      document.title = `${post.title} | Beyond Limits`;
      const md = document.getElementById("metaDesc");
      if (md) md.setAttribute("content", (post.subtitle || post.title).slice(0, 160));
      shell.innerHTML = buildHtml(post);
      const pr = document.getElementById("postProse");
      if (pr) {
        pr.innerHTML = post.bodyHtml || "<p></p>";
      }
      initRevealIn(shell);
    })
    .catch(() => {
      shell.innerHTML = `
        <div class="container" style="padding: 3rem; text-align: center; max-width: 36rem; margin: 0 auto">
          <h1>${L.loadErr}</h1>
          <p>${L.loadErrP}</p>
          <p><a href="${blogListHref}">← ${L.blog}</a></p>
        </div>`;
      document.title = (isCs ? "Blog" : "Blog") + " | Beyond Limits";
    });
}
