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
  applicantPhone: string;
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
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Phone / WhatsApp</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.applicantPhone}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Amount</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">€${opts.amount.toFixed(2)}</td>
      </tr>
      <tr>
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

// ---------------------------------------------------------------------------
// Auth email helpers
// ---------------------------------------------------------------------------

/** Welcome email sent to the user after registration */
export async function sendWelcomeEmail(opts: { to: string; name: string }) {
  const platform = await getPlatformSettings();
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">Welcome to ${platform.name}!</h2>
    <p style="color:#475569;line-height:1.6;">
      Hi <strong>${opts.name}</strong>, your account has been created successfully.
    </p>
    <p style="color:#475569;line-height:1.6;">
      To unlock all features — including transfers, cards, and beneficiary management — please complete your KYC verification from your dashboard.
    </p>
    <p style="color:#475569;line-height:1.6;">
      If you have any questions, don't hesitate to contact our support team.
    </p>
  `);

  await sendEmail({ to: opts.to, subject: `Welcome to ${platform.name}`, html });
}

/** Notify admin that a new user registered */
export async function sendNewUserAdminNotice(opts: { name: string; email: string }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">New User Registration</h2>
    <p style="color:#475569;line-height:1.6;">A new user has registered on the platform.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Name</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.name}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">Email</td>
        <td style="font-weight:600;text-align:right;">${opts.email}</td>
      </tr>
    </table>
  `);

  await sendEmail({ to: adminEmail, subject: `New User: ${opts.name}`, html });
}

// ---------------------------------------------------------------------------
// KYC email helpers
// ---------------------------------------------------------------------------

/** Sent to the user after they submit KYC documents */
export async function sendKycSubmittedEmail(opts: { to: string; name: string }) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">KYC Documents Received</h2>
    <p style="color:#475569;line-height:1.6;">
      Hi <strong>${opts.name}</strong>, we've received your identity verification documents and they are now under review.
    </p>
    <p style="color:#475569;line-height:1.6;">
      You'll receive another email once the review is complete. This typically takes 1–2 business days.
    </p>
  `);

  await sendEmail({ to: opts.to, subject: "KYC Documents Received", html });
}

/** Notify admin of a new KYC submission */
export async function sendKycSubmittedAdminNotice(opts: { userName: string; userEmail: string }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">New KYC Submission</h2>
    <p style="color:#475569;line-height:1.6;">A new KYC submission is awaiting review.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">User</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.userName}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">Email</td>
        <td style="font-weight:600;text-align:right;">${opts.userEmail}</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">Please log in to the admin panel to review.</p>
  `);

  await sendEmail({ to: adminEmail, subject: `New KYC Submission – ${opts.userName}`, html });
}

/** Sent to the user when their KYC is approved */
export async function sendKycApprovedEmail(opts: { to: string; name: string }) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#16a34a;">Identity Verified</h2>
    <p style="color:#475569;line-height:1.6;">
      Hi <strong>${opts.name}</strong>, your identity has been verified successfully!
    </p>
    <p style="color:#475569;line-height:1.6;">
      You now have full access to all banking features including transfers, cards, and beneficiary management.
    </p>
  `);

  await sendEmail({ to: opts.to, subject: "KYC Approved – Identity Verified", html });
}

/** Sent to the user when their KYC is rejected */
export async function sendKycRejectedEmail(opts: { to: string; name: string; reason: string }) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#dc2626;">KYC Verification Update</h2>
    <p style="color:#475569;line-height:1.6;">
      Hi <strong>${opts.name}</strong>, unfortunately your identity verification was not approved.
    </p>
    <div style="margin:20px 0;padding:16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
      <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Reason:</strong> ${opts.reason}</p>
    </div>
    <p style="color:#475569;line-height:1.6;">
      Please review the reason above and resubmit your documents from your dashboard.
    </p>
  `);

  await sendEmail({ to: opts.to, subject: "KYC Verification – Action Required", html });
}

// ---------------------------------------------------------------------------
// Transfer / Transaction email helpers
// ---------------------------------------------------------------------------

