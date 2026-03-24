const fs = require("fs/promises");
const path = require("path");
const config = require("./config");

const QUIZ_CONFIG_FILE = path.join(config.publicDir, "assets", "data", "quiz-data.json");
const QUIZ_CONFIG_TEMP_FILE = path.join(config.publicDir, "assets", "data", "quiz-data.tmp.json");

const MAX_QUESTION_COUNT = 50;
const MAX_OPTIONS_COUNT = 8;

let writeQueue = Promise.resolve();

const withWriteQueue = async (handler) => {
  const previous = writeQueue.catch(() => undefined);
  let release = () => undefined;

  writeQueue = new Promise((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await handler();
  } finally {
    release();
  }
};

const createValidationError = (message) => {
  const error = new Error(message);
  error.code = "QUIZ_CONFIG_VALIDATION_ERROR";
  return error;
};

const stripBom = (value) => String(value ?? "").replace(/^\uFEFF/, "");

const ensureQuizDataDir = async () => {
  await fs.mkdir(path.dirname(QUIZ_CONFIG_FILE), { recursive: true });
};

const validateStringField = (value, fieldName, { minLength = 1, maxLength = 20_000 } = {}) => {
  if (typeof value !== "string") {
    throw createValidationError(`${fieldName} must be a string.`);
  }

  const normalized = value.trim();
  if (normalized.length < minLength) {
    throw createValidationError(`${fieldName} is required.`);
  }

  if (normalized.length > maxLength) {
    throw createValidationError(`${fieldName} is too long.`);
  }

  return normalized;
};

const validateQuestion = (entry, index) => {
  const number = index + 1;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw createValidationError(`Question #${number} must be an object.`);
  }

  const question = validateStringField(entry.question, `questions[${index}].question`, {
    minLength: 3,
    maxLength: 500,
  });
  const paginationTitle = validateStringField(
    typeof entry.paginationTitle === "string" ? entry.paginationTitle : question,
    `questions[${index}].paginationTitle`,
    { minLength: 3, maxLength: 500 }
  );

  if (!Array.isArray(entry.options)) {
    throw createValidationError(`questions[${index}].options must be an array.`);
  }

  const options = entry.options
    .map((option, optionIndex) => validateStringField(option, `questions[${index}].options[${optionIndex}]`, { maxLength: 500 }))
    .filter(Boolean);

  if (options.length < 2) {
    throw createValidationError(`Question #${number} must have at least two options.`);
  }

  if (options.length > MAX_OPTIONS_COUNT) {
    throw createValidationError(`Question #${number} has too many options.`);
  }

  if (!Number.isInteger(entry.correct)) {
    throw createValidationError(`questions[${index}].correct must be an integer.`);
  }

  if (entry.correct < 0 || entry.correct >= options.length) {
    throw createValidationError(`questions[${index}].correct is out of range.`);
  }

  const legacyFactSource =
    typeof entry.feedbackCorrect === "string" && entry.feedbackCorrect.trim()
      ? entry.feedbackCorrect
      : typeof entry.feedbackWrong === "string" && entry.feedbackWrong.trim()
        ? entry.feedbackWrong
        : "";
  const factSource = typeof entry.fact === "string" && entry.fact.trim() ? entry.fact : legacyFactSource;

  const fact = validateStringField(factSource, `questions[${index}].fact`, {
    minLength: 3,
    maxLength: 4_000,
  });

  const sourceImage = entry.image && typeof entry.image === "object" && !Array.isArray(entry.image) ? entry.image : null;
  if (!sourceImage) {
    throw createValidationError(`questions[${index}].image must be an object.`);
  }

  const image = {
    src: validateStringField(sourceImage.src, `questions[${index}].image.src`, {
      minLength: 1,
      maxLength: 500,
    }),
    alt: validateStringField(sourceImage.alt, `questions[${index}].image.alt`, {
      minLength: 1,
      maxLength: 500,
    }),
  };

  return {
    question,
    paginationTitle,
    options,
    correct: entry.correct,
    fact,
    image,
  };
};

const normalizeQuizConfig = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw createValidationError("Quiz config must be an object.");
  }

  const labelsSource = input.labels && typeof input.labels === "object" && !Array.isArray(input.labels) ? input.labels : null;
  if (!labelsSource) {
    throw createValidationError("labels must be an object.");
  }

  const resultSummariesSource =
    input.resultSummaries && typeof input.resultSummaries === "object" && !Array.isArray(input.resultSummaries)
      ? input.resultSummaries
      : null;
  if (!resultSummariesSource) {
    throw createValidationError("resultSummaries must be an object.");
  }

  if (!Array.isArray(input.questions)) {
    throw createValidationError("questions must be an array.");
  }

  if (!input.questions.length) {
    throw createValidationError("At least one question is required.");
  }

  if (input.questions.length > MAX_QUESTION_COUNT) {
    throw createValidationError(`Too many questions. Max allowed: ${MAX_QUESTION_COUNT}.`);
  }

  const questions = input.questions.map((entry, index) => validateQuestion(entry, index));

  return {
    codeWord: validateStringField(input.codeWord, "codeWord", { minLength: 1, maxLength: 120 }),
    labels: {
      correct: validateStringField(labelsSource.correct, "labels.correct", { minLength: 1, maxLength: 300 }),
      wrong: validateStringField(labelsSource.wrong, "labels.wrong", { minLength: 1, maxLength: 300 }),
    },
    resultSummaries: {
      high: validateStringField(resultSummariesSource.high, "resultSummaries.high", { minLength: 3, maxLength: 2_000 }),
      medium: validateStringField(resultSummariesSource.medium, "resultSummaries.medium", {
        minLength: 3,
        maxLength: 2_000,
      }),
      low: validateStringField(resultSummariesSource.low, "resultSummaries.low", { minLength: 3, maxLength: 2_000 }),
    },
    questions,
  };
};

const readQuizConfig = async () => {
  await ensureQuizDataDir();

  let raw;
  try {
    raw = await fs.readFile(QUIZ_CONFIG_FILE, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      const notFoundError = new Error("Quiz config file was not found.");
      notFoundError.code = "QUIZ_CONFIG_FILE_NOT_FOUND";
      throw notFoundError;
    }
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(stripBom(raw));
  } catch (error) {
    const parseError = new Error("Quiz config JSON is invalid.");
    parseError.code = "QUIZ_CONFIG_JSON_INVALID";
    throw parseError;
  }

  const quizConfig = normalizeQuizConfig(parsed);
  const stat = await fs.stat(QUIZ_CONFIG_FILE);

  return {
    quizConfig,
    updatedAt: stat.mtime.toISOString(),
  };
};

const writeQuizConfig = async (incomingConfig) =>
  withWriteQueue(async () => {
    const quizConfig = normalizeQuizConfig(incomingConfig);
    await ensureQuizDataDir();

    const payload = `${JSON.stringify(quizConfig, null, 2)}\n`;
    await fs.writeFile(QUIZ_CONFIG_TEMP_FILE, payload, "utf8");
    await fs.rm(QUIZ_CONFIG_FILE, { force: true });
    await fs.rename(QUIZ_CONFIG_TEMP_FILE, QUIZ_CONFIG_FILE);

    const stat = await fs.stat(QUIZ_CONFIG_FILE);
    return {
      quizConfig,
      updatedAt: stat.mtime.toISOString(),
    };
  });

module.exports = {
  QUIZ_CONFIG_FILE,
  readQuizConfig,
  writeQuizConfig,
  normalizeQuizConfig,
};
