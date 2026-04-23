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
import { v2 as cloudinary } from "cloudinary";
import { MongoClient } from "mongodb";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Perzistentní úložiště.
 *
 * Pokud je v env `MONGODB_URI` (resp. `MONGO_URL` / `DATABASE_URL`), články
 * i admin heslo se ukládají do MongoDB → přežívají redeploye, stačí jeden
 * online DB cluster (např. MongoDB Atlas).
 *
 * Jinak (lokální vývoj bez Mongo) fallback na JSON soubor ve složce
 * `DATA_DIR`.
 *
 * Upload médií řeší zvlášť Cloudinary (viz níže) – do Mongo by se binárky
 * neukládaly.
 */
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const UPLOADS = process.env.UPLOADS_DIR || path.join(__dirname, "uploads");
const DATA = path.join(DATA_DIR, "posts.json");
const FRONTEND = path.join(__dirname, "..", "frontend");
const MAX_JSON = "2mb";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  "";
const MONGODB_DB = process.env.MONGODB_DB || "romcaom";

let mongo = null; // { client, db, posts, auth } když je DB připojená

async function initMongo() {
  if (!MONGODB_URI) return null;
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();
  const db = client.db(MONGODB_DB);
  const posts = db.collection("posts");
  const auth = db.collection("auth");
  try {
    await posts.createIndex({ slug: 1 }, { unique: true });
    await posts.createIndex({ createdAt: -1 });
  } catch (err) {
    console.warn("[mongo] createIndex warning:", err?.message || err);
  }
  return { client, db, posts, auth };
}

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

// Soubor pro fallback (lokální dev bez Mongo)
async function readFileDb() {
  if (!existsSync(DATA)) {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA, JSON.stringify({ posts: [] }, null, 2), "utf8");
  }
  const raw = await readFile(DATA, "utf8");
  return JSON.parse(raw);
}

