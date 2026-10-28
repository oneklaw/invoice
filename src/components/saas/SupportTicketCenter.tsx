import React, { useState, useMemo, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  X,
  FileSpreadsheet,
  Building2,
  Sparkles,
  Zap,
  CreditCard,
  MessageSquare,
  Shield,
  Layers,
  RefreshCw,
  FolderSync,
  Tag,
  Check,
  RotateCcw,
  PlusCircle,
  ExternalLink,
  Lock,
  Flame,
  Radio,
  BellRing,
  Hash,
  Mail,
  ChevronDown,
  ChevronUp,
  Terminal,
  Copy,
  CheckCheck,
} from 'lucide-react';
import {
  SupportTicket,
  TicketMessage,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  TicketEscalationLevel,
  AutomatedNotificationDispatch,
  User,
  OrganizationSettings,
} from '../../types';
import { storageService } from '../../services/storage';

interface SupportTicketCenterProps {
  currentUser: User;
  onRefresh?: () => void;
  onNavigateToTroubleshooting?: (tenantId?: string) => void;
  onNavigateToRevenue?: (tenantId?: string) => void;
}

export const SupportTicketCenter: React.FC<SupportTicketCenterProps> = ({
  currentUser,
  onRefresh,
  onNavigateToTroubleshooting,
  onNavigateToRevenue,
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>(storageService.getSupportTickets());
  const [tenants] = useState<OrganizationSettings[]>(storageService.getSaaSTenants());

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [escalationFilter, setEscalationFilter] = useState<'ALL' | TicketEscalationLevel>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TicketPriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');
  const [tenantFilter, setTenantFilter] = useState<string>('ALL');

  // Active Ticket Triage & Conversation Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [resolveOnSend, setResolveOnSend] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showRawSlackPayload, setShowRawSlackPayload] = useState(false);
  const [payloadCopied, setPayloadCopied] = useState(false);

  // New ticket modal (Simulate or Manual)
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketTenantId, setNewTicketTenantId] = useState(tenants[0]?.id || 'org_apex_tech');
  const [newTicketCategory, setNewTicketCategory] = useState<TicketCategory>('slow_query_performance');
  const [newTicketPriority, setNewTicketPriority] = useState<TicketPriority>('high');
  const [newTicketEscalation, setNewTicketEscalation] = useState<TicketEscalationLevel>('critical');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');

  // Simulation dropdown
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

  const reloadTickets = () => {
    const fresh = storageService.getSupportTickets();
    setTickets(fresh);
    if (selectedTicket) {
      const updated = fresh.find((t) => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
    if (onRefresh) onRefresh();
  };

  // Listen for automated critical incident routing events
  useEffect(() => {
    const handleCriticalIncidentRouted = (e: any) => {
      reloadTickets();
      if (e?.detail?.ticket) {
        setActionSuccessMsg(
          `🚨 AUTOMATED ROUTING: Critical incident ${e.detail.ticket.ticketNumber} paged to Senior Admin Kenneth Onekalit (onekalitkenneth@gmail.com) and Slack #platform-critical-incidents!`
        );
        setTimeout(() => setActionSuccessMsg(null), 7000);
      }
    };

    window.addEventListener('invox:critical_incident_routed', handleCriticalIncidentRouted);
    return () => {
      window.removeEventListener('invox:critical_incident_routed', handleCriticalIncidentRouted);
    };
  }, [selectedTicket]);

  // -------------------------------------------------------------
  // KPI CALCULATIONS
  // -------------------------------------------------------------
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress');
  const criticalTickets = tickets.filter(
    (t) => t.escalationLevel === 'critical' && t.status !== 'resolved' && t.status !== 'closed'
  );
  const urgentTickets = tickets.filter(
    (t) =>
      (t.priority === 'urgent' || t.priority === 'high' || t.escalationLevel === 'critical') &&
      t.status !== 'resolved' &&
      t.status !== 'closed'
  );
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed');
  const resolutionRate = totalTickets > 0 ? ((resolvedTickets.length / totalTickets) * 100).toFixed(1) : '100';

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        !searchQuery ||
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.createdByEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchEscalation = escalationFilter === 'ALL' || t.escalationLevel === escalationFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      const matchCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
      const matchTenant = tenantFilter === 'ALL' || t.organizationId === tenantFilter;

      return matchSearch && matchStatus && matchEscalation && matchPriority && matchCategory && matchTenant;
    });
  }, [tickets, searchQuery, statusFilter, escalationFilter, priorityFilter, categoryFilter, tenantFilter]);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    const targetStatus = resolveOnSend ? 'resolved' : undefined;
    const updated = storageService.addTicketMessage(
      selectedTicket.id,
      replyMessage.trim(),
      currentUser,
      isInternalNote,
      targetStatus
    );

    if (updated) {
      setSelectedTicket({ ...updated });
      setReplyMessage('');
      setIsInternalNote(false);
      setResolveOnSend(false);
      reloadTickets();
      setActionSuccessMsg(
        isInternalNote
          ? `Internal staff note added to ticket ${updated.ticketNumber}.`
          : `Reply dispatched to tenant admin (${updated.createdByEmail}) for ticket ${updated.ticketNumber}!`
      );
      setTimeout(() => setActionSuccessMsg(null), 4500);
    }
  };

  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus) => {
    storageService.updateTicketStatus(ticketId, newStatus, currentUser);
    reloadTickets();
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    setActionSuccessMsg(`Ticket status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleUpdatePriority = (ticketId: string, newPriority: TicketPriority) => {
    storageService.updateTicketPriority(ticketId, newPriority, currentUser);
    reloadTickets();
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, priority: newPriority } : null));
    }
    setActionSuccessMsg(`Ticket priority updated to ${newPriority.toUpperCase()}`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleUpdateEscalationLevel = (ticketId: string, newLevel: TicketEscalationLevel) => {
    storageService.updateTicketEscalationLevel(
      ticketId,
      newLevel,
      currentUser,
      newLevel === 'critical' ? 'Elevated to P0 Critical for senior platform admin triage' : undefined
    );
    reloadTickets();
    if (selectedTicket && selectedTicket.id === ticketId) {
      const fresh = storageService.getSupportTicketById(ticketId);
      if (fresh) setSelectedTicket(fresh);
    }
    if (newLevel === 'critical') {
      setActionSuccessMsg(
        `🚨 Ticket escalated to CRITICAL! Automated router alerted Senior Admin Kenneth Onekalit (onekalitkenneth@gmail.com) and Slack #platform-critical-incidents.`
      );
    } else {
      setActionSuccessMsg(`Ticket escalation level updated to ${newLevel.toUpperCase()}`);
    }
    setTimeout(() => setActionSuccessMsg(null), 5500);
  };

  const handleReDispatchAlert = (ticketId: string) => {
    storageService.dispatchCriticalRoutingAlert(ticketId, currentUser);
    reloadTickets();
    if (selectedTicket && selectedTicket.id === ticketId) {
      const fresh = storageService.getSupportTicketById(ticketId);
      if (fresh) setSelectedTicket(fresh);
    }
    setActionSuccessMsg(
      `🔔 Automated routing alert re-dispatched to Slack (#platform-critical-incidents) and Kenneth Onekalit (onekalitkenneth@gmail.com)!`
    );
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const handleSimulateTenantTicket = (forcedLevel?: TicketEscalationLevel) => {
    setShowSimulateMenu(false);
    const created = storageService.simulateTenantSupportTicket(undefined, forcedLevel);
    reloadTickets();
    if (created.escalationLevel === 'critical') {
      setActionSuccessMsg(
        `🚨 Simulated Critical Incident logged: ${created.ticketNumber} from ${created.organizationName}! Automated Slack (#platform-critical-incidents) and email alerts dispatched to Kenneth Onekalit.`
      );
    } else {
      setActionSuccessMsg(
        `Simulated incoming tenant query received: ${created.ticketNumber} from ${created.organizationName} (${created.escalationLevel?.toUpperCase()})!`
      );
    }
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  const handleCreateManualTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = tenants.find((t) => t.id === newTicketTenantId) || tenants[0];
    const created = storageService.createSupportTicket(
      {
        organizationId: tenant.id,
        organizationName: tenant.name,
        category: newTicketCategory,
        priority: newTicketPriority,
        escalationLevel: newTicketEscalation,
        subject: newTicketSubject,
        description: newTicketDescription,
      },
      newTicketDescription,
      currentUser
    );
    reloadTickets();
    setIsNewTicketModalOpen(false);
    setNewTicketSubject('');
    setNewTicketDescription('');

    if (created.escalationLevel === 'critical') {
      setActionSuccessMsg(
        `🚨 Critical ticket ${created.ticketNumber} opened! Automated routing dispatched to Kenneth Onekalit and Slack #platform-critical-incidents.`
      );
    } else {
      setActionSuccessMsg(`Support ticket ${created.ticketNumber} logged for ${created.organizationName}!`);
    }
    setTimeout(() => setActionSuccessMsg(null), 5500);
  };

  const handleExportTicketsCsv = () => {
    const headers =
      'Ticket ID,Created At,Tenant Name,Tenant ID,Category,Escalation Level,Priority,Status,Assigned Admin,Subject,Created By,Messages Count\n';
    const rows = tickets
      .map(
        (t) =>
          `"${t.ticketNumber}","${t.createdAt}","${t.organizationName}","${t.organizationId}","${t.category}","${t.escalationLevel || 'low'}","${t.priority}","${t.status}","${t.assignedAdminName || 'Unassigned'}","${t.subject.replace(/"/g, '""')}","${t.createdByEmail}",${t.messages.length}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kero_tenant_support_tickets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Canned Quick Responses
  const cannedResponses = [
    {
      title: 'Composite Index Deployed',
      text: 'Hello, our platform engineering team has analyzed your Firestore query execution plan and successfully provisioned the recommended composite index. Your query latency has dropped from >300ms down to ~18ms.',
    },
    {
      title: 'Critical Incident Acknowledged',
      text: 'Hello, Senior Platform Admin Kenneth Onekalit has received this critical incident page via Slack and high-priority email. Our team has initiated immediate triage under our 30-minute SLA window.',
    },
    {
      title: 'SaaS Subscription & VAT Receipt',
      text: 'Hello, thank you for reaching out. We have verified your recurring SaaS subscription charge on Stripe. An official A4 payment receipt with complete VAT reverse-charge and transaction hash has been generated.',
    },
    {
      title: 'Quota Reset & Pro Trial',
      text: 'Hello, we have reset your starter invoice quota so your billing department can continue operations unimpeded, and we have enabled a trial of our Pro features.',
    },
    {
      title: 'Google Drive Permissions Guide',
      text: 'Hello, to sync invoices to your shared Google Drive, ensure the connected OAuth account has "Content Manager" access on the designated folder in Google Workspace Admin.',
    },
  ];

  // Helper labels & badges
  const getEscalationBadge = (level?: TicketEscalationLevel) => {
    switch (level) {
      case 'critical':
        return (
          <div className="inline-flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black font-mono uppercase bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-sm shadow-rose-950/50 animate-pulse">
              <Flame className="w-3 h-3 text-rose-400 fill-rose-500/50" />
              Critical (P0)
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-rose-400 font-semibold px-1">
              <Radio className="w-2.5 h-2.5 text-rose-400 animate-ping" />
              Auto-Routed
            </span>
          </div>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            High (P1)
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            Medium (P2)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
            Low (P3)
          </span>
        );
    }
  };

  const getCategoryBadge = (category: TicketCategory) => {
    switch (category) {
      case 'slow_query_performance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Zap className="w-3 h-3 text-amber-400" /> DB Query Latency
          </span>
        );
      case 'billing_invoicing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CreditCard className="w-3 h-3 text-emerald-400" /> SaaS Billing & MRR
          </span>
        );
      case 'drive_integration':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <FolderSync className="w-3 h-3 text-sky-400" /> Google Drive Sync
          </span>
        );
      case 'tenant_access_rbac':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Shield className="w-3 h-3 text-purple-400" /> Tenant RBAC & Access
          </span>
        );
      case 'api_webhooks':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Tag className="w-3 h-3 text-indigo-400" /> Webhooks & API
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <LifeBuoy className="w-3 h-3 text-slate-400" /> General Inquiry
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Urgent SLA
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Open (Unassigned)
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            In Triage
          </span>
        );
      case 'waiting_on_tenant':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Waiting Tenant
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Resolved
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
            Closed
          </span>
        );
    }
  };

  // Generate mock Block Kit payload for inspection
  const getSlackBlockKitPayload = (ticket: SupportTicket) => {
    return {
      channel: '#platform-critical-incidents',
      text: `🚨 [P0 Critical Incident] Ticket #${ticket.ticketNumber} opened by ${ticket.organizationName}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 P0 CRITICAL INCIDENT ESCALATION',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Ticket ID:*\n\`${ticket.ticketNumber}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Tenant Workspace:*\n*${ticket.organizationName}* (\`${ticket.organizationId}\`)`,
            },
            {
              type: 'mrkdwn',
              text: `*Paged Admin:*\nKenneth Onekalit (\`onekalitkenneth@gmail.com\`)`,
            },
            {
              type: 'mrkdwn',
              text: `*Response SLA:*\n*< 30 minutes* (P0 Target)`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Incident Subject:*\n>${ticket.subject}\n\n*Initial Tenant Description:*\n>${ticket.description.slice(0, 220)}...`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `⚡ Automated routing triggered at ${ticket.createdAt} · Multi-tenant platform router v2.4`,
            },
          ],
        },
      ],
    };
  };

  const copyPayloadJson = (ticket: SupportTicket) => {
    const jsonStr = JSON.stringify(getSlackBlockKitPayload(ticket), null, 2);
    navigator.clipboard.writeText(jsonStr);
    setPayloadCopied(true);
    setTimeout(() => setPayloadCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-slate-900 border border-indigo-500/60 rounded-xl flex items-center justify-between text-xs text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span className="font-medium">{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* ACTIVE CRITICAL INCIDENT BANNER */}
      {/* ========================================================= */}
      {criticalTickets.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-2 border-rose-500/60 rounded-xl p-4 shadow-xl shadow-rose-950/40 relative overflow-hidden animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400 shrink-0">
                <Flame className="w-5 h-5 fill-rose-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono uppercase bg-rose-600 text-white tracking-wider">
                    P0 CRITICAL INCIDENT ACTIVE
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-300">
                    {criticalTickets[0].ticketNumber} · {criticalTickets[0].organizationName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950/80 border border-rose-500/40 text-rose-200">
                    SLA Response &lt; 30m
                  </span>
                </div>
                <div className="text-xs font-semibold text-white line-clamp-1">
                  {criticalTickets[0].subject}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-300 pt-0.5">
                  <span className="flex items-center gap-1 font-mono text-emerald-400">
                    <CheckCheck className="w-3.5 h-3.5" /> Slack #platform-critical-incidents
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-mono text-sky-400">
                    <Mail className="w-3.5 h-3.5" /> Paged Kenneth Onekalit
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelectedTicket(criticalTickets[0])}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-rose-900/50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 animate-ping" />
                <span>Triage Incident Now</span>
              </button>
              <button
                onClick={() => handleReDispatchAlert(criticalTickets[0].id)}
                className="px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-rose-500/50 text-rose-300 hover:text-white font-mono text-xs rounded-lg transition-colors cursor-pointer"
                title="Re-dispatch notification to Slack and Kenneth Onekalit"
              >
                Re-dispatch Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive KPI Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Queries Logged</span>
            <LifeBuoy className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{totalTickets}</div>
          <div className="text-[11px] text-slate-500">Across {tenants.length} tenant workspaces</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Open & Needs Triage</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">{openTickets.length}</div>
          <div className="text-[11px] text-slate-500">Awaiting platform staff response</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Critical Incidents (P0)</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 flex items-center gap-2">
            <span>{criticalTickets.length}</span>
            {criticalTickets.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                Auto-Paged
              </span>
            )}
          </div>
          <div className="text-[11px] text-rose-300/80 font-mono">Routing: #platform-critical-incidents</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Urgent / High (P1)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">{urgentTickets.length}</div>
          <div className="text-[11px] text-slate-500">SLA target &lt; 2h first reply</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Resolution Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">{resolutionRate}%</div>
          <div className="text-[11px] text-slate-500">{resolvedTickets.length} resolved / closed</div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ticket #, tenant, subject, query keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <button
                onClick={() => setShowSimulateMenu(!showSimulateMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
                title="Simulate incoming support query from tenant"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Simulate Query</span>
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              </button>

              {showSimulateMenu && (
                <div className="absolute right-0 mt-1 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 text-xs space-y-1 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => handleSimulateTenantTicket('critical')}
                    className="w-full text-left p-2 rounded-lg hover:bg-rose-950/50 border border-transparent hover:border-rose-500/30 flex items-start gap-2 text-rose-300 transition-colors"
                  >
                    <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 fill-rose-500/30" />
                    <div>
                      <div className="font-bold flex items-center gap-1">
                        <span>P0 Critical Incident</span>
                        <span className="text-[9px] bg-rose-500/20 px-1 rounded">Auto-Route</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Dispatches Slack Block Kit alert & high-priority SES email to Kenneth Onekalit
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSimulateTenantTicket('high')}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-start gap-2 text-amber-300 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">High Priority (P1) Query</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        A4 Receipt audit / VAT reconciliation query
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSimulateTenantTicket()}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-start gap-2 text-slate-300 transition-colors"
                  >
                    <LifeBuoy className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Random Tenant Query</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Drive sync or webhook configuration query
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsNewTicketModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Log Query</span>
            </button>

            <button
              onClick={handleExportTicketsCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              title="Export Tickets to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Grid with Escalation Level */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800/60 text-xs">
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses ({tickets.length})</option>
              <option value="open">Open (Unassigned)</option>
              <option value="in_progress">In Triage</option>
              <option value="waiting_on_tenant">Waiting on Tenant</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
              Escalation Level
            </label>
            <select
              value={escalationFilter}
              onChange={(e) => setEscalationFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
            >
              <option value="ALL">All Escalation Levels</option>
              <option value="critical">🚨 Critical (P0 - Auto-Routed)</option>
              <option value="high">⚠️ High (P1)</option>
              <option value="medium">Medium (P2)</option>
              <option value="low">Low (P3)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="urgent">Urgent SLA</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Query Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="slow_query_performance">Database / Slow Query</option>
              <option value="billing_invoicing">SaaS Billing & MRR</option>
              <option value="drive_integration">Google Drive Integration</option>
              <option value="tenant_access_rbac">Tenant Access & RBAC</option>
              <option value="api_webhooks">API & Webhooks</option>
              <option value="general_inquiry">General Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Tenant Organization</label>
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Tenants ({tenants.length})</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.plan.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tenant Support Queries Queue
            </h3>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
              {filteredTickets.length} Found
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Platform Lead & Incident Officer: Kenneth Onekalit (super_admin)
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-200">All Tenant Queries Resolved!</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No tickets match your active filter criteria. Click "Simulate Query" above to test triage flows.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Ticket / Priority</th>
                  <th className="py-3 px-4">Escalation</th>
                  <th className="py-3 px-4">Tenant Workspace</th>
                  <th className="py-3 px-4">Category & Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Admin</th>
                  <th className="py-3 px-4">Age / Activity</th>
                  <th className="py-3 px-4 text-right">Triage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-800/40 transition-colors group cursor-pointer ${
                      t.escalationLevel === 'critical' ? 'bg-rose-950/10' : ''
                    }`}
                    onClick={() => setSelectedTicket(t)}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono text-indigo-300 font-bold">{t.ticketNumber}</div>
                      <div className="mt-1">{getPriorityBadge(t.priority)}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getEscalationBadge(t.escalationLevel)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.organizationName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {t.createdByEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-md">
                      <div className="mb-1">{getCategoryBadge(t.category)}</div>
                      <div className="font-medium text-slate-200 truncate">{t.subject}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {t.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(t.status)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                      {t.assignedAdminName ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-600/40 border border-indigo-500/50 flex items-center justify-center text-[10px] text-indigo-300 font-bold">
                            {t.assignedAdminName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium">{t.assignedAdminName}</span>
                            {t.assignedAdminEmail === 'onekalitkenneth@gmail.com' && (
                              <div className="text-[9px] font-mono text-indigo-400">Senior Platform Admin</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      <div>{new Date(t.createdAt).toLocaleDateString()}</div>
                      <div className="text-slate-500 text-[10px]">
                        {t.messages.length} message{t.messages.length === 1 ? '' : 's'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className={`px-2.5 py-1 text-white font-semibold rounded text-xs transition-colors shadow-sm flex items-center gap-1 cursor-pointer ${
                            t.escalationLevel === 'critical'
                              ? 'bg-rose-600 hover:bg-rose-500'
                              : 'bg-indigo-600 hover:bg-indigo-500'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Triage</span>
                        </button>

                        {/* Diagnostic Shortcuts */}
                        {t.category === 'slow_query_performance' && onNavigateToTroubleshooting && (
                          <button
                            onClick={() => onNavigateToTroubleshooting(t.organizationId)}
                            className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-mono text-[10px] rounded transition-colors"
                            title="Inspect Database Query Logs"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                          </button>
                        )}
                        {t.category === 'billing_invoicing' && onNavigateToRevenue && (
                          <button
                            onClick={() => onNavigateToRevenue(t.organizationId)}
                            className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] rounded transition-colors"
                            title="Inspect Tenant Plan & Collections"
                          >
                            <CreditCard className="w-3 h-3 text-emerald-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: TICKET CONVERSATION THREAD & TRIAGE WORKSPACE */}
      {/* ========================================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full flex flex-col max-h-[92vh] shadow-2xl text-slate-100 animate-in zoom-in-95 overflow-hidden">
            {/* Modal Top Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    selectedTicket.escalationLevel === 'critical'
                      ? 'bg-rose-600/30 border border-rose-500 text-rose-400'
                      : 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-400'
                  }`}
                >
                  {selectedTicket.escalationLevel === 'critical' ? (
                    <Flame className="w-5 h-5 fill-rose-500/40" />
                  ) : (
                    <LifeBuoy className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-indigo-400 font-bold text-sm">
                      {selectedTicket.ticketNumber}
                    </span>
                    {getEscalationBadge(selectedTicket.escalationLevel)}
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                    {selectedTicket.subject}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tenant Meta & Status Triage Strip */}
            <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase text-slate-500">Tenant Workspace</div>
                <div className="font-semibold text-slate-200">{selectedTicket.organizationName}</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {selectedTicket.createdByEmail}
                </div>
              </div>

              {/* Escalation Level Selector */}
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                  <span>Escalation Level</span>
                  {selectedTicket.escalationLevel === 'critical' && (
                    <span className="text-[9px] text-rose-400 font-bold">● P0 ACTIVE</span>
                  )}
                </div>
                <select
                  value={selectedTicket.escalationLevel || 'low'}
                  onChange={(e) =>
                    handleUpdateEscalationLevel(selectedTicket.id, e.target.value as TicketEscalationLevel)
                  }
                  className={`w-full rounded px-2 py-1 text-xs font-bold border focus:outline-none cursor-pointer ${
                    selectedTicket.escalationLevel === 'critical'
                      ? 'bg-rose-950/70 border-rose-500 text-rose-200'
                      : 'bg-slate-950 border-slate-700 text-slate-200 focus:border-indigo-500'
                  }`}
                >
                  <option value="low">Low (P3 - General)</option>
                  <option value="medium">Medium (P2 - Standard)</option>
                  <option value="high">High (P1 - Priority SLA)</option>
                  <option value="critical">🚨 Critical (P0 - Auto-Route to Kenneth)</option>
                </select>
              </div>

              {/* Status Selector */}
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase text-slate-500">Triage Status</div>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="open">Open (Unassigned)</option>
                  <option value="in_progress">In Triage</option>
                  <option value="waiting_on_tenant">Waiting on Tenant</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase text-slate-500">Priority Level</div>
                <select
                  value={selectedTicket.priority}
                  onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="urgent">Urgent SLA</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* ========================================================= */}
            {/* AUTOMATED INCIDENT ROUTING & DISPATCH INSPECTOR */}
            {/* ========================================================= */}
            {(selectedTicket.escalationLevel === 'critical' ||
              (selectedTicket.automatedRoutingDispatches && selectedTicket.automatedRoutingDispatches.length > 0)) && (
              <div className="px-5 py-3 bg-slate-950 border-b border-rose-950/60 shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                      Automated Senior Admin Incident Routing Dispatches
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> 2 DISPATCHED
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReDispatchAlert(selectedTicket.id)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded text-[11px] text-slate-300 font-mono transition-colors flex items-center gap-1 cursor-pointer"
                      title="Re-dispatch notification alerts"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Re-dispatch</span>
                    </button>
                    <button
                      onClick={() => setShowRawSlackPayload(!showRawSlackPayload)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded text-[11px] text-slate-300 font-mono transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Terminal className="w-3 h-3 text-indigo-400" />
                      <span>{showRawSlackPayload ? 'Hide Payload' : 'Inspect Slack Block Kit'}</span>
                    </button>
                  </div>
                </div>

                {/* Dispatch Channels Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Slack Dispatch Card */}
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#4A154B]/50 border border-[#4A154B] flex items-center justify-center shrink-0 text-white">
                      <Hash className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="space-y-0.5 overflow-hidden flex-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white font-mono">#platform-critical-incidents</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded border border-emerald-800">
                          DELIVERED
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Block Kit alert posted with direct incident triage CTA & tenant ID.
                      </div>
                    </div>
                  </div>

                  {/* Email Dispatch Card */}
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center shrink-0 text-indigo-300">
                      <Mail className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="space-y-0.5 overflow-hidden flex-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white font-mono">Senior Admin: Kenneth Onekalit</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded border border-emerald-800">
                          DELIVERED
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        High-urgency SES email to <span className="text-indigo-300 font-mono">onekalitkenneth@gmail.com</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Block Kit JSON payload inspector */}
                {showRawSlackPayload && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono text-indigo-400">
                        Slack Block Kit Incident Message Payload JSON
                      </span>
                      <button
                        onClick={() => copyPayloadJson(selectedTicket)}
                        className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700"
                      >
                        {payloadCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" /> Copy JSON
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-[10px] font-mono text-emerald-400 bg-black/60 p-2.5 rounded overflow-x-auto max-h-40 leading-relaxed border border-slate-800">
                      {JSON.stringify(getSlackBlockKitPayload(selectedTicket), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Conversation Messages Thread (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/50">
              {/* Initial Query Description Card */}
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                      {selectedTicket.createdByName.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-200">{selectedTicket.createdByName}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ({selectedTicket.createdByEmail})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Message Thread History */}
              {selectedTicket.messages.map((msg) => {
                const isSuperAdmin = msg.senderRole === 'super_admin';
                const isSystem = msg.senderRole === 'system';
                const isInternal = msg.isInternalNote;

                if (isSystem) {
                  return (
                    <div
                      key={msg.id}
                      className="p-3.5 bg-slate-900/90 border border-indigo-500/30 rounded-xl space-y-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-indigo-400 font-bold flex items-center gap-1.5 font-mono uppercase text-[10px]">
                          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                          {msg.senderName} · Automated Router
                        </span>
                        <span className="font-mono text-slate-500 text-[10px]">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  );
                }

                if (isInternal) {
                  return (
                    <div
                      key={msg.id}
                      className="p-3.5 bg-amber-950/20 border border-dashed border-amber-600/40 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-300 font-bold flex items-center gap-1 font-mono uppercase text-[10px]">
                          <Lock className="w-3 h-3 text-amber-400" />
                          Internal Staff Note · {msg.senderName}
                        </span>
                        <span className="font-mono text-amber-400/70 text-[10px]">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-amber-100/90 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col space-y-1 ${isSuperAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono px-1">
                      <span>{msg.senderName}</span>
                      {isSuperAdmin && (
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] uppercase font-bold border border-indigo-500/30">
                          SaaS Ops
                        </span>
                      )}
                      <span>
                        ·{' '}
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        isSuperAdmin
                          ? 'bg-gradient-to-tr from-indigo-900 to-indigo-800 text-white rounded-br-none border border-indigo-700/60 shadow-md'
                          : 'bg-slate-900 text-slate-200 rounded-bl-none border border-slate-800 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Canned Response Presets */}
            <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <span className="text-[10px] font-mono uppercase text-slate-500 whitespace-nowrap">
                  Quick Responses:
                </span>
                {cannedResponses.map((cr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyMessage(cr.text)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-slate-300 whitespace-nowrap text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    {cr.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Reply Composer */}
            <form onSubmit={handleSendReply} className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
              <div className="relative">
                <textarea
                  rows={3}
                  required
                  placeholder={
                    isInternalNote
                      ? 'Add private staff diagnostic note (not visible to tenant)...'
                      : 'Type response to tenant admin. This will be recorded and dispatched...'
                  }
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className={`w-full rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none resize-none ${
                    isInternalNote
                      ? 'bg-amber-950/20 border border-amber-600/40 focus:border-amber-500'
                      : 'bg-slate-900 border border-slate-700 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-900"
                    />
                    <span className="flex items-center gap-1 text-[11px] text-amber-300">
                      <Lock className="w-3 h-3 text-amber-400" /> Internal Staff Note Only
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={resolveOnSend}
                      onChange={(e) => setResolveOnSend(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-900"
                    />
                    <span className="flex items-center gap-1 text-[11px] text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Mark Resolved on Send
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="px-3 py-1.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                      isInternalNote
                        ? 'bg-amber-600 hover:bg-amber-500'
                        : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isInternalNote ? 'Save Internal Note' : 'Dispatch Response'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: LOG NEW SUPPORT QUERY */}
      {/* ========================================================= */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Log Tenant Support Query</h3>
              </div>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tenant Organization</label>
                <select
                  value={newTicketTenantId}
                  onChange={(e) => setNewTicketTenantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.plan.toUpperCase()} Plan - {t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="slow_query_performance">Database / Slow Query</option>
                    <option value="billing_invoicing">SaaS Billing & MRR</option>
                    <option value="drive_integration">Google Drive Integration</option>
                    <option value="tenant_access_rbac">Tenant RBAC & Access</option>
                    <option value="api_webhooks">API & Webhooks</option>
                    <option value="general_inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="urgent">Urgent SLA (&lt; 2h)</option>
                    <option value="high">High (&lt; 6h)</option>
                    <option value="medium">Medium (&lt; 24h)</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Escalation Level Picker */}
              <div>
                <label className="block text-slate-400 mb-1">
                  Escalation Level & Automated Routing Policy
                </label>
                <select
                  value={newTicketEscalation}
                  onChange={(e) => setNewTicketEscalation(e.target.value as TicketEscalationLevel)}
                  className={`w-full rounded-lg px-3 py-2 text-white font-semibold focus:outline-none cursor-pointer border ${
                    newTicketEscalation === 'critical'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                      : 'bg-slate-950 border-slate-700 focus:border-indigo-500'
                  }`}
                >
                  <option value="critical">🚨 Critical (P0 - Immediate Slack & Email Routing to Kenneth)</option>
                  <option value="high">⚠️ High (P1 - Priority Response)</option>
                  <option value="medium">Medium (P2 - Standard Response)</option>
                  <option value="low">Low (P3 - General Inquiries)</option>
                </select>

                {newTicketEscalation === 'critical' && (
                  <div className="mt-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-[11px] text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-rose-400 animate-ping" />
                      <span>Automated Routing System Active:</span>
                    </div>
                    <p className="text-slate-300">
                      Senior Platform Admin <strong>Kenneth Onekalit</strong> (onekalitkenneth@gmail.com) will be paged via high-priority email, and a Block Kit alert will be posted to Slack channel <strong>#platform-critical-incidents</strong>. 30-minute response SLA.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Subject / Query Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Latency on month-end invoice report or subscription question"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detailed Query Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide context, error messages, collection names, or billing transaction IDs..."
                  value={newTicketDescription}
                  onChange={(e) => setNewTicketDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Log & Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
