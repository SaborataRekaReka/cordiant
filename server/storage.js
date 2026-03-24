const fs = require("fs/promises");
const path = require("path");
const config = require("./config");

const PROMOCODES_FILE = path.join(config.storageDir, "promocodes.json");
const LOCK_FILE = path.join(config.storageDir, "promocodes.lock");
const TEMP_FILE = path.join(config.storageDir, "promocodes.tmp");

const LOCK_RETRY_MS = 70;
const LOCK_TIMEOUT_MS = 10_000;
const STALE_LOCK_MS = 30_000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureStorageDir = async () => {
  await fs.mkdir(config.storageDir, { recursive: true });
};

const toQueue = (value) => {
  if (!Array.isArray(value)) {
    const error = new Error("Promocode storage format is invalid");
    error.code = "PROMOCODES_FORMAT_INVALID";
    throw error;
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
};

const readPromocodeQueue = async () => {
  await ensureStorageDir();

  let raw;
  try {
    raw = await fs.readFile(PROMOCODES_FILE, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      const notFoundError = new Error("Promocode storage file was not found");
      notFoundError.code = "PROMOCODES_FILE_NOT_FOUND";
      throw notFoundError;
    }
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch (error) {
    const parseError = new Error("Promocode storage JSON is invalid");
    parseError.code = "PROMOCODES_JSON_INVALID";
    throw parseError;
  }

  return toQueue(parsed);
};

const writePromocodeQueue = async (queue) => {
  await ensureStorageDir();
  const normalized = toQueue(queue);
  const payload = `${JSON.stringify(normalized, null, 2)}\n`;

  await fs.writeFile(TEMP_FILE, payload, "utf8");
  await fs.rm(PROMOCODES_FILE, { force: true });
  await fs.rename(TEMP_FILE, PROMOCODES_FILE);
};

const acquireLock = async () => {
  await ensureStorageDir();
  const startedAt = Date.now();

  while (Date.now() - startedAt < LOCK_TIMEOUT_MS) {
    try {
      return await fs.open(LOCK_FILE, "wx");
    } catch (error) {
      if (error.code !== "EEXIST") throw error;

      try {
        const lockStat = await fs.stat(LOCK_FILE);
        if (Date.now() - lockStat.mtimeMs > STALE_LOCK_MS) {
          await fs.rm(LOCK_FILE, { force: true });
        }
      } catch (_statError) {
        // Ignore race conditions while checking/removing stale lock.
      }

      await delay(LOCK_RETRY_MS);
    }
  }

  const timeoutError = new Error("Timed out waiting for promocode lock");
  timeoutError.code = "PROMOCODE_LOCK_TIMEOUT";
  throw timeoutError;
};

const releaseLock = async (handle) => {
  try {
    if (handle) await handle.close();
  } finally {
    await fs.rm(LOCK_FILE, { force: true });
  }
};

const withPromocodeLock = async (handler) => {
  const lockHandle = await acquireLock();
  try {
    return await handler();
  } finally {
    await releaseLock(lockHandle);
  }
};

module.exports = {
  readPromocodeQueue,
  writePromocodeQueue,
  withPromocodeLock,
};
