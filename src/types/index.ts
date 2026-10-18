export type UserRole = 'super_admin' | 'org_admin' | 'billing_manager' | 'invoice_editor' | 'viewer';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'ar' | 'sw';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  organizationId: string;
  createdAt: string;
}

export interface BankAccountDetails {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;
  swiftBic: string;
  iban: string;
  paymentInstructions?: string;
}

export interface PaymentGateways {
  stripeAccountId?: string;
  stripePaymentLink?: string;
  visaDirectEnabled: boolean;
  visaMerchantId?: string;
  paypalEmail?: string;
  cryptoWalletAddress?: string;
  customPaymentInstructions?: string;
}

export type InvoiceTheme = 'modern' | 'classic' | 'slate' | 'minimal';
export type InvoiceAccentColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'slate';

export interface OrganizationSettings {
  id: string;
  name: string;
  legalName: string;
  slug: string;
  logoUrl?: string;
  taxId: string; // VAT / GST / EIN
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  website?: string;
  currency: string;
  defaultPaymentTerms: string; // e.g. "Net 30"
  invoiceTermsAndConditions: string;
  bankDetails: BankAccountDetails;
  paymentGateways: PaymentGateways;
  invoiceTheme: InvoiceTheme;
  accentColor: InvoiceAccentColor;
  plan: 'free' | 'pro';
  invoiceCount: number; // lifetime generated invoices
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'none';
  subscriptionPeriodEnd?: string;
  cardLast4?: string;
  cardBrand?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // in percentage e.g. 10 for 10%
  discountRate: number; // percentage e.g. 0
  amount: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string; // e.g. INV-2026-001
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  poNumber?: string;
  currency: string;
  
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientTaxId?: string;

  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  shippingFee: number;
  totalAmount: number;

  notes?: string;
  termsAndConditions?: string;
  bankDetailsOverride?: BankAccountDetails;

  paidAt?: string;
  paymentMethodUsed?: string;
  paymentTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  taxId?: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  totalInvoiced: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  action: 
    | 'INVOICE_CREATED' 
    | 'INVOICE_UPDATED' 
    | 'INVOICE_SENT' 
    | 'INVOICE_PAID' 
    | 'INVOICE_VOIDED' 
    | 'USER_INVITED' 
    | 'ROLE_CHANGED' 
    | 'SETTINGS_UPDATED' 
    | 'SUBSCRIPTION_UPGRADED' 
    | 'SUBSCRIPTION_CANCELED' 
    | 'API_KEY_CREATED' 
    | 'API_TOKEN_GENERATED' 
    | 'CACHE_PURGED'
    | 'RATE_LIMIT_EXCEEDED';
  resourceType: 'invoice' | 'user' | 'organization' | 'subscription' | 'api' | 'cache';
  resourceId?: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'error';
  details: string;
  diff?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

export interface ApiCredential {
  id: string;
  organizationId: string;
  name: string;
  clientId: string;
  clientSecretMasked: string;
  scopes: string[];
  rateLimitPerMinute: number;
  createdAt: string;
  lastUsedAt?: string;
}

export interface OAuthToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string;
  createdAt: number;
}

export interface CacheEntry {
  key: string;
  sizeBytes: number;
  ttlSeconds: number;
  createdAt: number;
  hits: number;
}

export interface CacheMetrics {
  totalHits: number;
  totalMisses: number;
  hitRatio: number;
  avgCacheLatencyMs: number;
  avgDbLatencyMs: number;
  storedKeys: number;
  totalSizeBytes: number;
}
