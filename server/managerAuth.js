const crypto = require("crypto");
const config = require("./config");

const AUTH_COOKIE_NAME = "manager_auth";

const toBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
};

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

const parseCookies = (headerValue) => {
  if (!headerValue || typeof headerValue !== "string") return {};

  return headerValue.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
};

const signTokenPayload = (encodedPayload) => {
  return crypto
    .createHmac("sha256", config.manager.tokenSecret)
    .update(encodedPayload)
    .digest("base64url");
};

const createAuthToken = () => {
  const payload = {
    exp: Date.now() + config.manager.sessionTtlMs,
    iat: Date.now(),
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signTokenPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const verifyAuthToken = (token) => {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) return false;

  const expectedSignature = signTokenPayload(encodedPayload);
  if (!safeEqual(providedSignature, expectedSignature)) return false;

  let payload = null;
  try {
    payload = JSON.parse(fromBase64Url(encodedPayload));
  } catch (_error) {
    return false;
  }

  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp > Date.now();
};

const serializeAuthCookie = (token, maxAgeSeconds) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
};

const serializeClearedAuthCookie = () => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
};

const isManagerPasswordValid = (password) => {
  if (!config.manager.password) return false;
  return safeEqual(password, config.manager.password);
};

const requireManagerAuth = (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[AUTH_COOKIE_NAME];

  if (!verifyAuthToken(token)) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
      code: "UNAUTHORIZED",
    });
  }

  return next();
};

module.exports = {
  AUTH_COOKIE_NAME,
  createAuthToken,
  serializeAuthCookie,
  serializeClearedAuthCookie,
  isManagerPasswordValid,
  requireManagerAuth,
};
