/**
 * Email Service — Automated invoice reminders and notifications
 *
 * ACTIVATION: npm install resend && set RESEND_API_KEY env var
 * Alternative: npm install @sendgrid/mail && set SENDGRID_API_KEY
 *
 * Once configured, this module enables:
 * - Automatic payment reminders for overdue invoices
 * - Invoice delivery via email
 * - Payment confirmation emails
 * - Weekly financial summary digests
 */

// ── Configuration ──────────────────────────────────────────────

export function isConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
}

export function getProvider(): 'resend' | 'sendgrid' | null {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  return null;
}

// ── Email Types ────────────────────────────────────────────────

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface InvoiceReminderData {
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  paymentUrl?: string;
  companyName?: string;
}

interface InvoiceDeliveryData {
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  paymentUrl?: string;
  companyName?: string;
}

interface PaymentConfirmationData {
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  amount: number;
  paidDate: string;
  companyName?: string;
}

// ── Send Function ──────────────────────────────────────────────

async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = getProvider();

  if (!provider) {
    return { success: false, error: 'Email not configured. Set RESEND_API_KEY or SENDGRID_API_KEY.' };
  }

  const from = options.from || process.env.EMAIL_FROM || 'Ledgr <noreply@ledgr.app>';

  try {
    if (provider === 'resend') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY!);
        const { data, error } = await resend.emails.send({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          reply_to: options.replyTo,
        });
        if (error) return { success: false, error: error.message };
        return { success: true, messageId: data?.id };
      } catch {
        return { success: false, error: 'Resend package not installed. Run: npm install resend' };
      }
    }

    if (provider === 'sendgrid') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
        const [response] = await sgMail.send({
          to: options.to,
          from,
          subject: options.subject,
          html: options.html,
          replyTo: options.replyTo,
        });
        return { success: true, messageId: response.headers['x-message-id'] };
      } catch {
        return { success: false, error: 'SendGrid package not installed. Run: npm install @sendgrid/mail' };
      }
    }

    return { success: false, error: 'Unknown provider' };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Send failed' };
  }
}

// ── Email Templates ────────────────────────────────────────────

function invoiceReminderTemplate(data: InvoiceReminderData): string {
  const company = data.companyName || 'Our Company';
  const payButton = data.paymentUrl
    ? `<a href="${data.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">Pay Now — $${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</a>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:Inter,-apple-system,sans-serif;background:#F8FAFC;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#7C3AED,#9333EA);padding:24px 32px;">
      <h1 style="color:#fff;font-size:18px;margin:0;">Payment Reminder</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#0F172A;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Hi ${data.clientName},
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
        This is a friendly reminder that invoice <strong>${data.invoiceNumber}</strong> for
        <strong style="color:#0F172A;">$${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
        was due on ${data.dueDate} and is now <strong style="color:#EF4444;">${data.daysOverdue} days overdue</strong>.
      </p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin-bottom:16px;">
        <table style="width:100%;font-size:13px;color:#475569;">
          <tr><td style="padding:4px 0;">Invoice</td><td style="text-align:right;font-weight:600;color:#0F172A;">${data.invoiceNumber}</td></tr>
          <tr><td style="padding:4px 0;">Amount Due</td><td style="text-align:right;font-weight:600;color:#EF4444;">$${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="padding:4px 0;">Due Date</td><td style="text-align:right;font-weight:600;color:#0F172A;">${data.dueDate}</td></tr>
          <tr><td style="padding:4px 0;">Days Overdue</td><td style="text-align:right;font-weight:600;color:#EF4444;">${data.daysOverdue}</td></tr>
        </table>
      </div>
      ${payButton}
      <p style="color:#94A3B8;font-size:12px;margin-top:24px;">
        If you've already made this payment, please disregard this notice.
      </p>
    </div>
    <div style="border-top:1px solid #E2E8F0;padding:16px 32px;text-align:center;">
      <p style="color:#94A3B8;font-size:11px;margin:0;">Sent via Ledgr on behalf of ${company}</p>
    </div>
  </div>
</body>
</html>`;
}

