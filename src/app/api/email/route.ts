/**
 * Email API — Send invoice reminders and notifications
 *
 * ACTIVATION: npm install resend && set RESEND_API_KEY env var
 */
import { NextResponse } from 'next/server';
import { isConfigured, sendInvoiceReminder, sendInvoiceDelivery, sendPaymentConfirmation } from '@/lib/email';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(request: Request) {
  const { unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error: 'Email service not configured',
        setup: 'Install: npm install resend\nThen set RESEND_API_KEY in your environment variables.\nAlternative: npm install @sendgrid/mail && set SENDGRID_API_KEY',
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'send_reminder': {
        const { clientName, clientEmail, invoiceNumber, amount, dueDate, daysOverdue, paymentUrl } = body;
        if (!clientEmail || !invoiceNumber) {
          return NextResponse.json({ error: 'Missing clientEmail or invoiceNumber' }, { status: 400 });
        }
        const result = await sendInvoiceReminder({
          clientName, clientEmail, invoiceNumber,
          amount: parseFloat(amount),
          dueDate, daysOverdue: parseInt(daysOverdue),
          paymentUrl,
        });
        return NextResponse.json(result);
      }

      case 'send_invoice': {
        const { clientName, clientEmail, invoiceNumber, amount, dueDate, paymentUrl } = body;
        if (!clientEmail || !invoiceNumber) {
          return NextResponse.json({ error: 'Missing clientEmail or invoiceNumber' }, { status: 400 });
        }
        const result = await sendInvoiceDelivery({
          clientName, clientEmail, invoiceNumber,
          amount: parseFloat(amount),
          dueDate, paymentUrl,
        });
        return NextResponse.json(result);
      }

      case 'payment_confirmation': {
        const { clientName, clientEmail, invoiceNumber, amount, paidDate } = body;
        if (!clientEmail || !invoiceNumber) {
          return NextResponse.json({ error: 'Missing clientEmail or invoiceNumber' }, { status: 400 });
        }
        const result = await sendPaymentConfirmation({
          clientName, clientEmail, invoiceNumber,
          amount: parseFloat(amount),
          paidDate,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 });
  }
}
