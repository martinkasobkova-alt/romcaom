import express from "express";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Persistent storage paths.
 *
 * Na produkci (Render) je připnutý disk na `/var/data` a env proměnné
 * `DATA_DIR` + `UPLOADS_DIR` ukazují na tento disk, takže články i nahrané
 * soubory přežívají redeploye.
 *
 * Lokálně (bez env) se používá klasická složka uvnitř repozitáře, aby šlo
 * v klidu vyvíjet i bez nastavení.
 */
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const UPLOADS = process.env.UPLOADS_DIR || path.join(__dirname, "uploads");
const DATA = path.join(DATA_DIR, "posts.json");
const FRONTEND = path.join(__dirname, "..", "frontend");
const MAX_JSON = "2mb";

const app = express();
app.use(express.json({ limit: MAX_JSON }));

const BUILTIN_CORS_ORIGINS = [
  "https://romcaom-y4ru.vercel.app",
  "https://romcaom.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];
const fromEnv = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const corsOrigins = [...new Set([...BUILTIN_CORS_ORIGINS, ...fromEnv])];

function corsAllowsOrigin(o) {
  if (!o) return false;
  if (corsOrigins.includes(o)) return true;
  try {
    const u = new URL(o);
    if (u.protocol !== "https:") return false;
    const h = u.hostname;
    return h === "vercel.app" || h.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && corsAllowsOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

function slugify(s) {
  if (!s || typeof s !== "string") return "post";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "post";
}

async function readDb() {
  if (!existsSync(DATA)) {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA, JSON.stringify({ posts: [] }, null, 2), "utf8");
  }
  const raw = await readFile(DATA, "utf8");
  return JSON.parse(raw);
}

async function writeDb(data) {
  await writeFile(DATA, JSON.stringify(data, null, 2), "utf8");
}

function timingSafeStringEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const A = Buffer.from(a, "utf8");
  const B = Buffer.from(b, "utf8");
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

async function verifyPassword(plain) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    return bcrypt.compare(plain, hash);
  }
  const plainEnv = process.env.ADMIN_PASSWORD;
  if (plainEnv) {
    return timingSafeStringEqual(plain, plainEnv);
  }
  return false;
}

function authRequired(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = h.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server missing JWT_SECRET" });
  }
  try {
    req.admin = jwt.verify(token, secret);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

if (!existsSync(DATA_DIR)) {
  await mkdir(DATA_DIR, { recursive: true });
}
if (!existsSync(UPLOADS)) {
  await mkdir(UPLOADS, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /^image\//.test(file.mimetype) ||
      /^video\//.test(file.mimetype) ||
      /^audio\//.test(file.mimetype);
    cb(null, ok);
  },
});

// --- API ---

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasAuth: !!(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD) });
});

app.post("/api/auth/login", async (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Password required" });
  }
  const ok = await verifyPassword(password);
  if (!ok) {
    return res.status(401).json({ error: "Invalid password" });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server missing JWT_SECRET" });
  }
  const token = jwt.sign({ role: "admin" }, secret, { expiresIn: "14d" });
  res.json({ token, expiresIn: "14d" });
});

app.get("/api/auth/verify", authRequired, (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/posts", async (req, res) => {
  const db = await readDb();
  let list = [...(db.posts || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  } else {
    list = list.filter((p) => p.published);
  }
  res.json(
    list.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      category: p.category,
      bodyHtml: p.bodyHtml,
      heroImage: p.heroImage,
      gallery: p.gallery,
      published: p.published,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  );
});

app.get("/api/post/:slug", async (req, res) => {
  const { slug } = req.params;
  const db = await readDb();
  const post = (db.posts || []).find((p) => p.slug === slug);
  if (!post) {
    return res.status(404).json({ error: "Not found" });
  }
  if (!post.published) {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ")) {
      return res.status(404).json({ error: "Not found" });
    }
    try {
      jwt.verify(h.slice(7), process.env.JWT_SECRET);
    } catch {
      return res.status(404).json({ error: "Not found" });
    }
  }
  res.json({
    id: post.id,
    slug: post.slug,
    title: post.title,
    subtitle: post.subtitle,
    category: post.category,
    bodyHtml: post.bodyHtml,
    heroImage: post.heroImage,
    gallery: post.gallery,
    published: post.published,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  });
});