async function writeFileDb(data) {
  await writeFile(DATA, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Post store – abstrahuje Mongo vs. soubor.
 * Mongo dokument = stejný shape jako položka v `posts.json`.
 */
function publicPost(p) {
  if (!p) return null;
  return {
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
  };
}

async function listAllPosts() {
  if (mongo) {
    return await mongo.posts.find({}).sort({ createdAt: -1 }).toArray();
  }
  const db = await readFileDb();
  return [...(db.posts || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

async function findPostBySlug(slug) {
  if (mongo) {
    return await mongo.posts.findOne({ slug });
  }
  const db = await readFileDb();
  return (db.posts || []).find((p) => p.slug === slug) || null;
}

async function findPostById(id) {
  if (mongo) {
    return await mongo.posts.findOne({ id });
  }
  const db = await readFileDb();
  return (db.posts || []).find((p) => p.id === id) || null;
}

async function slugExists(slug, exceptId = null) {
  if (mongo) {
    const filter = exceptId ? { slug, id: { $ne: exceptId } } : { slug };
    const n = await mongo.posts.countDocuments(filter, { limit: 1 });
    return n > 0;
  }
  const db = await readFileDb();
  return (db.posts || []).some((p) => p.slug === slug && p.id !== exceptId);
}

async function insertPost(post) {
  if (mongo) {
    await mongo.posts.insertOne(post);
    return;
  }
  const db = await readFileDb();
  db.posts = [post, ...(db.posts || [])];
  await writeFileDb(db);
}

async function updatePostById(id, patch) {
  if (mongo) {
    const r = await mongo.posts.findOneAndUpdate(
      { id },
      { $set: patch },
      { returnDocument: "after" }
    );
    return r?.value || r; // driver verze se liší – oba případy ošetřené
  }
  const db = await readFileDb();
  const idx = (db.posts || []).findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const cur = { ...db.posts[idx], ...patch };
  db.posts[idx] = cur;
  await writeFileDb(db);
  return cur;
}

async function deletePostById(id) {
  if (mongo) {
    const r = await mongo.posts.deleteOne({ id });
    return r.deletedCount > 0;
  }
  const db = await readFileDb();
  const before = (db.posts || []).length;
  db.posts = (db.posts || []).filter((p) => p.id !== id);
  if (db.posts.length === before) return false;
  await writeFileDb(db);
  return true;
}

/**
 * Auth store – heslo uložené v DB (doc `_id: "admin"`) nebo v souboru
 * (fallback pro lokální dev).
 */
const AUTH_FILE = path.join(DATA_DIR, "auth.json");

async function readSavedAuth() {
  if (mongo) {
    const doc = await mongo.auth.findOne({ _id: "admin" });
    if (doc && typeof doc.passwordHash === "string" && doc.passwordHash) {
      return { passwordHash: doc.passwordHash, updatedAt: doc.updatedAt };
    }
    return null;
  }
  if (!existsSync(AUTH_FILE)) return null;
  try {
    const raw = await readFile(AUTH_FILE, "utf8");
    const data = JSON.parse(raw);
    if (data && typeof data.passwordHash === "string" && data.passwordHash) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeSavedAuth(data) {
  if (mongo) {
    await mongo.auth.updateOne(
      { _id: "admin" },
      { $set: { passwordHash: data.passwordHash, updatedAt: data.updatedAt } },
      { upsert: true }
    );
    return;
  }
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(AUTH_FILE, JSON.stringify(data, null, 2), "utf8");
}

function timingSafeStringEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const A = Buffer.from(a, "utf8");
  const B = Buffer.from(b, "utf8");
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

async function verifyPassword(plain) {
  const saved = await readSavedAuth();
  if (saved) {
    const ok = await bcrypt.compare(plain, saved.passwordHash);
    console.log(`[auth] verify via saved password (${mongo ? "mongo" : "file"}) → ${ok ? "OK" : "FAIL"}`);
    return ok;
  }
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    const ok = await bcrypt.compare(plain, hash);
    console.log(`[auth] verify via ADMIN_PASSWORD_HASH env → ${ok ? "OK" : "FAIL"}`);
    return ok;
  }
  const plainEnv = process.env.ADMIN_PASSWORD;
  if (plainEnv) {
    const ok = timingSafeStringEqual(plain, plainEnv);
    console.log(`[auth] verify via ADMIN_PASSWORD env (plain) → ${ok ? "OK" : "FAIL"}`);
    return ok;
  }
  console.log("[auth] verify: no credentials configured");
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

/**
 * Pokud je v env `CLOUDINARY_URL`, uploady jdou do Cloudinary (globální CDN,
 * automatická optimalizace obrázků, podporuje i video a audio).
 *
 * Jinak se soubory ukládají na lokální / Render disk (`UPLOADS_DIR`).
 */
const hasCloudinary = !!process.env.CLOUDINARY_URL;
if (hasCloudinary) {
  cloudinary.config({ secure: true });
}

const upload = multer({
  storage: hasCloudinary ? multer.memoryStorage() : multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, UPLOADS);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /^image\//.test(file.mimetype) ||
      /^video\//.test(file.mimetype) ||
      /^audio\//.test(file.mimetype);
    cb(null, ok);
  },
});

function uploadBufferToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: process.env.CLOUDINARY_FOLDER || "romcaom-blog",
        use_filename: true,
        unique_filename: true,
        filename_override: originalName,
      },
      (err, result) => {
        if (err || !result) return reject(err || new Error("Upload failed"));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// --- API ---

app.get("/api/health", async (_req, res) => {
  const savedAuth = await readSavedAuth().catch(() => null);
  res.json({
    ok: true,
    storage: mongo ? "mongodb" : "file",
    hasSavedPassword: !!savedAuth,
    hasEnvAuth: !!(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD),
  });
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

app.post("/api/auth/change-password", authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== "string" || !currentPassword) {
    return res.status(400).json({ error: "Current password required" });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }
  const ok = await verifyPassword(currentPassword);
  if (!ok) {
    console.warn("[change-password] wrong current password");
    return res.status(401).json({ error: "Current password is incorrect" });
  }
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await writeSavedAuth({ passwordHash, updatedAt: new Date().toISOString() });
    console.log(`[change-password] saved (store: ${mongo ? "mongo" : "file"})`);
    res.json({ ok: true });
  } catch (err) {
    console.error(`[change-password] write failed (store: ${mongo ? "mongo" : "file"}):`, err);
    res.status(500).json({ error: `Failed to save new password: ${err?.message || err}` });
  }
});

app.get("/api/posts", async (req, res) => {
  let list = await listAllPosts();
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
  res.json(list.map(publicPost));
});

app.get("/api/post/:slug", async (req, res) => {
  const { slug } = req.params;
  const post = await findPostBySlug(slug);
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
  res.json(publicPost(post));
});

app.post("/api/posts", authRequired, async (req, res) => {
  const b = req.body || {};
  const title = (b.title || "").trim();
  if (!title) {
    return res.status(400).json({ error: "Title required" });
  }
  let slug = (b.slug && String(b.slug).trim()) || slugify(title);
  if (await slugExists(slug)) {
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
  try {
    await insertPost(post);
  } catch (err) {
    console.error("[posts] insert failed:", err);
    return res.status(500).json({ error: `Failed to save post: ${err?.message || err}` });
  }
  res.status(201).json(publicPost(post));
});

app.put("/api/posts/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  const cur = await findPostById(id);
  if (!cur) {
    return res.status(404).json({ error: "Not found" });
  }
  const b = req.body || {};
  const patch = {};
  if (b.title != null) patch.title = String(b.title).trim() || cur.title;
  if (b.subtitle != null) patch.subtitle = String(b.subtitle).trim();
  if (b.category != null) patch.category = String(b.category).trim() || "Journal";
  if (b.bodyHtml != null) patch.bodyHtml = b.bodyHtml;
  if (b.heroImage != null) patch.heroImage = b.heroImage;
  if (b.gallery != null) patch.gallery = Array.isArray(b.gallery) ? b.gallery.map(String) : [];
  if (b.published != null) patch.published = !!b.published;
  if (b.slug != null) {
    const ns = String(b.slug).trim() || cur.slug;
    if (ns !== cur.slug && (await slugExists(ns, id))) {
      return res.status(400).json({ error: "Slug already in use" });
    }
    patch.slug = ns;
  }
  patch.updatedAt = new Date().toISOString();
  try {
    const updated = await updatePostById(id, patch);
    res.json(publicPost(updated || { ...cur, ...patch }));
  } catch (err) {
    console.error("[posts] update failed:", err);
    res.status(500).json({ error: `Failed to update post: ${err?.message || err}` });
  }
});

app.delete("/api/posts/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    const ok = await deletePostById(id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("[posts] delete failed:", err);
    res.status(500).json({ error: `Failed to delete post: ${err?.message || err}` });
  }
});

app.post("/api/upload", authRequired, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file" });
  }
  try {
    if (hasCloudinary) {
      const result = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
      return res.json({ url: result.secure_url, publicId: result.public_id });
    }
    return res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
  } catch (err) {
    console.error("[upload] failed:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/api/upload/gallery", authRequired, upload.array("files", 12), async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ error: "No files" });
  }
  try {
    if (hasCloudinary) {
      const results = await Promise.all(
        req.files.map((f) => uploadBufferToCloudinary(f.buffer, f.originalname))
      );
      return res.json({ urls: results.map((r) => r.secure_url) });
    }
    return res.json({ urls: req.files.map((f) => `/uploads/${f.filename}`) });
  } catch (err) {
    console.error("[upload/gallery] failed:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
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

async function bootstrap() {
  if (MONGODB_URI) {
    try {
      mongo = await initMongo();
      console.log(`[storage] posts: MongoDB (db="${MONGODB_DB}", collection="posts")`);
      console.log(`[storage] auth:  MongoDB (db="${MONGODB_DB}", collection="auth")`);
      const savedAuth = await readSavedAuth();
      console.log(`[auth] saved password in DB: ${savedAuth ? "yes" : "no"}`);
    } catch (err) {
      console.error("[mongo] connection FAILED, falling back to file storage:", err?.message || err);
      mongo = null;
    }
  }
  if (!mongo) {
    console.log(`[storage] posts file: ${DATA}`);
    console.log(`[storage] auth file:  ${AUTH_FILE} (exists: ${existsSync(AUTH_FILE)})`);
  }
  console.log(`[storage] media: ${hasCloudinary ? "Cloudinary (CLOUDINARY_URL set)" : `local dir ${UPLOADS}`}`);
  const envAuth = process.env.ADMIN_PASSWORD_HASH ? "ADMIN_PASSWORD_HASH" : (process.env.ADMIN_PASSWORD ? "ADMIN_PASSWORD (plain)" : "none");
  console.log(`[auth] env fallback: ${envAuth}`);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Beyond Limits: http://0.0.0.0:${port} (e.g. http://localhost:${port})`);
    if (!existsSync(FRONTEND)) {
      console.warn(`Warning: frontend folder not found at ${FRONTEND}`);
    }
    if (!process.env.JWT_SECRET) {
      console.warn("Warning: set JWT_SECRET in .env");
    }
    if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD && !mongo) {
      console.warn("Warning: set ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD) for blog admin");
    }
  });
}

bootstrap().catch((err) => {
  console.error("[bootstrap] fatal:", err);
  process.exit(1);
});
