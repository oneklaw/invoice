import {
  AuditLog,
  Client,
  Invoice,
  OrganizationSettings,
  User,
  UserRole,
  ApiCredential,
  Expense,
  InventoryItem,
  StockMovement,
  Vendor,
  PurchaseOrder,
  VendorPayment,
  ClientActivity,
  WorkflowRule,
  InvoiceComment,
  InvoiceVersion,
  ClientPortalSettings,
  SaaSSubscriptionTransaction,
  TenantQueryLog,
  SupportTicket,
  TicketMessage,
  TicketPriority,
  TicketEscalationLevel,
  AutomatedNotificationDispatch,
  TicketStatus,
  TicketCategory,
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
  EXPENSES: 'invox_saas_expenses_v3',
  INVENTORY: 'invox_saas_inventory_v3',
  STOCK_MOVEMENTS: 'invox_saas_stock_movements_v3',
  VENDORS: 'invox_saas_vendors_v3',
  PURCHASE_ORDERS: 'invox_saas_purchase_orders_v3',
  VENDOR_PAYMENTS: 'invox_saas_vendor_payments_v3',
  CLIENT_ACTIVITIES: 'invox_saas_client_activities_v3',
  WORKFLOW_RULES: 'invox_saas_workflow_rules_v3',
  CLIENT_PORTAL_SETTINGS: 'invox_saas_client_portal_settings_v3',
  ACTIVE_ORG_ID: 'invox_saas_active_org_id_v3',
  CURRENT_USER_ID: 'invox_saas_current_user_id_v3',
  AUTH_SESSION: 'invox_saas_auth_session_v3',
  AUTH_EXPIRES: 'invox_saas_auth_expires_v3',
  SAAS_REVENUE_TRANSACTIONS: 'invox_saas_revenue_transactions_v3',
  TENANT_QUERY_LOGS: 'invox_saas_tenant_query_logs_v3',
  SUPPORT_TICKETS: 'invox_saas_support_tickets_v3',
};

// Standard Professional Enterprise Commercial Terms & Conditions
export const DEFAULT_ENTERPRISE_TERMS = 
`1. Payment Terms: Payment is strictly due within 30 days of invoice issuance (Net 30) or per agreed commercial terms. Late payments accrue statutory interest at 1.5% per month.
2. Remittance: Please quote the Invoice Number as payment reference on all electronic wire and bank transfers.
3. Retention of Title: Title to deliverables and intellectual property rights remain with the issuer until payment in full has cleared.
4. Discrepancies: Any invoice discrepancy or query must be notified in writing within 7 business days of receipt.
5. Electronic Verification: This invoice is tamper-evident, ledger-certified, and verifiable via cryptographic hash QR code.`;

// Multi-Tenant SaaS Organizations Network
const INITIAL_ORGS: OrganizationSettings[] = [
  {
    id: 'org_enterprise_primary',
    name: 'KERO INVOICE SaaS',
    legalName: 'KERO Technology & Solutions Ltd',
    slug: 'kero-invoice',
    logoUrl: '/kero-logo.png',
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
    invoiceTermsAndConditions: DEFAULT_ENTERPRISE_TERMS,
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
    plan: 'pro',
    invoiceCount: 14,
    subscriptionStatus: 'active',
    subscriptionPeriodEnd: '2026-11-20T00:00:00.000Z',
    cardLast4: '4242',
    cardBrand: 'Visa',
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
  {
    id: 'org_apex_tech',
    name: 'Apex Cloud Technologies Inc.',
    legalName: 'Apex Cloud Global Technologies Inc.',
    slug: 'apex-cloud',
    taxId: 'US-EIN-94-8172940',
    email: 'finance@apexcloud.io',
    phone: '+1 (415) 890-2134',
    address: {
      line1: '548 Market Street, Suite 89201',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94104',
      country: 'United States',
    },
    website: 'https://apexcloud.io',
    currency: 'USD',
    defaultPaymentTerms: 'Net 15',
    invoiceTermsAndConditions: 'Standard SaaS license deliverables. Net 15 days.',
    bankDetails: {
      bankName: 'Silicon Valley Bank (First Citizens)',
      accountHolderName: 'Apex Cloud Global Technologies Inc.',
      accountNumber: '449102931',
      routingNumber: '121140399',
      swiftBic: 'SVBKUS6S',
      iban: 'US34SVBK121140399449102931',
      paymentInstructions: 'ACH or Fedwire directly to Apex Treasury.',
    },
    paymentGateways: {
      visaDirectEnabled: true,
    },
    invoiceTheme: 'modern',
    accentColor: 'indigo',
    plan: 'pro',
    invoiceCount: 28,
    subscriptionStatus: 'active',
    subscriptionPeriodEnd: '2026-11-15T00:00:00.000Z',
    cardLast4: '8912',
    cardBrand: 'Visa',
  },
  {
    id: 'org_nordic_media',
    name: 'Nordic Digital Media Studio',
    legalName: 'Nordic Digital Media AB',
    slug: 'nordic-media',
    taxId: 'SE-556123456701',
    email: 'billing@nordicmedia.se',
    phone: '+46 8 123 4567',
    address: {
      line1: 'Sveavagen 44, Floor 5',
      city: 'Stockholm',
      postalCode: '111 34',
      country: 'Sweden',
    },
    website: 'https://nordicmedia.se',
    currency: 'EUR',
    defaultPaymentTerms: 'Net 30',
    invoiceTermsAndConditions: 'VAT 25% applied where applicable. Reverse charge for EU B2B.',
    bankDetails: {
      bankName: 'Nordea Bank Abp Sweden',
      accountHolderName: 'Nordic Digital Media AB',
      accountNumber: '99201940',
      routingNumber: '3300',
      swiftBic: 'NDEASESS',
      iban: 'SE45330000000099201940',
      paymentInstructions: 'SEPA Credit Transfer.',
    },
    paymentGateways: {
      visaDirectEnabled: true,
    },
    invoiceTheme: 'slate',
    accentColor: 'cyan',
    plan: 'pro',
    invoiceCount: 35,
    subscriptionStatus: 'active',
    subscriptionPeriodEnd: '2026-11-28T00:00:00.000Z',
    cardLast4: '1044',
    cardBrand: 'Mastercard',
  },
  {
    id: 'org_quantum_ai',
    name: 'Quantum AI Systems Ltd',
    legalName: 'Quantum Artificial Intelligence Systems Ltd',
    slug: 'quantum-ai',
    taxId: 'GB-VAT-778899001',
    email: 'accounts@quantumai.dev',
    phone: '+44 1223 901234',
    address: {
      line1: 'Cambridge Science Park, Milton Road',
      city: 'Cambridge',
      postalCode: 'CB4 0FZ',
      country: 'United Kingdom',
    },
    website: 'https://quantumai.dev',
    currency: 'GBP',
    defaultPaymentTerms: 'Net 30',
    invoiceTermsAndConditions: 'Enterprise SLA Tier 1 with automated failover.',
    bankDetails: {
      bankName: 'HSBC UK Commercial Banking',
      accountHolderName: 'Quantum Artificial Intelligence Systems Ltd',
      accountNumber: '91823901',
      routingNumber: '40-12-34',
      swiftBic: 'HBUKGB41',
      iban: 'GB82HBUK40123491823901',
      paymentInstructions: 'BACS / CHAPS wire transfer.',
    },
    paymentGateways: {
      visaDirectEnabled: true,
    },
    invoiceTheme: 'minimal',
    accentColor: 'emerald',
    plan: 'pro',
    invoiceCount: 52,
    subscriptionStatus: 'active',
    subscriptionPeriodEnd: '2026-11-10T00:00:00.000Z',
    cardLast4: '3001',
    cardBrand: 'Amex',
  },
  {
    id: 'org_solis_green',
    name: 'Solis Renewable Energy Ltd',
    legalName: 'Solis Renewable Energy Solutions Ltd',
    slug: 'solis-energy',
    taxId: 'GB-VAT-332211009',
    email: 'admin@solisenergy.co.uk',
    phone: '+44 117 987 6543',
    address: {
      line1: '10 Temple Way',
      city: 'Bristol',
      postalCode: 'BS2 0BY',
      country: 'United Kingdom',
    },
    website: 'https://solisenergy.co.uk',
    currency: 'GBP',
    defaultPaymentTerms: 'Net 30',
    invoiceTermsAndConditions: 'Clean energy transition project billings.',
    bankDetails: {
      bankName: 'NatWest Commercial',
      accountHolderName: 'Solis Renewable Energy Solutions Ltd',
      accountNumber: '29384756',
      routingNumber: '60-00-01',
      swiftBic: 'NWBKGB2L',
      iban: 'GB11NWBK60000129384756',
    },
    paymentGateways: {
      visaDirectEnabled: true,
    },
    invoiceTheme: 'modern',
    accentColor: 'amber',
    plan: 'free',
    invoiceCount: 8,
    subscriptionStatus: 'none',
  },
  {
    id: 'org_zenith_freight',
    name: 'Zenith Global Logistics GmbH',
    legalName: 'Zenith Global Freight & Logistics GmbH',
    slug: 'zenith-freight',
    taxId: 'DE-VAT-192837465',
    email: 'ops@zenithfreight.de',
    phone: '+49 40 8899 0011',
    address: {
      line1: 'Am Sandtorkai 72',
      city: 'Hamburg',
      postalCode: '20457',
      country: 'Germany',
    },
    website: 'https://zenithfreight.de',
    currency: 'EUR',
    defaultPaymentTerms: 'Net 30',
    invoiceTermsAndConditions: 'International freight forwarding terms ADSp 2017.',
    bankDetails: {
      bankName: 'Deutsche Bank Hamburg',
      accountHolderName: 'Zenith Global Freight & Logistics GmbH',
      accountNumber: '5829102',
      routingNumber: '20070000',
      swiftBic: 'DEUTDEDBHAM',
      iban: 'DE89200700000005829102',
    },
    paymentGateways: {
      visaDirectEnabled: true,
    },
    invoiceTheme: 'classic',
    accentColor: 'rose',
    plan: 'free',
    invoiceCount: 4,
    subscriptionStatus: 'none',
  },
];

// Initial users: Kenneth Onekalit (Platform Super Admin & SaaS Owner) + Tenant Admins
const INITIAL_USERS: User[] = [
  {
    id: 'usr_super_admin',
    name: 'Kenneth Onekalit',
    email: 'onekalitkenneth@gmail.com',
    role: 'super_admin',
    organizationId: 'org_enterprise_primary',
    createdAt: '2026-08-01T00:00:00.000Z',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'usr_troubleshoot_lead',
    name: 'Kenneth Onekalit (SaaS Ops & Troubleshooting)',
    email: 'troubleshoot@kero-saas.internal',
    role: 'super_admin',
    organizationId: 'org_enterprise_primary',
    createdAt: '2026-08-01T00:00:00.000Z',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'usr_marcus_apex',
    name: 'Marcus Vance',
    email: 'marcus@apexcloud.io',
    role: 'org_admin',
    organizationId: 'org_apex_tech',
    createdAt: '2026-08-15T00:00:00.000Z',
    lastActive: '2026-10-20T14:30:00.000Z',
  },
  {
    id: 'usr_freja_nordic',
    name: 'Freja Lindstrom',
    email: 'freja@nordicmedia.se',
    role: 'org_admin',
    organizationId: 'org_nordic_media',
    createdAt: '2026-09-01T00:00:00.000Z',
    lastActive: '2026-10-21T09:15:00.000Z',
  },
  {
    id: 'usr_aris_quantum',
    name: 'Dr. Aris Thorne',
    email: 'aris@quantumai.dev',
    role: 'org_admin',
    organizationId: 'org_quantum_ai',
    createdAt: '2026-09-10T00:00:00.000Z',
    lastActive: '2026-10-21T11:45:00.000Z',
  },
  {
    id: 'usr_claire_solis',
    name: 'Claire Davies',
    email: 'claire@solisenergy.co.uk',
    role: 'org_admin',
    organizationId: 'org_solis_green',
    createdAt: '2026-09-25T00:00:00.000Z',
    lastActive: '2026-10-19T16:20:00.000Z',
  },
];

// Clean initial seed data
const SEED_CLIENTS: Client[] = [];
const SEED_INVOICES: Invoice[] = [];
const SEED_AUDIT_LOGS: AuditLog[] = [];
const SEED_API_KEYS: ApiCredential[] = [];

const SEED_VENDORS: Vendor[] = [
  {
    id: 'ven_aws_cloud',
    organizationId: 'org_enterprise_primary',
    name: 'AWS Cloud Services UK',
    contactPerson: 'Jeff Harrison',
    email: 'billing@aws-services.co.uk',
    phone: '+44 20 7946 0881',
    address: '60 Holborn Viaduct, London EC1A 2FD',
    taxId: 'GB-VAT-992182741',
    paymentTerms: 'Net 30',
    performanceScore: 98,
    totalDisbursed: 14500,
    notes: 'Primary cloud hosting, S3 backups, and database cluster infrastructure.',
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'ven_dell_ent',
    organizationId: 'org_enterprise_primary',
    name: 'Dell Technologies Enterprise',
    contactPerson: 'Sarah Jenkins',
    email: 'procurement@dell-enterprise.com',
    phone: '+44 1344 860456',
    address: 'Dell House, Cain Road, Bracknell RG12 1LF',
    taxId: 'GB-VAT-445892110',
    paymentTerms: 'Net 15',
    performanceScore: 95,
    totalDisbursed: 28400,
    notes: 'Developer workstations, rack servers, and high-performance monitors.',
    createdAt: '2026-02-10T10:30:00.000Z',
  },
  {
    id: 'ven_wework_hq',
    organizationId: 'org_enterprise_primary',
    name: 'WeWork Office Facilities Ltd',
    contactPerson: 'Marcus Thorne',
    email: 'tenancy@wework-london.com',
    phone: '+44 20 3808 7701',
    address: '10 York Road, Waterloo, London SE1 7ND',
    taxId: 'GB-VAT-112998432',
    paymentTerms: 'Net 30',
    performanceScore: 92,
    totalDisbursed: 9200,
    notes: 'Canary Wharf and London Waterloo executive office suites.',
    createdAt: '2026-02-28T14:15:00.000Z',
  },
  {
    id: 'ven_oracle_db',
    organizationId: 'org_enterprise_primary',
    name: 'Oracle Global Infrastructure',
    contactPerson: 'Elena Rostova',
    email: 'enterprise-billing@oracle.com',
    phone: '+44 118 984 0000',
    address: 'Oracle Parkway, Thames Valley Park, Reading RG6 1RA',
    taxId: 'GB-VAT-667102948',
    paymentTerms: 'Net 45',
    performanceScore: 90,
    totalDisbursed: 18000,
    notes: 'Enterprise Cloud SQL database backup and disaster recovery redundancy.',
    createdAt: '2026-03-01T11:00:00.000Z',
  },
];

const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po_001_dell',
    organizationId: 'org_enterprise_primary',
    poNumber: 'PO-2026-081',
    vendorId: 'ven_dell_ent',
    vendorName: 'Dell Technologies Enterprise',
    items: [
      { itemId: 'item_dell_serv', itemName: 'PowerEdge R750 Rack Server', quantity: 1, unitPrice: 3850, total: 3850 },
      { itemId: 'item_dell_ram', itemName: '128GB ECC Server Memory Kit', quantity: 2, unitPrice: 500, total: 1000 },
    ],
    totalAmount: 4850,
    currency: 'GBP',
    status: 'received',
    issueDate: '2026-10-05',
    expectedDeliveryDate: '2026-10-12',
    receivedDate: '2026-10-14',
    createdAt: '2026-10-05T08:30:00.000Z',
  },
  {
    id: 'po_002_aws',
    organizationId: 'org_enterprise_primary',
    poNumber: 'PO-2026-094',
    vendorId: 'ven_aws_cloud',
    vendorName: 'AWS Cloud Services UK',
    items: [
      { itemId: 'item_aws_compute', itemName: 'EC2 Dedicated Instances (Oct 2026)', quantity: 1, unitPrice: 1820, total: 1820 },
      { itemId: 'item_aws_s3', itemName: 'S3 Glacier Multi-Region Replication', quantity: 1, unitPrice: 600, total: 600 },
    ],
    totalAmount: 2420,
    currency: 'GBP',
    status: 'issued',
    issueDate: '2026-10-10',
    expectedDeliveryDate: '2026-10-10',
    createdAt: '2026-10-10T11:00:00.000Z',
  },
  {
    id: 'po_003_wework',
    organizationId: 'org_enterprise_primary',
    poNumber: 'PO-2026-072',
    vendorId: 'ven_wework_hq',
    vendorName: 'WeWork Office Facilities Ltd',
    items: [
      { itemId: 'item_wework_rent', itemName: 'Canary Wharf Private Office Lease (Oct)', quantity: 1, unitPrice: 3100, total: 3100 },
    ],
    totalAmount: 3100,
    currency: 'GBP',
    status: 'issued',
    issueDate: '2026-10-01',
    expectedDeliveryDate: '2026-10-01',
    createdAt: '2026-10-01T09:15:00.000Z',
  },
  {
    id: 'po_004_oracle',
    organizationId: 'org_enterprise_primary',
    poNumber: 'PO-2026-050',
    vendorId: 'ven_oracle_db',
    vendorName: 'Oracle Global Infrastructure',
    items: [
      { itemId: 'item_oracle_db', itemName: 'Managed PostgreSQL Enterprise License (Q3)', quantity: 1, unitPrice: 6200, total: 6200 },
    ],
    totalAmount: 6200,
    currency: 'GBP',
    status: 'paid',
    bankReference: 'WIRE-2026-ORC-9912',
    issueDate: '2026-09-15',
    expectedDeliveryDate: '2026-09-15',
    receivedDate: '2026-09-15',
    createdAt: '2026-09-15T10:00:00.000Z',
  },
];

