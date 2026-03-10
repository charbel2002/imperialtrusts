import nodemailer from "nodemailer";
import { getPlatformSettings } from "@/lib/platform";
import { getDictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";

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
// Email dictionary helper
// ---------------------------------------------------------------------------

async function getEmailDict(lang: string): Promise<Record<string, any>> {
  const platform = await getPlatformSettings();
  const dict = await getDictionary((lang || "en") as Locale, platform);
  return (dict as any).emails || {};
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
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.loanConfirmation || {};

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">${t.heading || "Loan Application Received"}</h2>
    <p style="color:#475569;line-height:1.6;">
      ${t.body || "Thank you for your application. We have received it and our team will review it shortly."}
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.amountRequested || "Amount Requested"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">&euro;${opts.amount.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.duration || "Duration"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.durationMonths} ${t.months || "months"}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.interestRate || "Interest Rate"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.interestRate}%</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.monthlyPayment || "Monthly Payment"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">&euro;${opts.monthlyPayment.toFixed(2)}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">${t.totalRepayment || "Total Repayment"}</td>
        <td style="font-weight:600;text-align:right;">&euro;${opts.totalRepayment.toFixed(2)}</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">
      ${t.footer || "You will receive another email once a decision has been made. If you have questions in the meantime, feel free to contact us."}
    </p>
  `);

  await sendEmail({
    to: opts.to,
    subject: t.subject || "Loan Application Received",
    html,
  });
}

/** Sent to the admin when a new loan application comes in (French) */
export async function sendLoanApplicationAdminNotice(opts: {
  applicantEmail: string;
  applicantPhone: string;
  amount: number;
  durationMonths: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">Nouvelle demande de pr&ecirc;t</h2>
    <p style="color:#475569;line-height:1.6;">
      Une nouvelle demande de pr&ecirc;t a &eacute;t&eacute; soumise et est en attente de r&eacute;vision.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Demandeur</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.applicantEmail}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">T&eacute;l&eacute;phone / WhatsApp</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.applicantPhone}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Montant</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">&euro;${opts.amount.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">Dur&eacute;e</td>
        <td style="font-weight:600;text-align:right;">${opts.durationMonths} mois</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">
      Veuillez vous connecter au panneau d'administration pour examiner et agir.
    </p>
  `);

  await sendEmail({
    to: adminEmail,
    subject: "Nouvelle demande de pr\u00EAt \u2013 \u20AC" + opts.amount.toFixed(2),
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
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.loanApproved || {};

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#16a34a;">${t.heading || "Loan Application Approved"}</h2>
    <p style="color:#475569;line-height:1.6;">
      ${t.body || "Great news! Your loan application has been <strong>approved</strong>."}
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.amount || "Amount"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">&euro;${opts.amount.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.duration || "Duration"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.durationMonths} ${t.months || "months"}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">${t.monthlyPayment || "Monthly Payment"}</td>
        <td style="font-weight:600;text-align:right;">&euro;${opts.monthlyPayment.toFixed(2)}</td>
      </tr>
    </table>
    ${opts.disbursed
      ? '<p style="color:#16a34a;font-weight:600;">' + (t.disbursed || "The funds have been disbursed to your account.") + "</p>"
      : '<p style="color:#475569;">' + (t.notDisbursed || "Please contact us for the next steps regarding fund disbursement.") + "</p>"
    }
  `);

  await sendEmail({
    to: opts.to,
    subject: t.subject || "Your Loan Has Been Approved",
    html,
  });
}

/** Sent to the applicant when their loan is rejected */
export async function sendLoanRejectedEmail(opts: {
  to: string;
  amount: number;
  reason: string;
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.loanRejected || {};

  const bodyText = (t.body || "We regret to inform you that your loan application for <strong>{{amount}}</strong> was not approved at this time.")
    .replace("{{amount}}", "\u20AC" + opts.amount.toFixed(2));

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#dc2626;">${t.heading || "Loan Application Update"}</h2>
    <p style="color:#475569;line-height:1.6;">${bodyText}</p>
    <div style="margin:20px 0;padding:16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
      <p style="margin:0;color:#991b1b;font-size:14px;"><strong>${t.reason || "Reason"}:</strong> ${opts.reason}</p>
    </div>
    <p style="color:#475569;line-height:1.6;">
      ${t.footer || "If you believe this decision was made in error, or you would like to discuss alternatives, please contact our support team."}
    </p>
  `);

  await sendEmail({
    to: opts.to,
    subject: t.subject || "Loan Application Update",
    html,
  });
}

// ---------------------------------------------------------------------------
// Auth email helpers
// ---------------------------------------------------------------------------

/** Welcome email sent to the user after registration */
export async function sendWelcomeEmail(opts: { to: string; name: string; lang?: string }) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.welcome || {};
  const platform = await getPlatformSettings();

  const heading = (t.heading || "Welcome to {{platformName}}!").replace("{{platformName}}", platform.name);
  const greeting = (t.greeting || "Hi <strong>{{name}}</strong>, your account has been created successfully.")
    .replace("{{name}}", opts.name);
  const subject = (t.subject || "Welcome to {{platformName}}")
    .replace("{{platformName}}", platform.name);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">${heading}</h2>
    <p style="color:#475569;line-height:1.6;">${greeting}</p>
    <p style="color:#475569;line-height:1.6;">
      ${t.body || "To unlock all features \u2014 including transfers, cards, and beneficiary management \u2014 please complete your KYC verification from your dashboard."}
    </p>
    <p style="color:#475569;line-height:1.6;">
      ${t.support || "If you have any questions, don't hesitate to contact our support team."}
    </p>
  `);

  await sendEmail({ to: opts.to, subject, html });
}

/** Notify admin that a new user registered (French) */
export async function sendNewUserAdminNotice(opts: { name: string; email: string }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">Nouvel utilisateur inscrit</h2>
    <p style="color:#475569;line-height:1.6;">Un nouvel utilisateur s'est inscrit sur la plateforme.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Nom</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.name}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">Email</td>
        <td style="font-weight:600;text-align:right;">${opts.email}</td>
      </tr>
    </table>
  `);

  await sendEmail({ to: adminEmail, subject: "Nouvel utilisateur : " + opts.name, html });
}

