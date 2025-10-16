// utils/emailTemplate.ts

const APP_NAME = "Quizzy";
const SUPPORT_EMAIL = "support@quizzy.app";
const LOGO_URL = "https://your-cdn.example.com/quizzy-logo.png";

type EmailTemplate = {
    subject: string;
    text: string;
    html: string;
};

/**
 * Generate email verification template for new users
 * Used in createAccount() to send verification links
 */
export const getVerifiedEmailTemplate = (verifyLink: string): EmailTemplate => {
    const subject = `${APP_NAME} - Verify Your Email`;

    const text = `Welcome to ${APP_NAME}!

Please verify your email address by clicking the link below:
${verifyLink}

If you didn’t create an account, ignore this email or contact ${SUPPORT_EMAIL}.

– The ${APP_NAME} Team`;

    const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <img src="${LOGO_URL}" alt="${APP_NAME} logo" style="width:100px;height:auto;margin-bottom:16px;" />
      <h2>Welcome to ${APP_NAME}! 👋</h2>
      <p>Please verify your email address to activate your account:</p>

      <a href="${verifyLink}"
         style="display:inline-block;padding:12px 20px;background:#007bff;color:#fff;
         text-decoration:none;border-radius:6px;font-weight:600;">
         Verify Email
      </a>

      <p style="margin-top:16px;font-size:14px;color:#555;">
        If the button doesn’t work, copy and paste this link:
        <br />
        <a href="${verifyLink}" style="color:#007bff;word-break:break-all;">${verifyLink}</a>
      </p>

      <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#777;">
        Didn’t sign up for ${APP_NAME}? Ignore this email or contact us at ${SUPPORT_EMAIL}.
      </p>
    </div>
  </div>`;

    return { subject, text, html };
};

/**
 * Generate password reset email template for users who forgot passwords
 */
export const getPasswordResetTemplate = (resetLink: string): EmailTemplate => {
    const subject = `${APP_NAME} - Reset Your Password`;

    const text = `We received a request to reset your ${APP_NAME} password.

Click the link below to set a new password:
${resetLink}

If you didn’t request this, please ignore this message or contact ${SUPPORT_EMAIL}.

– The ${APP_NAME} Team`;

    const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <img src="${LOGO_URL}" alt="${APP_NAME} logo" style="width:100px;height:auto;margin-bottom:16px;" />
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your ${APP_NAME} password.</p>

      <a href="${resetLink}"
         style="display:inline-block;padding:12px 20px;background:#28a745;color:#fff;
         text-decoration:none;border-radius:6px;font-weight:600;">
         Reset Password
      </a>

      <p style="margin-top:16px;font-size:14px;color:#555;">
        If the button doesn’t work, copy and paste this link:
        <br />
        <a href="${resetLink}" style="color:#28a745;word-break:break-all;">${resetLink}</a>
      </p>

      <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#777;">
        Didn’t request this? Ignore this email or contact ${SUPPORT_EMAIL}.
      </p>
    </div>
  </div>`;

    return { subject, text, html };
};
