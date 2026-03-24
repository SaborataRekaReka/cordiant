const fs = require("fs/promises");
const path = require("path");
const config = require("./config");

const SUCCESS_TEMPLATE_FILE = "Кодовое слово для покупки шин Cordiant с повышенным кешбэком введено верно.md";
const ERROR_TEMPLATE_FILE = "Кодовое слово для покупки шин Cordiant с повышенным кешбэком введено с ошибкой.md";

const SUCCESS_SUBJECT = "Ваш промокод Cordiant";
const ERROR_SUBJECT = "Кодовое слово не принято";

const readTemplate = async (fileName) => {
  const filePath = path.join(config.emailsDir, fileName);
  return fs.readFile(filePath, "utf8");
};

const writeTemplate = async (fileName, content) => {
  const filePath = path.join(config.emailsDir, fileName);
  await fs.writeFile(filePath, String(content ?? ""), "utf8");
};

const renderSuccessTemplate = async (promocode) => {
  const template = await readTemplate(SUCCESS_TEMPLATE_FILE);
  return template.replaceAll("[promocode]", promocode);
};

const renderErrorTemplate = async () => {
  return readTemplate(ERROR_TEMPLATE_FILE);
};

const getEditableTemplates = async () => {
  const [successTemplate, errorTemplate] = await Promise.all([
    readTemplate(SUCCESS_TEMPLATE_FILE),
    readTemplate(ERROR_TEMPLATE_FILE),
  ]);

  return {
    successTemplate,
    errorTemplate,
    successSubject: SUCCESS_SUBJECT,
    errorSubject: ERROR_SUBJECT,
  };
};

const updateEditableTemplates = async ({ successTemplate, errorTemplate }) => {
  await Promise.all([
    writeTemplate(SUCCESS_TEMPLATE_FILE, successTemplate),
    writeTemplate(ERROR_TEMPLATE_FILE, errorTemplate),
  ]);
};

module.exports = {
  SUCCESS_SUBJECT,
  ERROR_SUBJECT,
  renderSuccessTemplate,
  renderErrorTemplate,
  getEditableTemplates,
  updateEditableTemplates,
};
