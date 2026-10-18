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

const STORAGE_KEYS = {
  ORGANIZATIONS: 'invox_saas_organizations_v2',
  USERS: 'invox_saas_users_v2',
  INVOICES: 'invox_saas_invoices_v2',
  CLIENTS: 'invox_saas_clients_v2',
  AUDIT_LOGS: 'invox_saas_audit_logs_v2',
  API_KEYS: 'invox_saas_api_keys_v2',
  ACTIVE_ORG_ID: 'invox_saas_active_org_id_v2',
  CURRENT_USER_ID: 'invox_saas_current_user_id_v2',
};

// Initial realistic seed data
const SEED_ORGS: OrganizationSettings[] = [
  {
    id: 'org_apex_tech',
    name: 'Apex Global Cloud Solutions',
    legalName: 'Apex Cloud Solutions LLC',
    slug: 'apex-cloud',
    logoUrl: '',
    taxId: 'US-EIN-94-8172940',
    email: 'billing@apexcloud.io',
    phone: '+1 (415) 890-2341',
    address: {
      line1: '548 Market Street, Suite 2901',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94104',
      country: 'United States',
    },
    website: 'https://apexcloud.io',
    currency: 'USD',
    defaultPaymentTerms: 'Net 30',
    invoiceTermsAndConditions: 'Payment is due within 30 days of invoice issuance. Late payments are subject to a 1.5% compounding monthly surcharge. Wire transfers must include Invoice # in description reference.',
    bankDetails: {
      bankName: 'Silicon Valley Commercial Bank',
      accountHolderName: 'Apex Cloud Solutions LLC',
      accountNumber: '40918294012',
      routingNumber: '121000358',
      swiftBic: 'SVBCUS6S',
      iban: 'US64SVBC12100035840918294012',
      paymentInstructions: 'ACH and Domestic Fedwire preferred. For cross-border transfers, please note all intermediary bank fees must be borne by the remitter.',
    },
    paymentGateways: {
      stripeAccountId: 'acct_1NvxApexCloud99',
      stripePaymentLink: 'https://buy.stripe.com/test_apexcloud',
      visaDirectEnabled: true,
      visaMerchantId: 'VISA-MRCH-9021-USA',
      paypalEmail: 'payments@apexcloud.io',
      customPaymentInstructions: 'Credit Cards (Visa / Mastercard / Amex) accepted online via Stripe securely.',
    },
    invoiceTheme: 'modern',
    accentColor: 'indigo',
    plan: 'free',
    invoiceCount: 8, // 8 used out of 10 free!
    subscriptionStatus: 'none',
  },
  {
    id: 'org_nordic_craft',
    name: 'Nordic Architecture & Design Studio',
    legalName: 'Nordic Craft Arkitektur AB',
    slug: 'nordic-craft',
    logoUrl: '',
    taxId: 'SE556012345601',
    email: 'finance@nordiccraft.se',
    phone: '+46 8 123 4567',
    address: {
      line1: 'Strandvägen 17',
      city: 'Stockholm',
      postalCode: '114 56',
      country: 'Sweden',
    },
    website: 'https://nordiccraft.design',
    currency: 'EUR',
    defaultPaymentTerms: 'Net 14',
    invoiceTermsAndConditions: 'Tack för ditt samarbete. Betalning inom 14 dagar. Vid försenad betalning tillkommer lagstadgad dröjsmålsränta och påminnelseavgift.',
    bankDetails: {
      bankName: 'Nordea Bank Abp',
      accountHolderName: 'Nordic Craft Arkitektur AB',
      accountNumber: '5201 1234567',
      routingNumber: '9900',
      swiftBic: 'NDEASESS',
      iban: 'SE4595000099005201123456',
      paymentInstructions: 'SEPA bank transfer. Please reference invoice number on payment order.',
    },
    paymentGateways: {
      stripeAccountId: 'acct_1NvxNordicSE22',
      stripePaymentLink: 'https://buy.stripe.com/test_nordic',
      visaDirectEnabled: true,
      visaMerchantId: 'VISA-MRCH-4412-SE',
      paypalEmail: 'billing@nordiccraft.se',
    },
    invoiceTheme: 'minimal',
    accentColor: 'emerald',
    plan: 'pro',
    invoiceCount: 47,
    subscriptionStatus: 'active',
    subscriptionPeriodEnd: '2026-11-18T00:00:00.000Z',
    cardLast4: '4242',
    cardBrand: 'Visa',
  },
];

