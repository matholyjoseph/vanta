/**
 * Prisma build helper for Vercel.
 *
 * Problem: `prisma generate` validates the schema and crashes if DATABASE_URL
 * is empty or missing. On Vercel, .env files are gitignored so DATABASE_URL
 * must come from Vercel Environment Variables.
 *
 * Solution: If DATABASE_URL isn't set, provide a syntactically valid
 * placeholder so `prisma generate` can create the TypeScript client.
 * The placeholder is never used for actual database connections.
 */
const { execSync } = require("child_process");

const hasDbUrl =
  process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0;

if (!hasDbUrl) {
  console.log(
    "[prisma-build] DATABASE_URL not set — using placeholder for client generation only"
  );
  process.env.DATABASE_URL = "postgresql://placeholder:placeholder@localhost:5432/placeholder";
}

try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("[prisma-build] Prisma Client generated successfully");
} catch (err) {
  console.error("[prisma-build] prisma generate failed:", err.message);
  process.exit(1);
}

// Only push schema if a real DATABASE_URL is configured
if (hasDbUrl) {
  try {
    execSync("npx prisma db push --accept-data-loss --skip-generate", {
      stdio: "inherit",
    });
    console.log("[prisma-build] Database schema pushed successfully");
  } catch (err) {
    console.warn(
      "[prisma-build] prisma db push failed (database may not be reachable during build):",
      err.message
    );
    // Non-fatal — tables may already exist from a previous push
  }
}
