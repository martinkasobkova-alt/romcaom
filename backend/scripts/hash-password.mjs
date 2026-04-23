import bcrypt from "bcryptjs";

const p = process.argv[2];
if (!p) {
  console.error("Usage: node scripts/hash-password.mjs 'your-secure-password'");
  process.exit(1);
}
console.log(bcrypt.hashSync(p, 12));