const SEED_USERS: User[] = [
  {
    id: 'usr_super_admin',
    name: 'Kenneth Onekalit',
    email: 'onekalitkenneth@gmail.com',
    role: 'super_admin',
    organizationId: 'org_apex_tech',
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'usr_sarah_admin',
    name: 'Sarah Chen',
    email: 'sarah.chen@apexcloud.io',
    role: 'org_admin',
    organizationId: 'org_apex_tech',
    createdAt: '2026-02-01T10:30:00Z',
  },
  {
    id: 'usr_marcus_billing',
    name: 'Marcus Vance',
    email: 'marcus.v@apexcloud.io',
    role: 'billing_manager',
    organizationId: 'org_apex_tech',
    createdAt: '2026-03-10T14:15:00Z',
  },
  {
    id: 'usr_elena_editor',
    name: 'Elena Rostova',
    email: 'elena.r@apexcloud.io',
    role: 'invoice_editor',
    organizationId: 'org_apex_tech',
    createdAt: '2026-04-05T11:00:00Z',
  },
  {
    id: 'usr_david_viewer',
    name: 'David Kalu',
    email: 'david.kalu@apexcloud.io',
    role: 'viewer',
    organizationId: 'org_apex_tech',
    createdAt: '2026-05-12T16:20:00Z',
  },
  // Users for Nordic Craft
  {
    id: 'usr_astrid_nordic',
    name: 'Astrid Lindgren-Berg',
    email: 'astrid@nordiccraft.se',
    role: 'org_admin',
    organizationId: 'org_nordic_craft',
    createdAt: '2026-01-10T08:00:00Z',
  },
];