// ---------------------------------------------------------------------------
// KYC email helpers
// ---------------------------------------------------------------------------

/** Sent to the user after they submit KYC documents */
export async function sendKycSubmittedEmail(opts: { to: string; name: string; lang?: string }) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.kycSubmitted || {};

  const body = (t.body || "Hi <strong>{{name}}</strong>, we've received your identity verification documents and they are now under review.")
    .replace("{{name}}", opts.name);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">${t.heading || "KYC Documents Received"}</h2>
    <p style="color:#475569;line-height:1.6;">${body}</p>
    <p style="color:#475569;line-height:1.6;">
      ${t.footer || "You'll receive another email once the review is complete. This typically takes 1\u20132 business days."}
    </p>
  `);

  await sendEmail({ to: opts.to, subject: t.subject || "KYC Documents Received", html });
}

/** Notify admin of a new KYC submission (French) */
export async function sendKycSubmittedAdminNotice(opts: { userName: string; userEmail: string }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">Nouvelle soumission KYC</h2>
    <p style="color:#475569;line-height:1.6;">Une nouvelle soumission KYC est en attente de r&eacute;vision.</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">Utilisateur</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.userName}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">Email</td>
        <td style="font-weight:600;text-align:right;">${opts.userEmail}</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">Veuillez vous connecter au panneau d'administration pour examiner.</p>
  `);

  await sendEmail({ to: adminEmail, subject: "Nouvelle soumission KYC \u2013 " + opts.userName, html });
}

