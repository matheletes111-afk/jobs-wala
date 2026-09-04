import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, email, mobile, subject, message } = await req.json();

    if (!name || !email || !mobile || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Server-side validations
    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanMobile = String(mobile).trim();
    const cleanSubject = String(subject || "General Inquiry").trim();
    const cleanMessage = String(message).trim();

    if (cleanName.length < 3 || !/^[a-zA-Z\s]+$/.test(cleanName)) {
      return NextResponse.json(
        { error: "Name must be at least 3 characters and contain only letters and spaces." },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const digitCount = cleanMobile.replace(/[^0-9]/g, "").length;
    if (!/^\+?[0-9\s\-\(\)]+$/.test(cleanMobile) || digitCount < 10 || digitCount > 15) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number (10 to 15 digits)." },
        { status: 400 }
      );
    }

    if (cleanMessage.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters long." },
        { status: 400 }
      );
    }

    // 1. Permanently record inquiry in database (no lead is ever lost)
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        mobile: cleanMobile,
        subject: cleanSubject,
        message: cleanMessage,
        status: "NEW",
      },
    });

    // 2. Format HTML email notification
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 18px 24px; border-radius: 8px 8px 0 0; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff;">New Lead & Inquiry Submitted</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9; color: #ffffff;">Inquiry ID: #${inquiry.id.slice(-8).toUpperCase()}</p>
        </div>
        <div style="padding: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563; width: 120px;">Name:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${cleanName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Email:</td>
              <td style="padding: 8px 0; color: #1f2937;"><a href="mailto:${cleanEmail}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${cleanEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Mobile:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;"><a href="tel:${cleanMobile}" style="color: #16a34a; text-decoration: none;">${cleanMobile}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Reason/Subject:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${cleanSubject}</td>
            </tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;">
            <p style="margin-top: 0; margin-bottom: 6px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Message / Requirements:</p>
            <p style="margin-bottom: 0; color: #1e293b; white-space: pre-wrap; line-height: 1.6; font-size: 14px;">${cleanMessage}</p>
          </div>
        </div>
        <p style="margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Submitted via JobDaddy Contact Form at ${new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })} IST • View in Admin Console under Inquiries.
        </p>
      </div>
    `;

    // 3. Send email to Info@jobdaddy.in
    try {
      await sendEmail({
        to: "Info@jobdaddy.in",
        subject: `[Lead] ${cleanSubject} - ${cleanName} (${cleanMobile})`,
        html: htmlContent,
      });
    } catch (emailErr) {
      console.error("[CONTACT-API] Failed to deliver notification email:", emailErr);
      // We don't fail the submission if email fails, because it's safely recorded in database
    }

    return NextResponse.json({ success: true, inquiryId: inquiry.id });
  } catch (error: any) {
    console.error("Contact API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