/** Sent to the user after they initiate a transfer */
export async function sendTransferInitiatedEmail(opts: {
  to: string;
  amount: string;
  beneficiaryName: string;
  reference: string;
}) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">Transfer Submitted</h2>
    <p style="color:#475569;line-height:1.6;">Your transfer has been submitted and is pending review.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Amount</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Recipient</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.beneficiaryName}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">Reference</td>
        <td style="font-weight:600;text-align:right;">${opts.reference}</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">You will be notified once your transfer is processed.</p>
  `);

  await sendEmail({ to: opts.to, subject: `Transfer Pending – ${opts.reference}`, html });
}

/** Sent to the user when admin approves their transfer */
export async function sendTransferApprovedEmail(opts: {
  to: string;
  amount: string;
  beneficiaryName: string;
  reference: string;
  hasLocks: boolean;
}) {
  const statusText = opts.hasLocks
    ? "approved but requires additional verification steps before completion"
    : "approved and completed";

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#16a34a;">Transfer Approved</h2>
    <p style="color:#475569;line-height:1.6;">Your transfer has been <strong>${statusText}</strong>.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Amount</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Recipient</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.beneficiaryName}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">Reference</td>
        <td style="font-weight:600;text-align:right;">${opts.reference}</td>
      </tr>
    </table>
    ${opts.hasLocks
      ? '<p style="color:#f59e0b;line-height:1.6;">Please log in to your dashboard to complete the required verification steps.</p>'
      : '<p style="color:#16a34a;font-weight:600;">The funds have been deducted from your account.</p>'
    }
  `);

  await sendEmail({ to: opts.to, subject: `Transfer Approved – ${opts.reference}`, html });
}

/** Sent to the user when admin rejects their transfer */
export async function sendTransferRejectedEmail(opts: {
  to: string;
  amount: string;
  beneficiaryName: string;
  reference: string;
  reason: string;
}) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#dc2626;">Transfer Rejected</h2>
    <p style="color:#475569;line-height:1.6;">Your transfer has been rejected.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Amount</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Recipient</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.beneficiaryName}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">Reference</td>
        <td style="font-weight:600;text-align:right;">${opts.reference}</td>
      </tr>
    </table>
    <div style="margin:20px 0;padding:16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
      <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Reason:</strong> ${opts.reason}</p>
    </div>
    <p style="color:#475569;line-height:1.6;">If you believe this was in error, please contact support.</p>
  `);

  await sendEmail({ to: opts.to, subject: `Transfer Rejected – ${opts.reference}`, html });
}

/** Sent to the user when their transfer completes (progress 100%) */
export async function sendTransferCompletedEmail(opts: {
  to: string;
  amount: string;
  beneficiaryName: string;
  reference: string;
}) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#16a34a;">Transfer Completed</h2>
    <p style="color:#475569;line-height:1.6;">Your transfer has been completed successfully.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Amount</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Recipient</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.beneficiaryName}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">Reference</td>
        <td style="font-weight:600;text-align:right;">${opts.reference}</td>
      </tr>
    </table>
    <p style="color:#16a34a;font-weight:600;">The funds have been deducted from your account.</p>
  `);

  await sendEmail({ to: opts.to, subject: `Transfer Complete – ${opts.reference}`, html });
}

// ---------------------------------------------------------------------------
// Account status / credit / debit email helpers
// ---------------------------------------------------------------------------

/** Sent to the user when their account status changes (locked, suspended, reactivated) */
export async function sendAccountStatusEmail(opts: {
  to: string;
  name: string;
  status: "LOCKED" | "SUSPENDED" | "ACTIVE";
}) {
  const config: Record<string, { color: string; title: string; message: string }> = {
    LOCKED: {
      color: "#dc2626",
      title: "Account Locked",
      message: "Your bank account has been locked by an administrator. You will not be able to perform transactions until it is unlocked. Please contact support for assistance.",
    },
    SUSPENDED: {
      color: "#dc2626",
      title: "Account Suspended",
      message: "Your bank account has been suspended pending review. All account operations are temporarily disabled. Please contact support for more information.",
    },
    ACTIVE: {
      color: "#16a34a",
      title: "Account Reactivated",
      message: "Your bank account has been reactivated. You can now perform transactions and access all account features normally.",
    },
  };

  const c = config[opts.status];

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:${c.color};">${c.title}</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${opts.name}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">${c.message}</p>
  `);

  await sendEmail({ to: opts.to, subject: c.title, html });
}

/** Sent to the user when admin credits their account */
export async function sendAccountCreditedEmail(opts: {
  to: string;
  name: string;
  amount: string;
  description: string;
}) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#16a34a;">Account Credited</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${opts.name}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">Your account has been credited.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Amount</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">Reason</td>
        <td style="font-weight:600;text-align:right;">${opts.description}</td>
      </tr>
    </table>
  `);

  await sendEmail({ to: opts.to, subject: "Account Credited", html });
}