/** Sent to the user when their KYC is approved */
export async function sendKycApprovedEmail(opts: { to: string; name: string; lang?: string }) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.kycApproved || {};

  const body = (t.body || "Hi <strong>{{name}}</strong>, your identity has been verified successfully!")
    .replace("{{name}}", opts.name);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#16a34a;">${t.heading || "Identity Verified"}</h2>
    <p style="color:#475569;line-height:1.6;">${body}</p>
    <p style="color:#475569;line-height:1.6;">
      ${t.footer || "You now have full access to all banking features including transfers, cards, and beneficiary management."}
    </p>
  `);

  await sendEmail({ to: opts.to, subject: t.subject || "KYC Approved \u2013 Identity Verified", html });
}

/** Sent to the user when their KYC is rejected */
export async function sendKycRejectedEmail(opts: { to: string; name: string; reason: string; lang?: string }) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.kycRejected || {};

  const body = (t.body || "Hi <strong>{{name}}</strong>, unfortunately your identity verification was not approved.")
    .replace("{{name}}", opts.name);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#dc2626;">${t.heading || "KYC Verification Update"}</h2>
    <p style="color:#475569;line-height:1.6;">${body}</p>
    <div style="margin:20px 0;padding:16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
      <p style="margin:0;color:#991b1b;font-size:14px;"><strong>${t.reason || "Reason"}:</strong> ${opts.reason}</p>
    </div>
    <p style="color:#475569;line-height:1.6;">
      ${t.footer || "Please review the reason above and resubmit your documents from your dashboard."}
    </p>
  `);

  await sendEmail({ to: opts.to, subject: t.subject || "KYC Verification \u2013 Action Required", html });
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
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.transferInitiated || {};

  const subject = (t.subject || "Transfer Pending \u2013 {{reference}}")
    .replace("{{reference}}", opts.reference);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">${t.heading || "Transfer Submitted"}</h2>
    <p style="color:#475569;line-height:1.6;">${t.body || "Your transfer has been submitted and is pending review."}</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.amount || "Amount"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.recipient || "Recipient"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.beneficiaryName}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">${t.reference || "Reference"}</td>
        <td style="font-weight:600;text-align:right;">${opts.reference}</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">${t.footer || "You will be notified once your transfer is processed."}</p>
  `);

  await sendEmail({ to: opts.to, subject, html });
}

/** Sent to the user when admin approves their transfer */
export async function sendTransferApprovedEmail(opts: {
  to: string;
  amount: string;
  beneficiaryName: string;
  reference: string;
  hasLocks: boolean;
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.transferApproved || {};

  const statusText = opts.hasLocks
    ? (t.statusLocks || "approved but requires additional verification steps before completion")
    : (t.statusCompleted || "approved and completed");

  const bodyText = (t.body || "Your transfer has been <strong>{{status}}</strong>.")
    .replace("{{status}}", statusText);

  const subject = (t.subject || "Transfer Approved \u2013 {{reference}}")
    .replace("{{reference}}", opts.reference);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#16a34a;">${t.heading || "Transfer Approved"}</h2>
    <p style="color:#475569;line-height:1.6;">${bodyText}</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.amount || "Amount"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.recipient || "Recipient"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.beneficiaryName}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">${t.reference || "Reference"}</td>
        <td style="font-weight:600;text-align:right;">${opts.reference}</td>
      </tr>
    </table>
    ${opts.hasLocks
      ? '<p style="color:#f59e0b;line-height:1.6;">' + (t.verificationRequired || "Please log in to your dashboard to complete the required verification steps.") + "</p>"
      : '<p style="color:#16a34a;font-weight:600;">' + (t.fundsDeducted || "The funds have been deducted from your account.") + "</p>"
    }
  `);

  await sendEmail({ to: opts.to, subject, html });
}

