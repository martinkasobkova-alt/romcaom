import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { WHY_WRITE_BLOG_POST } from "../../frontend/js/en-blog-why-write.js";
import { ABOUT_HAPPINESS_BLOG_POST } from "../../frontend/js/en-blog-about-happiness.js";
import { SERVICE_BLOG_POST } from "../../frontend/js/en-blog-service.js";
import { EARTH_MEDITATION_BLOG_POST } from "../../frontend/js/en-blog-earth-meditation.js";
import { HARMONY_NATURE_BLOG_POST } from "../../frontend/js/en-blog-harmony-nature.js";
import { WHAT_PRECEDED_GITA_BLOG_POST } from "../../frontend/js/en-blog-what-preceded-gita.js";
import { OM_CHANTING_BLOG_POST } from "../../frontend/js/en-blog-om-chanting.js";
import { NEW_DIMENSION_BLOG_POST } from "../../frontend/js/en-blog-new-dimension.js";
import { FIRST_DARSHAN_BLOG_POST } from "../../frontend/js/en-blog-first-darshan.js";
import { JULINKA_BLOG_POST } from "../../frontend/js/en-blog-julinka.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "data", "posts.json");

const EN_POSTS = [
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
];

const db = JSON.parse(await readFile(dataPath, "utf8"));
const slugs = new Set(EN_POSTS.map((p) => p.slug));
let posts = db.posts.filter((p) => !slugs.has(p.slug));

for (const post of EN_POSTS) {
  const { lang, ...apiPost } = post;
  posts.unshift(apiPost);
}

await writeFile(dataPath, JSON.stringify({ posts }, null, 2) + "\n", "utf8");
console.log("Synced EN posts:", EN_POSTS.map((p) => p.slug).join(", "));
