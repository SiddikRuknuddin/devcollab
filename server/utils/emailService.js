const nodemailer = require("nodemailer");

/**
 * Create a reusable nodemailer transporter from environment variables.
 * Falls back gracefully if email env vars are not configured.
 */
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send an email verification link to the user.
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Raw (unhashed) verification token
 * @returns {Promise<boolean>} true if sent, false if skipped
 */
const sendVerificationEmail = async (email, name, token) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(
      "⚠️  Email service not configured — skipping verification email. " +
      "Set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in server/.env"
    );
    return false;
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationLink = `${frontendUrl}/verify-email/${token}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email — DevCollab</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:30px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                DevCollab
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">Developer Collaboration Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:600;">
                Verify your email address
              </h2>
              <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
                Thanks for signing up! Please verify your email address to activate your DevCollab account and start collaborating with developers.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${verificationLink}"
                   style="display:inline-block;padding:14px 36px;background:#1d4ed8;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                  Verify Email Address
                </a>
              </div>

              <p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${verificationLink}" style="color:#1d4ed8;font-size:13px;">${verificationLink}</a>
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This link expires in <strong>24 hours</strong>. If you did not create a DevCollab account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} DevCollab · Developer Collaboration Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `DevCollab <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email — DevCollab",
      html,
    });
    return true;
  } catch (err) {
    console.error("Email send error:", err.message);
    return false;
  }
};

module.exports = { sendVerificationEmail };
