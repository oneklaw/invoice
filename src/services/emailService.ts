import { EmailNotification, EmailNotificationType, Invoice, OrganizationSettings, SupportTicket } from '../types';

const EMAILS_STORAGE_KEY = 'invox_saas_emails_v2';

const SEED_EMAILS: EmailNotification[] = [
  {
    id: 'eml_seed_001',
    organizationId: 'org_apex_tech',
    invoiceId: 'inv_apex_001',
    invoiceNumber: 'INV-2026-001',
    type: 'payment_received',
    recipientEmail: 'ap@acmelogistics.com',
    recipientName: 'Acme Global Logistics Corp',
    subject: 'Receipt: Payment Confirmed for Invoice INV-2026-001 (USD 24,575.00)',
    previewText: 'Thank you! Your payment of USD 24,575.00 has been successfully processed.',
    bodyHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Apex Global Cloud Solutions</h2>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Official Payment Confirmation & Tax Receipt</p>
      </div>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0; color: #166534; font-weight: bold; font-size: 15px;">✓ Payment Received in Full</p>
        <p style="margin: 4px 0 0 0; color: #15803d; font-size: 13px;">Transaction settled via VISA Corporate (•••• 8912) & Stripe Gateway.</p>
      </div>
      <p style="font-size: 14px; line-height: 1.5;">Dear <strong>Acme Global Logistics Corp</strong>,</p>
      <p style="font-size: 14px; line-height: 1.5; color: #334155;">We have received your payment for Invoice <strong>INV-2026-001</strong>. Your account balance is now <strong>$0.00</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Invoice Reference</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">INV-2026-001</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Amount Paid</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #16a34a;">USD 24,575.00</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Payment Method</td><td style="padding: 8px 0; text-align: right;">VISA Corporate via Stripe</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Transaction Reference</td><td style="padding: 8px 0; text-align: right; font-family: monospace;">ch_3NvxApex918239401</td></tr>
      </table>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
        Apex Global Cloud Solutions LLC · 548 Market Street, San Francisco, CA 94104 · US-EIN-94-8172940
      </div>
    </div>`,
    sentAt: '2026-09-28T14:32:05Z',
    status: 'opened',
    openedAt: '2026-09-28T14:35:12Z',
    clickedAt: '2026-09-28T14:35:50Z',
    deliveredVia: 'KERO INVOICE Automated Mailer (Amazon SES / SMTP)',
  },
  {
    id: 'eml_seed_002',
    organizationId: 'org_apex_tech',
    invoiceId: 'inv_apex_002',
    invoiceNumber: 'INV-2026-002',
    type: 'invoice_generated',
    recipientEmail: 'finance@nexusmedia.co.uk',
    recipientName: 'Nexus Digital Media Ltd',
    subject: 'New Invoice INV-2026-002 from Apex Global Cloud Solutions (USD 16,500.00)',
    previewText: 'A new invoice of USD 16,500.00 has been issued. Payment is due by 2026-11-04.',
    bodyHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Apex Global Cloud Solutions</h2>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Invoice Notice: INV-2026-002</p>
      </div>
      <p style="font-size: 14px; line-height: 1.5;">Dear <strong>Nexus Digital Media Ltd</strong>,</p>
      <p style="font-size: 14px; line-height: 1.5; color: #334155;">Please find your invoice <strong>INV-2026-002</strong> for <strong>USD 16,500.00</strong> ready for review and payment.</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr><td style="padding: 4px 0; color: #64748b;">Amount Due:</td><td style="padding: 4px 0; text-align: right; font-weight: bold; font-size: 16px; color: #0f172a;">USD 16,500.00</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Due Date:</td><td style="padding: 4px 0; text-align: right; font-weight: bold;">2026-11-04</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Purchase Order:</td><td style="padding: 4px 0; text-align: right;">PO-NEX-449</td></tr>
        </table>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="#pay" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
          Pay Online via Visa or Stripe
        </a>
      </div>
      <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 12px; color: #475569; margin-top: 20px;">
        <strong>Bank Wire Coordinates:</strong> Silicon Valley Commercial Bank · SWIFT: SVBCUS6S · Acct: 40918294012
      </div>
    </div>`,
    sentAt: '2026-10-05T09:15:30Z',
    status: 'delivered',
    paymentUrl: '/pay/inv_apex_002',
    deliveredVia: 'KERO INVOICE Automated Mailer (Amazon SES / SMTP)',
  },
];

