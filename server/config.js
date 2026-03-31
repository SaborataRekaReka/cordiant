const path = require("path");
const dotenv = require("dotenv");

const rootDir = path.resolve(__dirname, "..");
const envPath = process.env.CORDIANT_ENV_PATH
  ? path.resolve(process.env.CORDIANT_ENV_PATH)
  : path.join(rootDir, "config", ".env");

dotenv.config({ path: envPath, quiet: true });

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return fallback;
};

const validCodeWords = String(process.env.VALID_CODE_WORDS || "")
  .split(",")
  .map((word) => word.trim().toUpperCase())
  .filter(Boolean);

const storageDir = process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : path.join(rootDir, "storage");

module.exports = {
  rootDir,
  publicDir: path.join(rootDir, "public"),
  storageDir,
  emailsDir: path.join(rootDir, "emails"),
  port: toInt(process.env.PORT, 3000),
  validCodeWords,
  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    maxRequests: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: toInt(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "",
    fromName: process.env.SMTP_FROM_NAME || "",
  },
  manager: {
    password: process.env.MANAGER_DASHBOARD_PASSWORD || "",
    tokenSecret: process.env.MANAGER_DASHBOARD_TOKEN_SECRET || process.env.MANAGER_DASHBOARD_PASSWORD || "",
    sessionTtlMs: toInt(process.env.MANAGER_SESSION_TTL_MS, 8 * 60 * 60 * 1000),
  },
};
