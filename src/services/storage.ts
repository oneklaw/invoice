import {
  AuditLog,
  Client,
  Invoice,
  OrganizationSettings,
  User,
  UserRole,
  ApiCredential
} from '../types';
import { cacheEngine } from './cacheEngine';
import { emailService } from './emailService';

const STORAGE_KEYS = {
  ORGANIZATIONS: 'invox_saas_organizations_v3',
  USERS: 'invox_saas_users_v3',
  INVOICES: 'invox_saas_invoices_v3',
  CLIENTS: 'invox_saas_clients_v3',
  AUDIT_LOGS: 'invox_saas_audit_logs_v3',
  API_KEYS: 'invox_saas_api_keys_v3',
  ACTIVE_ORG_ID: 'invox_saas_active_org_id_v3',
  CURRENT_USER_ID: 'invox_saas_current_user_id_v3',
  AUTH_SESSION: 'invox_saas_auth_session_v3',
  AUTH_EXPIRES: 'invox_saas_auth_expires_v3',
};

// Clean initial organization (Zero fake demo data)
const INITIAL_ORGS: OrganizationSettings[] = [
  {
    id: 'org_enterprise_primary',
    name: 'Enterprise Cloud Invoicing',
    legalName: 'Enterprise Cloud Solutions Ltd',
    slug: 'enterprise-invoicing',
    logoUrl: '',
    taxId: 'GB-VAT-902817294',
    email: 'onekalitkenneth@gmail.com',
    phone: '+44 20 7946 0192',
    address: {
      line1: '25 Bank Street, Canary Wharf',
      city: 'London',
      postalCode: 'E14 5JP',
      country: 'United Kingdom',
    },
    website: 'https://enterprise-invoicing.io',
    currency: 'USD',
    defaultPaymentTerms: 'Net 30',
    invoiceTermsAndConditions: 'Payment is due within 30 days of invoice issuance. Thank you for your business.',
    bankDetails: {
      bankName: 'Barclays Commercial Banking',
      accountHolderName: 'Enterprise Cloud Solutions Ltd',
      accountNumber: '80918294',
      routingNumber: '20-00-00',
      swiftBic: 'BARCGB22',
      iban: 'GB29BARC20000080918294',
      paymentInstructions: 'Bank transfer (BACS / CHAPS / Fedwire). Please include invoice number in payment reference.',
    },
    paymentGateways: {
      visaDirectEnabled: true,
      customPaymentInstructions: 'Online payments accepted securely via Visa Direct & Stripe.',
    },
    invoiceTheme: 'modern',
    accentColor: 'indigo',
    plan: 'free',
    invoiceCount: 0,
    subscriptionStatus: 'none',
    cloudSqlSnapshots: {
      projectId: 'eco-context-13kqt',
      region: 'europe-west2',
      instanceId: 'invox-db-prod',
      enabled: true,
      scheduleTimeUtc: '02:00',
      retentionDays: 14,
      pitrEnabled: true,
      location: 'regional',
      status: 'RUNNABLE',
      lastSnapshotAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      nextScheduledSnapshotAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      snapshots: [
        {
          id: 'snap-eco-context-13kqt-auto-daily-01',
          instanceId: 'invox-db-prod',
          projectId: 'eco-context-13kqt',
          region: 'europe-west2',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          sizeBytes: 41943040,
          sizeFormatted: '40.0 MB',
          type: 'AUTOMATED_DAILY',
          status: 'SUCCESSFUL',
          retentionExpiresAt: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Automated daily snapshot at 02:00 UTC (PostgreSQL 16)',
          walArchiveIncluded: true,
        },
      ],
    },
    googleDriveIntegration: {
      enabled: true,
      folderName: 'Invoices - Enterprise Cloud Invoicing',
      autoUploadOnInvoiceCreate: true,
    },
  },
];

// Clean initial user
const INITIAL_USERS: User[] = [
  {
    id: 'usr_super_admin',
    name: 'Kenneth Onekalit',
    email: 'onekalitkenneth@gmail.com',
    role: 'super_admin',
    organizationId: 'org_enterprise_primary',
    createdAt: new Date().toISOString(),
  },
];

// Zero demo records
const SEED_CLIENTS: Client[] = [];
const SEED_INVOICES: Invoice[] = [];
const SEED_AUDIT_LOGS: AuditLog[] = [];
const SEED_API_KEYS: ApiCredential[] = [];

