import { Resend } from "resend";

/**
 * Initialize Resend client - only create if API key is available
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Base email sending function using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn("RESEND_API_KEY not set, skipping email send");
      return { success: false, error: "Email service not configured" };
    }

    // Resend requires at least html or text
    if (!html && !text) {
      throw new Error("Either html or text must be provided");
    }

    // Use the from address from env or default domain from Resend
    const fromAddress =
      from ||
      process.env.RESEND_FROM_EMAIL ||
      `${process.env.MAIL_FROM_NAME || "KORA"} <${process.env.RESEND_FROM_ADDRESS || "onboarding@resend.dev"}>`;

    // Build email options - ensure at least html or text is present
    const emailOptions: {
      from: string;
      to: string;
      subject: string;
      html: string;
      text?: string;
    } | {
      from: string;
      to: string;
      subject: string;
      text: string;
      html?: string;
    } = html
      ? {
          from: fromAddress,
          to,
          subject,
          html,
          ...(text && { text }),
        }
      : {
          from: fromAddress,
          to,
          subject,
          text: text!,
        };

    const result = await resend.emails.send(emailOptions);

    if (result.error) {
      console.error("Resend API error:", result.error);
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

/**
 * Send application status update notification to job seeker
 */
export async function sendApplicationNotificationEmail({
  to,
  jobTitle,
  companyName,
  status,
}: {
  to: string;
  jobTitle: string;
  companyName: string;
  status: string;
}) {
  const subject = `Application Update: ${jobTitle} at ${companyName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Application Status Update</h2>
      <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
      <p><strong>Status:</strong> ${status}</p>
      <p>Thank you for your interest!</p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Send new application notification to employer
 */
export async function sendNewApplicationEmail({
  to,
  candidateName,
  jobTitle,
}: {
  to: string;
  candidateName: string;
  jobTitle: string;
}) {
  const subject = `New Application: ${jobTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Job Application</h2>
      <p><strong>${candidateName}</strong> has applied for the position: <strong>${jobTitle}</strong></p>
      <p>Please review the application in your employer dashboard.</p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail({
  to,
  verificationLink,
  name,
}: {
  to: string;
  verificationLink: string;
  name?: string;
}) {
  const subject = "Verify Your Email Address - KORA";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h2 style="color: #333; margin-bottom: 20px;">Email Verification Required</h2>
        <p style="color: #666; line-height: 1.6;">
          ${name ? `Hi ${name},` : "Hi there,"}
        </p>
        <p style="color: #666; line-height: 1.6;">
          Thank you for registering with KORA! Please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="color: #007bff; word-break: break-all; font-size: 12px;">
          ${verificationLink}
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours. If you didn't create an account, please ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}
