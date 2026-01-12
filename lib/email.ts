import { Resend } from "resend";

const resend = new Resend(process.env.EMAIL_API_KEY);

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
  if (!process.env.EMAIL_API_KEY) {
    console.warn("EMAIL_API_KEY not set, skipping email send");
    return { success: false, error: "Email service not configured" };
  }

  try {
    // Resend requires at least html or text
    if (!html && !text) {
      throw new Error("Either html or text must be provided");
    }

    const emailData: any = {
      from: process.env.EMAIL_FROM || "noreply@jobportal.com",
      to,
      subject,
    };

    if (html) {
      emailData.html = html;
    }
    if (text) {
      emailData.text = text;
    }

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }

    return { success: true, data };
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

