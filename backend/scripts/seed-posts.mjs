/**
 * Zkopíruje články z data/posts.json do MongoDB (upsert podle slug).
 * Použití: MONGODB_URI=… node scripts/seed-posts.mjs
 */
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  "";
const MONGODB_DB = process.env.MONGODB_DB || "romcaom";
const DATA = path.join(__dirname, "..", "data", "posts.json");

if (!MONGODB_URI) {
  console.error("Chybí MONGODB_URI v prostředí.");
  process.exit(1);
}

const raw = await readFile(DATA, "utf8");
const { posts = [] } = JSON.parse(raw);
const client = new MongoClient(MONGODB_URI);
await client.connect();
const col = client.db(MONGODB_DB).collection("posts");

for (const post of posts) {
  if (!post.slug) continue;
  await col.updateOne({ slug: post.slug }, { $set: post }, { upsert: true });
  console.log(`✓ ${post.slug}`);
}

await client.close();
console.log(`Hotovo — ${posts.length} článk(ů).`);