function invoiceDeliveryTemplate(data: InvoiceDeliveryData): string {
  const company = data.companyName || 'Our Company';
  const payButton = data.paymentUrl
    ? `<a href="${data.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">Pay Invoice</a>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:Inter,-apple-system,sans-serif;background:#F8FAFC;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#7C3AED,#9333EA);padding:24px 32px;">
      <h1 style="color:#fff;font-size:18px;margin:0;">New Invoice from ${company}</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#0F172A;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${data.clientName},</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
        You have a new invoice <strong>${data.invoiceNumber}</strong> for
        <strong style="color:#0F172A;">$${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>,
        due by ${data.dueDate}.
      </p>
      ${payButton}
    </div>
    <div style="border-top:1px solid #E2E8F0;padding:16px 32px;text-align:center;">
      <p style="color:#94A3B8;font-size:11px;margin:0;">Sent via Ledgr on behalf of ${company}</p>
    </div>
  </div>
</body>
</html>`;
}

function paymentConfirmationTemplate(data: PaymentConfirmationData): string {
  const company = data.companyName || 'Our Company';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:Inter,-apple-system,sans-serif;background:#F8FAFC;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
    <div style="background:#059669;padding:24px 32px;">
      <h1 style="color:#fff;font-size:18px;margin:0;">Payment Received</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#0F172A;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${data.clientName},</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
        We've received your payment of
        <strong style="color:#059669;">$${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
        for invoice <strong>${data.invoiceNumber}</strong>. Thank you!
      </p>
    </div>
    <div style="border-top:1px solid #E2E8F0;padding:16px 32px;text-align:center;">
      <p style="color:#94A3B8;font-size:11px;margin:0;">Sent via Ledgr on behalf of ${company}</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Auth Email Templates ───────────────────────────────────────

function verificationEmailTemplate(verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:Inter,-apple-system,sans-serif;background:#F8FAFC;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#7C3AED,#9333EA);padding:24px 32px;">
      <h1 style="color:#fff;font-size:20px;margin:0;font-weight:800;letter-spacing:-0.02em;">Ledgr</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#0F172A;font-size:18px;font-weight:700;margin:0 0 12px;">Verify your email address</h2>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Click the button below to verify your email and activate your Ledgr account. This link expires in 24 hours.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#7C3AED,#9333EA);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
        Verify Email Address
      </a>
      <p style="color:#94A3B8;font-size:12px;margin-top:24px;line-height:1.5;">
        If you didn't create a Ledgr account, you can safely ignore this email.
      </p>
      <p style="color:#94A3B8;font-size:11px;margin-top:8px;">
        Or copy this link: ${verifyUrl}
      </p>
    </div>
  </div>
</body>
</html>`;
}

function passwordResetEmailTemplate(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:Inter,-apple-system,sans-serif;background:#F8FAFC;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#7C3AED,#9333EA);padding:24px 32px;">
      <h1 style="color:#fff;font-size:20px;margin:0;font-weight:800;letter-spacing:-0.02em;">Ledgr</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#0F172A;font-size:18px;font-weight:700;margin:0 0 12px;">Reset your password</h2>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
        We received a request to reset your Ledgr password. Click the button below to choose a new one. This link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#7C3AED,#9333EA);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
        Reset Password
      </a>
      <p style="color:#94A3B8;font-size:12px;margin-top:24px;line-height:1.5;">
        If you didn't request a password reset, you can safely ignore this email. Your password won't change.
      </p>
      <p style="color:#94A3B8;font-size:11px;margin-top:8px;">
        Or copy this link: ${resetUrl}
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Public API ─────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  return sendEmail({
    to,
    subject: 'Verify your Ledgr email address',
    html: verificationEmailTemplate(verifyUrl),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: 'Reset your Ledgr password',
    html: passwordResetEmailTemplate(resetUrl),
  });
}

export async function sendInvoiceReminder(data: InvoiceReminderData) {
  return sendEmail({
    to: data.clientEmail,
    subject: `Payment Reminder: ${data.invoiceNumber} — $${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} overdue`,
    html: invoiceReminderTemplate(data),
  });
}

export async function sendInvoiceDelivery(data: InvoiceDeliveryData) {
  return sendEmail({
    to: data.clientEmail,
    subject: `Invoice ${data.invoiceNumber} from ${data.companyName || 'Ledgr'} — $${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    html: invoiceDeliveryTemplate(data),
  });
}

export async function sendPaymentConfirmation(data: PaymentConfirmationData) {
  return sendEmail({
    to: data.clientEmail,
    subject: `Payment Confirmed: ${data.invoiceNumber}`,
    html: paymentConfirmationTemplate(data),
  });
}
