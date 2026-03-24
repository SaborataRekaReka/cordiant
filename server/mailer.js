const nodemailer = require("nodemailer");
const config = require("./config");

let transporter = null;

const buildFromHeader = () => {
  if (!config.smtp.fromName) return config.smtp.from;
  const escaped = config.smtp.fromName.replace(/"/g, '\\"');
  return `"${escaped}" <${config.smtp.from}>`;
};

const getTransporter = () => {
  if (transporter) return transporter;

  if (!config.smtp.host || !config.smtp.port || !config.smtp.from) {
    const error = new Error("SMTP is not fully configured");
    error.code = "SMTP_NOT_CONFIGURED";
    throw error;
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user
      ? {
          user: config.smtp.user,
          pass: config.smtp.pass,
        }
      : undefined,
  });

  return transporter;
};

const sendHtmlEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();
  await transport.sendMail({
    from: buildFromHeader(),
    to,
    subject,
    html,
  });
};

module.exports = {
  sendHtmlEmail,
};