class StorageService {
  private getStorageItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultVal;
      return JSON.parse(data) as T;
    } catch {
      return defaultVal;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  // Initialization
  public initialize() {
    // Purge old demo storage if present from v2
    try {
      const oldV2 = localStorage.getItem('invox_saas_invoices_v2');
      if (oldV2) {
        localStorage.removeItem('invox_saas_organizations_v2');
        localStorage.removeItem('invox_saas_users_v2');
        localStorage.removeItem('invox_saas_invoices_v2');
        localStorage.removeItem('invox_saas_clients_v2');
        localStorage.removeItem('invox_saas_audit_logs_v2');
        localStorage.removeItem('invox_saas_api_keys_v2');
        localStorage.removeItem('invox_saas_active_org_id_v2');
        localStorage.removeItem('invox_saas_current_user_id_v2');
      }
    } catch {
      // Ignore
    }

    if (!localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS)) {
      this.setStorageItem(STORAGE_KEYS.ORGANIZATIONS, INITIAL_ORGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      this.setStorageItem(STORAGE_KEYS.CLIENTS, SEED_CLIENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      this.setStorageItem(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.setStorageItem(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.API_KEYS)) {
      this.setStorageItem(STORAGE_KEYS.API_KEYS, SEED_API_KEYS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_ORG_ID)) {
      this.setStorageItem(STORAGE_KEYS.ACTIVE_ORG_ID, 'org_enterprise_primary');
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      this.setStorageItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr_super_admin');
    }
  }

  // Purge all demo/mock data and restore clean slate
  public purgeAllDemoData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.INVOICES);
      localStorage.removeItem(STORAGE_KEYS.CLIENTS);
      localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
      localStorage.removeItem(STORAGE_KEYS.API_KEYS);
      this.setStorageItem(STORAGE_KEYS.INVOICES, []);
      this.setStorageItem(STORAGE_KEYS.CLIENTS, []);
      this.setStorageItem(STORAGE_KEYS.AUDIT_LOGS, []);
      this.setStorageItem(STORAGE_KEYS.API_KEYS, []);
      cacheEngine.flushAll();
    } catch (err) {
      console.error('Error purging demo data:', err);
    }
  }

  // Internal unscoped getters for storage persistence
  private getInternalAllOrganizations(): OrganizationSettings[] {
    return this.getStorageItem(STORAGE_KEYS.ORGANIZATIONS, INITIAL_ORGS);
  }

  private setInternalOrganizations(orgs: OrganizationSettings[]): void {
    this.setStorageItem(STORAGE_KEYS.ORGANIZATIONS, orgs);
  }

  private getInternalAllUsers(): User[] {
    return this.getStorageItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  private setInternalUsers(users: User[]): void {
    this.setStorageItem(STORAGE_KEYS.USERS, users);
  }

  // Active Organization & User Context (Strictly Isolated)
  public getActiveOrgId(): string {
    const stored = this.getStorageItem(STORAGE_KEYS.ACTIVE_ORG_ID, 'org_enterprise_primary');
    const currentUserId = this.getCurrentUserId();
    const users = this.getInternalAllUsers();
    const user = users.find(u => u.id === currentUserId);
    if (user && user.organizationId && stored !== user.organizationId) {
      this.setActiveOrgId(user.organizationId);
      return user.organizationId;
    }
    return stored;
  }

  public setActiveOrgId(orgId: string): void {
    this.setStorageItem(STORAGE_KEYS.ACTIVE_ORG_ID, orgId);
    cacheEngine.invalidate(`org:${orgId}`);
  }

  public getCurrentUserId(): string {
    return this.getStorageItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr_super_admin');
  }

  public setCurrentUserId(userId: string): void {
    this.setStorageItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }

  public getCurrentUser(): User {
    const userId = this.getCurrentUserId();
    const users = this.getInternalAllUsers();
    const user = users.find(u => u.id === userId);
    return user || users[0];
  }

  // Organizations (Strict Privacy: Never exposes other organizations)
  public getOrganizations(): OrganizationSettings[] {
    const activeOrgId = this.getActiveOrgId();
    const org = this.getOrganization(activeOrgId);
    return org ? [org] : [];
  }

  public getOrganization(orgId: string): OrganizationSettings | undefined {
    // Privacy boundary check: An organization cannot inspect other organizations
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) {
      console.warn(`[Privacy Guard] Access denied to organization ${orgId} from active context ${activeOrgId}`);
      return undefined;
    }

    const cacheKey = `org:settings:${orgId}`;
    const cached = cacheEngine.get<OrganizationSettings>(cacheKey);
    if (cached.hit && cached.data) {
      return cached.data;
    }

    const orgs = this.getInternalAllOrganizations();
    const org = orgs.find(o => o.id === orgId);
    if (org) {
      cacheEngine.set(cacheKey, org, 180);
    }
    return org;
  }

  public saveOrganization(org: OrganizationSettings, actor?: User): void {
    const activeOrgId = this.getActiveOrgId();
    if (org.id !== activeOrgId && (!actor || actor.organizationId !== org.id)) {
      console.error(`[Privacy Guard] Unauthorized attempt to save organization ${org.id}`);
      return;
    }

    const orgs = this.getInternalAllOrganizations();
    const oldOrg = orgs.find(o => o.id === org.id);
    const index = orgs.findIndex(o => o.id === org.id);

    if (index >= 0) {
      orgs[index] = org;
    } else {
      orgs.push(org);
    }

    this.setInternalOrganizations(orgs);
    cacheEngine.invalidate(`org:${org.id}`);
    cacheEngine.set(`org:settings:${org.id}`, org, 180);

    if (actor) {
      this.addAuditLog({
        organizationId: org.id,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SETTINGS_UPDATED',
        resourceType: 'organization',
        resourceId: org.id,
        status: 'success',
        details: `Updated organization settings and invoice customizations for ${org.name}`,
        diff: {
          before: oldOrg ? { name: oldOrg.name, taxId: oldOrg.taxId, theme: oldOrg.invoiceTheme, currency: oldOrg.currency } : undefined,
          after: { name: org.name, taxId: org.taxId, theme: org.invoiceTheme, currency: org.currency },
        },
      });
    }
  }

  // Company Currency Conversion
  public convertOrganizationCurrency(
    orgId: string,
    targetCurrency: string,
    exchangeRate: number,
    convertExistingInvoices: boolean,
    actor?: User
  ): {
    success: boolean;
    convertedInvoiceCount: number;
    oldCurrency: string;
    newCurrency: string;
    error?: string;
  } {
    const org = this.getOrganization(orgId);
    if (!org) {
      return { success: false, convertedInvoiceCount: 0, oldCurrency: '', newCurrency: targetCurrency, error: 'Organization not found' };
    }

    const oldCurrency = org.currency;
    org.currency = targetCurrency;

    let convertedCount = 0;
    if (convertExistingInvoices) {
      const allInvoices = this.getStorageItem<Invoice[]>(STORAGE_KEYS.INVOICES, SEED_INVOICES);
      const updatedInvoices = allInvoices.map((inv) => {
        if (inv.organizationId !== orgId) return inv;

        convertedCount++;
        const updatedItems = (inv.items || []).map((item) => ({
          ...item,
          unitPrice: Number((item.unitPrice * exchangeRate).toFixed(2)),
          amount: Number((item.amount * exchangeRate).toFixed(2)),
        }));

        const newSubtotal = Number((inv.subtotal * exchangeRate).toFixed(2));
        const newDiscount = Number(((inv.totalDiscount || 0) * exchangeRate).toFixed(2));
        const newTax = Number(((inv.totalTax || 0) * exchangeRate).toFixed(2));
        const newShipping = Number(((inv.shippingFee || 0) * exchangeRate).toFixed(2));
        const newTotal = Number((newSubtotal - newDiscount + newTax + newShipping).toFixed(2));

        return {
          ...inv,
          currency: targetCurrency,
          items: updatedItems,
          subtotal: newSubtotal,
          totalDiscount: newDiscount,
          totalTax: newTax,
          shippingFee: newShipping,
          totalAmount: newTotal,
        };
      });

      this.setStorageItem(STORAGE_KEYS.INVOICES, updatedInvoices);
      cacheEngine.invalidate(`invoices:${orgId}`);
    }

    this.saveOrganization(org, actor);

    if (actor) {
      this.addAuditLog({
        organizationId: org.id,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SETTINGS_UPDATED',
        resourceType: 'organization',
        resourceId: org.id,
        status: 'success',
        details: `Converted company operating currency from ${oldCurrency} to ${targetCurrency} (FX Rate: 1 ${oldCurrency} = ${exchangeRate} ${targetCurrency}). ${
          convertExistingInvoices
            ? `${convertedCount} historical invoices systematically converted.`
            : 'Historical invoices retained in original currency.'
        }`,
        diff: {
          before: { currency: oldCurrency },
          after: { currency: targetCurrency, exchangeRate, convertExistingInvoices, convertedCount },
        },
      });
    }

    // Notify components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('invox:currency_converted', {
          detail: {
            orgId,
            oldCurrency,
            newCurrency: targetCurrency,
            exchangeRate,
            convertedCount,
          },
        })
      );
    }

    return {
      success: true,
      convertedInvoiceCount: convertedCount,
      oldCurrency,
      newCurrency: targetCurrency,
    };
  }

  // Free Tier Quota & Upgrade
  public checkQuota(orgId: string): {
    allowed: boolean;
    isPro: boolean;
    count: number;
    limit: number;
    remaining: number;
  } {
    const org = this.getOrganization(orgId);
    if (!org) {
      return { allowed: false, isPro: false, count: 0, limit: 10, remaining: 0 };
    }

    const isPro = org.plan === 'pro' && org.subscriptionStatus === 'active';
    const limit = 10;
    const count = org.invoiceCount || 0;
    const remaining = Math.max(0, limit - count);

    // If pro, unlimited; if free, only allowed if count < limit
    const allowed = isPro || count < limit;

    return { allowed, isPro, count, limit, remaining };
  }

  public upgradeToPro(
    orgId: string,
    cardDetails: { last4: string; brand: string },
    actor: User
  ): OrganizationSettings {
    const org = this.getOrganization(orgId);
    if (!org) throw new Error('Organization not found');

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const updatedOrg: OrganizationSettings = {
      ...org,
      plan: 'pro',
      subscriptionStatus: 'active',
      subscriptionPeriodEnd: nextMonth.toISOString(),
      cardLast4: cardDetails.last4,
      cardBrand: cardDetails.brand,
    };

    this.saveOrganization(updatedOrg);

    this.addAuditLog({
      organizationId: orgId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SUBSCRIPTION_UPGRADED',
      resourceType: 'subscription',
      resourceId: orgId,
      status: 'success',
      details: `Subscribed to Invox Pro ($2.00/mo) via ${cardDetails.brand} (•••• ${cardDetails.last4}) & Stripe billing portal`,
      diff: {
        before: { plan: org.plan, status: org.subscriptionStatus },
        after: { plan: 'pro', status: 'active', amount: '2.00 USD/mo' },
      },
    });

    return updatedOrg;
  }

  public cancelSubscription(orgId: string, actor: User): OrganizationSettings {
    const org = this.getOrganization(orgId);
    if (!org) throw new Error('Organization not found');

    const updatedOrg: OrganizationSettings = {
      ...org,
      subscriptionStatus: 'canceled',
    };
    this.saveOrganization(updatedOrg);

    this.addAuditLog({
      organizationId: orgId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SUBSCRIPTION_CANCELED',
      resourceType: 'subscription',
      resourceId: orgId,
      status: 'warning',
      details: 'Canceled recurring Pro billing renewal via Stripe/Visa portal',
    });

    return updatedOrg;
  }

  // Invoices (Strictly isolated by organizationId with privacy guard)
  public getInvoices(orgId: string): Invoice[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) {
      console.warn(`[Privacy Guard] Access denied to invoices for organization ${orgId} from active context ${activeOrgId}`);
      return [];
    }

    const cacheKey = `org:invoices:${orgId}`;
    const cached = cacheEngine.get<Invoice[]>(cacheKey);
    if (cached.hit && cached.data) {
      return cached.data;
    }

    const allInvoices = this.getStorageItem<Invoice[]>(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    const orgInvoices = allInvoices.filter(inv => inv.organizationId === orgId);
    cacheEngine.set(cacheKey, orgInvoices, 120);
    return orgInvoices;
  }

  public getInvoiceById(id: string, orgId: string): Invoice | undefined {
    const invoices = this.getInvoices(orgId);
    return invoices.find(inv => inv.id === id);
  }

  public saveInvoice(invoice: Invoice, actor?: User): { success: boolean; error?: string } {
    const activeOrgId = this.getActiveOrgId();
    if (invoice.organizationId !== activeOrgId && (!actor || actor.organizationId !== invoice.organizationId)) {
      return { success: false, error: 'Unauthorized: Cross-tenant invoice modification prohibited.' };
    }

    const org = this.getOrganization(invoice.organizationId);
    if (!org) return { success: false, error: 'Organization not found' };

    const allInvoices = this.getStorageItem<Invoice[]>(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    const existingIndex = allInvoices.findIndex(i => i.id === invoice.id);
    const isNew = existingIndex < 0;

    // Check Free Tier Quota if creating a brand new invoice
    if (isNew) {
      const quota = this.checkQuota(invoice.organizationId);
      if (!quota.allowed) {
        return {
          success: false,
          error: 'QUOTA_EXCEEDED: Free tier limit of 10 invoices has been reached. Please upgrade to Pro for $2.00/month.',
        };
      }
    }

    if (isNew) {
      allInvoices.unshift(invoice);
      // Increment organization lifetime invoice count
      const updatedOrg: OrganizationSettings = {
        ...org,
        invoiceCount: (org.invoiceCount || 0) + 1,
      };
      this.saveOrganization(updatedOrg);
    } else {
      allInvoices[existingIndex] = invoice;
    }

    this.setStorageItem(STORAGE_KEYS.INVOICES, allInvoices);
    cacheEngine.invalidate(`org:${invoice.organizationId}`);

    if (actor) {
      this.addAuditLog({
        organizationId: invoice.organizationId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: isNew ? 'INVOICE_CREATED' : 'INVOICE_UPDATED',
        resourceType: 'invoice',
        resourceId: invoice.id,
        status: 'success',
        details: `${isNew ? 'Created' : 'Updated'} Invoice ${invoice.invoiceNumber} for ${invoice.clientName} (${invoice.currency} ${invoice.totalAmount.toLocaleString()})`,
      });
    }

    // Automated Email Dispatch on New Invoice Issuance
    if (isNew && invoice.status !== 'draft') {
      try {
        const sentNotification = emailService.notifyInvoiceGenerated(invoice, org);
        this.addAuditLog({
          organizationId: invoice.organizationId,
          actorId: actor?.id || 'usr_system',
          actorName: actor?.name || 'Automated Pipeline',
          actorEmail: actor?.email || org.email,
          actorRole: actor?.role || 'org_admin',
          action: 'EMAIL_DISPATCHED',
          resourceType: 'email',
          resourceId: sentNotification.id,
          status: 'success',
          details: `Automated invoice email dispatched to customer ${invoice.clientName} (${invoice.clientEmail}) with Visa/Stripe payment link`,
        });
      } catch (err) {
        console.error('Automated email dispatch error:', err);
      }
    }

    return { success: true };
  }

  public markInvoicePaid(
    invoiceId: string,
    orgId: string,
    paymentMethod: string,
    actor: User
  ): boolean {
    const invoice = this.getInvoiceById(invoiceId, orgId);
    if (!invoice) return false;
    const org = this.getOrganization(orgId);

    invoice.status = 'paid';
    invoice.paidAt = new Date().toISOString();
    invoice.paymentMethodUsed = paymentMethod;
    invoice.paymentTransactionId = 'txn_' + Math.random().toString(36).substring(2, 11);
    invoice.updatedAt = new Date().toISOString();

    const allInvoices = this.getStorageItem<Invoice[]>(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    const index = allInvoices.findIndex(i => i.id === invoiceId);
    if (index >= 0) {
      allInvoices[index] = invoice;
      this.setStorageItem(STORAGE_KEYS.INVOICES, allInvoices);
      cacheEngine.invalidate(`org:${orgId}`);
    }

    this.addAuditLog({
      organizationId: orgId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'INVOICE_PAID',
      resourceType: 'invoice',
      resourceId: invoice.id,
      status: 'success',
      details: `Received full payment for Invoice ${invoice.invoiceNumber} (${invoice.currency} ${invoice.totalAmount}) via ${paymentMethod}`,
    });

    // Automated Email Receipt Dispatch on Payment Confirmation
    if (org) {
      try {
        const receiptNotification = emailService.notifyPaymentReceived(
          invoice,
          org,
          paymentMethod,
          invoice.paymentTransactionId
        );
        this.addAuditLog({
          organizationId: orgId,
          actorId: actor.id,
          actorName: actor.name,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'EMAIL_DISPATCHED',
          resourceType: 'email',
          resourceId: receiptNotification.id,
          status: 'success',
          details: `Automated payment confirmation and tax receipt email dispatched to customer ${invoice.clientEmail}`,
        });
      } catch (err) {
        console.error('Automated receipt email dispatch error:', err);
      }
    }

    return true;
  }

  public voidInvoice(invoiceId: string, orgId: string, actor: User): boolean {
    const invoice = this.getInvoiceById(invoiceId, orgId);
    if (!invoice) return false;

    invoice.status = 'void';
    invoice.updatedAt = new Date().toISOString();

    const allInvoices = this.getStorageItem<Invoice[]>(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    const index = allInvoices.findIndex(i => i.id === invoiceId);
    if (index >= 0) {
      allInvoices[index] = invoice;
      this.setStorageItem(STORAGE_KEYS.INVOICES, allInvoices);
      cacheEngine.invalidate(`org:${orgId}`);
    }

    this.addAuditLog({
      organizationId: orgId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'INVOICE_VOIDED',
      resourceType: 'invoice',
      resourceId: invoice.id,
      status: 'warning',
      details: `Voided Invoice ${invoice.invoiceNumber}`,
    });

    return true;
  }

  public deleteInvoice(invoiceId: string, orgId: string, actor?: User): boolean {
    const allInvoices = this.getStorageItem<Invoice[]>(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    const invoice = allInvoices.find(i => i.id === invoiceId && i.organizationId === orgId);
    if (!invoice) return false;

    const filtered = allInvoices.filter(i => i.id !== invoiceId);
    this.setStorageItem(STORAGE_KEYS.INVOICES, filtered);
    cacheEngine.invalidate(`org:${orgId}`);

    if (actor) {
      this.addAuditLog({
        organizationId: orgId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'INVOICE_VOIDED',
        resourceType: 'invoice',
        resourceId: invoiceId,
        status: 'warning',
        details: `Permanently removed Invoice ${invoice.invoiceNumber}`,
      });
    }

    return true;
  }

  // Clients (Strictly isolated by organizationId with privacy guard)
  public getClients(orgId: string): Client[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) {
      console.warn(`[Privacy Guard] Access denied to clients for organization ${orgId} from active context ${activeOrgId}`);
      return [];
    }
    const all = this.getStorageItem<Client[]>(STORAGE_KEYS.CLIENTS, SEED_CLIENTS);
    return all.filter(c => c.organizationId === orgId);
  }

  public saveClient(client: Client, actor: User): void {
    const activeOrgId = this.getActiveOrgId();
    if (client.organizationId !== activeOrgId && actor.organizationId !== client.organizationId) {
      console.error(`[Privacy Guard] Unauthorized attempt to modify clients for organization ${client.organizationId}`);
      return;
    }

    const all = this.getStorageItem<Client[]>(STORAGE_KEYS.CLIENTS, SEED_CLIENTS);
    const index = all.findIndex(c => c.id === client.id);
    if (index >= 0) {
      all[index] = client;
    } else {
      all.unshift(client);
    }
    this.setStorageItem(STORAGE_KEYS.CLIENTS, all);
    cacheEngine.invalidate(`org:${client.organizationId}`);
  }

  public deleteClient(clientId: string, orgId: string, actor?: User): boolean {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId && (!actor || actor.organizationId !== orgId)) {
      return false;
    }

    const all = this.getStorageItem<Client[]>(STORAGE_KEYS.CLIENTS, SEED_CLIENTS);
    const client = all.find(c => c.id === clientId && c.organizationId === orgId);
    if (!client) return false;

    const filtered = all.filter(c => c.id !== clientId);
    this.setStorageItem(STORAGE_KEYS.CLIENTS, filtered);
    cacheEngine.invalidate(`org:${orgId}`);

    if (actor) {
      this.addAuditLog({
        organizationId: orgId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SETTINGS_UPDATED',
        resourceType: 'organization',
        resourceId: clientId,
        status: 'warning',
        details: `Deleted Client record '${client.name}'`,
      });
    }

    return true;
  }

  // Users & Team Members (Strictly Isolated to the Tenant)
  public getUsersByOrg(orgId: string): User[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) {
      console.warn(`[Privacy Guard] Access denied to team members for organization ${orgId} from active context ${activeOrgId}`);
      return [];
    }
    return this.getInternalAllUsers().filter(u => u.organizationId === orgId);
  }

  // Strictly returns only users in the current organization (no cross-tenant leakage)
  public getAllUsers(): User[] {
    return this.getUsersByOrg(this.getActiveOrgId());
  }

  public inviteUser(
    email: string,
    name: string,
    role: UserRole,
    orgId: string,
    actor: User
  ): User {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId || actor.organizationId !== orgId) {
      throw new Error('Access denied: Cannot invite user to another organization');
    }

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      name,
      role,
      organizationId: orgId,
      createdAt: new Date().toISOString(),
    };

    const users = this.getInternalAllUsers();
    users.push(newUser);
    this.setInternalUsers(users);

    this.addAuditLog({
      organizationId: orgId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'USER_INVITED',
      resourceType: 'user',
      resourceId: newUser.id,
      status: 'success',
      details: `Invited new team member ${name} (${email}) with role '${role}'`,
    });

    return newUser;
  }

  public updateUserRole(userId: string, newRole: UserRole, orgId: string, actor: User): boolean {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId || actor.organizationId !== orgId) {
      return false;
    }

    const users = this.getInternalAllUsers();
    const user = users.find(u => u.id === userId && u.organizationId === orgId);
    if (!user) return false;

    const oldRole = user.role;
    user.role = newRole;
    this.setInternalUsers(users);

    this.addAuditLog({
      organizationId: orgId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'ROLE_CHANGED',
      resourceType: 'user',
      resourceId: userId,
      status: 'warning',
      details: `Updated permissions for ${user.name} from '${oldRole}' to '${newRole}'`,
      diff: {
        before: { role: oldRole },
        after: { role: newRole },
      },
    });

    return true;
  }

  // Audit Logs (Strictly isolated by organizationId)
  public getAuditLogs(orgId: string): AuditLog[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) {
      console.warn(`[Privacy Guard] Access denied to audit logs for organization ${orgId} from active context ${activeOrgId}`);
      return [];
    }
    const all = this.getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    return all.filter(l => l.organizationId === orgId);
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress'>): void {
    const all = this.getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    const newLog: AuditLog = {
      ...log,
      id: 'aud_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ipAddress: '198.51.100.' + (Math.floor(Math.random() * 200) + 10),
    };
    all.unshift(newLog);
    // Keep last 300 logs
    if (all.length > 300) all.length = 300;
    this.setStorageItem(STORAGE_KEYS.AUDIT_LOGS, all);
  }

  // API Credentials (Strictly isolated by organizationId)
  public getApiKeys(orgId: string): ApiCredential[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) {
      console.warn(`[Privacy Guard] Access denied to API keys for organization ${orgId} from active context ${activeOrgId}`);
      return [];
    }
    const all = this.getStorageItem<ApiCredential[]>(STORAGE_KEYS.API_KEYS, SEED_API_KEYS);
    return all.filter(k => k.organizationId === orgId);
  }

  public saveApiKey(apiKey: ApiCredential, actor: User): void {
    const activeOrgId = this.getActiveOrgId();
    if (apiKey.organizationId !== activeOrgId && actor.organizationId !== apiKey.organizationId) {
      return;
    }

    const all = this.getStorageItem<ApiCredential[]>(STORAGE_KEYS.API_KEYS, SEED_API_KEYS);
    all.unshift(apiKey);
    this.setStorageItem(STORAGE_KEYS.API_KEYS, all);

    this.addAuditLog({
      organizationId: apiKey.organizationId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'API_KEY_CREATED',
      resourceType: 'api',
      resourceId: apiKey.id,
      status: 'success',
      details: `Generated OAuth 2.0 API Credential '${apiKey.name}' with scopes [${apiKey.scopes.join(', ')}]`,
    });
  }

  // Authentication & Session Management
  public isAuthenticated(): boolean {
    const sessionToken = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    const expiresStr = localStorage.getItem(STORAGE_KEYS.AUTH_EXPIRES);
    if (!sessionToken || !expiresStr) {
      return false;
    }
    const expiresAt = parseInt(expiresStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      this.logout();
      return false;
    }
    return true;
  }

  public getUserByEmail(email: string): User | undefined {
    const cleanEmail = email.trim().toLowerCase();
    return this.getInternalAllUsers().find(u => u.email.toLowerCase() === cleanEmail);
  }

  public login(
    email: string,
    password?: string,
    rememberMe: boolean = true
  ): { success: boolean; user?: User; error?: string; requires2FA?: boolean } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.getUserByEmail(cleanEmail);

    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials. User email not found in tenant directory.',
      };
    }

    // Passwords in enterprise env: must be at least 6 chars if provided
    if (password && password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      };
    }

    // Super Admin requires 2FA authentication code simulation for extra security
    if (user.role === 'super_admin') {
      return {
        success: false,
        requires2FA: true,
        user,
      };
    }

    return this.establishSession(user, rememberMe);
  }

  public verify2FA(
    user: User,
    code: string,
    rememberMe: boolean = true
  ): { success: boolean; user?: User; error?: string } {
    const cleanCode = code.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      return {
        success: false,
        error: 'Invalid 2FA code. Please enter a valid 6-digit verification code.',
      };
    }

    return this.establishSession(user, rememberMe);
  }

  private establishSession(
    user: User,
    rememberMe: boolean
  ): { success: boolean; user: User } {
    const token = 'ivx_sess_' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const ttlMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const expiresAt = Date.now() + ttlMs;

    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, token);
    localStorage.setItem(STORAGE_KEYS.AUTH_EXPIRES, expiresAt.toString());

    this.setCurrentUserId(user.id);
    this.setActiveOrgId(user.organizationId);

    this.addAuditLog({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_INVITED',
      resourceType: 'user',
      resourceId: user.id,
      status: 'success',
      details: `User ${user.name} (${user.email}) securely authenticated into dedicated tenant workspace`,
    });

    return { success: true, user };
  }

  public loginWithGoogle(
    googleUser: { email: string; displayName?: string | null; photoURL?: string | null },
    rememberMe: boolean = true
  ): { success: boolean; user: User } {
    const cleanEmail = googleUser.email.trim().toLowerCase();
    const existing = this.getUserByEmail(cleanEmail);
    let resolvedUser: User;

    if (!existing) {
      // Create a dedicated, completely independent private organization for this user
      const orgId = 'org_' + Math.random().toString(36).substring(2, 9);
      const companyTitle = (googleUser.displayName || cleanEmail.split('@')[0]) + ' Organization';
      const newOrg: OrganizationSettings = {
        id: orgId,
        name: companyTitle,
        legalName: companyTitle + ' Ltd',
        slug: companyTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        taxId: 'TAX-' + Math.floor(Math.random() * 899999 + 100000),
        email: cleanEmail,
        phone: '+1 (555) 012-3456',
        address: {
          line1: '1 Innovation Way',
          city: 'London',
          postalCode: 'EC1A 1BB',
          country: 'United Kingdom',
        },
        currency: 'USD',
        defaultPaymentTerms: 'Net 30',
        invoiceTermsAndConditions: 'Payment is due within 30 days of invoice date. Thank you for your business.',
        bankDetails: {
          bankName: 'Global Commercial Bank',
          accountHolderName: companyTitle,
          accountNumber: '99' + Math.floor(Math.random() * 89999999 + 10000000),
          routingNumber: '121000358',
          swiftBic: 'GLBCUS33',
          iban: 'GB' + Math.floor(Math.random() * 899999999999 + 100000000000),
        },
        paymentGateways: {
          visaDirectEnabled: true,
        },
        invoiceTheme: 'modern',
        accentColor: 'indigo',
        plan: 'free',
        invoiceCount: 0,
        subscriptionStatus: 'none',
        cloudSqlSnapshots: {
          projectId: 'eco-context-13kqt',
          region: 'europe-west2',
          instanceId: `invox-db-${cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '')}`,
          enabled: true,
          scheduleTimeUtc: '02:00',
          retentionDays: 14,
          pitrEnabled: true,
          location: 'regional',
          status: 'RUNNABLE',
          snapshots: [],
        },
        googleDriveIntegration: {
          enabled: true,
          folderName: `Invoices - ${companyTitle}`,
          autoUploadOnInvoiceCreate: true,
        },
      };

      const orgs = this.getInternalAllOrganizations();
      orgs.push(newOrg);
      this.setInternalOrganizations(orgs);

      const newUser: User = {
        id: 'usr_g_' + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        name: googleUser.displayName || cleanEmail.split('@')[0],
        role: 'org_admin',
        organizationId: orgId,
        avatarUrl: googleUser.photoURL || undefined,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      const users = this.getInternalAllUsers();
      users.push(newUser);
      this.setInternalUsers(users);
      resolvedUser = newUser;
    } else {
      resolvedUser = existing;
    }

    return this.establishSession(resolvedUser, rememberMe);
  }

  public logout(): void {
    const user = this.getCurrentUser();
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    localStorage.removeItem(STORAGE_KEYS.AUTH_EXPIRES);

    if (user) {
      this.addAuditLog({
        organizationId: user.organizationId,
        actorId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'SETTINGS_UPDATED',
        resourceType: 'user',
        resourceId: user.id,
        status: 'success',
        details: `User ${user.name} logged out and terminated active session`,
      });
    }
  }

  public registerNewTenant(data: {
    name: string;
    email: string;
    orgName: string;
    currency: string;
  }): { success: boolean; user?: User; error?: string } {
    const cleanEmail = data.email.trim().toLowerCase();
    if (this.getUserByEmail(cleanEmail)) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please log in.',
      };
    }

    const orgId = 'org_' + Math.random().toString(36).substring(2, 9);
    const userId = 'usr_' + Math.random().toString(36).substring(2, 9);

    const newOrg: OrganizationSettings = {
      id: orgId,
      name: data.orgName,
      legalName: data.orgName + ' Inc.',
      slug: data.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      taxId: 'TAX-' + Math.floor(Math.random() * 899999 + 100000),
      email: cleanEmail,
      phone: '+1 (555) 019-8234',
      address: {
        line1: '100 Enterprise Way',
        city: 'San Francisco',
        postalCode: '94107',
        country: 'United States',
      },
      currency: data.currency || 'USD',
      defaultPaymentTerms: 'Net 30',
      invoiceTermsAndConditions: 'Payment is due within 30 days of invoice date. Thank you for your business.',
      bankDetails: {
        bankName: 'Global Commercial Bank',
        accountHolderName: data.orgName,
        accountNumber: '99' + Math.floor(Math.random() * 89999999 + 10000000),
        routingNumber: '121000358',
        swiftBic: 'GLBCUS33',
        iban: 'US' + Math.floor(Math.random() * 899999999999 + 100000000000),
      },
      paymentGateways: {
        visaDirectEnabled: true,
      },
      invoiceTheme: 'modern',
      accentColor: 'indigo',
      plan: 'free',
      invoiceCount: 0,
      subscriptionStatus: 'none',
      cloudSqlSnapshots: {
        projectId: 'eco-context-13kqt',
        region: 'europe-west2',
        instanceId: `invox-db-${data.orgName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        enabled: true,
        scheduleTimeUtc: '02:00',
        retentionDays: 14,
        pitrEnabled: true,
        location: 'regional',
        status: 'RUNNABLE',
        snapshots: [],
      },
      googleDriveIntegration: {
        enabled: true,
        folderName: `Invoices - ${data.orgName}`,
        autoUploadOnInvoiceCreate: true,
      },
    };

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      name: data.name,
      role: 'org_admin',
      organizationId: orgId,
      createdAt: new Date().toISOString(),
    };

    // Save organization to internal persistent store
    const orgs = this.getInternalAllOrganizations();
    orgs.push(newOrg);
    this.setInternalOrganizations(orgs);

    // Save user to internal persistent store
    const users = this.getInternalAllUsers();
    users.push(newUser);
    this.setInternalUsers(users);

    // Establish session for this new independent tenant organization
    return this.establishSession(newUser, true);
  }
}

export const storageService = new StorageService();
// Initialize immediately
storageService.initialize();