const SEED_CLIENTS: Client[] = [
  {
    id: 'clt_acme_corp',
    organizationId: 'org_apex_tech',
    name: 'Acme Global Logistics Corp',
    companyName: 'Acme International Holding',
    email: 'ap@acmelogistics.com',
    phone: '+1 (212) 555-0199',
    taxId: 'US-EIN-13-9481023',
    address: '742 Evergreen Terrace, Floor 14',
    city: 'New York, NY',
    country: 'United States',
    currency: 'USD',
    totalInvoiced: 48500,
    createdAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'clt_nexus_media',
    organizationId: 'org_apex_tech',
    name: 'Nexus Digital Media Ltd',
    companyName: 'Nexus Global Interactive',
    email: 'finance@nexusmedia.co.uk',
    phone: '+44 20 7946 0912',
    taxId: 'GB982341829',
    address: '100 Bishopsgate, Level 22',
    city: 'London',
    country: 'United Kingdom',
    currency: 'USD',
    totalInvoiced: 24200,
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'clt_kyoto_robotics',
    organizationId: 'org_apex_tech',
    name: 'Kyoto Autonomous Systems K.K.',
    companyName: 'Kyoto Robotics Japan',
    email: 'invoicing@kyotorobotics.jp',
    taxId: 'JP-法人番号-901000109923',
    address: 'Shimogyo Ward, Karasuma-dori 450',
    city: 'Kyoto',
    country: 'Japan',
    currency: 'USD',
    totalInvoiced: 62000,
    createdAt: '2026-04-12T00:00:00Z',
  },
  // Clients for Nordic Craft
  {
    id: 'clt_helsinki_urban',
    organizationId: 'org_nordic_craft',
    name: 'Helsinki Urban Developments Oy',
    companyName: 'Helsinki City Construction Group',
    email: 'laskut@helsinkiurban.fi',
    taxId: 'FI19283746',
    address: 'Mannerheimintie 14 B',
    city: 'Helsinki',
    country: 'Finland',
    currency: 'EUR',
    totalInvoiced: 94000,
    createdAt: '2026-02-18T00:00:00Z',
  },
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv_apex_001',
    organizationId: 'org_apex_tech',
    invoiceNumber: 'INV-2026-001',
    status: 'paid',
    issueDate: '2026-09-01',
    dueDate: '2026-10-01',
    poNumber: 'PO-ACM-8812',
    currency: 'USD',
    clientId: 'clt_acme_corp',
    clientName: 'Acme Global Logistics Corp',
    clientEmail: 'ap@acmelogistics.com',
    clientAddress: '742 Evergreen Terrace, New York, NY, US',
    items: [
      {
        id: 'item_1',
        description: 'Enterprise Cloud Infrastructure Architecture & High-Availability Migration',
        quantity: 1,
        unitPrice: 16500,
        taxRate: 0,
        discountRate: 0,
        amount: 16500,
      },
      {
        id: 'item_2',
        description: 'Multi-Region Failover & Disaster Recovery Setup',
        quantity: 1,
        unitPrice: 8500,
        taxRate: 0,
        discountRate: 5,
        amount: 8075,
      },
    ],
    subtotal: 25000,
    totalDiscount: 425,
    totalTax: 0,
    shippingFee: 0,
    totalAmount: 24575,
    paidAt: '2026-09-28T14:32:00Z',
    paymentMethodUsed: 'VISA Corporate (•••• 8912) via Stripe',
    paymentTransactionId: 'ch_3NvxApex918239401',
    notes: 'Thank you for choosing Apex Global Cloud Solutions.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-28T14:32:00Z',
  },
  {
    id: 'inv_apex_002',
    organizationId: 'org_apex_tech',
    invoiceNumber: 'INV-2026-002',
    status: 'sent',
    issueDate: '2026-10-05',
    dueDate: '2026-11-04',
    poNumber: 'PO-NEX-449',
    currency: 'USD',
    clientId: 'clt_nexus_media',
    clientName: 'Nexus Digital Media Ltd',
    clientEmail: 'finance@nexusmedia.co.uk',
    clientAddress: '100 Bishopsgate, Level 22, London, UK',
    items: [
      {
        id: 'item_3',
        description: 'Kubernetes Cluster Provisioning & Autoscaling Engine',
        quantity: 1,
        unitPrice: 12000,
        taxRate: 0,
        discountRate: 0,
        amount: 12000,
      },
      {
        id: 'item_4',
        description: '24/7 SRE Dedicated Support Retainer (October 2026)',
        quantity: 1,
        unitPrice: 4500,
        taxRate: 0,
        discountRate: 0,
        amount: 4500,
      },
    ],
    subtotal: 16500,
    totalDiscount: 0,
    totalTax: 0,
    shippingFee: 0,
    totalAmount: 16500,
    notes: 'Invoice sent via automated client billing portal.',
    createdAt: '2026-10-05T09:15:00Z',
    updatedAt: '2026-10-05T09:15:00Z',
  },
  {
    id: 'inv_apex_003',
    organizationId: 'org_apex_tech',
    invoiceNumber: 'INV-2026-003',
    status: 'overdue',
    issueDate: '2026-08-15',
    dueDate: '2026-09-15',
    currency: 'USD',
    clientId: 'clt_kyoto_robotics',
    clientName: 'Kyoto Autonomous Systems K.K.',
    clientEmail: 'invoicing@kyotorobotics.jp',
    clientAddress: 'Shimogyo Ward, Karasuma-dori 450, Kyoto, Japan',
    items: [
      {
        id: 'item_5',
        description: 'Edge Telemetry Pipeline Integration & Low Latency Ingestion',
        quantity: 1,
        unitPrice: 18200,
        taxRate: 0,
        discountRate: 0,
        amount: 18200,
      },
    ],
    subtotal: 18200,
    totalDiscount: 0,
    totalTax: 0,
    shippingFee: 0,
    totalAmount: 18200,
    notes: 'Payment reminder dispatched on October 1st.',
    createdAt: '2026-08-15T11:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
  },
  // Invoices for Nordic Craft (Tenant isolation test)
  {
    id: 'inv_nordic_001',
    organizationId: 'org_nordic_craft',
    invoiceNumber: 'SE-2026-094',
    status: 'paid',
    issueDate: '2026-10-01',
    dueDate: '2026-10-15',
    currency: 'EUR',
    clientId: 'clt_helsinki_urban',
    clientName: 'Helsinki Urban Developments Oy',
    clientEmail: 'laskut@helsinkiurban.fi',
    clientAddress: 'Mannerheimintie 14 B, Helsinki, Finland',
    items: [
      {
        id: 'item_6',
        description: 'Architectural Concept Design & BIM Structural Modeling',
        quantity: 1,
        unitPrice: 32000,
        taxRate: 24,
        discountRate: 0,
        amount: 32000,
      },
    ],
    subtotal: 32000,
    totalDiscount: 0,
    totalTax: 7680,
    shippingFee: 0,
    totalAmount: 39680,
    paidAt: '2026-10-12T11:00:00Z',
    paymentMethodUsed: 'SEPA Direct Debit',
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-12T11:00:00Z',
  },
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_1',
    organizationId: 'org_apex_tech',
    timestamp: '2026-10-18T10:14:22Z',
    actorId: 'usr_super_admin',
    actorName: 'Kenneth Onekalit',
    actorEmail: 'onekalitkenneth@gmail.com',
    actorRole: 'super_admin',
    action: 'SETTINGS_UPDATED',
    resourceType: 'organization',
    resourceId: 'org_apex_tech',
    ipAddress: '198.51.100.42',
    status: 'success',
    details: 'Updated bank account SWIFT/BIC and custom invoice terms',
    diff: {
      before: { swiftBic: 'SVBCUS6X' },
      after: { swiftBic: 'SVBCUS6S' },
    },
  },
  {
    id: 'aud_2',
    organizationId: 'org_apex_tech',
    timestamp: '2026-10-17T16:45:09Z',
    actorId: 'usr_sarah_admin',
    actorName: 'Sarah Chen',
    actorEmail: 'sarah.chen@apexcloud.io',
    actorRole: 'org_admin',
    action: 'INVOICE_SENT',
    resourceType: 'invoice',
    resourceId: 'inv_apex_002',
    ipAddress: '198.51.100.89',
    status: 'success',
    details: 'Dispatched Invoice INV-2026-002 ($16,500.00) to Nexus Digital Media Ltd',
  },
  {
    id: 'aud_3',
    organizationId: 'org_apex_tech',
    timestamp: '2026-10-16T12:00:00Z',
    actorId: 'usr_super_admin',
    actorName: 'Kenneth Onekalit',
    actorEmail: 'onekalitkenneth@gmail.com',
    actorRole: 'super_admin',
    action: 'USER_INVITED',
    resourceType: 'user',
    resourceId: 'usr_david_viewer',
    ipAddress: '198.51.100.42',
    status: 'success',
    details: 'Invited David Kalu with Viewer permissions',
  },
  {
    id: 'aud_4',
    organizationId: 'org_apex_tech',
    timestamp: '2026-10-15T09:30:00Z',
    actorId: 'usr_marcus_billing',
    actorName: 'Marcus Vance',
    actorEmail: 'marcus.v@apexcloud.io',
    actorRole: 'billing_manager',
    action: 'API_KEY_CREATED',
    resourceType: 'api',
    resourceId: 'key_production_01',
    ipAddress: '198.51.100.12',
    status: 'success',
    details: 'Generated OAuth 2.0 Client credentials with scopes [invoices:read, invoices:write]',
  },
];