/** Sent to the user when admin rejects their transfer */
export async function sendTransferRejectedEmail(opts: {
  to: string;
  amount: string;
  beneficiaryName: string;
  reference: string;
  reason: string;
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.transferRejected || {};

  const subject = (t.subject || "Transfer Rejected \u2013 {{reference}}")
    .replace("{{reference}}", opts.reference);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#dc2626;">${t.heading || "Transfer Rejected"}</h2>
    <p style="color:#475569;line-height:1.6;">${t.body || "Your transfer has been rejected."}</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.amount || "Amount"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.recipient || "Recipient"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.beneficiaryName}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">${t.reference || "Reference"}</td>
        <td style="font-weight:600;text-align:right;">${opts.reference}</td>
      </tr>
    </table>
    <div style="margin:20px 0;padding:16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
      <p style="margin:0;color:#991b1b;font-size:14px;"><strong>${t.reason || "Reason"}:</strong> ${opts.reason}</p>
    </div>
    <p style="color:#475569;line-height:1.6;">${t.footer || "If you believe this was in error, please contact support."}</p>
  `);

  await sendEmail({ to: opts.to, subject, html });
}

/** Sent to the user when their transfer completes (progress 100%) */
export async function sendTransferCompletedEmail(opts: {
  to: string;
  amount: string;
  beneficiaryName: string;
  reference: string;
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.transferCompleted || {};

  const subject = (t.subject || "Transfer Complete \u2013 {{reference}}")
    .replace("{{reference}}", opts.reference);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#16a34a;">${t.heading || "Transfer Completed"}</h2>
    <p style="color:#475569;line-height:1.6;">${t.body || "Your transfer has been completed successfully."}</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.amount || "Amount"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.recipient || "Recipient"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.beneficiaryName}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="color:#64748b;font-size:13px;">${t.reference || "Reference"}</td>
        <td style="font-weight:600;text-align:right;">${opts.reference}</td>
      </tr>
    </table>
    <p style="color:#16a34a;font-weight:600;">${t.fundsDeducted || "The funds have been deducted from your account."}</p>
  `);

  await sendEmail({ to: opts.to, subject, html });
}

// ---------------------------------------------------------------------------
// Account status / credit / debit email helpers
// ---------------------------------------------------------------------------

/** Sent to the user when their account status changes (locked, suspended, reactivated) */
export async function sendAccountStatusEmail(opts: {
  to: string;
  name: string;
  status: "LOCKED" | "SUSPENDED" | "ACTIVE";
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const as = e.accountStatus || {};
  const statusKey = opts.status.toLowerCase() as "locked" | "suspended" | "active";
  const s = as[statusKey] || {};

  const fallbackConfig: Record<string, { color: string; title: string; message: string }> = {
    locked: { color: "#dc2626", title: "Account Locked", message: "Your bank account has been locked by an administrator. You will not be able to perform transactions until it is unlocked. Please contact support for assistance." },
    suspended: { color: "#dc2626", title: "Account Suspended", message: "Your bank account has been suspended pending review. All account operations are temporarily disabled. Please contact support for more information." },
    active: { color: "#16a34a", title: "Account Reactivated", message: "Your bank account has been reactivated. You can now perform transactions and access all account features normally." },
  };

  const fb = fallbackConfig[statusKey];
  const title = s.title || fb.title;
  const message = s.message || fb.message;
  const color = fb.color;
  const greeting = (as.greeting || "Hi <strong>{{name}}</strong>,").replace("{{name}}", opts.name);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:${color};">${title}</h2>
    <p style="color:#475569;line-height:1.6;">${greeting}</p>
    <p style="color:#475569;line-height:1.6;">${message}</p>
  `);

  await sendEmail({ to: opts.to, subject: title, html });
}

/** Sent to the user when admin credits their account */
export async function sendAccountCreditedEmail(opts: {
  to: string;
  name: string;
  amount: string;
  description: string;
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.accountCredited || {};
  const greeting = (t.greeting || "Hi <strong>{{name}}</strong>,").replace("{{name}}", opts.name);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#16a34a;">${t.heading || "Account Credited"}</h2>
    <p style="color:#475569;line-height:1.6;">${greeting}</p>
    <p style="color:#475569;line-height:1.6;">${t.body || "Your account has been credited."}</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.amount || "Amount"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">${t.reason || "Reason"}</td>
        <td style="font-weight:600;text-align:right;">${opts.description}</td>
      </tr>
    </table>
  `);

  await sendEmail({ to: opts.to, subject: t.subject || "Account Credited", html });
}

