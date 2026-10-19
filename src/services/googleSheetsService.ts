import { Client, Invoice, OrganizationSettings, User } from '../types';
import { getAccessToken, googleSignIn } from './googleAuthService';
import { storageService } from './storage';

export interface GoogleSheetExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  exportedAt: string;
  clientCount: number;
  invoiceCount: number;
  totalCollected: number;
  currency: string;
}

export interface ExportProgressCallback {
  (stage: 'auth' | 'creating' | 'populating' | 'formatting' | 'completed', message: string): void;
}

export class GoogleSheetsService {
  /**
   * Exports clients and payment history to a newly created Google Spreadsheet
   */
  public async exportClientsAndPaymentsToGoogleSheet(
    org: OrganizationSettings,
    clients: Client[],
    currentUser: User,
    onProgress?: ExportProgressCallback
  ): Promise<GoogleSheetExportResult> {
    // 1. Ensure access token
    let token = getAccessToken();
    if (!token) {
      if (onProgress) onProgress('auth', 'Authenticating with Google Account...');
      const authResult = await googleSignIn();
      if (!authResult || !authResult.accessToken) {
        throw new Error('Google authentication required to export to Google Sheets.');
      }
      token = authResult.accessToken;
    }

    if (onProgress) onProgress('creating', 'Creating new Google Sheet via Sheets API...');

    // Fetch invoices for payment history
    const allInvoices: Invoice[] = storageService.getInvoices(org.id);

    // Filter payments & calculate metrics
    const paidInvoices = allInvoices.filter((inv) => inv.status === 'paid');
    const totalCollected = paidInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalLifetimeInvoiced = allInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const pendingInvoices = allInvoices.filter((inv) => inv.status === 'sent');
    const overdueInvoices = allInvoices.filter((inv) => inv.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const spreadsheetTitle = `${org.name} - Client Directory & Payment History (${dateStr})`;

    // 2. Initialize new spreadsheet with 3 tabs
    const createPayload = {
      properties: {
        title: spreadsheetTitle,
        locale: 'en_US',
        autoRecalc: 'ON_CHANGE',
      },
      sheets: [
        {
          properties: {
            sheetId: 0,
            title: 'Executive Summary',
            gridProperties: { rowCount: 40, columnCount: 10 },
          },
        },
        {
          properties: {
            sheetId: 1,
            title: 'Client Directory',
            gridProperties: { rowCount: Math.max(60, clients.length + 20), columnCount: 14 },
          },
        },
        {
          properties: {
            sheetId: 2,
            title: 'Payment History',
            gridProperties: { rowCount: Math.max(60, allInvoices.length + 20), columnCount: 16 },
          },
        },
      ],
    };

    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPayload),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      let parsedMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        parsedMessage = errorJson.error?.message || errorText;
      } catch {
        // ignore json parse error
      }
      throw new Error(`Google Sheets API Error (${createResponse.status}): ${parsedMessage}`);
    }

    const createdSheet = await createResponse.json();
    const spreadsheetId: string = createdSheet.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 3. Prepare data rows
    if (onProgress) onProgress('populating', 'Populating client records and payment history...');

    // Summary Tab data
    const summaryRows = [
      ['INVOX SAAS - FINANCIAL & CLIENT REPORT', ''],
      ['Organization Name', org.name],
      ['Legal Entity', org.legalName || 'N/A'],
      ['Tax / VAT Identifier', org.taxId || 'N/A'],
      ['Billing Currency', org.currency],
      ['Export Timestamp', `${dateStr} ${timeStr}`],
      ['Exported By', `${currentUser.name} (${currentUser.role.replace('_', ' ').toUpperCase()})`],
      ['Total Active Clients', clients.length],
      ['Total Invoices Issued', allInvoices.length],
      ['Paid Invoices Count', paidInvoices.length],
      ['Total Paid Revenue Collected', `${org.currency} ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ['Total Lifetime Invoiced Amount', `${org.currency} ${totalLifetimeInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ['Outstanding / Sent Invoices', pendingInvoices.length],
      ['Overdue Invoices Count', overdueInvoices.length],
      ['Overdue Receivables', `${org.currency} ${overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ['', ''],
      ['Report Generated From', 'Invox Enterprise Multi-Tenant Invoicing Platform'],
    ];

    // Client Directory Tab data
    const clientHeaders = [
      'Client ID',
      'Contact Name',
      'Company Name',
      'Billing Email',
      'Phone Number',
      'Tax / VAT ID',
      'Address',
      'City',
      'Country',
      'Currency',
      'Lifetime Invoiced',
      'Client Since',
    ];

    const clientRows = clients.map((c) => [
      c.id,
      c.name,
      c.companyName || '—',
      c.email,
      c.phone || '—',
      c.taxId || '—',
      c.address || '—',
      c.city || '—',
      c.country,
      c.currency,
      c.totalInvoiced,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—',
    ]);

    // Payment History Tab data
    const invoiceHeaders = [
      'Invoice #',
      'Client Name',
      'Client Email',
      'Status',
      'Issue Date',
      'Due Date',
      'Subtotal',
      'Tax Amount',
      'Discount',
      'Total Amount',
      'Currency',
      'Paid Date',
      'Payment Method',
      'Transaction Ref',
      'Invoice Notes',
    ];

    const invoiceRows = allInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.clientName,
      inv.clientEmail,
      inv.status.toUpperCase(),
      inv.issueDate,
      inv.dueDate,
      inv.subtotal,
      inv.totalTax,
      inv.totalDiscount,
      inv.totalAmount,
      inv.currency,
      inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : '—',
      inv.paymentMethodUsed || (inv.status === 'paid' ? 'Credit Card / Stripe' : '—'),
      inv.paymentTransactionId || '—',
      inv.notes || '—',
    ]);

    // Batch update values
    const valuePayload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: "'Executive Summary'!A1:B17",
          values: summaryRows,
        },
        {
          range: `'Client Directory'!A1:L${clientRows.length + 1}`,
          values: [clientHeaders, ...clientRows],
        },
        {
          range: `'Payment History'!A1:O${invoiceRows.length + 1}`,
          values: [invoiceHeaders, ...invoiceRows],
        },
      ],
    };

    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(valuePayload),
      }
    );

    if (!updateResponse.ok) {
      console.warn('Batch update values warning:', await updateResponse.text());
    }

    // 4. Polish with header styling and auto-resize
    if (onProgress) onProgress('formatting', 'Applying table formatting and column styling...');

    try {
      const formatPayload = {
        requests: [
          // Bold title in Executive Summary
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 2,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.19, green: 0.24, blue: 0.36 },
                  textFormat: {
                    bold: true,
                    fontSize: 12,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Header formatting for Client Directory
          {
            repeatCell: {
              range: {
                sheetId: 1,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 12,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.26, green: 0.35, blue: 0.85 }, // Indigo-600
                  textFormat: {
                    bold: true,
                    fontSize: 10,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Header formatting for Payment History
          {
            repeatCell: {
              range: {
                sheetId: 2,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 15,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.06, green: 0.55, blue: 0.42 }, // Emerald-600
                  textFormat: {
                    bold: true,
                    fontSize: 10,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      };

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formatPayload),
      });
    } catch (fmtErr) {
      console.warn('Formatting warning (non-fatal):', fmtErr);
    }

    if (onProgress) onProgress('completed', 'Google Sheet successfully generated!');

    // 5. Add audit log
    storageService.addAuditLog({
      organizationId: org.id,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action: 'DATA_EXPORTED',
      resourceType: 'report',
      resourceId: spreadsheetId,
      status: 'success',
      details: `Exported ${clients.length} clients and ${allInvoices.length} payment records (${org.currency} ${totalCollected.toLocaleString()} collected) to Google Sheet: "${spreadsheetTitle}"`,
    });

    return {
      spreadsheetId,
      spreadsheetUrl,
      title: spreadsheetTitle,
      exportedAt: now.toISOString(),
      clientCount: clients.length,
      invoiceCount: allInvoices.length,
      totalCollected,
      currency: org.currency,
    };
  }
}

export const googleSheetsService = new GoogleSheetsService();