const SEED_API_KEYS: ApiCredential[] = [
  {
    id: 'key_prod_apex',
    organizationId: 'org_apex_tech',
    name: 'Production Invoicing Webhook & Gateway',
    clientId: 'ivx_client_live_94819a8f2',
    clientSecretMasked: 'ivx_sec_••••••••••••••••••••••••7c42',
    scopes: ['invoices:read', 'invoices:write', 'clients:read'],
    rateLimitPerMinute: 60,
    createdAt: '2026-09-10T12:00:00Z',
    lastUsedAt: '2026-10-18T10:50:00Z',
  },
];

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
    if (!localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS)) {
      this.setStorageItem(STORAGE_KEYS.ORGANIZATIONS, SEED_ORGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setStorageItem(STORAGE_KEYS.USERS, SEED_USERS);
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
      this.setStorageItem(STORAGE_KEYS.ACTIVE_ORG_ID, 'org_apex_tech');
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      this.setStorageItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr_super_admin');
    }
  }

  // Active Organization & User Context
  public getActiveOrgId(): string {
    return this.getStorageItem(STORAGE_KEYS.ACTIVE_ORG_ID, 'org_apex_tech');
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
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);
    return user || users[0];
  }

  // Organizations
  public getOrganizations(): OrganizationSettings[] {
    return this.getStorageItem(STORAGE_KEYS.ORGANIZATIONS, SEED_ORGS);
  }

  public getOrganization(orgId: string): OrganizationSettings | undefined {
    // Check in-memory cache first
    const cacheKey = `org:settings:${orgId}`;
    const cached = cacheEngine.get<OrganizationSettings>(cacheKey);
    if (cached.hit && cached.data) {
      return cached.data;
    }

    const orgs = this.getOrganizations();
    const org = orgs.find(o => o.id === orgId);
    if (org) {
      cacheEngine.set(cacheKey, org, 180);
    }
    return org;
  }

  public saveOrganization(org: OrganizationSettings, actor?: User): void {
    const orgs = this.getOrganizations();
    const oldOrg = orgs.find(o => o.id === org.id);
    const index = orgs.findIndex(o => o.id === org.id);

    if (index >= 0) {
      orgs[index] = org;
    } else {
      orgs.push(org);
    }

    this.setStorageItem(STORAGE_KEYS.ORGANIZATIONS, orgs);
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
          before: oldOrg ? { name: oldOrg.name, taxId: oldOrg.taxId, theme: oldOrg.invoiceTheme } : undefined,
          after: { name: org.name, taxId: org.taxId, theme: org.invoiceTheme },
        },
      });
    }
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

  // Invoices (Strictly isolated by organizationId)
  public getInvoices(orgId: string): Invoice[] {
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

  public saveInvoice(invoice: Invoice, actor: User): { success: boolean; error?: string } {
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

  // Clients
  public getClients(orgId: string): Client[] {
    const all = this.getStorageItem<Client[]>(STORAGE_KEYS.CLIENTS, SEED_CLIENTS);
    return all.filter(c => c.organizationId === orgId);
  }

  public saveClient(client: Client, actor: User): void {
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

  // Users & Team Members
  public getAllUsers(): User[] {
    return this.getStorageItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  }

  public getUsersByOrg(orgId: string): User[] {
    return this.getAllUsers().filter(u => u.organizationId === orgId);
  }

  public inviteUser(
    email: string,
    name: string,
    role: UserRole,
    orgId: string,
    actor: User
  ): User {
    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      name,
      role,
      organizationId: orgId,
      createdAt: new Date().toISOString(),
    };

    const users = this.getAllUsers();
    users.push(newUser);
    this.setStorageItem(STORAGE_KEYS.USERS, users);

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
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId && u.organizationId === orgId);
    if (!user) return false;

    const oldRole = user.role;
    user.role = newRole;
    this.setStorageItem(STORAGE_KEYS.USERS, users);

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

  // Audit Logs
  public getAuditLogs(orgId: string): AuditLog[] {
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

  // API Credentials
  public getApiKeys(orgId: string): ApiCredential[] {
    const all = this.getStorageItem<ApiCredential[]>(STORAGE_KEYS.API_KEYS, SEED_API_KEYS);
    return all.filter(k => k.organizationId === orgId);
  }

  public saveApiKey(apiKey: ApiCredential, actor: User): void {
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
}

export const storageService = new StorageService();
// Initialize immediately
storageService.initialize();
