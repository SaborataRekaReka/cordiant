const path = require("path");
const express = require("express");

const config = require("./config");
const { sendHtmlEmail } = require("./mailer");
const { appendRequestLog, readRequestLogCsv } = require("./csvLogger");
const { readPromocodeQueue, writePromocodeQueue, withPromocodeLock } = require("./storage");
const { getDashboardSummary, getDashboardRequests } = require("./dashboardService");
const {
  createAuthToken,
  serializeAuthCookie,
  serializeClearedAuthCookie,
  isManagerPasswordValid,
  requireManagerAuth,
} = require("./managerAuth");
const {
  SUCCESS_SUBJECT,
  ERROR_SUBJECT,
  renderSuccessTemplate,
  renderErrorTemplate,
  getEditableTemplates,
  updateEditableTemplates,
} = require("./templates");
const { readQuizConfig, writeQuizConfig } = require("./quizConfig");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const codeWordPattern = /^[A-Z0-9_-]+$/;
const MAX_EMAIL_TEMPLATE_LENGTH = 120_000;

const requestBuckets = new Map();

const normalizeName = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();
const normalizeCodeWord = (value) => String(value ?? "").trim().toUpperCase();

const isValidName = (value) => value.length >= 2 && value.length <= 80;
const isValidEmail = (value) => value.length <= 254 && emailPattern.test(value);
const isValidCodeWordFormat = (value) =>
  value.length >= 2 && value.length <= 32 && codeWordPattern.test(value);

const twoDigits = (value) => String(value).padStart(2, "0");

const getDateFields = () => {
  const now = new Date();
  const date = `${now.getFullYear()}-${twoDigits(now.getMonth() + 1)}-${twoDigits(now.getDate())}`;
  const time = `${twoDigits(now.getHours())}:${twoDigits(now.getMinutes())}:${twoDigits(now.getSeconds())}`;
  return {
    date,
    time,
    timestamp: now.toISOString(),
  };
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  const raw = req.socket?.remoteAddress || req.ip || "";
  return String(raw).replace(/^::ffff:/, "");
};

const buildLogRecord = ({ name, email, enteredWord, ip, userAgent }, overrides = {}) => {
  const { date, time, timestamp } = getDateFields();
  return {
    name,
    email,
    date,
    time,
    timestamp,
    entered_word: enteredWord,
    result: "",
    promocode: "",
    ip,
    user_agent: userAgent,
    error_message: "",
    ...overrides,
  };
};

const safeAppendLog = async (record) => {
  try {
    await appendRequestLog(record);
  } catch (error) {
    console.error("[csv] Failed to append request log:", error);
  }
};

const cleanRateLimitBuckets = (now) => {
  for (const [ip, bucket] of requestBuckets) {
    if (now - bucket.windowStartedAt >= config.rateLimit.windowMs) {
      requestBuckets.delete(ip);
    }
  }
};

const rateLimitMiddleware = (req, res, next) => {
  const ip = getClientIp(req);
  const now = Date.now();

  if (requestBuckets.size > 5000) {
    cleanRateLimitBuckets(now);
  }

  const bucket = requestBuckets.get(ip);
  if (!bucket || now - bucket.windowStartedAt >= config.rateLimit.windowMs) {
    requestBuckets.set(ip, { windowStartedAt: now, requests: 1 });
    return next();
  }

  if (bucket.requests >= config.rateLimit.maxRequests) {
    return res.status(429).json({
      success: false,
      message: "Слишком много запросов. Попробуйте позже.",
      code: "RATE_LIMIT",
    });
  }

  bucket.requests += 1;
  return next();
};

app.post("/api/manager/login", (req, res) => {
  if (!config.manager.password || !config.manager.tokenSecret) {
    return res.status(503).json({
      success: false,
      message: "Manager dashboard is not configured.",
      code: "MANAGER_DISABLED",
    });
  }

  const password = String(req.body?.password ?? "");
  if (!isManagerPasswordValid(password)) {
    return res.status(401).json({
      success: false,
      message: "Invalid password.",
      code: "INVALID_PASSWORD",
    });
  }

  const token = createAuthToken();
  const maxAgeSeconds = Math.max(60, Math.floor(config.manager.sessionTtlMs / 1000));
  res.setHeader("Set-Cookie", serializeAuthCookie(token, maxAgeSeconds));

  return res.status(200).json({
    success: true,
    message: "Authentication successful.",
  });
});