/** Sent to the user when admin debits their account */
export async function sendAccountDebitedEmail(opts: {
  to: string;
  name: string;
  amount: string;
  description: string;
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.accountDebited || {};
  const greeting = (t.greeting || "Hi <strong>{{name}}</strong>,").replace("{{name}}", opts.name);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#f59e0b;">${t.heading || "Account Debited"}</h2>
    <p style="color:#475569;line-height:1.6;">${greeting}</p>
    <p style="color:#475569;line-height:1.6;">${t.body || "A debit has been applied to your account."}</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.amount || "Amount"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.amount}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">${t.reason || "Reason"}</td>
        <td style="font-weight:600;text-align:right;">${opts.description}</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">${t.footer || "If you have questions about this transaction, please contact support."}</p>
  `);

  await sendEmail({ to: opts.to, subject: t.subject || "Account Debited", html });
}

// ---------------------------------------------------------------------------
// Card email helpers
// ---------------------------------------------------------------------------

/** Sent to the user when they create a new card */
export async function sendCardCreatedEmail(opts: {
  to: string;
  cardType: string;
  lastFour: string;
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.cardCreated || {};
  const subject = (t.subject || "New {{cardType}} Card Created").replace("{{cardType}}", opts.cardType);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">${t.heading || "New Card Created"}</h2>
    <p style="color:#475569;line-height:1.6;">${t.body || "Your new virtual card has been created successfully."}</p>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${t.cardType || "Card Type"}</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.cardType}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">${t.cardNumber || "Card Number"}</td>
        <td style="font-weight:600;text-align:right;">**** **** **** ${opts.lastFour}</td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">${t.footer || "You can manage your card from the Cards section of your dashboard."}</p>
  `);

  await sendEmail({ to: opts.to, subject, html });
}

/** Sent to the user when admin cancels their card */
export async function sendCardCancelledEmail(opts: {
  to: string;
  cardType: string;
  lastFour: string;
  balanceReturned: string | null;
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.cardCancelled || {};

  const body = (t.body || "Your <strong>{{cardType}}</strong> card ending in <strong>{{lastFour}}</strong> has been cancelled by an administrator.")
    .replace("{{cardType}}", opts.cardType).replace("{{lastFour}}", opts.lastFour);

  const balanceText = opts.balanceReturned
    ? '<p style="color:#475569;line-height:1.6;">' +
      (t.balanceReturned || "<strong>{{amount}}</strong> has been returned to your bank account.").replace("{{amount}}", opts.balanceReturned) +
      "</p>"
    : "";

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#dc2626;">${t.heading || "Card Cancelled"}</h2>
    <p style="color:#475569;line-height:1.6;">${body}</p>
    ${balanceText}
    <p style="color:#475569;line-height:1.6;">${t.footer || "If you have questions, please contact support."}</p>
  `);

  await sendEmail({ to: opts.to, subject: t.subject || "Card Cancelled", html });
}

/** Sent to the user when admin freezes or unfreezes their card */
export async function sendCardFreezeToggleEmail(opts: {
  to: string;
  cardType: string;
  lastFour: string;
  frozen: boolean;
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.cardFreezeToggle || {};

  const title = opts.frozen ? (t.frozenTitle || "Card Frozen") : (t.reactivatedTitle || "Card Reactivated");
  const color = opts.frozen ? "#f59e0b" : "#16a34a";
  const message = opts.frozen
    ? (t.frozenBody || "Your <strong>{{cardType}}</strong> card ending in <strong>{{lastFour}}</strong> has been frozen by an administrator. You will not be able to use it until it is reactivated.")
        .replace("{{cardType}}", opts.cardType).replace("{{lastFour}}", opts.lastFour)
    : (t.reactivatedBody || "Your <strong>{{cardType}}</strong> card ending in <strong>{{lastFour}}</strong> has been reactivated by an administrator and is ready to use.")
        .replace("{{cardType}}", opts.cardType).replace("{{lastFour}}", opts.lastFour);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:${color};">${title}</h2>
    <p style="color:#475569;line-height:1.6;">${message}</p>
    <p style="color:#475569;line-height:1.6;">${t.footer || "If you have questions, please contact support."}</p>
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
  lang?: string;
}) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.contactConfirmation || {};
  const platform = await getPlatformSettings();

  const greeting = (t.greeting || "Hi <strong>{{name}}</strong>, thank you for reaching out to us.")
    .replace("{{name}}", opts.name);
  const body = (t.body || "We've received your message regarding \"<strong>{{subject}}</strong>\" and our team will get back to you as soon as possible.")
    .replace("{{subject}}", opts.subject);
  const urgent = (t.urgent || "In the meantime, if your inquiry is urgent, feel free to call us at <strong>{{phone}}</strong>.")
    .replace("{{phone}}", platform.phone);
  const emailSubject = (t.subject || "Message Received \u2013 {{subject}}")
    .replace("{{subject}}", opts.subject);

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">${t.heading || "We Received Your Message"}</h2>
    <p style="color:#475569;line-height:1.6;">${greeting}</p>
    <p style="color:#475569;line-height:1.6;">${body}</p>
    <p style="color:#475569;line-height:1.6;">${urgent}</p>
  `);

  await sendEmail({ to: opts.to, subject: emailSubject, html });
}

