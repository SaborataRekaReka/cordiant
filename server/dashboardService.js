const { readRequestLog } = require("./csvLogger");
const { readPromocodeQueue } = require("./storage");

const toInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getPromocodeRemaining = async () => {
  try {
    const queue = await readPromocodeQueue();
    return queue.length;
  } catch (_error) {
    return 0;
  }
};

const getDashboardSummary = async () => {
  const requests = await readRequestLog();
  const remainingPromocodes = await getPromocodeRemaining();

  const sentCount = requests.filter((item) => item.result === "success").length;
  const errorCount = requests.filter((item) => item.result !== "success").length;
  const noPromocodesCount = requests.filter((item) =>
    String(item.error_message || "").startsWith("NO_PROMOCODES")
  ).length;
  const invalidWordCount = requests.filter((item) =>
    String(item.error_message || "").startsWith("INVALID_WORD")
  ).length;
  const mailSendFailedCount = requests.filter((item) =>
    String(item.error_message || "").startsWith("MAIL_SEND_FAILED")
  ).length;
  const totalPromocodes = remainingPromocodes + sentCount;

  return {
    totalPromocodes,
    remainingPromocodes,
    sentPromocodes: sentCount,
    totalRequests: requests.length,
    errorRequests: errorCount,
    invalidWordCount,
    mailSendFailedCount,
    noPromocodesCount,
    updatedAt: new Date().toISOString(),
  };
};

const getDashboardRequests = async (limit = 200) => {
  const safeLimit = Math.min(1000, Math.max(1, toInteger(limit, 200)));
  const requests = await readRequestLog();
  return requests.slice(-safeLimit).reverse();
};

module.exports = {
  getDashboardSummary,
  getDashboardRequests,
};