class EmailService {
  private getStorageEmails(): EmailNotification[] {
    try {
      const data = localStorage.getItem(EMAILS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(SEED_EMAILS));
        return SEED_EMAILS;
      }
      return JSON.parse(data) as EmailNotification[];
    } catch {
      return SEED_EMAILS;
    }
  }

  private setStorageEmails(emails: EmailNotification[]): void {
    try {
      localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(emails));
    } catch (e) {
      console.error('Failed to save emails:', e);
    }
  }

  public getEmailsByOrg(orgId: string): EmailNotification[] {
    const all = this.getStorageEmails();
    return all.filter((e) => e.organizationId === orgId);
  }

  /**
   * Automatically generate and dispatch an email when an invoice is created or updated
   */
  public notifyInvoiceGenerated(
    invoice: Invoice,
    org: OrganizationSettings
  ): EmailNotification {
    const id = 'eml_' + Math.random().toString(36).substring(2, 9);
    const subject = `New Invoice ${invoice.invoiceNumber} from ${org.name} (${invoice.currency} ${invoice.totalAmount.toLocaleString()})`;
    const previewText = `A new invoice of ${invoice.currency} ${invoice.totalAmount.toLocaleString()} has been issued by ${org.name}. Due on ${invoice.dueDate}.`;

    const itemsRowsHtml = invoice.items
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #1e293b; font-size: 13px;">${it.description}</td>
          <td style="padding: 10px 8px; text-align: center; color: #64748b; font-size: 13px;">${it.quantity}</td>
          <td style="padding: 10px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 13px;">${invoice.currency} ${it.amount.toLocaleString()}</td>
        </tr>`
      )
      .join('');

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Email Header -->
        <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #6366f1;">
          <table style="width: 100%;">
            <tr>
              <td>
                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">${org.name}</h1>
                <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Automated Invoicing & Payment Portal</p>
              </td>
              <td style="text-align: right;">
                <span style="background: rgba(99, 102, 241, 0.2); color: #c7d2fe; border: 1px solid rgba(99, 102, 241, 0.4); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-family: monospace; font-weight: 600;">
                  ${invoice.invoiceNumber}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px;">
          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
            Dear <strong>${invoice.clientName}</strong>,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #334155;">
            Thank you for your business. A new invoice has been prepared for you. You can review the line items below and complete payment online securely via credit card (Stripe / VISA) or direct bank wire.
          </p>

          <!-- Highlights Card -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-size: 12px;">Total Due:</td>
                <td style="padding: 4px 0; text-align: right; color: #4338ca; font-weight: 800; font-size: 20px;">
                  ${invoice.currency} ${invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-size: 12px;">Due Date:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600; font-size: 13px; color: #0f172a;">
                  ${invoice.dueDate}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-size: 12px;">Payment Window:</td>
                <td style="padding: 4px 0; text-align: right; font-size: 13px; color: #0f172a;">
                  ${org.defaultPaymentTerms}
                </td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
                <th style="padding: 8px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Description</th>
                <th style="padding: 8px 8px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: center;">Qty</th>
                <th style="padding: 8px 0; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <!-- Call to action button -->
          <div style="text-align: center; margin: 32px 0 24px 0;">
            <a href="#pay-online" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
              Pay Online via VISA / Stripe →
            </a>
          </div>

          <!-- Bank wire coordinates box -->
          <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-top: 24px; font-size: 12px; color: #334155;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Direct Bank Wire Remittance:</div>
            <div>Bank: <strong>${org.bankDetails.bankName}</strong> · Beneficiary: <strong>${org.bankDetails.accountHolderName}</strong></div>
            <div>Account #: <strong>${org.bankDetails.accountNumber}</strong> · SWIFT/BIC: <strong>${org.bankDetails.swiftBic}</strong> · IBAN: <strong>${org.bankDetails.iban}</strong></div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0;">${org.legalName} · ${org.address.line1}, ${org.address.city} · Tax ID: ${org.taxId}</p>
          <p style="margin: 0;">Sent automatically by KERO INVOICE SaaS Notification Engine.</p>
        </div>
      </div>
    `;

    const notification: EmailNotification = {
      id,
      organizationId: org.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: 'invoice_generated',
      recipientEmail: invoice.clientEmail,
      recipientName: invoice.clientName,
      subject,
      previewText,
      bodyHtml,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      paymentUrl: `/pay/${invoice.id}`,
      deliveredVia: 'KERO INVOICE Automated Mailer (Amazon SES / SMTP)',
    };

    this.saveNotification(notification);
    this.broadcastEmailSent(notification);
    return notification;
  }

  /**
   * Automatically generate and dispatch an email receipt when payment is received
   */
  public notifyPaymentReceived(
    invoice: Invoice,
    org: OrganizationSettings,
    paymentMethod: string,
    transactionId?: string
  ): EmailNotification {
    const id = 'eml_' + Math.random().toString(36).substring(2, 9);
    const txnRef = transactionId || 'txn_' + Math.random().toString(36).substring(2, 10);
    const subject = `Payment Confirmed: Receipt for Invoice ${invoice.invoiceNumber} (${invoice.currency} ${invoice.totalAmount.toLocaleString()})`;
    const previewText = `We received your payment of ${invoice.currency} ${invoice.totalAmount.toLocaleString()} for Invoice ${invoice.invoiceNumber}. Thank you!`;

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Email Header -->
        <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #10b981;">
          <table style="width: 100%;">
            <tr>
              <td>
                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">${org.name}</h1>
                <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Official Tax Receipt & Payment Confirmation</p>
              </td>
              <td style="text-align: right;">
                <span style="background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-family: monospace; font-weight: 600;">
                  PAID IN FULL
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding: 32px;">
          <!-- Green Success Banner -->
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 18px; margin-bottom: 24px; text-align: center;">
            <div style="font-size: 28px; margin-bottom: 4px;">🎉</div>
            <h2 style="margin: 0; color: #065f46; font-size: 17px; font-weight: 700;">Payment Successfully Received</h2>
            <p style="margin: 4px 0 0 0; color: #047857; font-size: 13px;">
              Thank you! Your payment for <strong>${invoice.invoiceNumber}</strong> has been cleared.
            </p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Dear <strong>${invoice.clientName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            This email serves as an official proof of payment and tax receipt for your records. Your remaining balance for this invoice is <strong>0.00</strong>.
          </p>

          <!-- Payment Details Summary -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; background: #fafafa;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b;">Invoice Reference:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;">${invoice.invoiceNumber}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b;">Amount Paid:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 800; font-size: 16px; color: #059669;">
                  ${invoice.currency} ${invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b;">Payment Method:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${paymentMethod}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b;">Transaction Reference:</td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px; color: #475569;">${txnRef}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Settled Timestamp:</td>
                <td style="padding: 8px 0; text-align: right; font-size: 12px; color: #475569;">${new Date().toUTCString()}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 24px 0 16px 0;">
            <a href="#view-invoice" style="background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-block;">
              Download PDF Receipt
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0;">${org.legalName} · ${org.address.line1}, ${org.address.city} · Tax ID: ${org.taxId}</p>
          <p style="margin: 0;">Sent automatically by KERO INVOICE SaaS Notification Engine.</p>
        </div>
      </div>
    `;

    const notification: EmailNotification = {
      id,
      organizationId: org.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: 'payment_received',
      recipientEmail: invoice.clientEmail,
      recipientName: invoice.clientName,
      subject,
      previewText,
      bodyHtml,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      deliveredVia: 'KERO INVOICE Automated Mailer (Amazon SES / SMTP)',
    };

    this.saveNotification(notification);
    this.broadcastEmailSent(notification);
    return notification;
  }

  /**
   * Automated reminder email for upcoming or overdue invoices
   */
  public sendReminderEmail(
    invoice: Invoice,
    org: OrganizationSettings
  ): EmailNotification {
    const id = 'eml_' + Math.random().toString(36).substring(2, 9);
    const isOverdue = invoice.status === 'overdue';
    const subject = `${isOverdue ? 'URGENT: Overdue Notice' : 'Reminder'}: Invoice ${invoice.invoiceNumber} from ${org.name} (${invoice.currency} ${invoice.totalAmount.toLocaleString()})`;
    const previewText = `Reminder regarding Invoice ${invoice.invoiceNumber} for ${invoice.currency} ${invoice.totalAmount.toLocaleString()} due on ${invoice.dueDate}.`;

    const bodyHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">${org.name}</h2>
        <div style="background: ${isOverdue ? '#fff1f2' : '#fefce8'}; border: 1px solid ${isOverdue ? '#fecdd3' : '#fef08a'}; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
          <p style="margin: 0; color: ${isOverdue ? '#be123c' : '#854d0e'}; font-weight: bold; font-size: 14px;">
            ${isOverdue ? '⚠️ This invoice is past due' : '📅 Payment Reminder'}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: ${isOverdue ? '#9f1239' : '#713f12'};">
            Invoice ${invoice.invoiceNumber} was due on ${invoice.dueDate}. Total balance remaining: <strong>${invoice.currency} ${invoice.totalAmount.toLocaleString()}</strong>.
          </p>
        </div>
        <p style="font-size: 14px; line-height: 1.5;">Dear <strong>${invoice.clientName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #334155;">
          Please settle this outstanding balance at your earliest convenience using our instant online payment gateway.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="#pay-now" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Settle Balance via VISA / Stripe
          </a>
        </div>
      </div>
    `;

    const notification: EmailNotification = {
      id,
      organizationId: org.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: 'payment_reminder',
      recipientEmail: invoice.clientEmail,
      recipientName: invoice.clientName,
      subject,
      previewText,
      bodyHtml,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      deliveredVia: 'KERO INVOICE Automated Mailer (Amazon SES / SMTP)',
    };

    this.saveNotification(notification);
    this.broadcastEmailSent(notification);
    return notification;
  }

  /**
   * Automated critical incident notification dispatched to senior platform admins
   */
  public notifyCriticalTicketEscalation(
    ticket: SupportTicket,
    adminEmail: string = 'onekalitkenneth@gmail.com',
    adminName: string = 'Kenneth Onekalit'
  ): EmailNotification {
    const id = 'eml_crit_' + Math.random().toString(36).substring(2, 9);
    const subject = `🚨 [CRITICAL INCIDENT] Ticket ${ticket.ticketNumber} opened by ${ticket.organizationName} - Immediate Action Required`;
    const previewText = `CRITICAL ESCALATION: ${ticket.subject} from tenant ${ticket.organizationName}. Immediate SLA response required (<30m).`;

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #0f172a; color: #f8fafc; border: 2px solid #ef4444; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.3);">
        <div style="background: #ef4444; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
          🚨 Automated Critical Escalation Router · SLA Window: &lt; 30 Mins
        </div>
        
        <div style="padding: 24px 32px;">
          <h2 style="color: #ffffff; margin: 0 0 8px 0; font-size: 20px;">Senior Platform Admin Incident Dispatch</h2>
          <p style="color: #cbd5e1; margin: 0 0 20px 0; font-size: 14px;">
            A support query with <strong>CRITICAL</strong> escalation level has been opened by tenant <strong>${ticket.organizationName}</strong> and automatically assigned to you.
          </p>

          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 8px 0; color: #94a3b8; width: 140px;">Ticket Reference:</td>
                <td style="padding: 8px 0; font-family: monospace; font-weight: bold; color: #a5b4fc;">${ticket.ticketNumber}</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 8px 0; color: #94a3b8;">Escalation Level:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #ef4444;">🔴 CRITICAL</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 8px 0; color: #94a3b8;">Category:</td>
                <td style="padding: 8px 0; text-transform: capitalize;">${ticket.category.replace(/_/g, ' ')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 8px 0; color: #94a3b8;">Tenant Org:</td>
                <td style="padding: 8px 0; font-weight: 600;">${ticket.organizationName} (${ticket.organizationId})</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 8px 0; color: #94a3b8;">Contact:</td>
                <td style="padding: 8px 0;">${ticket.createdByName} (${ticket.createdByEmail})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8;">Subject:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #ffffff;">${ticket.subject}</td>
              </tr>
            </table>
          </div>

          <div style="background: #020617; border-left: 4px solid #ef4444; padding: 14px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; font-family: monospace;">Tenant Query Details</p>
            <p style="margin: 6px 0 0 0; color: #f1f5f9; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${ticket.description}</p>
          </div>

          <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="#triage" style="background: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              Open Ticket in Support Ticket Center
            </a>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center;">
            Automated Incident Router · Slack Sync: #platform-critical-incidents · Senior Staff Dispatch
          </div>
        </div>
      </div>
    `;

    const notification: EmailNotification = {
      id,
      organizationId: ticket.organizationId,
      invoiceId: ticket.id,
      invoiceNumber: ticket.ticketNumber,
      type: 'critical_ticket_escalation',
      recipientEmail: adminEmail,
      recipientName: adminName,
      subject,
      previewText,
      bodyHtml,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      deliveredVia: 'KERO INVOICE Automated Mailer (Amazon SES / SMTP) + Slack Gateway',
    };

    this.saveNotification(notification);
    this.broadcastEmailSent(notification);
    return notification;
  }

  private saveNotification(notification: EmailNotification): void {
    const all = this.getStorageEmails();
    all.unshift(notification);
    if (all.length > 250) all.length = 250;
    this.setStorageEmails(all);
  }

  private broadcastEmailSent(notification: EmailNotification): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('invox:email_dispatched', {
          detail: notification,
        })
      );
    }
  }
}

export const emailService = new EmailService();