/** Sent to the user when admin debits their account */
export async function sendAccountDebitedEmail(opts: {
  to: string;
  name: string;
  amount: string;
  description: string;
}) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#f59e0b;">Account Debited</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${opts.name}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">A debit has been applied to your account.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Amount</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">Reason</td>
        <td style="font-weight:600;text-align:right;">${opts.description}</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">If you have questions about this transaction, please contact support.</p>
  `);

  await sendEmail({ to: opts.to, subject: "Account Debited", html });
}

// ---------------------------------------------------------------------------
// Card email helpers
// ---------------------------------------------------------------------------

/** Sent to the user when they create a new card */
export async function sendCardCreatedEmail(opts: {
  to: string;
  cardType: string;
  lastFour: string;
}) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">New Card Created</h2>
    <p style="color:#475569;line-height:1.6;">Your new virtual card has been created successfully.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Card Type</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.cardType}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">Card Number</td>
        <td style="font-weight:600;text-align:right;">**** **** **** ${opts.lastFour}</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">You can manage your card from the Cards section of your dashboard.</p>
  `);

  await sendEmail({ to: opts.to, subject: `New ${opts.cardType} Card Created`, html });
}

/** Sent to the user when admin cancels their card */
export async function sendCardCancelledEmail(opts: {
  to: string;
  cardType: string;
  lastFour: string;
  balanceReturned: string | null;
}) {
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#dc2626;">Card Cancelled</h2>
    <p style="color:#475569;line-height:1.6;">
      Your <strong>${opts.cardType}</strong> card ending in <strong>${opts.lastFour}</strong> has been cancelled by an administrator.
    </p>
    ${opts.balanceReturned
      ? `<p style="color:#475569;line-height:1.6;"><strong>${opts.balanceReturned}</strong> has been returned to your bank account.</p>`
      : ""
    }
    <p style="color:#475569;line-height:1.6;">If you have questions, please contact support.</p>
  `);

  await sendEmail({ to: opts.to, subject: "Card Cancelled", html });
}

/** Sent to the user when admin freezes or unfreezes their card */
export async function sendCardFreezeToggleEmail(opts: {
  to: string;
  cardType: string;
  lastFour: string;
  frozen: boolean;
}) {
  const title = opts.frozen ? "Card Frozen" : "Card Reactivated";
  const color = opts.frozen ? "#f59e0b" : "#16a34a";
  const message = opts.frozen
    ? `Your <strong>${opts.cardType}</strong> card ending in <strong>${opts.lastFour}</strong> has been frozen by an administrator. You will not be able to use it until it is reactivated.`
    : `Your <strong>${opts.cardType}</strong> card ending in <strong>${opts.lastFour}</strong> has been reactivated by an administrator and is ready to use.`;

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:${color};">${title}</h2>
    <p style="color:#475569;line-height:1.6;">${message}</p>
    <p style="color:#475569;line-height:1.6;">If you have questions, please contact support.</p>
  `);

  await sendEmail({ to: opts.to, subject: title, html });
}

// ---------------------------------------------------------------------------
// Contact form email helpers
// ---------------------------------------------------------------------------

/** Sent to the visitor after they submit the contact form */
export async function sendContactConfirmationEmail(opts: {
  to: string;
  name: string;
  subject: string;
}) {
  const platform = await getPlatformSettings();
  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">We Received Your Message</h2>
    <p style="color:#475569;line-height:1.6;">
      Hi <strong>${opts.name}</strong>, thank you for reaching out to us.
    </p>
    <p style="color:#475569;line-height:1.6;">
      We've received your message regarding "<strong>${opts.subject}</strong>" and our team will get back to you as soon as possible.
    </p>
    <p style="color:#475569;line-height:1.6;">
      In the meantime, if your inquiry is urgent, feel free to call us at <strong>${platform.phone}</strong>.
    </p>
  `);

  await sendEmail({ to: opts.to, subject: `Message Received – ${opts.subject}`, html });
}

/** Forward the contact form message to the admin */
export async function sendContactFormToAdmin(opts: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">New Contact Form Message</h2>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">From</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.name} (${opts.email})</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">Subject</td>
        <td style="font-weight:600;text-align:right;">${opts.subject}</td>
      </tr>
    </table>
    <div style="margin:20px 0;padding:16px;background:#f8fafc;border-left:4px solid #3b82f6;border-radius:4px;">
      <p style="margin:0;color:#1e293b;font-size:14px;white-space:pre-wrap;">${opts.message}</p>
    </div>
    <p style="color:#475569;line-height:1.6;">Reply directly to <strong>${opts.email}</strong>.</p>
  `);

  await sendEmail({ to: adminEmail, subject: `Contact: ${opts.subject} – from ${opts.name}`, html });
}
