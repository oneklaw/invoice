import { jsPDF } from 'jspdf';
import { Invoice, OrganizationSettings, User } from '../types';
import { getAccessToken, googleSignIn, isGoogleConnected } from './googleAuthService';
import { storageService } from './storage';

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  folderId: string;
  folderName: string;
}

export class GoogleDriveService {
  /**
   * Generates a clean PDF binary for an invoice using jsPDF
   */
  public generateInvoicePdfBlob(invoice: Invoice, org: OrganizationSettings): Blob {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Organization Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(org.name || 'Enterprise Invoicing', 20, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate-500
    y += 6;
    if (org.legalName && org.legalName !== org.name) {
      doc.text(org.legalName, 20, y);
      y += 5;
    }
    if (org.address?.line1) {
      doc.text(`${org.address.line1}, ${org.address.city || ''} ${org.address.postalCode || ''}`, 20, y);
      y += 5;
    }
    if (org.taxId) {
      doc.text(`Tax / VAT ID: ${org.taxId}`, 20, y);
      y += 5;
    }
    if (org.email) {
      doc.text(`Email: ${org.email}`, 20, y);
      y += 5;
    }

    // Invoice Meta (Top Right)
    const rightX = pageWidth - 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('INVOICE', rightX, 20, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`#${invoice.invoiceNumber}`, rightX, 27, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Issue Date: ${invoice.issueDate}`, rightX, 33, { align: 'right' });
    doc.text(`Due Date: ${invoice.dueDate}`, rightX, 38, { align: 'right' });
    doc.text(`Status: ${invoice.status.toUpperCase()}`, rightX, 43, { align: 'right' });
    if (invoice.poNumber) {
      doc.text(`PO Number: ${invoice.poNumber}`, rightX, 48, { align: 'right' });
    }

    // Divider Line
    y = Math.max(y + 8, 55);
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);

    // Bill To Section
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('BILLED TO:', 20, y);

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(invoice.clientName || 'Valued Client', 20, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    if (invoice.clientEmail) {
      y += 5;
      doc.text(invoice.clientEmail, 20, y);
    }
    if (invoice.clientAddress) {
      y += 5;
      doc.text(invoice.clientAddress, 20, y);
    }
    if (invoice.clientTaxId) {
      y += 5;
      doc.text(`Client Tax ID: ${invoice.clientTaxId}`, 20, y);
    }

    // Line Items Table Header
    y += 12;
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(20, y - 4, pageWidth - 40, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('DESCRIPTION', 24, y + 1);
    doc.text('QTY', pageWidth - 80, y + 1, { align: 'right' });
    doc.text('PRICE', pageWidth - 50, y + 1, { align: 'right' });
    doc.text('TOTAL', pageWidth - 24, y + 1, { align: 'right' });

    // Table rows
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    const currencySymbol = invoice.currency || org.currency || 'USD';

    (invoice.items || []).forEach((item) => {
      // Description
      const desc = item.description || 'Service/Item';
      const truncated = desc.length > 45 ? desc.substring(0, 42) + '...' : desc;
      doc.text(truncated, 24, y);
      doc.text(String(item.quantity || 1), pageWidth - 80, y, { align: 'right' });
      doc.text(`${(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 50, y, { align: 'right' });
      doc.text(`${(item.amount || (item.quantity * item.unitPrice) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 24, y, { align: 'right' });

      y += 6;
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });

    // Divider Line
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y, pageWidth - 20, y);

    // Totals section
    y += 6;
    const totalsX = pageWidth - 65;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);

    doc.text('Subtotal:', totalsX, y);
    doc.text(`${(invoice.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currencySymbol}`, pageWidth - 24, y, { align: 'right' });

    if (invoice.totalDiscount > 0) {
      y += 5;
      doc.text('Discount:', totalsX, y);
      doc.text(`-${(invoice.totalDiscount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currencySymbol}`, pageWidth - 24, y, { align: 'right' });
    }

    if (invoice.totalTax > 0) {
      y += 5;
      doc.text('Tax / VAT:', totalsX, y);
      doc.text(`+${(invoice.totalTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currencySymbol}`, pageWidth - 24, y, { align: 'right' });
    }

    if (invoice.shippingFee > 0) {
      y += 5;
      doc.text('Shipping:', totalsX, y);
      doc.text(`+${(invoice.shippingFee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currencySymbol}`, pageWidth - 24, y, { align: 'right' });
    }

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Total Due:', totalsX, y);
    doc.setTextColor(79, 70, 229);
    doc.text(`${(invoice.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currencySymbol}`, pageWidth - 24, y, { align: 'right' });

    // Payment details & notes
    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('PAYMENT INSTRUCTIONS & BANK DETAILS', 20, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const bank = invoice.bankDetailsOverride || org.bankDetails;
    if (bank) {
      if (bank.bankName) {
        doc.text(`Bank: ${bank.bankName} | Holder: ${bank.accountHolderName}`, 20, y);
        y += 4;
      }
      if (bank.iban) {
        doc.text(`IBAN: ${bank.iban} | SWIFT/BIC: ${bank.swiftBic}`, 20, y);
        y += 4;
      }
    }
    if (org.defaultPaymentTerms) {
      doc.text(`Payment Terms: ${org.defaultPaymentTerms}`, 20, y);
      y += 4;
    }
    if (invoice.notes) {
      doc.text(`Notes: ${invoice.notes}`, 20, y);
      y += 4;
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated automatically by Enterprise Cloud Invoicing System. Thank you for your business.', pageWidth / 2, 285, { align: 'center' });

    return doc.output('blob');
  }

  /**
   * Finds or creates a designated folder in Google Drive
   */
  public async getOrCreateDesignatedFolder(
    folderName: string,
    token: string
  ): Promise<{ folderId: string; webViewLink?: string }> {
    // 1. Search for existing folder
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    )}&fields=files(id,name,webViewLink)`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          folderId: data.files[0].id,
          webViewLink: data.files[0].webViewLink,
        };
      }
    }

    // 2. Folder does not exist, create it
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create Google Drive folder: ${errText}`);
    }

    const folderData = await createRes.json();
    return {
      folderId: folderData.id,
      webViewLink: folderData.webViewLink,
    };
  }

  /**
   * Uploads an invoice PDF file to Google Drive
   */
  public async uploadInvoicePdfToDrive(
    invoice: Invoice,
    org: OrganizationSettings,
    actor?: User
  ): Promise<DriveUploadResult> {
    // 1. Acquire Token
    let token = getAccessToken();
    if (!token) {
      const authResult = await googleSignIn();
      if (!authResult || !authResult.accessToken) {
        throw new Error('Google authorization is required to save invoice PDFs to Google Drive.');
      }
      token = authResult.accessToken;
    }

    // 2. Resolve Designated Folder
    const designatedFolderName =
      org.googleDriveIntegration?.folderName || `Invoices - ${org.name || 'Company'}`;
    const { folderId } = await this.getOrCreateDesignatedFolder(designatedFolderName, token);

    // 3. Generate PDF Blob
    const pdfBlob = this.generateInvoicePdfBlob(invoice, org);
    const fileName = `Invoice-${invoice.invoiceNumber || invoice.id}.pdf`;

    // 4. Perform Multipart Upload to Google Drive
    const metadata = {
      name: fileName,
      mimeType: 'application/pdf',
      parents: [folderId],
      description: `Automated invoice PDF generated on ${new Date().toISOString()} for ${invoice.clientName} (${invoice.totalAmount} ${invoice.currency})`,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const mediaHeader = `${delimiter}Content-Type: application/pdf\r\n\r\n`;

    const pdfArrayBuffer = await pdfBlob.arrayBuffer();

    // Assemble multipart payload using Uint8Array
    const enc = new TextEncoder();
    const metaBytes = enc.encode(metadataPart);
    const mediaHeaderBytes = enc.encode(mediaHeader);
    const closeBytes = enc.encode(closeDelimiter);

    const totalLen = metaBytes.length + mediaHeaderBytes.length + pdfArrayBuffer.byteLength + closeBytes.length;
    const bodyBuffer = new Uint8Array(totalLen);
    let offset = 0;

    bodyBuffer.set(metaBytes, offset);
    offset += metaBytes.length;
    bodyBuffer.set(mediaHeaderBytes, offset);
    offset += mediaHeaderBytes.length;
    bodyBuffer.set(new Uint8Array(pdfArrayBuffer), offset);
    offset += pdfArrayBuffer.byteLength;
    bodyBuffer.set(closeBytes, offset);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink';
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: bodyBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Google Drive API upload failed: ${errText}`);
    }

    const driveFile = await uploadRes.json();

    // 5. Update invoice record with Drive info
    const updatedInvoice: Invoice = {
      ...invoice,
      googleDriveFileId: driveFile.id,
      googleDriveLink: driveFile.webViewLink,
      googleDriveUploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storageService.saveInvoice(updatedInvoice);

    // 6. Update organization settings with folder info
    const currentDriveConfig = org.googleDriveIntegration || {
      enabled: true,
      folderName: designatedFolderName,
      autoUploadOnInvoiceCreate: true,
    };
    const updatedOrg: OrganizationSettings = {
      ...org,
      googleDriveIntegration: {
        ...currentDriveConfig,
        enabled: true,
        folderName: designatedFolderName,
        folderId,
        lastSyncAt: new Date().toISOString(),
      },
    };
    storageService.saveOrganization(updatedOrg);

    // 7. Audit Log
    if (actor) {
      storageService.addAuditLog({
        organizationId: org.id,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'GOOGLE_DRIVE_SYNCED',
        resourceType: 'drive',
        resourceId: driveFile.id,
        status: 'success',
        details: `Saved invoice PDF '${fileName}' into Google Drive folder '${designatedFolderName}'`,
      });
    }

    // 8. Dispatch notification event
    window.dispatchEvent(
      new CustomEvent('invox:drive_synced', {
        detail: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          fileId: driveFile.id,
          webViewLink: driveFile.webViewLink,
          folderName: designatedFolderName,
        },
      })
    );

    return {
      fileId: driveFile.id,
      fileName,
      webViewLink: driveFile.webViewLink,
      folderId,
      folderName: designatedFolderName,
    };
  }

  /**
   * Generates a single merged multi-page PDF document containing all selected invoices
   */
  public generateMergedInvoicesPdfBlob(invoices: Invoice[], org: OrganizationSettings): Blob {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    invoices.forEach((inv, index) => {
      if (index > 0) {
        doc.addPage();
      }

      let y = 20;

      // Organization Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text(org.name || 'Enterprise Invoicing', 20, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      y += 6;
      if (org.taxId) {
        doc.text(`Tax ID: ${org.taxId}`, 20, y);
        y += 5;
      }
      if (org.email) {
        doc.text(`Email: ${org.email}`, 20, y);
        y += 5;
      }

      // Invoice Meta (Top Right)
      const rightX = pageWidth - 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(79, 70, 229);
      doc.text(`INVOICE ${inv.invoiceNumber}`, rightX, 20, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Status: ${inv.status.toUpperCase()}`, rightX, 26, { align: 'right' });
      doc.text(`Issue Date: ${inv.issueDate}`, rightX, 31, { align: 'right' });
      doc.text(`Due Date: ${inv.dueDate}`, rightX, 36, { align: 'right' });

      // Client info
      y += 10;
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y, rightX, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('Billed To:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(inv.clientName, 45, y);
      y += 5;
      if (inv.clientEmail) {
        doc.text(inv.clientEmail, 45, y);
        y += 5;
      }
      if (inv.clientAddress) {
        doc.text(inv.clientAddress, 45, y);
        y += 7;
      }

      // Line items table
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, rightX - 20, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('DESCRIPTION', 23, y + 5);
      doc.text('QTY', 110, y + 5);
      doc.text('UNIT PRICE', 130, y + 5);
      doc.text('AMOUNT', rightX - 3, y + 5, { align: 'right' });
      y += 9;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      (inv.items || []).forEach((item) => {
        doc.text(item.description, 23, y);
        doc.text(String(item.quantity), 110, y);
        doc.text(`${inv.currency} ${item.unitPrice.toLocaleString()}`, 130, y);
        doc.text(`${inv.currency} ${item.amount.toLocaleString()}`, rightX - 3, y, { align: 'right' });
        y += 6;
      });

      y += 4;
      doc.line(20, y, rightX, y);
      y += 6;

      // Totals
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(79, 70, 229);
      doc.text(`Total Due: ${inv.currency} ${inv.totalAmount.toLocaleString()}`, rightX, y, { align: 'right' });
    });

    return doc.output('blob');
  }

  public downloadMergedInvoicesPdf(invoices: Invoice[], org: OrganizationSettings): void {
    const blob = this.generateMergedInvoicesPdfBlob(invoices, org);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Batch_Invoices_${org.slug}_${invoices.length}_records.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const googleDriveService = new GoogleDriveService();

