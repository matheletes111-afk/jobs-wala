import { Resend } from "resend";
import sgMail from "@sendgrid/mail";

/**
 * Email service configuration
 * Priority: RESEND_API_KEY > SENDGRID_API_KEY
 */
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || "resend"; // "resend" or "sendgrid"

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
 * Initialize SendGrid client
 */
function getSendGridClient() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return null;
  }
  sgMail.setApiKey(apiKey);
  return sgMail;
}

/**
 * Send email using Resend
 */
async function sendEmailWithResend({
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
  const resend = getResendClient();
  if (!resend) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const fromAddress =
    from ||
    process.env.RESEND_FROM_EMAIL ||
    `${process.env.MAIL_FROM_NAME || "KORA"} <${process.env.RESEND_FROM_ADDRESS || "onboarding@resend.dev"}>`;

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
    throw result.error;
  }

  return { success: true, data: result.data };
}

/**
 * Send email using SendGrid
 */
async function sendEmailWithSendGrid({
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
  const sendgrid = getSendGridClient();
  if (!sendgrid) {
    throw new Error("SENDGRID_API_KEY not configured");
  }

  // SendGrid requires a verified sender email
  // Priority: from param > SENDGRID_FROM_EMAIL > MAIL_FROM_ADDRESS > fallback
  const fromAddress =
    from ||
    process.env.SENDGRID_FROM_EMAIL ||
    process.env.MAIL_FROM_ADDRESS;

  if (!fromAddress) {
    throw new Error(
      "SENDGRID_FROM_EMAIL or MAIL_FROM_ADDRESS must be set. " +
      "You need to verify a sender email in SendGrid first. " +
      "Visit: https://app.sendgrid.com/settings/sender_auth/senders/new"
    );
  }

  const fromName = process.env.MAIL_FROM_NAME || "KORA";

  console.log("[EMAIL DEBUG] SendGrid from address:", fromAddress);
  console.log("[EMAIL DEBUG] SendGrid from name:", fromName);

  // SendGrid format - ensure we have html or text
  const msg: {
    to: string;
    from: string;
    subject: string;
    html?: string;
    text?: string;
  } = {
    to,
    from: fromAddress,
    subject,
  };

  if (html) {
    msg.html = html;
  }
  if (text) {
    msg.text = text;
  }

  // Ensure at least one content type
  if (!msg.html && !msg.text) {
    throw new Error("Either html or text must be provided");
  }

  const result = await sendgrid.send(msg as Parameters<typeof sendgrid.send>[0]);
  return { success: true, data: result[0] };
}

/**
 * Base email sending function with automatic fallback
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
  console.log("[EMAIL DEBUG] Starting sendEmail function");
  console.log("[EMAIL DEBUG] Recipient:", to);
  console.log("[EMAIL DEBUG] Subject:", subject);
  console.log("[EMAIL DEBUG] Has HTML:", !!html);
  console.log("[EMAIL DEBUG] Has Text:", !!text);
  console.log("[EMAIL DEBUG] Email service preference:", EMAIL_SERVICE);

  // Resend requires at least html or text
  if (!html && !text) {
    console.error("[EMAIL DEBUG] ❌ Neither html nor text provided");
    return { success: false, error: "Either html or text must be provided" };
  }

  // Try Resend first (if configured and preferred)
  if (EMAIL_SERVICE === "resend" || (!process.env.SENDGRID_API_KEY && process.env.RESEND_API_KEY)) {
    console.log("[EMAIL DEBUG] Attempting to send via Resend...");
    try {
      const result = await sendEmailWithResend({ to, subject, html, text, from });
      console.log("[EMAIL DEBUG] ✅ Email sent successfully via Resend!");
      console.log("[EMAIL DEBUG] Email ID:", result.data?.id);
      return result;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[EMAIL DEBUG] ❌ Resend failed:", errorMsg);
      
      // Check if it's a domain verification error
      const errorMessage = errorMsg || JSON.stringify(error);
      const isDomainError = 
        errorMessage.includes("verification") ||
        errorMessage.includes("testing emails") ||
        errorMessage.includes("verify a domain");

      if (isDomainError && process.env.SENDGRID_API_KEY) {
        console.log("[EMAIL DEBUG] ⚠️ Resend domain error detected, falling back to SendGrid...");
        // Fallback to SendGrid
      } else {
        // If no SendGrid fallback, return the error
        if (!process.env.SENDGRID_API_KEY) {
          console.error("[EMAIL DEBUG] ❌ No fallback service available");
          return { success: false, error };
        }
        console.log("[EMAIL DEBUG] ⚠️ Resend failed, falling back to SendGrid...");
      }
    }
  }

  // Try SendGrid (if configured)
  if (EMAIL_SERVICE === "sendgrid" || process.env.SENDGRID_API_KEY) {
    console.log("[EMAIL DEBUG] Attempting to send via SendGrid...");
    try {
      const result = await sendEmailWithSendGrid({ to, subject, html, text, from });
      console.log("[EMAIL DEBUG] ✅ Email sent successfully via SendGrid!");
      console.log("[EMAIL DEBUG] Status code:", result.data?.statusCode);
      return result;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[EMAIL DEBUG] ❌ SendGrid failed:", errorMsg);
      const errorDetails = (error as { response?: { body?: unknown } })?.response?.body || error;
      console.error("[EMAIL DEBUG] Error details:", errorDetails);
    return { success: false, error };
  }
}

  // No email service configured
  console.error("[EMAIL DEBUG] ❌ No email service configured");
  return {
    success: false,
    error: "No email service configured. Please set RESEND_API_KEY or SENDGRID_API_KEY",
  };
}

/**
 * Send application status update notification to job seeker
 */
export async function sendApplicationNotificationEmail({
  to,
  jobTitle,
  companyName,
  status,
  candidateName,
}: {
  to: string;
  jobTitle: string;
  companyName: string;
  status: string;
  candidateName?: string;
}) {
  // Status-specific email templates
  const getStatusEmail = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    const name = candidateName || "there";

    switch (normalizedStatus) {
      case "SHORTLISTED":
        return {
          subject: `🎉 Congratulations! You've been shortlisted for ${jobTitle} at ${companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
              </div>
              <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">You've Been Shortlisted!</h2>
                <p style="color: #666; line-height: 1.6; font-size: 16px;">
                  Hi ${name},
                </p>
                <p style="color: #666; line-height: 1.6;">
                  Great news! Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been reviewed and you've been <strong style="color: #28a745;">shortlisted</strong>!
                </p>
                <p style="color: #666; line-height: 1.6;">
                  This means your qualifications and experience have impressed the hiring team. They will be in touch with you soon regarding the next steps in the hiring process.
                </p>
                <div style="background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #1976D2; font-weight: bold;">What's Next?</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                    Keep an eye on your email and dashboard for updates. The employer may contact you for interviews or additional information.
                  </p>
                </div>
                <p style="color: #666; line-height: 1.6;">
                  Best of luck with the next steps!
                </p>
                <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                  Best regards,<br>
                  <strong>The KORA Team</strong>
                </p>
              </div>
            </div>
          `,
        };

      case "REVIEWED":
        return {
          subject: `Application Update: ${jobTitle} at ${companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Application Under Review</h2>
                <p style="color: #666; line-height: 1.6; font-size: 16px;">
                  Hi ${name},
                </p>
                <p style="color: #666; line-height: 1.6;">
                  Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been <strong style="color: #ff9800;">reviewed</strong> by the hiring team.
                </p>
                <p style="color: #666; line-height: 1.6;">
                  The employer is currently evaluating all applications. You will be notified once a decision has been made regarding your candidacy.
                </p>
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #856404; font-weight: bold;">Status: Under Review</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                    Please continue to check your dashboard for updates on your application status.
                  </p>
                </div>
                <p style="color: #666; line-height: 1.6;">
                  Thank you for your patience and interest in this position.
                </p>
                <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                  Best regards,<br>
                  <strong>The KORA Team</strong>
                </p>
              </div>
            </div>
          `,
        };

      case "REJECTED":
        return {
          subject: `Update on your application for ${jobTitle} at ${companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Application Update</h2>
                <p style="color: #666; line-height: 1.6; font-size: 16px;">
                  Hi ${name},
                </p>
                <p style="color: #666; line-height: 1.6;">
                  Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.
                </p>
                <p style="color: #666; line-height: 1.6;">
                  After careful consideration, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current needs.
                </p>
                <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #721c24; font-weight: bold;">Application Status: Not Selected</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                    This decision was not easy, and we appreciate the time you took to apply.
                  </p>
                </div>
                <p style="color: #666; line-height: 1.6;">
                  We encourage you to continue exploring other opportunities on KORA. We wish you the best in your job search.
                </p>
                <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                  Best regards,<br>
                  <strong>The KORA Team</strong>
                </p>
              </div>
            </div>
          `,
        };

      case "PENDING":
      default:
        return {
          subject: `Application Received: ${jobTitle} at ${companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Application Status Update</h2>
                <p style="color: #666; line-height: 1.6; font-size: 16px;">
                  Hi ${name},
                </p>
                <p style="color: #666; line-height: 1.6;">
                  Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> is currently <strong style="color: #6c757d;">pending review</strong>.
                </p>
                <p style="color: #666; line-height: 1.6;">
                  The employer will review your application and update you on the status. You can track your application status in your dashboard.
                </p>
                <div style="background-color: #e2e3e5; border-left: 4px solid #6c757d; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #383d41; font-weight: bold;">Status: Pending Review</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                    We'll notify you as soon as there's an update on your application.
                  </p>
                </div>
                <p style="color: #666; line-height: 1.6;">
                  Thank you for your interest in this position!
                </p>
                <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                  Best regards,<br>
                  <strong>The KORA Team</strong>
                </p>
              </div>
    </div>
          `,
        };
    }
  };

  const emailContent = getStatusEmail(status);
  return sendEmail({ to, subject: emailContent.subject, html: emailContent.html });
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
