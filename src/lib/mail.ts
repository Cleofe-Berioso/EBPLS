import nodemailer from "nodemailer";

// Initialize transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using Gmail SMTP
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD environment variables
 */
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  // Validate environment variables
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error(
      "Gmail SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables."
    );
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email. Please try again later.");
  }
}

/**
 * Generate password reset OTP email HTML
 */
export function generatePasswordResetEmailHtml(
  otp: string,
  expirationMinutes: number
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .card {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #0b8754;
            padding-bottom: 15px;
          }
          .header h1 {
            margin: 0;
            color: #0b8754;
            font-size: 24px;
          }
          .otp-box {
            background-color: #e8f5e9;
            border: 2px solid #0b8754;
            border-radius: 6px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #0b8754;
            font-family: 'Courier New', monospace;
          }
          .info {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
          }
          .warning {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>eBPPS Password Reset</h1>
            </div>
            
            <p>Hello,</p>
            
            <p>We received a request to reset your eBPPS account password. Use the OTP code below to proceed with your password reset:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="info">
              <strong>⏱️ Valid for ${expirationMinutes} minutes</strong>
            </div>
            
            <p style="margin: 15px 0;">
              <strong>Important security notes:</strong>
            </p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Never share this code with anyone</li>
              <li>eBPPS staff will never ask for this code</li>
              <li>After ${expirationMinutes} minutes, this code will expire</li>
              <li>If you did not request this, please ignore this email and your account remains secure</li>
            </ul>
            
            <div class="warning">
              <strong>⚠️ Did not request this?</strong><br>
              If you did not request a password reset, no action is needed. Your account is safe and this code cannot be used without your confirmation.
            </div>
            
              <p style="margin: 20px 0; font-size: 14px; color: #666;">
              For security reasons, do not reply to this email. If you need help, contact eBPPS support directly.
            </p>
            
            <div class="footer">
              <p>© 2026 eBPPS. All rights reserved.</p>
              <p>This is an automated message - please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