app.post("/api/posts", authRequired, async (req, res) => {
  const b = req.body || {};
  const title = (b.title || "").trim();
  if (!title) {
    return res.status(400).json({ error: "Title required" });
  }
  let slug = (b.slug && String(b.slug).trim()) || slugify(title);
  const db = await readDb();
  if ((db.posts || []).some((p) => p.slug === slug)) {
    slug = `${slug}-${Date.now()}`;
  }
  const id = `p-${randomUUID()}`;
  const now = new Date().toISOString();
  const post = {
    id,
    slug,
    title,
    subtitle: (b.subtitle || "").trim(),
    category: (b.category || "Journal").trim(),
    bodyHtml: b.bodyHtml || "",
    heroImage: b.heroImage || "",
    gallery: Array.isArray(b.gallery) ? b.gallery.map(String) : [],
    published: b.published !== false,
    createdAt: now,
    updatedAt: now,
  };
  db.posts = [post, ...(db.posts || [])];
  await writeDb(db);
  res.status(201).json(post);
});

app.put("/api/posts/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const idx = (db.posts || []).findIndex((p) => p.id === id);
  if (idx < 0) {
    return res.status(404).json({ error: "Not found" });
  }
  const cur = db.posts[idx];
  const b = req.body || {};
  if (b.title != null) cur.title = String(b.title).trim() || cur.title;
  if (b.subtitle != null) cur.subtitle = String(b.subtitle).trim();
  if (b.category != null) cur.category = String(b.category).trim() || "Journal";
  if (b.bodyHtml != null) cur.bodyHtml = b.bodyHtml;
  if (b.heroImage != null) cur.heroImage = b.heroImage;
  if (b.gallery != null) cur.gallery = Array.isArray(b.gallery) ? b.gallery.map(String) : [];
  if (b.published != null) cur.published = !!b.published;
  if (b.slug != null) {
    const ns = String(b.slug).trim() || cur.slug;
    if (ns !== cur.slug && (db.posts || []).some((p) => p.slug === ns && p.id !== id)) {
      return res.status(400).json({ error: "Slug already in use" });
    }
    cur.slug = ns;
  }
  cur.updatedAt = new Date().toISOString();
  db.posts[idx] = cur;
  await writeDb(db);
  res.json(cur);
});

app.delete("/api/posts/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const before = (db.posts || []).length;
  db.posts = (db.posts || []).filter((p) => p.id !== id);
  if (db.posts.length === before) {
    return res.status(404).json({ error: "Not found" });
  }
  await writeDb(db);
  res.json({ ok: true });
});

app.post("/api/upload", authRequired, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file" });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

app.post("/api/upload/gallery", authRequired, upload.array("files", 12), (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ error: "No files" });
  }
  const urls = req.files.map((f) => `/uploads/${f.filename}`);
  res.json({ urls });
});

// Static: uploads, then /blog/* → post.html, then public site
app.use("/uploads", express.static(UPLOADS));

app.get("/blog/:slug", (_req, res) => {
  res.sendFile(path.join(FRONTEND, "post.html"));
});

app.get("/cs/blog/:slug", (_req, res) => {
  res.sendFile(path.join(FRONTEND, "cs", "post.html"));
});

app.use(
  express.static(FRONTEND, {
    extensions: ["html"],
    index: ["index.html"],
    maxAge: "1h",
  })
);

// Fallback: SPA-like post route already handled. 404
app.use((_req, res) => {
  res.status(404).send("Not found");
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Beyond Limits: http://0.0.0.0:${port} (e.g. http://localhost:${port})`);
  console.log(`[storage] posts file: ${DATA}`);
  console.log(`[storage] uploads dir: ${UPLOADS}`);
  if (!existsSync(FRONTEND)) {
    console.warn(`Warning: frontend folder not found at ${FRONTEND}`);
  }
  if (!process.env.JWT_SECRET) {
    console.warn("Warning: set JWT_SECRET in .env");
  }
  if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
    console.warn("Warning: set ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD) for blog admin");
  }
});