const SEED_VENDOR_PAYMENTS: VendorPayment[] = [
  {
    id: 'vp_hist_1',
    organizationId: 'org_enterprise_primary',
    vendorId: 'ven_dell_ent',
    vendorName: 'Dell Technologies Enterprise',
    purchaseOrderId: 'po_archived_1',
    amount: 12000,
    currency: 'GBP',
    paymentDate: '2026-08-20',
    bankReference: 'WIRE-BARC-892110',
    status: 'completed',
  },
  {
    id: 'vp_hist_2',
    organizationId: 'org_enterprise_primary',
    vendorId: 'ven_aws_cloud',
    vendorName: 'AWS Cloud Services UK',
    purchaseOrderId: 'po_archived_2',
    amount: 5400,
    currency: 'GBP',
    paymentDate: '2026-08-30',
    bankReference: 'CHAPS-2026-44102',
    status: 'completed',
  },
  {
    id: 'vp_hist_3',
    organizationId: 'org_enterprise_primary',
    vendorId: 'ven_dell_ent',
    vendorName: 'Dell Technologies Enterprise',
    purchaseOrderId: 'po_archived_3',
    amount: 16400,
    currency: 'GBP',
    paymentDate: '2026-09-12',
    bankReference: 'BACS-899120',
    status: 'completed',
  },
  {
    id: 'vp_hist_4',
    organizationId: 'org_enterprise_primary',
    vendorId: 'ven_wework_hq',
    vendorName: 'WeWork Office Facilities Ltd',
    purchaseOrderId: 'po_archived_4',
    amount: 6100,
    currency: 'GBP',
    paymentDate: '2026-09-28',
    bankReference: 'CHAPS-2026-55190',
    status: 'completed',
  },
  {
    id: 'vp_hist_5',
    organizationId: 'org_enterprise_primary',
    vendorId: 'ven_oracle_db',
    vendorName: 'Oracle Global Infrastructure',
    purchaseOrderId: 'po_004_oracle',
    amount: 6200,
    currency: 'GBP',
    paymentDate: '2026-10-15',
    bankReference: 'WIRE-2026-ORC-9912',
    status: 'completed',
  },
];

const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp_001',
    organizationId: 'org_enterprise_primary',
    title: 'AWS Cloud Infrastructure - Multi-Region Cluster',
    category: 'Cloud Infrastructure',
    amount: 2420,
    currency: 'GBP',
    date: '2026-10-01',
    vendorId: 'ven_aws_cloud',
    vendorName: 'AWS Cloud Services UK',
    isRecurring: true,
    status: 'logged',
    notes: 'Monthly EC2, S3, and CloudFront CDN bandwidth costs.',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'exp_002',
    organizationId: 'org_enterprise_primary',
    title: 'Canary Wharf Headquarters Office Rent',
    category: 'Office & Rent',
    amount: 3100,
    currency: 'GBP',
    date: '2026-10-05',
    vendorId: 'ven_wework_hq',
    vendorName: 'WeWork Office Facilities Ltd',
    isRecurring: true,
    status: 'logged',
    notes: 'Q4 Canary Wharf 20-person executive suite license.',
    createdAt: '2026-10-05T09:30:00.000Z',
  },
  {
    id: 'exp_003',
    organizationId: 'org_enterprise_primary',
    title: 'Engineering Dell Workstation Servers',
    category: 'Hardware',
    amount: 4850,
    currency: 'GBP',
    date: '2026-10-14',
    vendorId: 'ven_dell_ent',
    vendorName: 'Dell Technologies Enterprise',
    isRecurring: false,
    status: 'logged',
    notes: 'PowerEdge R750 server with ECC memory for on-prem CI/CD pipeline.',
    createdAt: '2026-10-14T15:20:00.000Z',
  },
  {
    id: 'exp_004',
    organizationId: 'org_enterprise_primary',
    title: 'GitHub Enterprise & Figma Organization Licenses',
    category: 'Software',
    amount: 680,
    currency: 'GBP',
    date: '2026-10-16',
    isRecurring: true,
    status: 'logged',
    notes: '25 developer seat subscription seats.',
    createdAt: '2026-10-16T12:00:00.000Z',
  },
];

const SEED_INVENTORY: InventoryItem[] = [
  {
    id: 'inv_srv_001',
    organizationId: 'org_enterprise_primary',
    sku: 'SKU-SRV-7501',
    name: 'Dell PowerEdge R750 Enterprise Server Rack',
    category: 'Hardware & Servers',
    unit: 'units',
    unitCost: 3850,
    sellingPrice: 4950,
    currentStock: 8,
    lowStockThreshold: 3,
    department: 'IT Infrastructure',
    branch: 'Main HQ - London',
    supplierId: 'ven_dell_ent',
    supplierName: 'Dell Technologies Enterprise',
    reorderQuantity: 5,
    lastRestockedAt: '2026-10-14T15:20:00.000Z',
    addedBy: 'Kenneth Onekalit (super_admin)',
    notes: 'Dual Intel Xeon Gold, 128GB ECC RAM, 8x 1.92TB NVMe SSDs.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'inv_ram_002',
    organizationId: 'org_enterprise_primary',
    sku: 'SKU-RAM-128G',
    name: '128GB DDR4 ECC Registered Server Memory Kit',
    category: 'Hardware & Components',
    unit: 'kits',
    unitCost: 480,
    sellingPrice: 650,
    currentStock: 14,
    lowStockThreshold: 5,
    department: 'IT Infrastructure',
    branch: 'Main HQ - London',
    supplierId: 'ven_dell_ent',
    supplierName: 'Dell Technologies Enterprise',
    reorderQuantity: 10,
    lastRestockedAt: '2026-10-14T15:20:00.000Z',
    addedBy: 'Kenneth Onekalit (super_admin)',
    notes: 'PC4-25600 3200MHz Registered ECC DIMMs for server node expansions.',
    createdAt: '2026-09-05T09:30:00.000Z',
  },
  {
    id: 'inv_mon_003',
    organizationId: 'org_enterprise_primary',
    sku: 'SKU-MON-4K32',
    name: 'Dell UltraSharp 32" 4K USB-C Hub Monitor (U3223QE)',
    category: 'Peripherals & Displays',
    unit: 'units',
    unitCost: 620,
    sellingPrice: 850,
    currentStock: 2,
    lowStockThreshold: 4,
    department: 'Operations',
    branch: 'Regional Hub - New York',
    supplierId: 'ven_dell_ent',
    supplierName: 'Dell Technologies Enterprise',
    reorderQuantity: 6,
    lastRestockedAt: '2026-09-20T11:00:00.000Z',
    addedBy: 'Sarah Jenkins (org_admin)',
    notes: 'IPS Black technology, 90W Power Delivery, RJ45 Gigabit Ethernet.',
    createdAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'inv_lic_004',
    organizationId: 'org_enterprise_primary',
    sku: 'SKU-LIC-GHE25',
    name: 'GitHub Enterprise 25-Seat Developer License Tier',
    category: 'Software & Licenses',
    unit: 'licenses',
    unitCost: 525,
    sellingPrice: 680,
    currentStock: 25,
    lowStockThreshold: 5,
    department: 'Engineering',
    branch: 'Main HQ - London',
    reorderQuantity: 10,
    lastRestockedAt: '2026-10-16T12:00:00.000Z',
    addedBy: 'Kenneth Onekalit (super_admin)',
    notes: 'Annual license bundle for private microservice repositories.',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'inv_cab_005',
    organizationId: 'org_enterprise_primary',
    sku: 'SKU-CAB-CAT6A',
    name: 'Cat6A 10Gbps Shielded Network Patch Cables (50m Reel)',
    category: 'Networking & Cabling',
    unit: 'boxes',
    unitCost: 85,
    sellingPrice: 130,
    currentStock: 32,
    lowStockThreshold: 10,
    department: 'Logistics',
    branch: 'EMEA Distribution - Dublin',
    reorderQuantity: 20,
    lastRestockedAt: '2026-09-25T14:00:00.000Z',
    addedBy: 'Marcus Thorne (billing_manager)',
    notes: 'Snagless shielded S/FTP 10 Gigabit high-speed interconnects.',
    createdAt: '2026-09-12T13:45:00.000Z',
  },
];