/** Forward the contact form message to the admin (French) */
export async function sendContactFormToAdmin(opts: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">Nouveau message du formulaire de contact</h2>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
      <tr style="background:#f8fafc;">
        <td style="border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">De</td>
        <td style="border-bottom:1px solid #e2e8f0;font-weight:600;text-align:right;">${opts.name} (${opts.email})</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-size:13px;">Sujet</td>
        <td style="font-weight:600;text-align:right;">${opts.subject}</td>
      </tr>
    </table>
    <div style="margin:20px 0;padding:16px;background:#f8fafc;border-left:4px solid #3b82f6;border-radius:4px;">
      <p style="margin:0;color:#1e293b;font-size:14px;white-space:pre-wrap;">${opts.message}</p>
    </div>
    <p style="color:#475569;line-height:1.6;">R&eacute;pondre directement &agrave; <strong>${opts.email}</strong>.</p>
  `);

  await sendEmail({ to: adminEmail, subject: "Contact : " + opts.subject + " \u2013 de " + opts.name, html });
}

// ---------------------------------------------------------------------------
// OTP email
// ---------------------------------------------------------------------------

/** Send a 6-digit OTP code for login verification */
export async function sendOtpEmail(opts: { to: string; code: string; lang?: string }) {
  const e = await getEmailDict(opts.lang || "en");
  const t = e.otp || {};

  const html = await wrapHtml(`
    <h2 style="margin:0 0 16px;color:#1e293b;">${t.heading || "Your Login Verification Code"}</h2>
    <p style="color:#475569;line-height:1.6;">
      ${t.body || "Use the following one-time code to complete your sign-in. This code is valid for <strong>10 minutes</strong>."}
    </p>
    <div style="margin:24px 0;text-align:center;">
      <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:#1e293b;background:#f1f5f9;padding:16px 32px;border-radius:8px;border:2px dashed #cbd5e1;">
        ${opts.code}
      </span>
    </div>
    <p style="color:#475569;line-height:1.6;">
      ${t.ignore || "If you did not attempt to sign in, please ignore this email or contact support immediately."}
    </p>
  `);

  await sendEmail({
    to: opts.to,
    subject: t.subject || "Your Login Verification Code",
    html,
  });
}
