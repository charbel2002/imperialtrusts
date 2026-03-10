import nodemailer from "nodemailer";
import { getPlatformSettings } from "@/lib/platform";

// ---------------------------------------------------------------------------
// Transporter (created lazily, cached for the process lifetime)
// ---------------------------------------------------------------------------

let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT) || 1025,
    secure: Number(process.env.SMTP_PORT) === 465,
    ...(process.env.SMTP_USER && process.env.SMTP_PASS
      ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
      : {}),
  });

  return _transporter;
}

// ---------------------------------------------------------------------------
// Low-level send helper
// ---------------------------------------------------------------------------

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const platform = await getPlatformSettings();

  try {
    await getTransporter().sendMail({
      from: `"${platform.mailName}" <${process.env.MAIL_FROM || platform.mailFrom}>`,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });
  } catch (err) {
    // Log but never let email failures break the main flow
    console.error("[email] Failed to send:", err);
  }
}

// ---------------------------------------------------------------------------
// Shared HTML wrapper
// ---------------------------------------------------------------------------

async function wrapHtml(body: string): Promise<string> {
  const platform = await getPlatformSettings();

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">${platform.name}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;color:#94a3b8;font-size:12px;text-align:center;">
            ${platform.name} &middot; ${platform.address}<br/>
            ${platform.email} &middot; ${platform.phone}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Loan-specific email helpers
// ---------------------------------------------------------------------------

/** Sent to the user right after they submit a loan application */
export async function sendLoanApplicationConfirmation(opts: {
  to: string;
  amount: number;
  durationMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalRepayment: number;
}) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">Loan Application Received</h2>
    <p style="color:#475569;line-height:1.6;">
      Thank you for your application. We have received it and our team will review it shortly.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Amount Requested</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">$${opts.amount.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Duration</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.durationMonths} months</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Interest Rate</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.interestRate}%</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Monthly Payment</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">$${opts.monthlyPayment.toFixed(2)}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">Total Repayment</td>
        <td style="font-weight:600;text-align:right;">$${opts.totalRepayment.toFixed(2)}</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">
      You will receive another email once a decision has been made. If you have questions in the meantime, feel free to contact us.
    </p>
  `);

  await sendEmail({
    to: opts.to,
    subject: "Loan Application Received",
    html,
  });
}

/** Sent to the admin when a new loan application comes in */
export async function sendLoanApplicationAdminNotice(opts: {
  applicantEmail: string;
  amount: number;
  durationMonths: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return; // no admin email configured – skip silently

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">New Loan Application</h2>
    <p style="color:#475569;line-height:1.6;">
      A new loan application has been submitted and is awaiting review.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Applicant</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.applicantEmail}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Amount</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">$${opts.amount.toFixed(2)}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">Duration</td>
        <td style="font-weight:600;text-align:right;">${opts.durationMonths} months</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">
      Please log in to the admin panel to review and take action.
    </p>
  `);

  await sendEmail({
    to: adminEmail,
    subject: `New Loan Application – $${opts.amount.toFixed(2)}`,
    html,
  });
}

/** Sent to the applicant when their loan is approved */
export async function sendLoanApprovedEmail(opts: {
  to: string;
  amount: number;
  durationMonths: number;
  monthlyPayment: number;
  disbursed: boolean;
}) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#16a34a;">Loan Application Approved</h2>
    <p style="color:#475569;line-height:1.6;">
      Great news! Your loan application has been <strong>approved</strong>.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Amount</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">$${opts.amount.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Duration</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.durationMonths} months</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">Monthly Payment</td>
        <td style="font-weight:600;text-align:right;">$${opts.monthlyPayment.toFixed(2)}</td>
      </tr>
    </table>
    ${opts.disbursed
      ? '<p style="color:#16a34a;font-weight:600;">The funds have been disbursed to your account.</p>'
      : '<p style="color:#475569;">Please contact us for the next steps regarding fund disbursement.</p>'
    }
  `);

  await sendEmail({
    to: opts.to,
    subject: "Your Loan Has Been Approved",
    html,
  });
}

/** Sent to the applicant when their loan is rejected */
export async function sendLoanRejectedEmail(opts: {
  to: string;
  amount: number;
  reason: string;
}) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#dc2626;">Loan Application Update</h2>
    <p style="color:#475569;line-height:1.6;">
      We regret to inform you that your loan application for <strong>$${opts.amount.toFixed(2)}</strong>
      was not approved at this time.
    </p>
    <div style="margin:20px 0;padding:16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
      <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Reason:</strong> ${opts.reason}</p>
    </div>
    <p style="color:#475569;line-height:1.6;">
      If you believe this decision was made in error, or you would like to discuss alternatives, please contact our support team.
    </p>
  `);

  await sendEmail({
    to: opts.to,
    subject: "Loan Application Update",
    html,
  });
}