const SEED_SAAS_REVENUE_TRANSACTIONS: SaaSSubscriptionTransaction[] = [
  {
    id: 'sub_txn_oct_apex',
    organizationId: 'org_apex_tech',
    organizationName: 'Apex Cloud Technologies Inc.',
    planName: 'Pro',
    amount: 2.00,
    currency: 'USD',
    billingCycle: 'monthly',
    status: 'settled',
    paymentGateway: 'Stripe Subscriptions (ch_3MvApex918201)',
    transactionId: 'txn_sub_apex_oct26',
    timestamp: '2026-10-15T08:30:00Z',
    invoiceCount: 28,
    cardLast4: '8912',
  },
  {
    id: 'sub_txn_oct_nordic',
    organizationId: 'org_nordic_media',
    organizationName: 'Nordic Digital Media Studio',
    planName: 'Pro',
    amount: 2.00,
    currency: 'EUR',
    billingCycle: 'monthly',
    status: 'settled',
    paymentGateway: 'Stripe Subscriptions (ch_3MvNordic2233)',
    transactionId: 'txn_sub_nordic_oct26',
    timestamp: '2026-10-18T10:14:00Z',
    invoiceCount: 35,
    cardLast4: '1044',
  },
  {
    id: 'sub_txn_oct_quantum',
    organizationId: 'org_quantum_ai',
    organizationName: 'Quantum AI Systems Ltd',
    planName: 'Enterprise Pro',
    amount: 19.00,
    currency: 'GBP',
    billingCycle: 'monthly',
    status: 'settled',
    paymentGateway: 'Visa Corporate Direct (ch_3MvQuantum99)',
    transactionId: 'txn_sub_quantum_oct26',
    timestamp: '2026-10-10T14:22:00Z',
    invoiceCount: 52,
    cardLast4: '3001',
  },
  {
    id: 'sub_txn_oct_primary',
    organizationId: 'org_enterprise_primary',
    organizationName: 'Enterprise Cloud Invoicing',
    planName: 'Pro',
    amount: 2.00,
    currency: 'USD',
    billingCycle: 'monthly',
    status: 'settled',
    paymentGateway: 'Stripe Subscriptions (ch_3MvPrimary88)',
    transactionId: 'txn_sub_primary_oct26',
    timestamp: '2026-10-20T09:00:00Z',
    invoiceCount: 14,
    cardLast4: '4242',
  },
  {
    id: 'sub_txn_sep_apex',
    organizationId: 'org_apex_tech',
    organizationName: 'Apex Cloud Technologies Inc.',
    planName: 'Pro',
    amount: 2.00,
    currency: 'USD',
    billingCycle: 'monthly',
    status: 'settled',
    paymentGateway: 'Stripe Subscriptions (ch_3MsApex81729)',
    transactionId: 'txn_sub_apex_sep26',
    timestamp: '2026-09-15T08:30:00Z',
    invoiceCount: 18,
    cardLast4: '8912',
  },
  {
    id: 'sub_txn_sep_quantum',
    organizationId: 'org_quantum_ai',
    organizationName: 'Quantum AI Systems Ltd',
    planName: 'Enterprise Pro',
    amount: 19.00,
    currency: 'GBP',
    billingCycle: 'monthly',
    status: 'settled',
    paymentGateway: 'Visa Corporate Direct (ch_3MsQuantum44)',
    transactionId: 'txn_sub_quantum_sep26',
    timestamp: '2026-09-10T14:22:00Z',
    invoiceCount: 38,
    cardLast4: '3001',
  },
];

const SEED_TENANT_QUERY_LOGS: TenantQueryLog[] = [
  {
    id: 'tql_001_slow_inv',
    timestamp: '2026-10-21T03:42:15Z',
    organizationId: 'org_apex_tech',
    organizationName: 'Apex Cloud Technologies Inc.',
    userEmail: 'marcus@apexcloud.io',
    userRole: 'org_admin',
    collection: 'invoices',
    signature: "db.collection('invoices').where('organizationId', '==', 'org_apex_tech').where('status', 'in', ['sent','overdue']).orderBy('dueDate', 'desc')",
    latencyMs: 342,
    docsScanned: 1840,
    docsReturned: 14,
    status: 'slow_unindexed',
    suggestedIndex: {
      name: 'idx_invoices_org_status_dueDate',
      fields: [
        { field: 'organizationId', mode: 'ASCENDING' },
        { field: 'status', mode: 'ASCENDING' },
        { field: 'dueDate', mode: 'DESCENDING' },
      ],
      firestoreJson: JSON.stringify({
        collectionGroup: 'invoices',
        queryScope: 'COLLECTION',
        fields: [
          { fieldPath: 'organizationId', order: 'ASCENDING' },
          { fieldPath: 'status', order: 'ASCENDING' },
          { fieldPath: 'dueDate', order: 'DESCENDING' },
        ],
      }, null, 2),
      sqlStatement: 'CREATE INDEX CONCURRENTLY idx_invoices_org_status_due ON invoices (organization_id, status, due_date DESC);',
      reason: 'Multi-tenant composite filter and order-by scans entire partition without a composite index.',
    },
    resolutionStatus: 'open',
  },
  {
    id: 'tql_002_exp_cat',
    timestamp: '2026-10-21T03:15:20Z',
    organizationId: 'org_nordic_media',
    organizationName: 'Nordic Digital Media Studio',
    userEmail: 'freja@nordicmedia.se',
    userRole: 'org_admin',
    collection: 'expenses',
    signature: "db.collection('expenses').where('organizationId', '==', 'org_nordic_media').where('category', '==', 'Hardware').orderBy('date', 'desc')",
    latencyMs: 218,
    docsScanned: 920,
    docsReturned: 5,
    status: 'slow_unindexed',
    suggestedIndex: {
      name: 'idx_expenses_org_cat_date',
      fields: [
        { field: 'organizationId', mode: 'ASCENDING' },
        { field: 'category', mode: 'ASCENDING' },
        { field: 'date', mode: 'DESCENDING' },
      ],
      firestoreJson: JSON.stringify({
        collectionGroup: 'expenses',
        queryScope: 'COLLECTION',
        fields: [
          { fieldPath: 'organizationId', order: 'ASCENDING' },
          { fieldPath: 'category', order: 'ASCENDING' },
          { fieldPath: 'date', order: 'DESCENDING' },
        ],
      }, null, 2),
      sqlStatement: 'CREATE INDEX CONCURRENTLY idx_expenses_org_cat_date ON expenses (organization_id, category, date DESC);',
      reason: 'Expense category filtering with date ordering requires composite indexing.',
    },
    resolutionStatus: 'open',
  },
  {
    id: 'tql_003_audit_actor',
    timestamp: '2026-10-21T02:50:11Z',
    organizationId: 'org_enterprise_primary',
    organizationName: 'Enterprise Cloud Invoicing',
    userEmail: 'onekalitkenneth@gmail.com',
    userRole: 'super_admin',
    collection: 'audit_logs',
    signature: "db.collection('audit_logs').where('organizationId', '==', 'org_enterprise_primary').where('action', '==', 'SUBSCRIPTION_UPGRADED').orderBy('timestamp', 'desc')",
    latencyMs: 185,
    docsScanned: 640,
    docsReturned: 2,
    status: 'warning',
    suggestedIndex: {
      name: 'idx_audit_org_action_time',
      fields: [
        { field: 'organizationId', mode: 'ASCENDING' },
        { field: 'action', mode: 'ASCENDING' },
        { field: 'timestamp', mode: 'DESCENDING' },
      ],
      firestoreJson: JSON.stringify({
        collectionGroup: 'audit_logs',
        queryScope: 'COLLECTION',
        fields: [
          { fieldPath: 'organizationId', order: 'ASCENDING' },
          { fieldPath: 'action', order: 'ASCENDING' },
          { fieldPath: 'timestamp', order: 'DESCENDING' },
        ],
      }, null, 2),
      sqlStatement: 'CREATE INDEX CONCURRENTLY idx_audit_org_action_time ON audit_logs (organization_id, action, timestamp DESC);',
      reason: 'Audit trail action query filtered by tenant.',
    },
    resolutionStatus: 'resolved',
  },
  {
    id: 'tql_004_client_search',
    timestamp: '2026-10-21T01:30:00Z',
    organizationId: 'org_quantum_ai',
    organizationName: 'Quantum AI Systems Ltd',
    userEmail: 'aris@quantumai.dev',
    userRole: 'org_admin',
    collection: 'clients',
    signature: "db.collection('clients').where('organizationId', '==', 'org_quantum_ai').orderBy('createdAt', 'desc')",
    latencyMs: 19,
    docsScanned: 24,
    docsReturned: 24,
    status: 'optimized',
    resolutionStatus: 'resolved',
  },
];

