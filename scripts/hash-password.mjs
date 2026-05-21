import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash-password -- "your-password"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const escapedHash = hash.replaceAll("$", "\\$");

console.log("Raw hash:");
console.log(hash);
console.log("");
console.log("Paste this in .env.local:");
console.log(`APP_PASSWORD_HASH=${escapedHash}`);