app.post("/api/manager/logout", (_req, res) => {
  res.setHeader("Set-Cookie", serializeClearedAuthCookie());
  return res.status(200).json({
    success: true,
    message: "Logged out.",
  });
});

app.get("/api/manager/summary", requireManagerAuth, async (_req, res) => {
  try {
    const summary = await getDashboardSummary();
    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load summary.",
      code: "DASHBOARD_SUMMARY_ERROR",
    });
  }
});

app.get("/api/manager/requests", requireManagerAuth, async (req, res) => {
  try {
    const rows = await getDashboardRequests(req.query.limit);
    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load requests.",
      code: "DASHBOARD_REQUESTS_ERROR",
    });
  }
});

app.get("/api/manager/requests.csv", requireManagerAuth, async (_req, res) => {
  try {
    const csv = await readRequestLogCsv();
    const now = new Date();
    const stamp = `${now.getFullYear()}${twoDigits(now.getMonth() + 1)}${twoDigits(now.getDate())}-${twoDigits(
      now.getHours()
    )}${twoDigits(now.getMinutes())}${twoDigits(now.getSeconds())}`;
    const filename = `requests-${stamp}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to export CSV.",
      code: "DASHBOARD_CSV_EXPORT_ERROR",
    });
  }
});

app.post("/api/manager/promocodes/import", requireManagerAuth, async (req, res) => {
  const rawCodes = String(req.body?.codesText ?? "");
  const lines = rawCodes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return res.status(400).json({
      success: false,
      message: "Paste at least one promocode.",
      code: "PROMOCODES_EMPTY_INPUT",
    });
  }

  const normalizedCodes = lines.map((line) => line.toUpperCase());
  const validCodes = normalizedCodes.filter((code) => /^[A-Z0-9_-]{2,128}$/.test(code));
  const invalidCount = normalizedCodes.length - validCodes.length;

  if (!validCodes.length) {
    return res.status(400).json({
      success: false,
      message: "No valid promocodes found in input.",
      code: "PROMOCODES_INVALID_INPUT",
    });
  }

  try {
    const result = await withPromocodeLock(async () => {
      let queue = [];
      try {
        queue = await readPromocodeQueue();
      } catch (error) {
        if (error.code === "PROMOCODES_FILE_NOT_FOUND") {
          queue = [];
        } else {
          throw error;
        }
      }

      const existing = new Set(queue.map((item) => String(item).toUpperCase()));
      const additions = [];
      let duplicateCount = 0;

      validCodes.forEach((code) => {
        if (existing.has(code)) {
          duplicateCount += 1;
          return;
        }

        existing.add(code);
        additions.push(code);
      });

      if (additions.length) {
        queue.push(...additions);
        await writePromocodeQueue(queue);
      }

      return {
        addedCount: additions.length,
        duplicateCount,
        invalidCount,
        remainingPromocodes: queue.length,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: "Promocodes imported.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to import promocodes.",
      code: "PROMOCODES_IMPORT_ERROR",
    });
  }
});

app.get("/api/manager/emails", requireManagerAuth, async (_req, res) => {
  try {
    const templates = await getEditableTemplates();
    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load email templates.",
      code: "EMAIL_TEMPLATES_LOAD_ERROR",
    });
  }
});

app.post("/api/manager/emails", requireManagerAuth, async (req, res) => {
  const successTemplate = String(req.body?.successTemplate ?? "");
  const errorTemplate = String(req.body?.errorTemplate ?? "");

  if (!successTemplate.trim() || !errorTemplate.trim()) {
    return res.status(400).json({
      success: false,
      message: "Both email templates are required.",
      code: "EMAIL_TEMPLATE_VALIDATION_ERROR",
    });
  }

  if (successTemplate.length > MAX_EMAIL_TEMPLATE_LENGTH || errorTemplate.length > MAX_EMAIL_TEMPLATE_LENGTH) {
    return res.status(400).json({
      success: false,
      message: "Email template is too large.",
      code: "EMAIL_TEMPLATE_VALIDATION_ERROR",
    });
  }

  if (!successTemplate.includes("[promocode]")) {
    return res.status(400).json({
      success: false,
      message: "Success template must include [promocode].",
      code: "EMAIL_TEMPLATE_VALIDATION_ERROR",
    });
  }

  try {
    await updateEditableTemplates({
      successTemplate,
      errorTemplate,
    });

    return res.status(200).json({
      success: true,
      message: "Email templates saved.",
      data: {
        savedAt: new Date().toISOString(),
        successSubject: SUCCESS_SUBJECT,
        errorSubject: ERROR_SUBJECT,
      },
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save email templates.",
      code: "EMAIL_TEMPLATES_SAVE_ERROR",
    });
  }
});

app.get("/api/manager/quiz", requireManagerAuth, async (_req, res) => {
  try {
    const data = await readQuizConfig();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load quiz config.",
      code: error.code || "QUIZ_CONFIG_LOAD_ERROR",
    });
  }
});

app.post("/api/manager/quiz", requireManagerAuth, async (req, res) => {
  const quizConfig = req.body?.quizConfig;
  if (!quizConfig || typeof quizConfig !== "object" || Array.isArray(quizConfig)) {
    return res.status(400).json({
      success: false,
      message: "quizConfig must be a JSON object.",
      code: "QUIZ_CONFIG_VALIDATION_ERROR",
    });
  }

  try {
    const data = await writeQuizConfig(quizConfig);
    return res.status(200).json({
      success: true,
      message: "Quiz config saved.",
      data,
    });
  } catch (error) {
    if (error.code === "QUIZ_CONFIG_VALIDATION_ERROR") {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save quiz config.",
      code: error.code || "QUIZ_CONFIG_SAVE_ERROR",
    });
  }
});

app.post("/api/request-promocode", rateLimitMiddleware, async (req, res) => {
  const enteredWord = normalizeCodeWord(req.body?.entered_word);
  const name = normalizeName(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  const ip = getClientIp(req);
  const userAgent = String(req.headers["user-agent"] || "");

  const baseLogContext = {
    name,
    email,
    enteredWord,
    ip,
    userAgent,
  };

  if (!isValidName(name) || !isValidEmail(email) || !isValidCodeWordFormat(enteredWord)) {
    await safeAppendLog(
      buildLogRecord(baseLogContext, {
        result: "error",
        error_message: "VALIDATION_ERROR",
      })
    );

    return res.status(400).json({
      success: false,
      message: "Проверьте корректность введенных данных.",
      code: "VALIDATION_ERROR",
    });
  }

  const isValidBusinessWord = config.validCodeWords.includes(enteredWord);

  if (!isValidBusinessWord) {
    try {
      const html = await renderErrorTemplate();
      await sendHtmlEmail({
        to: email,
        subject: ERROR_SUBJECT,
        html,
      });
    } catch (error) {
      await safeAppendLog(
        buildLogRecord(baseLogContext, {
          result: "error",
          error_message: `MAIL_SEND_FAILED: ${error.message}`,
        })
      );

      return res.status(400).json({
        success: false,
        message: "Не удалось отправить письмо. Попробуйте позже.",
        code: "MAIL_SEND_FAILED",
      });
    }

    await safeAppendLog(
      buildLogRecord(baseLogContext, {
        result: "error",
        error_message: "INVALID_WORD",
      })
    );

    return res.status(200).json({
      success: true,
      message: "Письмо с информацией о неверном кодовом слове отправлено.",
      code: "INVALID_WORD_EMAIL_SENT",
    });
  }

  try {
    const transaction = await withPromocodeLock(async () => {
      let queue = [];
      try {
        queue = await readPromocodeQueue();
      } catch (error) {
        if (
          error.code === "PROMOCODES_FILE_NOT_FOUND" ||
          error.code === "PROMOCODES_JSON_INVALID" ||
          error.code === "PROMOCODES_FORMAT_INVALID"
        ) {
          return { type: "NO_PROMOCODES", details: error.message };
        }
        throw error;
      }

      if (!queue.length) {
        return { type: "NO_PROMOCODES", details: "Promocode queue is empty" };
      }

      const promocode = queue[0];
      const html = await renderSuccessTemplate(promocode);

      try {
        await sendHtmlEmail({
          to: email,
          subject: SUCCESS_SUBJECT,
          html,
        });
      } catch (error) {
        return {
          type: "MAIL_SEND_FAILED",
          promocode,
          details: error.message,
        };
      }

      queue = queue.slice(1);
      await writePromocodeQueue(queue);

      return {
        type: "SUCCESS",
        promocode,
      };
    });

    if (transaction.type === "SUCCESS") {
      await safeAppendLog(
        buildLogRecord(baseLogContext, {
          result: "success",
          promocode: transaction.promocode,
        })
      );

      return res.status(200).json({
        success: true,
        message: "Письмо отправлено.",
      });
    }

    if (transaction.type === "NO_PROMOCODES") {
      await safeAppendLog(
        buildLogRecord(baseLogContext, {
          result: "error",
          error_message: `NO_PROMOCODES: ${transaction.details || ""}`.trim(),
        })
      );

      return res.status(400).json({
        success: false,
        message: "Промокоды закончились. Попробуйте позже.",
        code: "NO_PROMOCODES",
      });
    }

    if (transaction.type === "MAIL_SEND_FAILED") {
      await safeAppendLog(
        buildLogRecord(baseLogContext, {
          result: "error",
          error_message: `MAIL_SEND_FAILED: ${transaction.details || ""}`.trim(),
        })
      );

      return res.status(400).json({
        success: false,
        message: "Не удалось отправить письмо. Попробуйте позже.",
        code: "MAIL_SEND_FAILED",
      });
    }

    await safeAppendLog(
      buildLogRecord(baseLogContext, {
        result: "error",
        error_message: `UNEXPECTED_TRANSACTION_STATE: ${transaction.type}`,
      })
    );

    return res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера.",
      code: "INTERNAL_ERROR",
    });
  } catch (error) {
    await safeAppendLog(
      buildLogRecord(baseLogContext, {
        result: "error",
        error_message: `INTERNAL_ERROR: ${error.message}`,
      })
    );

    return res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера.",
      code: "INTERNAL_ERROR",
    });
  }
});

app.post("/api/quiz-contact", rateLimitMiddleware, async (req, res) => {
  const name = normalizeName(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  const ip = getClientIp(req);
  const userAgent = String(req.headers["user-agent"] || "");

  if (!isValidName(name) || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Проверьте корректность введенных данных.",
      code: "VALIDATION_ERROR",
    });
  }

  await safeAppendLog(
    buildLogRecord({ name, email, enteredWord: "QUIZ_CONTACT", ip, userAgent }, {
      result: "quiz_contact",
      error_message: "",
    })
  );

  return res.status(200).json({
    success: true,
    message: "Данные приняты.",
    code: "QUIZ_CONTACT_SAVED",
  });
});

app.get("/public", (_req, res) => {
  res.redirect(301, "/");
});

app.get("/public/index.html", (_req, res) => {
  res.redirect(301, "/");
});

app.get("/rules.html", (_req, res) => {
  res.redirect(301, "/rules");
});

app.get("/manager", (_req, res) => {
  res.setHeader("Cache-Control", "no-cache, must-revalidate");
  res.sendFile(path.join(config.publicDir, "manager", "index.html"));
});

app.get("/public/manager", (_req, res) => {
  res.redirect(301, "/manager");
});

app.get("/public/manager/index.html", (_req, res) => {
  res.redirect(301, "/manager");
});

app.get("/public/rules", (_req, res) => {
  res.redirect(301, "/rules");
});

app.get("/public/rules.html", (_req, res) => {
  res.redirect(301, "/rules");
});

app.get("/rules", (_req, res) => {
  res.setHeader("Cache-Control", "no-cache, must-revalidate");
  res.sendFile(path.join(config.publicDir, "rules", "index.html"));
});

app.use(express.static(config.publicDir, {
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
    }
  },
}));

app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Маршрут API не найден.",
    code: "NOT_FOUND",
  });
});

app.use((_req, res) => {
  res.status(404).send("Not found");
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`[server] Running on http://localhost:${config.port}`);
    if (!config.validCodeWords.length) {
      console.warn("[server] VALID_CODE_WORDS is empty. All requests will be rejected as INVALID_WORD.");
    }
  });
}

module.exports = app;
