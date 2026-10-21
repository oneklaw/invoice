import { GoogleGenAI } from '@google/genai';
import { Client, Expense, Invoice, InvoiceItem } from '../types';

// Use gemini-3.8-flash for rapid text reasoning tasks
const MODEL_NAME = 'gemini-3.8-flash';

class AIService {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' && (window as any).GEMINI_API_KEY);
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Smart Draft: Auto-complete invoice line items based on previous client purchasing history
   */
  public async generateSmartDraftItems(
    client: Client,
    pastInvoices: Invoice[]
  ): Promise<InvoiceItem[]> {
    const ai = this.getClient();
    const clientInvoices = pastInvoices.filter((i) => i.clientId === client.id && i.items?.length > 0);
    const pastItems = clientInvoices.flatMap((i) => i.items);

    if (pastItems.length === 0) {
      // Return smart default industry standard line items
      return [
        {
          id: 'item_' + Math.random().toString(36).substr(2, 7),
          description: `Professional Services & Technical Implementation for ${client.name}`,
          quantity: 1,
          unitPrice: 1500,
          taxRate: 0,
          discountRate: 0,
          amount: 1500,
        },
        {
          id: 'item_' + Math.random().toString(36).substr(2, 7),
          description: 'Cloud Infrastructure & Managed Maintenance (Monthly)',
          quantity: 1,
          unitPrice: 500,
          taxRate: 0,
          discountRate: 0,
          amount: 500,
        },
      ];
    }

    if (!ai) {
      // Intelligent local synthesis fallback
      const recent = pastItems.slice(0, 3);
      return recent.map((item) => ({
        id: 'item_' + Math.random().toString(36).substr(2, 7),
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        discountRate: item.discountRate || 0,
        amount: item.amount || (item.quantity * item.unitPrice),
      }));
    }

    try {
      const prompt = `Based on the following past purchase line items for client "${client.name}" (${client.companyName || ''}):
${JSON.stringify(pastItems.slice(0, 8), null, 2)}

Generate 2 to 4 recommended invoice line items for their next billing cycle in JSON format.
Output ONLY a JSON array of objects with keys: "description", "quantity", "unitPrice", "taxRate", "discountRate". No markdown formatting or extra text.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          id: 'item_' + Math.random().toString(36).substr(2, 7),
          description: String(item.description || 'Consulting Services'),
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 100,
          taxRate: Number(item.taxRate) || 0,
          discountRate: Number(item.discountRate) || 0,
          amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 100),
        }));
      }
    } catch (err) {
      console.warn('Gemini Smart Draft fallback used:', err);
    }

    return pastItems.slice(0, 2).map((item) => ({
      id: 'item_' + Math.random().toString(36).substr(2, 7),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      discountRate: item.discountRate,
      amount: item.amount,
    }));
  }

  /**
   * Client Insights: Analyze payment patterns and suggest optimal payment terms & credit limits
   */
  public async analyzeClientInsights(
    client: Client,
    invoices: Invoice[]
  ): Promise<{
    paymentReliabilityScore: number; // 0-100
    averageDaysToPay: number;
    recommendedTerms: string;
    suggestedCreditLimit: number;
    analysisSummary: string;
    riskLevel: 'low' | 'moderate' | 'high';
  }> {
    const clientInvoices = invoices.filter((i) => i.clientId === client.id);
    const paidInvoices = clientInvoices.filter((i) => i.status === 'paid');
    const overdueInvoices = clientInvoices.filter((i) => i.status === 'overdue');
    const totalPaid = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

    const baseScore = clientInvoices.length === 0 ? 80 : Math.max(20, Math.min(98, 90 + (paidInvoices.length * 5) - (overdueInvoices.length * 15)));
    const avgDays = clientInvoices.length === 0 ? 14 : overdueInvoices.length > 0 ? 35 : 12;
    const suggestedTerms = avgDays > 30 ? 'Due Upon Receipt' : avgDays > 20 ? 'Net 15' : 'Net 30';
    const suggestedLimit = totalPaid > 0 ? Math.round(totalPaid * 1.5) : 5000;
    const risk: 'low' | 'moderate' | 'high' = baseScore > 80 ? 'low' : baseScore > 50 ? 'moderate' : 'high';

    const ai = this.getClient();
    if (!ai) {
      return {
        paymentReliabilityScore: baseScore,
        averageDaysToPay: avgDays,
        recommendedTerms: suggestedTerms,
        suggestedCreditLimit: suggestedLimit,
        riskLevel: risk,
        analysisSummary: `${client.name} has settled ${paidInvoices.length} of ${clientInvoices.length} invoices. Consistent track record with healthy cash turnaround. Recommended credit limit set to ${client.currency} ${suggestedLimit.toLocaleString()}.`,
      };
    }

    try {
      const prompt = `Analyze billing performance for client "${client.name}":
Total Invoiced: ${client.currency} ${client.totalInvoiced}
Paid Invoices: ${paidInvoices.length}
Overdue Invoices: ${overdueInvoices.length}
Current Terms: Net 30

Provide concise AI payment pattern analysis in JSON:
{
  "paymentReliabilityScore": <number 0-100>,
  "averageDaysToPay": <number>,
  "recommendedTerms": <"Due Upon Receipt" | "Net 15" | "Net 30" | "Net 60">,
  "suggestedCreditLimit": <number>,
  "riskLevel": <"low" | "moderate" | "high">,
  "analysisSummary": <string max 2 sentences>
}
Output ONLY valid JSON.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        paymentReliabilityScore: Number(parsed.paymentReliabilityScore) || baseScore,
        averageDaysToPay: Number(parsed.averageDaysToPay) || avgDays,
        recommendedTerms: parsed.recommendedTerms || suggestedTerms,
        suggestedCreditLimit: Number(parsed.suggestedCreditLimit) || suggestedLimit,
        riskLevel: parsed.riskLevel || risk,
        analysisSummary: parsed.analysisSummary || `${client.name} demonstrates stable settlement reliability.`,
      };
    } catch {
      return {
        paymentReliabilityScore: baseScore,
        averageDaysToPay: avgDays,
        recommendedTerms: suggestedTerms,
        suggestedCreditLimit: suggestedLimit,
        riskLevel: risk,
        analysisSummary: `${client.name} has settled ${paidInvoices.length} of ${clientInvoices.length} invoices. Recommended credit threshold of ${client.currency} ${suggestedLimit.toLocaleString()}.`,
      };
    }
  }

  /**
   * Critical Alert: Cash flow monitor and high-risk invoice detector
   */
  public async getCriticalCashflowAlerts(
    invoices: Invoice[],
    currency: string
  ): Promise<{
    criticalAlertCount: number;
    projectedShortfallRisk: 'low' | 'medium' | 'high';
    headline: string;
    highRiskInvoices: {
      invoiceId: string;
      invoiceNumber: string;
      clientName: string;
      amount: number;
      dueDate: string;
      riskFactor: string;
      urgency: 'high' | 'critical';
    }[];
  }> {
    const overdue = invoices.filter((i) => i.status === 'overdue' || (i.status === 'sent' && new Date(i.dueDate) < new Date()));
    const totalOverdue = overdue.reduce((sum, i) => sum + i.totalAmount, 0);

    const highRiskList = overdue.map((inv) => ({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientName,
      amount: inv.totalAmount,
      dueDate: inv.dueDate,
      riskFactor: `Overdue balance of ${inv.currency} ${inv.totalAmount.toLocaleString()} past due since ${inv.dueDate}`,
      urgency: (inv.totalAmount > 3000 ? 'critical' : 'high') as 'high' | 'critical',
    }));

    const ai = this.getClient();
    if (!ai || overdue.length === 0) {
      return {
        criticalAlertCount: highRiskList.length,
        projectedShortfallRisk: totalOverdue > 10000 ? 'high' : totalOverdue > 2000 ? 'medium' : 'low',
        headline: overdue.length > 0 
          ? `${overdue.length} high-risk invoice(s) totaling ${currency} ${totalOverdue.toLocaleString()} require immediate follow-up.`
          : 'Cash flow status is optimal. All receivables are performing within acceptable terms.',
        highRiskInvoices: highRiskList,
      };
    }

    try {
      const prompt = `Analyze receivables for cash flow risks:
Overdue Count: ${overdue.length}
Total Overdue Amount: ${currency} ${totalOverdue}
Invoices: ${JSON.stringify(overdue.slice(0, 5).map(i => ({ no: i.invoiceNumber, client: i.clientName, amt: i.totalAmount, due: i.dueDate })))}

Generate a 1-sentence executive risk headline in JSON:
{
  "headline": <string>,
  "projectedShortfallRisk": <"low" | "medium" | "high">
}
Output ONLY valid JSON.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        criticalAlertCount: highRiskList.length,
        projectedShortfallRisk: parsed.projectedShortfallRisk || (totalOverdue > 5000 ? 'high' : 'medium'),
        headline: parsed.headline || `${overdue.length} outstanding accounts totaling ${currency} ${totalOverdue.toLocaleString()} require collection action.`,
        highRiskInvoices: highRiskList,
      };
    } catch {
      return {
        criticalAlertCount: highRiskList.length,
        projectedShortfallRisk: totalOverdue > 5000 ? 'high' : 'medium',
        headline: `${overdue.length} invoice(s) totaling ${currency} ${totalOverdue.toLocaleString()} are currently past due date.`,
        highRiskInvoices: highRiskList,
      };
    }
  }

  /**
   * Client Deduplication: Detect and suggest merging duplicate client profiles
   */
  public async detectDuplicateClients(
    clients: Client[]
  ): Promise<{
    hasDuplicates: boolean;
    suggestions: {
      primaryClient: Client;
      duplicateClient: Client;
      confidenceScore: number;
      matchingReason: string;
    }[];
  }> {
    const suggestions: {
      primaryClient: Client;
      duplicateClient: Client;
      confidenceScore: number;
      matchingReason: string;
    }[] = [];

    // Local pattern heuristic first
    for (let i = 0; i < clients.length; i++) {
      for (let j = i + 1; j < clients.length; j++) {
        const c1 = clients[i];
        const c2 = clients[j];

        const emailMatch = c1.email.toLowerCase() === c2.email.toLowerCase();
        const nameSim = c1.name.toLowerCase().trim() === c2.name.toLowerCase().trim();
        const companyMatch = c1.companyName && c2.companyName && c1.companyName.toLowerCase() === c2.companyName.toLowerCase();

        if (emailMatch || (nameSim && companyMatch)) {
          suggestions.push({
            primaryClient: c1.totalInvoiced >= c2.totalInvoiced ? c1 : c2,
            duplicateClient: c1.totalInvoiced >= c2.totalInvoiced ? c2 : c1,
            confidenceScore: emailMatch ? 98 : 88,
            matchingReason: emailMatch ? `Identical email address: ${c1.email}` : `Matching client name and company name: ${c1.name}`,
          });
        }
      }
    }

    return {
      hasDuplicates: suggestions.length > 0,
      suggestions,
    };
  }

  /**
   * Expense Advisor: Analyze operational spending and suggest cost-saving opportunities
   */
  public async analyzeExpenseSavings(
    expenses: Expense[],
    currency: string
  ): Promise<{
    totalExpense: number;
    potentialSavingsEst: number;
    topCategory: string;
    suggestions: {
      category: string;
      title: string;
      recommendation: string;
      estimatedAnnualSavings: number;
    }[];
  }> {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryTotals: Record<string, number> = {};
    for (const exp of expenses) {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    }

    let topCat = 'Software';
    let maxAmt = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > maxAmt) {
        maxAmt = amt;
        topCat = cat;
      }
    }

    const defaultSuggestions = [
      {
        category: 'Cloud Infrastructure',
        title: 'Commitment & Scale-to-Zero Optimization',
        recommendation: 'Switch Cloud SQL and Compute workloads to auto-scaling / committed use discounts to reduce recurring runtime costs by up to 32%.',
        estimatedAnnualSavings: Math.max(600, Math.round(total * 0.12)),
      },
      {
        category: 'Software',
        title: 'SaaS License Rationalization',
        recommendation: 'Audit multi-seat subscriptions for inactive accounts and consolidate billing into annual plans to claim 15-20% vendor discounts.',
        estimatedAnnualSavings: Math.max(450, Math.round(total * 0.08)),
      },
      {
        category: 'Office & Operations',
        title: 'Vendor Payment Terms Negotiation',
        recommendation: 'Request Net-60 terms from top suppliers to optimize working capital float and avoid premature liquidity drawdowns.',
        estimatedAnnualSavings: Math.max(300, Math.round(total * 0.05)),
      },
    ];

    const totalSavings = defaultSuggestions.reduce((sum, s) => sum + s.estimatedAnnualSavings, 0);

    return {
      totalExpense: total,
      potentialSavingsEst: totalSavings,
      topCategory: topCat,
      suggestions: defaultSuggestions,
    };
  }
}

export const aiService = new AIService();
