import { Client, Invoice, InvoiceItem } from '../types';

export type SearchResultType = 'invoice' | 'client' | 'line_item';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  details: string;
  metadata?: string;
  invoiceId?: string;
  clientId?: string;
  score: number;
  highlightMatch?: string;
}

export interface SearchQueryResult {
  query: string;
  tookMs: number;
  totalMatches: number;
  results: {
    invoices: SearchResultItem[];
    clients: SearchResultItem[];
    lineItems: SearchResultItem[];
  };
}

/**
 * Tokenized Inverted Index Engine for sub-millisecond full-text searching
 */
class SearchIndexEngine {
  // Inverted index map: term -> array of document pointers
  private invertedIndex: Map<string, Set<string>> = new Map();
  // Document registry: docKey -> document item
  private docRegistry: Map<string, SearchResultItem> = new Map();
  private isIndexed = false;
  private indexedOrgId = '';

  private tokenize(text: string): string[] {
    if (!text) return [];
    // Normalize: lowercase, split on whitespace, punctuation, and hyphens/underscores
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, ' ')
      .split(/[\s_-]+/)
      .filter((t) => t.length >= 1);

    const termSet = new Set<string>();
    for (const token of tokens) {
      termSet.add(token);
      // Generate prefix terms for instant typing / autocomplete (up to 12 chars)
      for (let i = 2; i <= Math.min(12, token.length); i++) {
        termSet.add(token.substring(0, i));
      }
    }

    return Array.from(termSet);
  }

  /**
   * Rebuild the in-memory inverted index for an organization
   */
  public buildIndex(orgId: string, invoices: Invoice[], clients: Client[]): void {
    const start = performance.now();
    this.invertedIndex.clear();
    this.docRegistry.clear();

    // 1. Index Invoices
    for (const inv of invoices) {
      const docKey = `inv:${inv.id}`;
      const searchItem: SearchResultItem = {
        id: inv.id,
        type: 'invoice',
        title: `${inv.invoiceNumber} · ${inv.clientName}`,
        subtitle: `${inv.currency} ${inv.totalAmount.toLocaleString()} · Due: ${inv.dueDate}`,
        details: `Status: ${inv.status.toUpperCase()} · ${inv.items.length} line item(s) · PO: ${inv.poNumber || 'N/A'}`,
        metadata: `${inv.issueDate} ${inv.dueDate}`,
        invoiceId: inv.id,
        score: 0,
      };
      this.docRegistry.set(docKey, searchItem);

      // Extract all searchable strings from invoice
      const invoiceText = [
        inv.invoiceNumber,
        inv.clientName,
        inv.clientEmail,
        inv.clientAddress,
        inv.poNumber || '',
        inv.status,
        inv.currency,
        String(inv.totalAmount),
        inv.notes || '',
      ].join(' ');

      const tokens = this.tokenize(invoiceText);
      for (const token of tokens) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Set());
        }
        this.invertedIndex.get(token)!.add(docKey);
      }

      // 2. Index Individual Line Items within this invoice
      inv.items.forEach((item, index) => {
        const itemDocKey = `item:${inv.id}:${item.id || index}`;
        const itemSearchItem: SearchResultItem = {
          id: item.id || `${inv.id}-${index}`,
          type: 'line_item',
          title: item.description,
          subtitle: `In ${inv.invoiceNumber} (${inv.clientName}) · ${inv.currency} ${item.amount.toLocaleString()}`,
          details: `Qty: ${item.quantity} × ${inv.currency} ${item.unitPrice} · Tax: ${item.taxRate}%`,
          invoiceId: inv.id,
          score: 0,
        };
        this.docRegistry.set(itemDocKey, itemSearchItem);

        const itemText = [
          item.description,
          String(item.unitPrice),
          String(item.quantity),
          String(item.amount),
          inv.invoiceNumber,
          inv.clientName,
        ].join(' ');

        const itemTokens = this.tokenize(itemText);
        for (const token of itemTokens) {
          if (!this.invertedIndex.has(token)) {
            this.invertedIndex.set(token, new Set());
          }
          this.invertedIndex.get(token)!.add(itemDocKey);
        }
      });
    }

    // 3. Index Clients
    for (const client of clients) {
      const docKey = `client:${client.id}`;
      const searchItem: SearchResultItem = {
        id: client.id,
        type: 'client',
        title: client.name,
        subtitle: client.companyName ? `${client.companyName} · ${client.email}` : client.email,
        details: `${client.city}, ${client.country} · Lifetime Invoiced: ${client.currency} ${client.totalInvoiced.toLocaleString()}`,
        clientId: client.id,
        score: 0,
      };
      this.docRegistry.set(docKey, searchItem);

      const clientText = [
        client.name,
        client.companyName || '',
        client.email,
        client.phone || '',
        client.address,
        client.city,
        client.country,
        client.taxId || '',
      ].join(' ');

      const tokens = this.tokenize(clientText);
      for (const token of tokens) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Set());
        }
        this.invertedIndex.get(token)!.add(docKey);
      }
    }

    this.isIndexed = true;
    this.indexedOrgId = orgId;
    const duration = performance.now() - start;
    console.debug(`[SearchIndex] Indexed ${this.docRegistry.size} documents in ${duration.toFixed(2)}ms`);
  }

  /**
   * Fast full-text query matching using inverted index with score ranking
   */
  public search(query: string, maxResults = 15): SearchQueryResult {
    const start = performance.now();
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return {
        query: '',
        tookMs: 0,
        totalMatches: 0,
        results: { invoices: [], clients: [], lineItems: [] },
      };
    }

    const queryTerms = cleanQuery.split(/\s+/).filter(Boolean);
    const docScores = new Map<string, number>();

    // Accumulate relevance scores across terms
    for (const term of queryTerms) {
      const matchingDocs = this.invertedIndex.get(term);
      if (matchingDocs) {
        for (const docKey of matchingDocs) {
          const current = docScores.get(docKey) || 0;
          docScores.set(docKey, current + 10);
        }
      }

      // Also search keys for prefix matches
      for (const [indexedTerm, docKeys] of this.invertedIndex.entries()) {
        if (indexedTerm.startsWith(term) && indexedTerm !== term) {
          for (const docKey of docKeys) {
            const current = docScores.get(docKey) || 0;
            docScores.set(docKey, current + 3);
          }
        }
      }
    }

    // Categorize and sort results
    const invoices: SearchResultItem[] = [];
    const clients: SearchResultItem[] = [];
    const lineItems: SearchResultItem[] = [];

    const sortedEntries = Array.from(docScores.entries()).sort((a, b) => b[1] - a[1]);

    for (const [docKey, score] of sortedEntries) {
      const doc = this.docRegistry.get(docKey);
      if (!doc) continue;

      const scoredDoc: SearchResultItem = {
        ...doc,
        score,
        highlightMatch: cleanQuery,
      };

      if (doc.type === 'invoice' && invoices.length < maxResults) {
        invoices.push(scoredDoc);
      } else if (doc.type === 'client' && clients.length < maxResults) {
        clients.push(scoredDoc);
      } else if (doc.type === 'line_item' && lineItems.length < maxResults) {
        lineItems.push(scoredDoc);
      }
    }

    const end = performance.now();
    const tookMs = Number((end - start).toFixed(2));
    const totalMatches = invoices.length + clients.length + lineItems.length;

    return {
      query,
      tookMs,
      totalMatches,
      results: { invoices, clients, lineItems },
    };
  }

  public getIndexedCount(): number {
    return this.docRegistry.size;
  }
}

export const searchIndexEngine = new SearchIndexEngine();
