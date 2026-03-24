const fs = require("fs/promises");
const path = require("path");
const config = require("./config");

const REQUESTS_FILE = path.join(config.storageDir, "requests.csv");

const CSV_COLUMNS = [
  "name",
  "email",
  "date",
  "time",
  "timestamp",
  "entered_word",
  "result",
  "promocode",
  "ip",
  "user_agent",
  "error_message",
];

const escapeCsv = (value) => {
  const stringValue = String(value ?? "");
  if (!/[",\r\n]/.test(stringValue)) return stringValue;
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const ensureRequestsFile = async () => {
  await fs.mkdir(config.storageDir, { recursive: true });
  const expectedHeader = CSV_COLUMNS.join(",");

  try {
    await fs.access(REQUESTS_FILE);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const headerLine = `${expectedHeader}\n`;
    await fs.writeFile(REQUESTS_FILE, headerLine, "utf8");
    return;
  }

  const existing = await fs.readFile(REQUESTS_FILE, "utf8");
  const normalized = existing.replace(/^\uFEFF/, "");
  if (!normalized.trim()) {
    await fs.writeFile(REQUESTS_FILE, `${expectedHeader}\n`, "utf8");
    return;
  }

  const firstLine = normalized.split(/\r?\n/, 1)[0].trim();
  if (firstLine !== expectedHeader) {
    await fs.writeFile(REQUESTS_FILE, `${expectedHeader}\n${normalized}`, "utf8");
  }
};

const appendRequestLog = async (entry) => {
  await ensureRequestsFile();
  const line = `${CSV_COLUMNS.map((column) => escapeCsv(entry[column])).join(",")}\n`;
  await fs.appendFile(REQUESTS_FILE, line, "utf8");
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const readRequestLog = async () => {
  await ensureRequestsFile();
  const raw = await fs.readFile(REQUESTS_FILE, "utf8");
  const normalized = raw.replace(/^\uFEFF/, "");
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (!lines.length) return [];

  const header = parseCsvLine(lines[0]);
  const rows = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = parseCsvLine(lines[index]);
    const record = {};

    header.forEach((column, columnIndex) => {
      record[column] = values[columnIndex] ?? "";
    });

    rows.push(record);
  }

  return rows;
};

const readRequestLogCsv = async () => {
  await ensureRequestsFile();
  return fs.readFile(REQUESTS_FILE, "utf8");
};

module.exports = {
  CSV_COLUMNS,
  appendRequestLog,
  readRequestLog,
  readRequestLogCsv,
  REQUESTS_FILE,
};