const SEED_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt_001_apex_latency',
    ticketNumber: 'TICK-2026-101',
    organizationId: 'org_apex_tech',
    organizationName: 'Apex Cloud Technologies Inc.',
    createdById: 'usr_marcus_apex',
    createdByName: 'Marcus Vance',
    createdByEmail: 'marcus@apexcloud.io',
    category: 'slow_query_performance',
    priority: 'urgent',
    escalationLevel: 'critical',
    status: 'open',
    assignedAdminName: 'Kenneth Onekalit',
    assignedAdminEmail: 'onekalitkenneth@gmail.com',
    automatedRoutingTriggered: true,
    automatedRoutingDispatches: [
      {
        id: 'ard_001_slack',
        ticketId: 'tkt_001_apex_latency',
        ticketNumber: 'TICK-2026-101',
        escalationLevel: 'critical',
        channel: 'slack',
        recipient: '#platform-critical-incidents',
        timestamp: '2026-10-21T08:30:05.000Z',
        status: 'delivered',
        payloadSummary: '🚨 [CRITICAL ESCALATION] Apex Cloud Technologies opened TICK-2026-101: High latency on invoice query (>340ms unindexed). Auto-routed to senior platform admin Kenneth Onekalit. SLA: <30m.',
        slackChannel: '#platform-critical-incidents',
      },
      {
        id: 'ard_001_email',
        ticketId: 'tkt_001_apex_latency',
        ticketNumber: 'TICK-2026-101',
        escalationLevel: 'critical',
        channel: 'email',
        recipient: 'onekalitkenneth@gmail.com',
        timestamp: '2026-10-21T08:30:06.000Z',
        status: 'delivered',
        payloadSummary: 'High-priority SES dispatch sent to senior platform admin Kenneth Onekalit (onekalitkenneth@gmail.com)',
        emailSubject: '🚨 [CRITICAL INCIDENT] Ticket TICK-2026-101 opened by Apex Cloud Technologies Inc. - Immediate Action Required',
      },
    ],
    subject: 'High latency on invoice query during month-end financial reporting',
    description: 'Our finance team noticed our invoice export query is taking 342ms and scanning hundreds of documents unindexed. Can the platform engineering team inspect and deploy the composite index on organizationId and createdAt?',
    createdAt: '2026-10-21T08:30:00.000Z',
    updatedAt: '2026-10-21T08:30:00.000Z',
    tags: ['firestore-index', 'sla-critical', 'auto-routed-slack', 'month-end'],
    messages: [
      {
        id: 'msg_001_1',
        senderId: 'usr_marcus_apex',
        senderName: 'Marcus Vance',
        senderEmail: 'marcus@apexcloud.io',
        senderRole: 'tenant_admin',
        message: 'Hello Support Team, we are preparing for our monthly board review and notice the invoice list query in our workspace is taking >300ms. Could you inspect our query execution profile?',
        timestamp: '2026-10-21T08:30:00.000Z',
      },
      {
        id: 'msg_001_sys',
        senderId: 'sys_router',
        senderName: 'Automated Incident Router',
        senderEmail: 'alerts@kero-saas.internal',
        senderRole: 'system',
        message: '🚨 [Automated Routing Engine] Critical escalation level detected. Senior Platform Admin Kenneth Onekalit notified via Slack channel #platform-critical-incidents and high-priority email to onekalitkenneth@gmail.com. Response SLA: 30 minutes.',
        timestamp: '2026-10-21T08:30:05.000Z',
      },
    ],
  },
  {
    id: 'tkt_002_quantum_sub',
    ticketNumber: 'TICK-2026-102',
    organizationId: 'org_quantum_ai',
    organizationName: 'Quantum AI Systems Ltd',
    createdById: 'usr_aris_quantum',
    createdByName: 'Dr. Aris Thorne',
    createdByEmail: 'aris@quantumai.dev',
    category: 'billing_invoicing',
    priority: 'high',
    escalationLevel: 'high',
    status: 'in_progress',
    subject: 'Enterprise Pro subscription renewal confirmation & EU reverse-charge VAT receipt',
    description: 'We noticed our $19.00/mo Enterprise Pro charge was collected. We need to verify that reverse-charge EU VAT was recorded on the official A4 receipt and that our custom API quotas remain unlimited.',
    createdAt: '2026-10-21T09:15:00.000Z',
    updatedAt: '2026-10-21T09:40:00.000Z',
    assignedAdminName: 'Kenneth Onekalit',
    assignedAdminEmail: 'onekalitkenneth@gmail.com',
    tags: ['billing', 'mrr-enterprise', 'vat-receipt'],
    messages: [
      {
        id: 'msg_002_1',
        senderId: 'usr_aris_quantum',
        senderName: 'Dr. Aris Thorne',
        senderEmail: 'aris@quantumai.dev',
        senderRole: 'tenant_admin',
        message: 'Hi Kenneth, our subscription renewed for $19.00. Could you verify our VAT reverse-charge status for our quarterly EU corporate return and confirm the receipt breakdown?',
        timestamp: '2026-10-21T09:15:00.000Z',
      },
      {
        id: 'msg_002_2',
        senderId: 'usr_super_admin',
        senderName: 'Kenneth Onekalit (SaaS Lead)',
        senderEmail: 'onekalitkenneth@gmail.com',
        senderRole: 'super_admin',
        message: 'Hello Dr. Thorne, I have verified your EU VAT ID in our Stripe billing portal. The reverse-charge flag is active on all automated invoices and a clean A4 receipt has been generated with transaction hash.',
        timestamp: '2026-10-21T09:40:00.000Z',
      },
    ],
  },
  {
    id: 'tkt_003_nordic_drive',
    ticketNumber: 'TICK-2026-103',
    organizationId: 'org_nordic_media',
    organizationName: 'Nordic Media Group AB',
    createdById: 'usr_freja_nordic',
    createdByName: 'Freja Lindstrom',
    createdByEmail: 'freja@nordicmedia.se',
    category: 'drive_integration',
    priority: 'medium',
    escalationLevel: 'medium',
    status: 'waiting_on_tenant',
    subject: 'Google Drive automatic PDF sync folder permissions for marketing department',
    description: 'Our design team wants the PDF invoices synced to a shared Google Drive team drive instead of personal drive. Can you advise on the OAuth scope permissions?',
    createdAt: '2026-10-20T16:45:00.000Z',
    updatedAt: '2026-10-20T17:10:00.000Z',
    assignedAdminName: 'Kenneth Onekalit',
    assignedAdminEmail: 'onekalitkenneth@gmail.com',
    tags: ['google-drive', 'oauth', 'pdf-sync'],
    messages: [
      {
        id: 'msg_003_1',
        senderId: 'usr_freja_nordic',
        senderName: 'Freja Lindstrom',
        senderEmail: 'freja@nordicmedia.se',
        senderRole: 'tenant_admin',
        message: 'We configured Google Drive auto-sync, but want to point it to our shared Team Drive "Nordic Media - Client Invoices". How do we grant the service account access?',
        timestamp: '2026-10-20T16:45:00.000Z',
      },
      {
        id: 'msg_003_2',
        senderId: 'usr_super_admin',
        senderName: 'Kenneth Onekalit (SaaS Lead)',
        senderEmail: 'onekalitkenneth@gmail.com',
        senderRole: 'super_admin',
        message: 'Hi Freja, you can grant "Content Manager" permissions to the connected Google OAuth account in your Google Drive Admin settings. Let us know if you encounter any scope errors!',
        timestamp: '2026-10-20T17:10:00.000Z',
      },
    ],
  },
  {
    id: 'tkt_004_solis_quota',
    ticketNumber: 'TICK-2026-104',
    organizationId: 'org_solis_green',
    organizationName: 'Solis Green Energy Ltd',
    createdById: 'usr_claire_solis',
    createdByName: 'Claire Davies',
    createdByEmail: 'claire@solisenergy.co.uk',
    category: 'billing_invoicing',
    priority: 'low',
    escalationLevel: 'low',
    status: 'resolved',
    subject: 'Request to reset starter quota while evaluating Pro tier upgrade',
    description: 'We reached 10 invoices on our test run while training our team on invoice design and multi-currency billing. Can we get an extension or reset before our fiscal year upgrade?',
    createdAt: '2026-10-19T11:20:00.000Z',
    updatedAt: '2026-10-19T14:10:00.000Z',
    resolvedAt: '2026-10-19T14:10:00.000Z',
    resolutionSummary: 'Starter invoice quota reset to 0 and 14-day trial activated.',
    assignedAdminName: 'Kenneth Onekalit',
    assignedAdminEmail: 'onekalitkenneth@gmail.com',
    tags: ['quota-reset', 'trial', 'pro-evaluation'],
    messages: [
      {
        id: 'msg_004_1',
        senderId: 'usr_claire_solis',
        senderName: 'Claire Davies',
        senderEmail: 'claire@solisenergy.co.uk',
        senderRole: 'tenant_admin',
        message: 'We reached 10 invoices on our test run. Can we get an extension to test client portal features before upgrading to Pro?',
        timestamp: '2026-10-19T11:20:00.000Z',
      },
      {
        id: 'msg_004_2',
        senderId: 'usr_super_admin',
        senderName: 'Kenneth Onekalit (SaaS Lead)',
        senderEmail: 'onekalitkenneth@gmail.com',
        senderRole: 'super_admin',
        message: 'Hi Claire, I have reset your starter invoice quota back to 0 so you can continue testing, and our team is standing by if you need assistance with client portals.',
        timestamp: '2026-10-19T14:10:00.000Z',
      },
    ],
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
    } else {
      // Ensure multi-tenants exist if previously seeded with only 1 org
      const existingOrgs = this.getStorageItem<OrganizationSettings[]>(STORAGE_KEYS.ORGANIZATIONS, []);
      if (existingOrgs.length <= 1) {
        this.setStorageItem(STORAGE_KEYS.ORGANIZATIONS, INITIAL_ORGS);
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    } else {
      const existingUsers = this.getStorageItem<User[]>(STORAGE_KEYS.USERS, []);
      if (!existingUsers.some(u => u.email === 'onekalitkenneth@gmail.com')) {
        this.setStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
      }
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
    if (!localStorage.getItem(STORAGE_KEYS.VENDORS)) {
      this.setStorageItem(STORAGE_KEYS.VENDORS, SEED_VENDORS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS)) {
      this.setStorageItem(STORAGE_KEYS.PURCHASE_ORDERS, SEED_PURCHASE_ORDERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VENDOR_PAYMENTS)) {
      this.setStorageItem(STORAGE_KEYS.VENDOR_PAYMENTS, SEED_VENDOR_PAYMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      this.setStorageItem(STORAGE_KEYS.EXPENSES, SEED_EXPENSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SAAS_REVENUE_TRANSACTIONS)) {
      this.setStorageItem(STORAGE_KEYS.SAAS_REVENUE_TRANSACTIONS, SEED_SAAS_REVENUE_TRANSACTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TENANT_QUERY_LOGS)) {
      this.setStorageItem(STORAGE_KEYS.TENANT_QUERY_LOGS, SEED_TENANT_QUERY_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS)) {
      this.setStorageItem(STORAGE_KEYS.SUPPORT_TICKETS, SEED_SUPPORT_TICKETS);
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
      localStorage.removeItem(STORAGE_KEYS.SUPPORT_TICKETS);
      this.setStorageItem(STORAGE_KEYS.INVOICES, []);
      this.setStorageItem(STORAGE_KEYS.CLIENTS, []);
      this.setStorageItem(STORAGE_KEYS.AUDIT_LOGS, []);
      this.setStorageItem(STORAGE_KEYS.API_KEYS, []);
      this.setStorageItem(STORAGE_KEYS.SUPPORT_TICKETS, SEED_SUPPORT_TICKETS);
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
      if (!org.logoUrl) {
        org.logoUrl = '/kero-logo.png';
      }
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

    // Record SaaS revenue transaction for platform admin collection
    const txns = this.getSaaSRevenueTransactions();
    const newTxn: SaaSSubscriptionTransaction = {
      id: 'sub_txn_' + Math.random().toString(36).substring(2, 9),
      organizationId: org.id,
      organizationName: org.name,
      planName: 'Pro',
      amount: 2.0,
      currency: org.currency || 'USD',
      billingCycle: 'monthly',
      status: 'settled',
      paymentGateway: `Stripe Direct (${cardDetails.brand} •••• ${cardDetails.last4})`,
      transactionId: 'ch_stripe_' + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString(),
      invoiceCount: org.invoiceCount || 0,
      cardLast4: cardDetails.last4,
    };
    txns.unshift(newTxn);
    this.setStorageItem(STORAGE_KEYS.SAAS_REVENUE_TRANSACTIONS, txns);

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
      details: `Subscribed to KERO INVOICE Pro ($2.00/mo) via ${cardDetails.brand} (•••• ${cardDetails.last4}) & Stripe billing portal`,
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

    // Ensure invoice has professional Terms & Conditions
    if (!invoice.termsAndConditions || !invoice.termsAndConditions.trim()) {
      invoice.termsAndConditions = org.invoiceTermsAndConditions || DEFAULT_ENTERPRISE_TERMS;
    }

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
    const isSuperAdmin = actor.role === 'super_admin';
    const isOrgAdmin = actor.role === 'org_admin' && actor.organizationId === orgId;

    if (!isSuperAdmin && !isOrgAdmin) {
      throw new Error('Access denied: Only Org Admin or Platform Super Admin can invite team members.');
    }

    if (role === 'super_admin' && !isSuperAdmin) {
      throw new Error('Tenants cannot assign the platform super_admin role.');
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
    const isSuperAdmin = actor.role === 'super_admin';
    const isOrgAdmin = actor.role === 'org_admin' && actor.organizationId === orgId;

    if (!isSuperAdmin && !isOrgAdmin) {
      return false;
    }

    if (newRole === 'super_admin' && !isSuperAdmin) {
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

  public removeUserFromOrg(userId: string, orgId: string, actor: User): boolean {
    const isSuperAdmin = actor.role === 'super_admin';
    const isOrgAdmin = actor.role === 'org_admin' && actor.organizationId === orgId;

    if (!isSuperAdmin && !isOrgAdmin) {
      throw new Error('Access denied: Only Org Admin or Platform Super Admin can remove team members.');
    }

    if (userId === actor.id) {
      throw new Error('Cannot remove yourself from the organization.');
    }

    const users = this.getInternalAllUsers();
    const target = users.find(u => u.id === userId && u.organizationId === orgId);
    if (!target) return false;

    const remaining = users.filter(u => !(u.id === userId && u.organizationId === orgId));
    this.setInternalUsers(remaining);

    this.addAuditLog({
      organizationId: orgId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'USER_REMOVED',
      resourceType: 'user',
      resourceId: userId,
      status: 'warning',
      details: `Removed team member ${target.name} (${target.email}) from tenant organization`,
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

  // ==========================================
  // EXPENSE TRACKING
  // ==========================================
  public getExpenses(orgId: string): Expense[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return [];
    const all = this.getStorageItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    return all.filter(e => e.organizationId === orgId);
  }

  public saveExpense(expense: Expense, actor?: User): void {
    const activeOrgId = this.getActiveOrgId();
    if (expense.organizationId !== activeOrgId) return;

    const all = this.getStorageItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const idx = all.findIndex(e => e.id === expense.id);
    if (idx >= 0) {
      all[idx] = expense;
    } else {
      all.unshift(expense);
    }
    this.setStorageItem(STORAGE_KEYS.EXPENSES, all);

    if (actor) {
      this.addAuditLog({
        organizationId: expense.organizationId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SETTINGS_UPDATED',
        resourceType: 'organization',
        resourceId: expense.id,
        status: 'success',
        details: `Recorded operational expense: ${expense.title} (${expense.currency} ${expense.amount.toLocaleString()}) [${expense.category}]`,
      });
    }
  }

  public deleteExpense(id: string, orgId: string, actor?: User): boolean {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return false;

    const all = this.getStorageItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const exp = all.find(e => e.id === id && e.organizationId === orgId);
    if (!exp) return false;

    const filtered = all.filter(e => e.id !== id);
    this.setStorageItem(STORAGE_KEYS.EXPENSES, filtered);

    if (actor) {
      this.addAuditLog({
        organizationId: orgId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SETTINGS_UPDATED',
        resourceType: 'organization',
        resourceId: id,
        status: 'warning',
        details: `Deleted operational expense record '${exp.title}'`,
      });
    }
    return true;
  }

  public getUpcomingRecurringExpenseAlerts(orgId: string): Expense[] {
    const expenses = this.getExpenses(orgId);
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return expenses.filter(e => {
      if (!e.isRecurring || !e.nextRecurringDate) return false;
      const nextDate = new Date(e.nextRecurringDate);
      return nextDate >= now && nextDate <= threeDaysLater;
    });
  }

  // ==========================================
  // INVENTORY & STOCK MANAGEMENT
  // ==========================================
  public getInventoryItems(orgId: string): InventoryItem[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return [];
    return this.getStorageItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY, SEED_INVENTORY).filter(i => i.organizationId === orgId);
  }

  public saveInventoryItem(item: InventoryItem, actor?: User): void {
    const activeOrgId = this.getActiveOrgId();
    if (item.organizationId !== activeOrgId) return;

    if (!item.addedBy && actor) {
      item.addedBy = `${actor.name} (${actor.role})`;
      item.addedById = actor.id;
    }

    const all = this.getStorageItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY, SEED_INVENTORY);
    const idx = all.findIndex(i => i.id === item.id);
    const isNew = idx < 0;

    if (!isNew) {
      all[idx] = item;
    } else {
      all.unshift(item);
    }
    this.setStorageItem(STORAGE_KEYS.INVENTORY, all);

    if (actor) {
      this.addAuditLog({
        organizationId: item.organizationId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: isNew ? 'USER_INVITED' : 'SETTINGS_UPDATED',
        resourceType: 'organization',
        resourceId: item.id,
        status: 'success',
        details: `${isNew ? 'Added new' : 'Updated'} inventory item '${item.name}' (SKU: ${item.sku}) in ${item.department} / ${item.branch}. Stock: ${item.currentStock} ${item.unit}. Added by: ${item.addedBy || actor.name}.`,
      });
    }
  }

  public deleteInventoryItem(id: string, orgId: string, actor?: User): boolean {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return false;

    const all = this.getStorageItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY, SEED_INVENTORY);
    const target = all.find(i => i.id === id && i.organizationId === orgId);
    const filtered = all.filter(i => !(i.id === id && i.organizationId === orgId));
    this.setStorageItem(STORAGE_KEYS.INVENTORY, filtered);

    if (actor && target) {
      this.addAuditLog({
        organizationId: orgId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SETTINGS_UPDATED',
        resourceType: 'organization',
        resourceId: id,
        status: 'warning',
        details: `Deleted inventory item '${target.name}' (${target.sku}) from ${target.department} / ${target.branch}`,
      });
    }
    return true;
  }

  public getStockMovements(orgId: string): StockMovement[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return [];
    return this.getStorageItem<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []).filter(m => m.organizationId === orgId);
  }

  public recordStockMovement(movement: StockMovement, actor?: User): void {
    const all = this.getStorageItem<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
    all.unshift(movement);
    this.setStorageItem(STORAGE_KEYS.STOCK_MOVEMENTS, all);

    // Update item stock count
    const items = this.getInventoryItems(movement.organizationId);
    const item = items.find(i => i.id === movement.itemId);
    if (item) {
      if (movement.type === 'in') {
        item.currentStock += movement.quantity;
      } else if (movement.type === 'out') {
        item.currentStock = Math.max(0, item.currentStock - movement.quantity);
      }
      item.lastRestockedAt = new Date().toISOString();
      this.saveInventoryItem(item, actor);
    }
  }

  public getLowStockItems(orgId: string): InventoryItem[] {
    const items = this.getInventoryItems(orgId);
    return items.filter(i => i.currentStock <= i.lowStockThreshold);
  }

  public getInventorySummary(orgId: string) {
    const items = this.getInventoryItems(orgId);
    const totalItems = items.length;
    const totalUnits = items.reduce((sum, i) => sum + i.currentStock, 0);
    const totalCostValuation = items.reduce((sum, i) => sum + (i.unitCost * i.currentStock), 0);
    const totalRetailValuation = items.reduce((sum, i) => sum + (i.sellingPrice * i.currentStock), 0);
    const potentialGrossMargin = totalRetailValuation > 0
      ? ((totalRetailValuation - totalCostValuation) / totalRetailValuation) * 100
      : 0;
    const lowStockItems = items.filter(i => i.currentStock <= i.lowStockThreshold);

    // Grouping by Category
    const categoryMap: Record<string, { count: number; units: number; costValuation: number; retailValuation: number }> = {};
    // Grouping by Department
    const departmentMap: Record<string, { count: number; units: number; costValuation: number; retailValuation: number }> = {};
    // Grouping by Branch
    const branchMap: Record<string, { count: number; units: number; costValuation: number; retailValuation: number }> = {};

    items.forEach((item) => {
      const cat = item.category || 'Uncategorized';
      const dept = item.department || 'General Operations';
      const br = item.branch || 'Main HQ';

      const costVal = item.unitCost * item.currentStock;
      const retVal = item.sellingPrice * item.currentStock;

      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, units: 0, costValuation: 0, retailValuation: 0 };
      categoryMap[cat].count += 1;
      categoryMap[cat].units += item.currentStock;
      categoryMap[cat].costValuation += costVal;
      categoryMap[cat].retailValuation += retVal;

      if (!departmentMap[dept]) departmentMap[dept] = { count: 0, units: 0, costValuation: 0, retailValuation: 0 };
      departmentMap[dept].count += 1;
      departmentMap[dept].units += item.currentStock;
      departmentMap[dept].costValuation += costVal;
      departmentMap[dept].retailValuation += retVal;

      if (!branchMap[br]) branchMap[br] = { count: 0, units: 0, costValuation: 0, retailValuation: 0 };
      branchMap[br].count += 1;
      branchMap[br].units += item.currentStock;
      branchMap[br].costValuation += costVal;
      branchMap[br].retailValuation += retVal;
    });

    return {
      totalItems,
      totalUnits,
      totalCostValuation,
      totalRetailValuation,
      potentialGrossMargin,
      lowStockItems,
      categoryBreakdown: categoryMap,
      departmentBreakdown: departmentMap,
      branchBreakdown: branchMap,
    };
  }

  // ==========================================
  // VENDOR MANAGEMENT & PURCHASE ORDERS
  // ==========================================
  public getVendors(orgId: string): Vendor[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return [];
    return this.getStorageItem<Vendor[]>(STORAGE_KEYS.VENDORS, []).filter(v => v.organizationId === orgId);
  }

  public saveVendor(vendor: Vendor, actor?: User): void {
    const activeOrgId = this.getActiveOrgId();
    if (vendor.organizationId !== activeOrgId) return;

    const all = this.getStorageItem<Vendor[]>(STORAGE_KEYS.VENDORS, []);
    const idx = all.findIndex(v => v.id === vendor.id);
    if (idx >= 0) {
      all[idx] = vendor;
    } else {
      all.unshift(vendor);
    }
    this.setStorageItem(STORAGE_KEYS.VENDORS, all);
  }

  public deleteVendor(id: string, orgId: string, actor?: User): boolean {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return false;

    const all = this.getStorageItem<Vendor[]>(STORAGE_KEYS.VENDORS, []);
    const filtered = all.filter(v => !(v.id === id && v.organizationId === orgId));
    this.setStorageItem(STORAGE_KEYS.VENDORS, filtered);
    return true;
  }

  public getPurchaseOrders(orgId: string): PurchaseOrder[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return [];
    return this.getStorageItem<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, []).filter(po => po.organizationId === orgId);
  }

  public savePurchaseOrder(po: PurchaseOrder, actor?: User): void {
    const activeOrgId = this.getActiveOrgId();
    if (po.organizationId !== activeOrgId) return;

    const all = this.getStorageItem<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, []);
    const idx = all.findIndex(p => p.id === po.id);
    if (idx >= 0) {
      all[idx] = po;
    } else {
      all.unshift(po);
    }
    this.setStorageItem(STORAGE_KEYS.PURCHASE_ORDERS, all);
  }

  /**
   * Receives a Purchase Order: Auto-updates inventory stock and syncs with expense tracker
   */
  public receivePurchaseOrder(poId: string, orgId: string, actor?: User): boolean {
    const pos = this.getPurchaseOrders(orgId);
    const po = pos.find(p => p.id === poId);
    if (!po) return false;

    po.status = 'received';
    po.receivedDate = new Date().toISOString();
    this.savePurchaseOrder(po, actor);

    // Auto-update stock for each item in the PO
    const items = this.getInventoryItems(orgId);
    for (const poItem of po.items) {
      const invItem = items.find(i => i.id === poItem.itemId || i.name.toLowerCase() === poItem.itemName.toLowerCase());
      if (invItem) {
        invItem.currentStock += poItem.quantity;
        invItem.lastRestockedAt = new Date().toISOString();
        this.saveInventoryItem(invItem, actor);

        this.recordStockMovement({
          id: 'sm_' + Math.random().toString(36).substr(2, 7),
          itemId: invItem.id,
          itemName: invItem.name,
          organizationId: orgId,
          type: 'in',
          quantity: poItem.quantity,
          date: new Date().toISOString(),
          department: invItem.department || 'Operations',
          branch: invItem.branch || 'Main HQ',
          reason: `PO #${po.poNumber} received from ${po.vendorName}`,
          actorName: actor?.name || 'Automated Pipeline',
        }, actor);
      }
    }

    // Sync with Expense Tracker if not already synced
    if (!po.syncedToExpense) {
      const newExpense: Expense = {
        id: 'exp_po_' + po.id,
        organizationId: orgId,
        title: `PO #${po.poNumber} - ${po.vendorName} Goods Delivery`,
        category: 'Hardware',
        amount: po.totalAmount,
        currency: po.currency,
        date: new Date().toISOString().split('T')[0],
        vendorId: po.vendorId,
        vendorName: po.vendorName,
        isRecurring: false,
        status: 'logged',
        createdAt: new Date().toISOString(),
      };
      this.saveExpense(newExpense, actor);
      po.syncedToExpense = true;
      this.savePurchaseOrder(po, actor);
    }

    return true;
  }

  public getVendorPayments(orgId: string): VendorPayment[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return [];
    return this.getStorageItem<VendorPayment[]>(STORAGE_KEYS.VENDOR_PAYMENTS, []).filter(vp => vp.organizationId === orgId);
  }

  public recordVendorPayment(payment: VendorPayment, actor?: User): void {
    const all = this.getStorageItem<VendorPayment[]>(STORAGE_KEYS.VENDOR_PAYMENTS, []);
    all.unshift(payment);
    this.setStorageItem(STORAGE_KEYS.VENDOR_PAYMENTS, all);

    // Update vendor total disbursed
    const vendors = this.getVendors(payment.organizationId);
    const vendor = vendors.find(v => v.id === payment.vendorId);
    if (vendor) {
      vendor.totalDisbursed = (vendor.totalDisbursed || 0) + payment.amount;
      this.saveVendor(vendor, actor);
    }

    // Mark PO paid if linked
    if (payment.purchaseOrderId) {
      const pos = this.getPurchaseOrders(payment.organizationId);
      const po = pos.find(p => p.id === payment.purchaseOrderId);
      if (po) {
        po.status = 'paid';
        po.bankReference = payment.bankReference;
        this.savePurchaseOrder(po, actor);
      }
    }

    if (actor) {
      this.addAuditLog({
        organizationId: payment.organizationId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'VENDOR_PAYMENT_RECONCILED',
        resourceType: 'organization',
        resourceId: payment.id,
        status: 'success',
        details: `Reconciled supplier disbursement of ${payment.currency} ${payment.amount.toLocaleString()} to ${payment.vendorName} via bank transfer ref: ${payment.bankReference}`,
      });
    }
  }

  public bulkImportVendors(vendors: Vendor[], actor?: User): { count: number; updated: number } {
    const activeOrgId = this.getActiveOrgId();
    const all = this.getStorageItem<Vendor[]>(STORAGE_KEYS.VENDORS, []);
    let newCount = 0;
    let updatedCount = 0;

    for (const v of vendors) {
      if (v.organizationId !== activeOrgId) continue;
      const idx = all.findIndex(existing => existing.id === v.id || (existing.name.toLowerCase() === v.name.toLowerCase() && existing.organizationId === v.organizationId));
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...v };
        updatedCount++;
      } else {
        all.unshift(v);
        newCount++;
      }
    }

    this.setStorageItem(STORAGE_KEYS.VENDORS, all);

    if (actor) {
      this.addAuditLog({
        organizationId: activeOrgId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SETTINGS_UPDATED',
        resourceType: 'organization',
        status: 'success',
        details: `Bulk imported ${newCount} new suppliers and updated ${updatedCount} existing records via CSV`,
      });
    }

    return { count: newCount, updated: updatedCount };
  }

  public bulkImportVendorPayments(payments: VendorPayment[], actor?: User): { count: number } {
    const activeOrgId = this.getActiveOrgId();
    const all = this.getStorageItem<VendorPayment[]>(STORAGE_KEYS.VENDOR_PAYMENTS, []);
    let imported = 0;

    for (const p of payments) {
      if (p.organizationId !== activeOrgId) continue;
      all.unshift(p);
      imported++;

      // Update vendor total disbursed
      const vendors = this.getVendors(p.organizationId);
      const vendor = vendors.find(v => v.id === p.vendorId || v.name.toLowerCase() === p.vendorName.toLowerCase());
      if (vendor) {
        vendor.totalDisbursed = (vendor.totalDisbursed || 0) + p.amount;
        this.saveVendor(vendor, actor);
      }
    }

    this.setStorageItem(STORAGE_KEYS.VENDOR_PAYMENTS, all);

    if (actor) {
      this.addAuditLog({
        organizationId: activeOrgId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SETTINGS_UPDATED',
        resourceType: 'organization',
        status: 'success',
        details: `Bulk imported ${imported} historical supplier bank transfer payments via CSV`,
      });
    }

    return { count: imported };
  }

  // ==========================================
  // CLIENT ACTIVITY FEED & ENGAGEMENT
  // ==========================================
  public getClientActivities(orgId: string, clientId?: string): ClientActivity[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return [];
    const all = this.getStorageItem<ClientActivity[]>(STORAGE_KEYS.CLIENT_ACTIVITIES, []);
    let filtered = all.filter(a => a.organizationId === orgId);
    if (clientId) {
      filtered = filtered.filter(a => a.clientId === clientId);
    }
    return filtered;
  }

  public recordClientActivity(activity: Omit<ClientActivity, 'id' | 'timestamp'>): void {
    const all = this.getStorageItem<ClientActivity[]>(STORAGE_KEYS.CLIENT_ACTIVITIES, []);
    const entry: ClientActivity = {
      ...activity,
      id: 'act_' + Math.random().toString(36).substr(2, 7),
      timestamp: new Date().toISOString(),
    };
    all.unshift(entry);
    if (all.length > 500) all.length = 500;
    this.setStorageItem(STORAGE_KEYS.CLIENT_ACTIVITIES, all);
  }

  // ==========================================
  // WORKFLOW AUTOMATOR
  // ==========================================
  public getWorkflowRules(orgId: string): WorkflowRule[] {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return [];
    return this.getStorageItem<WorkflowRule[]>(STORAGE_KEYS.WORKFLOW_RULES, []).filter(r => r.organizationId === orgId);
  }

  public saveWorkflowRule(rule: WorkflowRule, actor?: User): void {
    const activeOrgId = this.getActiveOrgId();
    if (rule.organizationId !== activeOrgId) return;

    const all = this.getStorageItem<WorkflowRule[]>(STORAGE_KEYS.WORKFLOW_RULES, []);
    const idx = all.findIndex(r => r.id === rule.id);
    if (idx >= 0) {
      all[idx] = rule;
    } else {
      all.unshift(rule);
    }
    this.setStorageItem(STORAGE_KEYS.WORKFLOW_RULES, all);
  }

  public deleteWorkflowRule(id: string, orgId: string): boolean {
    const activeOrgId = this.getActiveOrgId();
    if (orgId !== activeOrgId) return false;

    const all = this.getStorageItem<WorkflowRule[]>(STORAGE_KEYS.WORKFLOW_RULES, []);
    const filtered = all.filter(r => !(r.id === id && r.organizationId === orgId));
    this.setStorageItem(STORAGE_KEYS.WORKFLOW_RULES, filtered);
    return true;
  }

  public triggerWorkflow(trigger: 'payment_received' | 'invoice_overdue' | 'invoice_created' | 'low_stock', orgId: string, payload: any): void {
    const rules = this.getWorkflowRules(orgId).filter(r => r.enabled && r.trigger === trigger);
    for (const rule of rules) {
      rule.executionCount = (rule.executionCount || 0) + 1;
      rule.lastExecutedAt = new Date().toISOString();
      this.saveWorkflowRule(rule);

      if (rule.action === 'add_tag' && payload?.invoiceId) {
        const invoices = this.getInvoices(orgId);
        const inv = invoices.find(i => i.id === payload.invoiceId);
        if (inv) {
          inv.tags = Array.from(new Set([...(inv.tags || []), rule.actionPayload]));
          this.saveInvoice(inv);
        }
      }
    }
  }

  // ==========================================
  // INVOICE COLLABORATION, COMMENTS & VERSIONS
  // ==========================================
  public addInvoiceComment(invoiceId: string, orgId: string, text: string, actor: User): InvoiceComment {
    const inv = this.getInvoiceById(invoiceId, orgId);
    if (!inv) throw new Error('Invoice not found');

    const comment: InvoiceComment = {
      id: 'cmt_' + Math.random().toString(36).substr(2, 7),
      invoiceId,
      authorId: actor.id,
      authorName: actor.name,
      text,
      createdAt: new Date().toISOString(),
    };

    inv.comments = [...(inv.comments || []), comment];
    this.saveInvoice(inv);
    return comment;
  }

  public saveInvoiceVersion(invoiceId: string, orgId: string, summary: string, actor: User): InvoiceVersion {
    const inv = this.getInvoiceById(invoiceId, orgId);
    if (!inv) throw new Error('Invoice not found');

    const version: InvoiceVersion = {
      id: 'ver_' + Math.random().toString(36).substr(2, 7),
      timestamp: new Date().toISOString(),
      authorName: actor.name,
      summary,
      snapshot: JSON.parse(JSON.stringify(inv)),
    };

    inv.versions = [...(inv.versions || []), version];
    this.saveInvoice(inv);
    return version;
  }

  public restoreInvoiceVersion(invoiceId: string, orgId: string, versionId: string, actor: User): boolean {
    const inv = this.getInvoiceById(invoiceId, orgId);
    if (!inv || !inv.versions) return false;

    const ver = inv.versions.find(v => v.id === versionId);
    if (!ver || !ver.snapshot) return false;

    const restored: Invoice = {
      ...ver.snapshot,
      updatedAt: new Date().toISOString(),
    };

    this.saveInvoice(restored, actor);
    return true;
  }

  public bulkTagInvoices(invoiceIds: string[], orgId: string, tag: string, actor?: User): boolean {
    const all = this.getInvoices(orgId);
    for (const inv of all) {
      if (invoiceIds.includes(inv.id)) {
        inv.tags = Array.from(new Set([...(inv.tags || []), tag]));
        this.saveInvoice(inv, actor);
      }
    }
    return true;
  }

  // ==========================================
  // AUTOMATED LATE FEES & BANK RECONCILIATION
  // ==========================================
  public assessLateFees(orgId: string, actor?: User): { assessedCount: number; totalFeeAdded: number } {
    const invoices = this.getInvoices(orgId);
    const clients = this.getClients(orgId);
    const now = new Date();
    let assessedCount = 0;
    let totalFeeAdded = 0;

    for (const inv of invoices) {
      if ((inv.status === 'sent' || inv.status === 'overdue') && !inv.isLateFeeAssessed) {
        const dueDate = new Date(inv.dueDate);
        if (dueDate < now) {
          const client = clients.find(c => c.id === inv.clientId);
          const percent = client?.lateFeePercentage || 5; // default 5%
          const flat = client?.lateFeeFlat || 0;
          const fee = Number(((inv.subtotal * (percent / 100)) + flat).toFixed(2));

          inv.status = 'overdue';
          inv.lateFeeApplied = fee;
          inv.isLateFeeAssessed = true;
          inv.totalAmount = Number((inv.totalAmount + fee).toFixed(2));
          inv.items.push({
            id: 'late_fee_' + inv.id,
            description: `Automated Late Payment Assessment (${percent}% penalty)`,
            quantity: 1,
            unitPrice: fee,
            taxRate: 0,
            discountRate: 0,
            amount: fee,
          });

          this.saveInvoice(inv, actor);
          assessedCount++;
          totalFeeAdded += fee;
        }
      }
    }

    return { assessedCount, totalFeeAdded };
  }

  public simulateBankFeedMatch(orgId: string, actor?: User): {
    matchedCount: number;
    matchedInvoices: Invoice[];
    totalMatched: number;
  } {
    const openInvoices = this.getInvoices(orgId).filter(i => i.status === 'sent' || i.status === 'overdue');
    const matched: Invoice[] = [];
    let total = 0;

    // Match top eligible invoices
    for (const inv of openInvoices.slice(0, 2)) {
      this.markInvoicePaid(inv.id, orgId, 'Stripe Bank Settlement (Instant Match)', actor || this.getCurrentUser());
      matched.push(inv);
      total += inv.totalAmount;
      this.triggerWorkflow('payment_received', orgId, { invoiceId: inv.id, amount: inv.totalAmount });
    }

    return {
      matchedCount: matched.length,
      matchedInvoices: matched,
      totalMatched: total,
    };
  }

  // ==========================================
  // SHARED PUBLIC CLIENT PORTAL DATA ACCESS
  // ==========================================
  public getPublicClientPortalData(clientId: string): {
    client?: Client;
    org?: OrganizationSettings;
    invoices: Invoice[];
    payments: { date: string; amount: number; method: string; invoiceNo: string }[];
  } {
    const allClients = this.getStorageItem<Client[]>(STORAGE_KEYS.CLIENTS, []);
    const client = allClients.find(c => c.id === clientId);
    if (!client) return { invoices: [], payments: [] };

    const orgs = this.getInternalAllOrganizations();
    const org = orgs.find(o => o.id === client.organizationId);

    const allInvoices = this.getStorageItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const clientInvoices = allInvoices.filter(i => i.clientId === clientId && i.organizationId === client.organizationId);

    const payments = clientInvoices
      .filter(i => i.status === 'paid' && i.paidAt)
      .map(i => ({
        date: i.paidAt || i.updatedAt,
        amount: i.totalAmount,
        method: i.paymentMethodUsed || 'Direct Transfer',
        invoiceNo: i.invoiceNumber,
      }));

    return {
      client,
      org,
      invoices: clientInvoices,
      payments,
    };
  }

  // ==========================================
  // SUPER ADMIN & SAAS REVENUE OPERATIONS
  // ==========================================
  public loginAsSuperAdmin(targetEmailOrRememberMe: string | boolean = true, rememberMe: boolean = true): { success: boolean; user?: User } {
    let email = 'onekalitkenneth@gmail.com';
    let isRemember = true;

    if (typeof targetEmailOrRememberMe === 'string') {
      email = targetEmailOrRememberMe;
      isRemember = rememberMe;
    } else {
      isRemember = targetEmailOrRememberMe;
    }

    const users = this.getStorageItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    let admin = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!admin) {
      admin = users.find(u => u.role === 'super_admin');
    }
    if (!admin) {
      admin = {
        id: 'usr_super_admin',
        name: 'Kenneth Onekalit',
        email: 'onekalitkenneth@gmail.com',
        role: 'super_admin',
        organizationId: 'org_enterprise_primary',
        createdAt: '2026-08-01T00:00:00.000Z',
        lastActive: new Date().toISOString(),
      };
      users.unshift(admin);
      this.setStorageItem(STORAGE_KEYS.USERS, users);
    }
    return this.establishSession(admin, isRemember);
  }

  public getSuperAdminAccounts(): User[] {
    const users = this.getStorageItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    return users.filter(u => u.role === 'super_admin');
  }

  public createTroubleshootingAccount(
    data: { name: string; email: string; role?: UserRole; organizationId?: string; title?: string },
    actor: User
  ): User {
    const users = this.getStorageItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error(`An account with email ${data.email} already exists.`);
    }

    const newAccount: User = {
      id: 'usr_op_' + Math.random().toString(36).substring(2, 9),
      name: data.name,
      email: data.email,
      role: data.role || 'super_admin',
      organizationId: data.organizationId || 'org_enterprise_primary',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    users.push(newAccount);
    this.setStorageItem(STORAGE_KEYS.USERS, users);

    this.addAuditLog({
      organizationId: newAccount.organizationId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'USER_INVITED',
      resourceType: 'user',
      resourceId: newAccount.id,
      status: 'success',
      details: `Created new SaaS Operations & Troubleshooting Account for ${newAccount.name} (${newAccount.email}) with role ${newAccount.role}`,
    });

    return newAccount;
  }

  public getSaaSTenants(): OrganizationSettings[] {
    return this.getInternalAllOrganizations();
  }

  public getSaaSRevenueTransactions(): SaaSSubscriptionTransaction[] {
    return this.getStorageItem<SaaSSubscriptionTransaction[]>(
      STORAGE_KEYS.SAAS_REVENUE_TRANSACTIONS,
      SEED_SAAS_REVENUE_TRANSACTIONS
    );
  }

  public recordSaaSSubscriptionCharge(
    orgId: string,
    planName: 'Pro' | 'Enterprise Pro' | 'Starter',
    amount: number,
    gateway: string,
    actor: User
  ): SaaSSubscriptionTransaction {
    const orgs = this.getInternalAllOrganizations();
    const org = orgs.find(o => o.id === orgId);
    if (!org) throw new Error('Tenant organization not found');

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    org.plan = 'pro';
    org.subscriptionStatus = 'active';
    org.subscriptionPeriodEnd = nextMonth.toISOString();
    this.saveOrganization(org);

    const txns = this.getSaaSRevenueTransactions();
    const newTxn: SaaSSubscriptionTransaction = {
      id: 'sub_txn_' + Math.random().toString(36).substring(2, 9),
      organizationId: org.id,
      organizationName: org.name,
      planName,
      amount,
      currency: org.currency || 'USD',
      billingCycle: 'monthly',
      status: 'settled',
      paymentGateway: gateway,
      transactionId: 'ch_stripe_' + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString(),
      invoiceCount: org.invoiceCount || 0,
      cardLast4: org.cardLast4 || '4242',
    };

    txns.unshift(newTxn);
    this.setStorageItem(STORAGE_KEYS.SAAS_REVENUE_TRANSACTIONS, txns);

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
      details: `Collected SaaS recurring subscription payment of ${org.currency} ${amount.toFixed(2)} from ${org.name} via ${gateway}`,
    });

    return newTxn;
  }

  public receiveTenantPayment(
    orgId: string,
    amount: number,
    planName: string,
    gateway: string,
    reference: string,
    actor: User
  ): SaaSSubscriptionTransaction {
    const isSuperAdmin = actor.role === 'super_admin';
    if (!isSuperAdmin) {
      throw new Error('Access denied: Only Platform Admin can record or receive payments from tenants.');
    }

    const orgs = this.getInternalAllOrganizations();
    const org = orgs.find((o) => o.id === orgId);
    if (!org) throw new Error('Tenant organization not found');

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    org.plan = 'pro';
    org.subscriptionStatus = 'active';
    org.subscriptionPeriodEnd = nextMonth.toISOString();
    this.saveOrganization(org);

    const txns = this.getSaaSRevenueTransactions();
    const newTxn: SaaSSubscriptionTransaction = {
      id: 'sub_txn_' + Math.random().toString(36).substring(2, 9),
      organizationId: org.id,
      organizationName: org.name,
      planName: (planName.includes('Enterprise') ? 'Enterprise Pro' : 'Pro') as 'Pro' | 'Enterprise Pro' | 'Starter',
      amount,
      currency: org.currency || 'USD',
      billingCycle: 'monthly',
      status: 'settled',
      paymentGateway: gateway,
      transactionId: reference || ('pmt_' + Math.random().toString(36).substring(2, 10)),
      timestamp: new Date().toISOString(),
      invoiceCount: org.invoiceCount || 0,
      cardLast4: org.cardLast4 || '4242',
    };

    txns.unshift(newTxn);
    this.setStorageItem(STORAGE_KEYS.SAAS_REVENUE_TRANSACTIONS, txns);

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
      details: `Platform Admin received payment of ${org.currency || 'USD'} ${amount.toFixed(2)} from tenant ${org.name} via ${gateway}. Ref: ${reference || 'Settled'}`,
    });

    return newTxn;
  }

  public updateTenantPlan(
    orgId: string,
    plan: 'free' | 'pro',
    status: 'active' | 'canceled' | 'past_due' | 'none',
    customInvoiceCountDelta: number = 0,
    actor?: User
  ): OrganizationSettings {
    const orgs = this.getInternalAllOrganizations();
    const org = orgs.find(o => o.id === orgId);
    if (!org) throw new Error('Tenant organization not found');

    const prevPlan = org.plan;
    const prevStatus = org.subscriptionStatus;

    org.plan = plan;
    org.subscriptionStatus = status;
    if (customInvoiceCountDelta !== 0) {
      org.invoiceCount = Math.max(0, (org.invoiceCount || 0) + customInvoiceCountDelta);
    }

    if (plan === 'pro' && status === 'active' && !org.subscriptionPeriodEnd) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      org.subscriptionPeriodEnd = nextMonth.toISOString();
    }

    this.saveOrganization(org);

    if (actor) {
      this.addAuditLog({
        organizationId: orgId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SETTINGS_UPDATED',
        resourceType: 'organization',
        resourceId: orgId,
        status: 'success',
        details: `Platform Super Admin modified ${org.name} plan from ${prevPlan} (${prevStatus}) to ${plan} (${status})`,
      });
    }

    return org;
  }

  public resetTenantInvoiceQuota(orgId: string, actor: User): OrganizationSettings {
    const orgs = this.getInternalAllOrganizations();
    const org = orgs.find(o => o.id === orgId);
    if (!org) throw new Error('Tenant organization not found');

    const prevCount = org.invoiceCount || 0;
    org.invoiceCount = 0;
    this.saveOrganization(org);

    this.addAuditLog({
      organizationId: orgId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SETTINGS_UPDATED',
      resourceType: 'organization',
      resourceId: orgId,
      status: 'success',
      details: `Reset starter invoice quota for tenant ${org.name} (cleared ${prevCount} invoices)`,
    });

    return org;
  }

  // ==========================================
  // MULTI-TENANT QUERY TROUBLESHOOTING
  // ==========================================
  public getTenantQueryLogs(): TenantQueryLog[] {
    return this.getStorageItem<TenantQueryLog[]>(
      STORAGE_KEYS.TENANT_QUERY_LOGS,
      SEED_TENANT_QUERY_LOGS
    );
  }

  public resolveTenantQuery(queryId: string, actor: User): boolean {
    const logs = this.getTenantQueryLogs();
    const target = logs.find(q => q.id === queryId);
    if (!target) return false;

    target.status = 'optimized';
    target.resolutionStatus = 'resolved';
    target.latencyMs = Math.min(target.latencyMs, 18);
    this.setStorageItem(STORAGE_KEYS.TENANT_QUERY_LOGS, logs);

    this.addAuditLog({
      organizationId: target.organizationId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SETTINGS_UPDATED',
      resourceType: 'organization',
      resourceId: target.organizationId,
      status: 'success',
      details: `Applied composite index and optimized slow query on ${target.collection} for ${target.organizationName}`,
    });

    return true;
  }

  public simulateDiagnosticQuery(orgId: string, queryType: string): TenantQueryLog {
    const orgs = this.getInternalAllOrganizations();
    const org = orgs.find(o => o.id === orgId) || orgs[0];
    const latency = Math.floor(Math.random() * 200) + 25;
    const isSlow = latency > 140;

    const newLog: TenantQueryLog = {
      id: 'tql_live_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      organizationId: org.id,
      organizationName: org.name,
      userEmail: 'onekalitkenneth@gmail.com',
      userRole: 'super_admin',
      collection: queryType === 'invoices' ? 'invoices' : queryType === 'expenses' ? 'expenses' : 'clients',
      signature: `db.collection('${queryType}').where('organizationId', '==', '${org.id}').orderBy('createdAt', 'desc')`,
      latencyMs: latency,
      docsScanned: isSlow ? 750 : 25,
      docsReturned: 25,
      status: isSlow ? 'slow_unindexed' : 'optimized',
      resolutionStatus: isSlow ? 'open' : 'resolved',
      suggestedIndex: isSlow
        ? {
            name: `idx_${queryType}_org_createdAt`,
            fields: [
              { field: 'organizationId', mode: 'ASCENDING' },
              { field: 'createdAt', mode: 'DESCENDING' },
            ],
            firestoreJson: JSON.stringify({
              collectionGroup: queryType,
              queryScope: 'COLLECTION',
              fields: [
                { fieldPath: 'organizationId', order: 'ASCENDING' },
                { fieldPath: 'createdAt', order: 'DESCENDING' },
              ],
            }, null, 2),
            sqlStatement: `CREATE INDEX CONCURRENTLY idx_${queryType}_org_created ON ${queryType} (organization_id, created_at DESC);`,
            reason: 'Composite filter and order-by optimization for multi-tenant partition.',
          }
        : undefined,
    };

    const logs = this.getTenantQueryLogs();
    logs.unshift(newLog);
    if (logs.length > 100) logs.length = 100;
    this.setStorageItem(STORAGE_KEYS.TENANT_QUERY_LOGS, logs);

    return newLog;
  }

  // ==========================================
  // MULTI-TENANT SUPPORT TICKET OPERATIONS
  // ==========================================
  public getSupportTickets(): SupportTicket[] {
    return this.getStorageItem<SupportTicket[]>(
      STORAGE_KEYS.SUPPORT_TICKETS,
      SEED_SUPPORT_TICKETS
    );
  }

  public getSupportTicketById(id: string): SupportTicket | undefined {
    return this.getSupportTickets().find(t => t.id === id);
  }

  public createSupportTicket(
    data: Partial<SupportTicket>,
    initialMessage?: string,
    actor?: User
  ): SupportTicket {
    const tickets = this.getSupportTickets();
    const ticketSeq = tickets.length + 105;
    const now = new Date().toISOString();
    const ticketId = 'tkt_' + Math.random().toString(36).substring(2, 9);
    const ticketNumber = `TICK-2026-${ticketSeq}`;
    const orgId = data.organizationId || 'org_apex_tech';
    const orgName = data.organizationName || 'Apex Cloud Technologies Inc.';
    
    // Determine escalation level
    const escalationLevel: TicketEscalationLevel =
      data.escalationLevel || (data.priority === 'urgent' ? 'critical' : 'medium');
    const isCritical = escalationLevel === 'critical';

    const messages: TicketMessage[] = [];
    if (initialMessage) {
      messages.push({
        id: 'msg_' + Math.random().toString(36).substring(2, 9),
        senderId: data.createdById || actor?.id || 'usr_tenant',
        senderName: data.createdByName || actor?.name || 'Tenant Admin',
        senderEmail: data.createdByEmail || actor?.email || 'admin@tenant.com',
        senderRole: 'tenant_admin',
        message: initialMessage,
        timestamp: now,
      });
    }

    let automatedDispatches: AutomatedNotificationDispatch[] | undefined = undefined;
    let assignedAdminName = data.assignedAdminName;
    let assignedAdminEmail = data.assignedAdminEmail;

    if (isCritical) {
      // Automated routing to senior platform admin Kenneth Onekalit
      assignedAdminName = 'Kenneth Onekalit';
      assignedAdminEmail = 'onekalitkenneth@gmail.com';

      automatedDispatches = [
        {
          id: 'ard_slack_' + Math.random().toString(36).substring(2, 9),
          ticketId,
          ticketNumber,
          escalationLevel: 'critical',
          channel: 'slack',
          recipient: '#platform-critical-incidents',
          slackChannel: '#platform-critical-incidents',
          timestamp: now,
          status: 'delivered',
          payloadSummary: `🚨 BLOCK-KIT INCIDENT: [P0 Critical] Ticket #${ticketNumber} opened by ${orgName}. Paged: Kenneth Onekalit. SLA response deadline: 30 minutes.`,
        },
        {
          id: 'ard_email_' + Math.random().toString(36).substring(2, 9),
          ticketId,
          ticketNumber,
          escalationLevel: 'critical',
          channel: 'email',
          recipient: 'onekalitkenneth@gmail.com',
          emailSubject: `🚨 [CRITICAL INCIDENT] Ticket ${ticketNumber} opened by ${orgName} - Immediate Action Required`,
          timestamp: now,
          status: 'delivered',
          payloadSummary: `High-priority SES/SMTP alert dispatched to Senior Platform Admin Kenneth Onekalit (onekalitkenneth@gmail.com) with 30-minute SLA countdown.`,
        },
      ];

      // System audit message injected into the ticket message thread
      messages.push({
        id: 'msg_sys_' + Math.random().toString(36).substring(2, 9),
        senderId: 'sys_router',
        senderName: 'Automated Incident Router',
        senderEmail: 'alerts@kero-saas.internal',
        senderRole: 'system',
        message: `🚨 [Automated Routing Engine] Critical escalation level detected. Senior Platform Admin Kenneth Onekalit has been auto-assigned and alerted via Slack channel #platform-critical-incidents and high-priority email to onekalitkenneth@gmail.com. Response SLA: 30 minutes.`,
        timestamp: now,
      });
    }

    const newTicket: SupportTicket = {
      id: ticketId,
      ticketNumber,
      organizationId: orgId,
      organizationName: orgName,
      createdById: data.createdById || actor?.id || 'usr_marcus_apex',
      createdByName: data.createdByName || actor?.name || 'Marcus Vance',
      createdByEmail: data.createdByEmail || actor?.email || 'marcus@apexcloud.io',
      category: data.category || 'general_inquiry',
      priority: data.priority || (isCritical ? 'urgent' : 'medium'),
      escalationLevel,
      status: 'open',
      subject: data.subject || 'Support Request',
      description: data.description || initialMessage || 'Support inquiry from tenant.',
      createdAt: now,
      updatedAt: now,
      assignedAdminName,
      assignedAdminEmail,
      tags: data.tags || (isCritical ? ['sla-critical', 'auto-routed-slack'] : ['tenant-support']),
      messages,
      automatedRoutingTriggered: isCritical,
      automatedRoutingDispatches: automatedDispatches,
    };

    tickets.unshift(newTicket);
    this.setStorageItem(STORAGE_KEYS.SUPPORT_TICKETS, tickets);

    // If critical, fire the email notification service and broadcast live event
    if (isCritical) {
      try {
        emailService.notifyCriticalTicketEscalation(
          newTicket,
          'onekalitkenneth@gmail.com',
          'Kenneth Onekalit'
        );
      } catch (err) {
        console.error('Error dispatching critical ticket email alert:', err);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('invox:critical_incident_routed', {
            detail: { ticket: newTicket, dispatches: automatedDispatches },
          })
        );
      }
    }

    if (actor) {
      this.addAuditLog({
        organizationId: newTicket.organizationId,
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SETTINGS_UPDATED',
        resourceType: 'organization',
        resourceId: newTicket.organizationId,
        status: 'success',
        details: `Created new support query ${newTicket.ticketNumber} (${newTicket.subject}) with escalation level ${escalationLevel.toUpperCase()} for ${newTicket.organizationName}`,
      });
    }

    return newTicket;
  }

  public addTicketMessage(
    ticketId: string,
    message: string,
    sender: User,
    isInternalNote: boolean = false,
    updatedStatus?: TicketStatus
  ): SupportTicket | null {
    const tickets = this.getSupportTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return null;

    const now = new Date().toISOString();
    const newMsg: TicketMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      senderId: sender.id,
      senderName: sender.name,
      senderEmail: sender.email,
      senderRole: sender.role === 'super_admin' ? 'super_admin' : 'tenant_admin',
      message: message.trim(),
      timestamp: now,
      isInternalNote: isInternalNote,
    };

    ticket.messages.push(newMsg);
    ticket.updatedAt = now;

    if (updatedStatus) {
      ticket.status = updatedStatus;
      if (updatedStatus === 'resolved' || updatedStatus === 'closed') {
        ticket.resolvedAt = now;
        ticket.resolutionSummary = `Resolved by ${sender.name}: ${message.slice(0, 100)}`;
      }
    } else if (sender.role === 'super_admin' && !isInternalNote) {
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      }
    }

    if (sender.role === 'super_admin') {
      ticket.assignedAdminName = sender.name;
      ticket.assignedAdminEmail = sender.email;
    }

    this.setStorageItem(STORAGE_KEYS.SUPPORT_TICKETS, tickets);

    this.addAuditLog({
      organizationId: ticket.organizationId,
      actorId: sender.id,
      actorName: sender.name,
      actorEmail: sender.email,
      actorRole: sender.role,
      action: 'SETTINGS_UPDATED',
      resourceType: 'organization',
      resourceId: ticket.organizationId,
      status: 'success',
      details: `${isInternalNote ? 'Added internal staff note to' : 'Responded to'} support ticket ${ticket.ticketNumber} for ${ticket.organizationName}`,
    });

    return ticket;
  }

  public updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    actor: User,
    resolutionSummary?: string
  ): boolean {
    const tickets = this.getSupportTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    const now = new Date().toISOString();
    ticket.status = status;
    ticket.updatedAt = now;
    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = now;
      if (resolutionSummary) {
        ticket.resolutionSummary = resolutionSummary;
      }
    }

    this.setStorageItem(STORAGE_KEYS.SUPPORT_TICKETS, tickets);

    this.addAuditLog({
      organizationId: ticket.organizationId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SETTINGS_UPDATED',
      resourceType: 'organization',
      resourceId: ticket.organizationId,
      status: 'success',
      details: `Updated support ticket ${ticket.ticketNumber} status to ${status.toUpperCase()} (${resolutionSummary || 'No summary'})`,
    });

    return true;
  }

  public updateTicketPriority(
    ticketId: string,
    priority: TicketPriority,
    actor: User
  ): boolean {
    const tickets = this.getSupportTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    ticket.priority = priority;
    ticket.updatedAt = new Date().toISOString();
    this.setStorageItem(STORAGE_KEYS.SUPPORT_TICKETS, tickets);

    this.addAuditLog({
      organizationId: ticket.organizationId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SETTINGS_UPDATED',
      resourceType: 'organization',
      resourceId: ticket.organizationId,
      status: 'success',
      details: `Updated support ticket ${ticket.ticketNumber} priority to ${priority.toUpperCase()}`,
    });

    return true;
  }

  public assignTicketAdmin(
    ticketId: string,
    adminName: string,
    adminEmail: string,
    actor: User
  ): boolean {
    const tickets = this.getSupportTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    ticket.assignedAdminName = adminName;
    ticket.assignedAdminEmail = adminEmail;
    ticket.updatedAt = new Date().toISOString();
    this.setStorageItem(STORAGE_KEYS.SUPPORT_TICKETS, tickets);

    this.addAuditLog({
      organizationId: ticket.organizationId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SETTINGS_UPDATED',
      resourceType: 'organization',
      resourceId: ticket.organizationId,
      status: 'success',
      details: `Assigned support ticket ${ticket.ticketNumber} to platform admin ${adminName} (${adminEmail})`,
    });

    return true;
  }

  public updateTicketEscalationLevel(
    ticketId: string,
    level: TicketEscalationLevel,
    actor: User,
    reason?: string
  ): boolean {
    const tickets = this.getSupportTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    const previousLevel = ticket.escalationLevel || 'low';
    ticket.escalationLevel = level;
    const now = new Date().toISOString();
    ticket.updatedAt = now;

    if (level === 'critical') {
      ticket.assignedAdminName = 'Kenneth Onekalit';
      ticket.assignedAdminEmail = 'onekalitkenneth@gmail.com';
      ticket.automatedRoutingTriggered = true;

      const dispatches: AutomatedNotificationDispatch[] = [
        {
          id: 'ard_slack_' + Math.random().toString(36).substring(2, 9),
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          escalationLevel: 'critical',
          channel: 'slack',
          recipient: '#platform-critical-incidents',
          slackChannel: '#platform-critical-incidents',
          timestamp: now,
          status: 'delivered',
          payloadSummary: `🚨 BLOCK-KIT INCIDENT: [P0 Critical] Ticket #${ticket.ticketNumber} escalated by ${actor.name}. Paged: Kenneth Onekalit. SLA response deadline: 30 minutes.`,
        },
        {
          id: 'ard_email_' + Math.random().toString(36).substring(2, 9),
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          escalationLevel: 'critical',
          channel: 'email',
          recipient: 'onekalitkenneth@gmail.com',
          emailSubject: `🚨 [CRITICAL INCIDENT] Ticket ${ticket.ticketNumber} escalated to CRITICAL by ${actor.name} - Immediate Action Required`,
          timestamp: now,
          status: 'delivered',
          payloadSummary: `High-priority SES/SMTP alert dispatched to Senior Platform Admin Kenneth Onekalit (onekalitkenneth@gmail.com). Reason: ${reason || 'Manual severity escalation'}.`,
        },
      ];

      ticket.automatedRoutingDispatches = [
        ...(ticket.automatedRoutingDispatches || []),
        ...dispatches,
      ];

      ticket.messages.push({
        id: 'msg_sys_' + Math.random().toString(36).substring(2, 9),
        senderId: 'sys_router',
        senderName: 'Automated Incident Router',
        senderEmail: 'alerts@kero-saas.internal',
        senderRole: 'system',
        message: `🚨 [Automated Escalation] Ticket escalated from ${previousLevel.toUpperCase()} to CRITICAL by ${actor.name}.${reason ? ` Reason: "${reason}".` : ''} Senior Platform Admin Kenneth Onekalit alerted via Slack channel #platform-critical-incidents and priority email to onekalitkenneth@gmail.com. Response SLA: 30 minutes.`,
        timestamp: now,
      });

      try {
        emailService.notifyCriticalTicketEscalation(
          ticket,
          'onekalitkenneth@gmail.com',
          'Kenneth Onekalit'
        );
      } catch (err) {
        console.error('Error dispatching critical escalation email:', err);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('invox:critical_incident_routed', {
            detail: { ticket, dispatches },
          })
        );
      }
    } else {
      ticket.messages.push({
        id: 'msg_sys_' + Math.random().toString(36).substring(2, 9),
        senderId: 'sys_router',
        senderName: 'Automated Incident Router',
        senderEmail: 'alerts@kero-saas.internal',
        senderRole: 'system',
        message: `ℹ️ Escalation level updated from ${previousLevel.toUpperCase()} to ${level.toUpperCase()} by ${actor.name}.${reason ? ` Reason: ${reason}` : ''}`,
        timestamp: now,
      });
    }

    this.setStorageItem(STORAGE_KEYS.SUPPORT_TICKETS, tickets);
    this.addAuditLog({
      organizationId: ticket.organizationId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SETTINGS_UPDATED',
      resourceType: 'organization',
      resourceId: ticket.organizationId,
      status: 'success',
      details: `Updated support ticket ${ticket.ticketNumber} escalation level to ${level.toUpperCase()}${reason ? ` (${reason})` : ''}`,
    });

    return true;
  }

  public dispatchCriticalRoutingAlert(ticketId: string, actor: User): boolean {
    const tickets = this.getSupportTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    const now = new Date().toISOString();
    ticket.automatedRoutingTriggered = true;
    const dispatches: AutomatedNotificationDispatch[] = [
      {
        id: 'ard_slack_' + Math.random().toString(36).substring(2, 9),
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        escalationLevel: ticket.escalationLevel || 'critical',
        channel: 'slack',
        recipient: '#platform-critical-incidents',
        slackChannel: '#platform-critical-incidents',
        timestamp: now,
        status: 'delivered',
        payloadSummary: `🚨 RE-TRIGGERED SLACK ALERT: Ticket #${ticket.ticketNumber} (${ticket.subject}) pushed to #platform-critical-incidents by ${actor.name}. Paged: Kenneth Onekalit.`,
      },
      {
        id: 'ard_email_' + Math.random().toString(36).substring(2, 9),
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        escalationLevel: ticket.escalationLevel || 'critical',
        channel: 'email',
        recipient: 'onekalitkenneth@gmail.com',
        emailSubject: `🚨 [RE-DISPATCH] Critical Incident Alert: Ticket ${ticket.ticketNumber} for ${ticket.organizationName}`,
        timestamp: now,
        status: 'delivered',
        payloadSummary: `Re-dispatched high-urgency SES alert to Kenneth Onekalit (onekalitkenneth@gmail.com). Initiated by ${actor.name}.`,
      },
    ];

    ticket.automatedRoutingDispatches = [
      ...(ticket.automatedRoutingDispatches || []),
      ...dispatches,
    ];

    ticket.messages.push({
      id: 'msg_sys_' + Math.random().toString(36).substring(2, 9),
      senderId: 'sys_router',
      senderName: 'Automated Incident Router',
      senderEmail: 'alerts@kero-saas.internal',
      senderRole: 'system',
      message: `🔔 Senior platform admin alert manually re-dispatched by ${actor.name}. Notification confirmed in Slack #platform-critical-incidents and email to onekalitkenneth@gmail.com.`,
      timestamp: now,
    });

    ticket.updatedAt = now;
    this.setStorageItem(STORAGE_KEYS.SUPPORT_TICKETS, tickets);

    try {
      emailService.notifyCriticalTicketEscalation(
        ticket,
        'onekalitkenneth@gmail.com',
        'Kenneth Onekalit'
      );
    } catch (err) {
      console.error('Error re-dispatching critical escalation email:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('invox:critical_incident_routed', {
          detail: { ticket, dispatches },
        })
      );
    }

    this.addAuditLog({
      organizationId: ticket.organizationId,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SETTINGS_UPDATED',
      resourceType: 'organization',
      resourceId: ticket.organizationId,
      status: 'success',
      details: `Re-dispatched automated critical routing alerts for ticket ${ticket.ticketNumber} to Slack (#platform-critical-incidents) and Kenneth Onekalit`,
    });

    return true;
  }

  public simulateTenantSupportTicket(
    tenantOrgId?: string,
    forcedEscalation?: TicketEscalationLevel
  ): SupportTicket {
    const orgs = this.getInternalAllOrganizations();
    const selectedOrg = tenantOrgId
      ? orgs.find(o => o.id === tenantOrgId) || orgs[1]
      : orgs[Math.floor(Math.random() * (orgs.length - 1)) + 1] || orgs[1];

    const templates = [
      {
        category: 'slow_query_performance' as TicketCategory,
        priority: 'urgent' as TicketPriority,
        escalationLevel: 'critical' as TicketEscalationLevel,
        subject: `🚨 [P0 CRITICAL] Database index lock & slow queries (410ms) in ${selectedOrg.name}`,
        description: `Our accounting department cannot export the end-of-month statements because invoice queries are timing out (>400ms). Unindexed composite scan detected. Requires immediate platform engineering intervention.`,
        message: `Hello Kenneth & Ops team, we are hitting severe latency timeouts on the /invoices collection. Finance leads are blocked from completing the tax closeout. Please inspect index status immediately.`,
        tags: ['query-latency', 'sla-critical', 'firestore-index', 'p0-blocker'],
      },
      {
        category: 'tenant_access_rbac' as TicketCategory,
        priority: 'urgent' as TicketPriority,
        escalationLevel: 'critical' as TicketEscalationLevel,
        subject: `🚨 [CRITICAL] OAuth SSO token revocation failure for finance controllers`,
        description: `Tenants in ${selectedOrg.name} are encountering HTTP 403 on Google Workspace drive export sync after Google OAuth credentials refresh. High business disruption.`,
        message: `Platform Support: Our whole finance group is locked out of automatic Drive invoice syncing following today's corporate Google Workspace domain certificate rotation.`,
        tags: ['oauth-sso', 'sla-critical', 'security-lockout'],
      },
      {
        category: 'billing_invoicing' as TicketCategory,
        priority: 'high' as TicketPriority,
        escalationLevel: 'high' as TicketEscalationLevel,
        subject: `Monthly subscription invoice query & automated bank receipt reconciliation`,
        description: `We need an itemized A4 official receipt showing VAT breakdown for our monthly ${selectedOrg.plan.toUpperCase()} subscription to present to our corporate accounting auditor.`,
        message: `Hi Kenneth, could you provide the clean A4 payment receipt for our recurring subscription charge? Our accounting department requires the cryptographic receipt hash and tax ID details.`,
        tags: ['billing', 'a4-receipt', 'audit'],
      },
      {
        category: 'drive_integration' as TicketCategory,
        priority: 'medium' as TicketPriority,
        escalationLevel: 'medium' as TicketEscalationLevel,
        subject: `Google Drive auto-sync destination folder permissions update`,
        description: `We are migrating our shared drives to a new Google Workspace organization unit and would like to confirm automated PDF backup sync behavior.`,
        message: `Hi team, we updated our Google Drive root folder. Could you verify whether invoice PDFs are auto-uploading without requiring re-authentication?`,
        tags: ['google-drive', 'cloud-sync'],
      },
      {
        category: 'api_webhooks' as TicketCategory,
        priority: 'low' as TicketPriority,
        escalationLevel: 'low' as TicketEscalationLevel,
        subject: `Webhook delivery retry policy for invoice.payment_cleared events`,
        description: `We would like to configure automatic webhook retries with exponential backoff for incoming client payment notifications.`,
        message: `Hello support, what is the default retry window when our endpoint returns HTTP 503 during our maintenance windows?`,
        tags: ['webhooks', 'api-integration'],
      },
    ];

    let chosen = templates[Math.floor(Math.random() * templates.length)];
    if (forcedEscalation) {
      const match = templates.find(t => t.escalationLevel === forcedEscalation);
      if (match) chosen = match;
    }

    return this.createSupportTicket(
      {
        organizationId: selectedOrg.id,
        organizationName: selectedOrg.name,
        createdById: 'usr_tenant_' + selectedOrg.id,
        createdByName: `${selectedOrg.name} Admin`,
        createdByEmail: selectedOrg.email,
        category: chosen.category,
        priority: chosen.priority,
        escalationLevel: forcedEscalation || chosen.escalationLevel,
        subject: chosen.subject,
        description: chosen.description,
        tags: chosen.tags,
      },
      chosen.message
    );
  }
}

export const storageService = new StorageService();
// Initialize immediately
storageService.initialize();
