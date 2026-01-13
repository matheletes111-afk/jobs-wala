import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.MAIL_PORT || "587"),
      secure: process.env.MAIL_ENCRYPTION === "ssl", // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.warn("Email configuration not set, skipping email send");
      return { success: false, error: "Email service not configured" };
    }

    // Nodemailer requires at least html or text
    if (!html && !text) {
      throw new Error("Either html or text must be provided");
    }

    const mailOptions = {
      from: `${process.env.MAIL_FROM_NAME || "KORA"} <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME}>`,
      to,
      subject,
      html: html || undefined,
      text: text || undefined,
    };

    const info = await mailTransporter.sendMail(mailOptions);

    return { success: true, data: info };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

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

