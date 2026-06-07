/**
 * Články uložené ve frontendu — zobrazí se v blogu i bez zápisu v MongoDB.
 * Po publikaci přes admin na Renderu se stejný slug z API přebere automaticky.
 */

import { WHY_WRITE_BLOG_POST } from "./en-blog-why-write.js";
import { ABOUT_HAPPINESS_BLOG_POST } from "./en-blog-about-happiness.js";
import { SERVICE_BLOG_POST } from "./en-blog-service.js";
import { EARTH_MEDITATION_BLOG_POST } from "./en-blog-earth-meditation.js";
import { HARMONY_NATURE_BLOG_POST } from "./en-blog-harmony-nature.js";
import { WHAT_PRECEDED_GITA_BLOG_POST } from "./en-blog-what-preceded-gita.js";
import { OM_CHANTING_BLOG_POST } from "./en-blog-om-chanting.js";
import { NEW_DIMENSION_BLOG_POST } from "./en-blog-new-dimension.js";
import { FIRST_DARSHAN_BLOG_POST } from "./en-blog-first-darshan.js";
import { JULINKA_BLOG_POST } from "./en-blog-julinka.js";

export const STATIC_POSTS = [
  JULINKA_BLOG_POST,
  FIRST_DARSHAN_BLOG_POST,
  NEW_DIMENSION_BLOG_POST,
  OM_CHANTING_BLOG_POST,
  WHAT_PRECEDED_GITA_BLOG_POST,
  HARMONY_NATURE_BLOG_POST,
  EARTH_MEDITATION_BLOG_POST,
  SERVICE_BLOG_POST,
  ABOUT_HAPPINESS_BLOG_POST,
  WHY_WRITE_BLOG_POST,
  {
    id: "static-zmena-navrat",
    slug: "kdyz-se-zmena-nedeje-silou-ale-navratem",
    title: "Když se změna neděje silou, ale návratem",
    subtitle:
      "Jsme zvyklí tlačit na změnu. Mít plán, výkon, výsledky. Ale vnitřní proměna takhle nefunguje.",
    category: "Blog",
    bodyHtml:
      "<p>Jsme zvyklí tlačit na změnu. Mít plán, výkon, výsledky. Ale vnitřní proměna takhle nefunguje.</p>" +
      "<p>To, co se v nás opravdu mění, se neděje v napětí, ale ve chvíli, kdy se tělo přestane bránit. Když se nervový systém uvolní. Když přestaneme bojovat s tím, co cítíme.</p>" +
      "<p>Návrat k sobě není krok vpřed.</p>" +
      "<p>Je to spíš zastavení toho, co nás od sebe vzdaluje.</p>" +
      "<p>A právě v tom prostoru začíná něco nového. Ne proto, že jsme to vymysleli, ale proto, že to konečně může projít skrz nás bez odporu.</p>" +
      "<p>V Beyond Limits nepracujeme s tlakem.</p>" +
      "<p>Pracujeme s přítomností.</p>" +
      "<p>S tím, co je skutečné právě teď.</p>" +
      "<p>S dechem, který se zpomalí.</p>" +
      "<p>S tělem, které se uvolní.</p>" +
      "<p>S myslí, která nemusí všechno řídit.</p>" +
      "<p>A v tom se začíná měnit celý vnitřní svět.</p>",
    heroImage: "https://anuradha.blog/wp-content/uploads/2025/07/meditw.jpg",
    gallery: [],
    published: true,
    createdAt: "2026-05-28T10:00:00.000Z",
    updatedAt: "2026-05-28T10:00:00.000Z",
    lang: "cs",
  },
];

export function findStaticPost(slug) {
  if (!slug) return null;
  return STATIC_POSTS.find((p) => p.published && p.slug === slug) || null;
}

export function listStaticPosts(isCs) {
  return STATIC_POSTS.filter((p) => p.published && (!p.lang || (isCs ? p.lang === "cs" : p.lang === "en")));
}

export function mergePosts(apiPosts, isCs) {
  const staticOnes = listStaticPosts(isCs);
  const api = Array.isArray(apiPosts) ? apiPosts : [];
  const staticSlugs = new Set(staticOnes.map((p) => p.slug));
  const fromApi = api.filter((p) => p && p.slug && !staticSlugs.has(p.slug));
  return [...staticOnes, ...fromApi].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}
