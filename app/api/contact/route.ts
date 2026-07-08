import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

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
    if (name.trim().length < 3 || !/^[a-zA-Z\s]+$/.test(name)) {
      return NextResponse.json(
        { error: "Name must be at least 3 characters and contain only letters and spaces." },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const digitCount = mobile.replace(/[^0-9]/g, "").length;
    if (!/^\+?[0-9\s\-\(\)]+$/.test(mobile) || digitCount < 10 || digitCount > 15) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number (10 to 15 digits)." },
        { status: 400 }
      );
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters long." },
        { status: 400 }
      );
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563; width: 120px;">Name:</td>
            <td style="padding: 8px 0; color: #1f2937;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Email:</td>
            <td style="padding: 8px 0; color: #1f2937;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Mobile:</td>
            <td style="padding: 8px 0; color: #1f2937;">${mobile}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Subject:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${subject}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;">
          <p style="margin-top: 0; font-weight: bold; color: #4b5563;">Message:</p>
          <p style="margin-bottom: 0; color: #1f2937; white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>
        <p style="margin-top: 30px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          Submitted via JobDaddy Contact Form at ${new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })} IST
        </p>
      </div>
    `;

    const mailResponse = await sendEmail({
      to: "Info@jobdaddy.in",
      subject: `New Contact Submission: ${subject} - from ${name}`,
      html: htmlContent,
    });

    if (!mailResponse.success) {
      console.error("Failed to send contact email:", "error" in mailResponse ? mailResponse.error : "Unknown error");
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Contact API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
