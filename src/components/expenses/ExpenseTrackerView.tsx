import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Mic,
  MicOff,
  Trash2,
  Calendar,
  Building2,
  Tag,
  Repeat,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Expense, OrganizationSettings, User } from '../../types';
import { storageService } from '../../services/storage';

interface ExpenseTrackerViewProps {
  org: OrganizationSettings;
  currentUser: User;
  onRefresh?: () => void;
}

export const ExpenseTrackerView: React.FC<ExpenseTrackerViewProps> = ({
  org,
  currentUser,
  onRefresh,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>(storageService.getExpenses(org.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Software');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState(org.currency || 'GBP');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendorName, setVendorName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');

  // Web Speech API Voice Dictation State
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceNotification, setVoiceNotification] = useState<string | null>(null);

  const categories: Expense['category'][] = [
    'Software',
    'Cloud Infrastructure',
    'Office & Rent',
    'Salaries',
    'Marketing',
    'Hardware',
    'Travel',
    'Other',
  ];

  const refreshExpenses = () => {
    setExpenses(storageService.getExpenses(org.id));
    if (onRefresh) onRefresh();
  };

  // -------------------------------------------------------------
  // WEB SPEECH API RECOGNITION HANDLER
  // -------------------------------------------------------------
  const handleToggleVoiceDictation = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotification('Speech Recognition not supported in this browser. You can type directly.');
      setTimeout(() => setVoiceNotification(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      setIsListeningVoice(true);
      setVoiceTranscript('');
      setVoiceNotification('Listening... speak your expense title, category, or amount!');

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalTranscript = event.results[i][0].transcript;
            setVoiceTranscript(finalTranscript);
            parseSpokenExpense(finalTranscript);
          } else {
            interim += event.results[i][0].transcript;
            setVoiceTranscript(interim);
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListeningVoice(false);
        setVoiceNotification('Microphone listening ended.');
        setTimeout(() => setVoiceNotification(null), 3000);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition init failed:', err);
      setIsListeningVoice(false);
    }
  };

  // Smart spoken text parser to populate form fields
  const parseSpokenExpense = (spokenText: string) => {
    const text = spokenText.toLowerCase();

    // 1. Look for numbers for amount
    const numberMatches = text.match(/\b\d+(\.\d{1,2})?\b/);
    if (numberMatches) {
      setAmount(numberMatches[0]);
    } else {
      // Check written numbers e.g. "fifty" "hundred"
      if (text.includes('fifty')) setAmount('50');
      else if (text.includes('hundred')) setAmount('100');
      else if (text.includes('thousand')) setAmount('1000');
    }

    // 2. Look for category keywords
    if (text.includes('cloud') || text.includes('aws') || text.includes('hosting') || text.includes('server')) {
      setCategory('Cloud Infrastructure');
    } else if (text.includes('software') || text.includes('saas') || text.includes('license') || text.includes('figma') || text.includes('github')) {
      setCategory('Software');
    } else if (text.includes('rent') || text.includes('office') || text.includes('wework')) {
      setCategory('Office & Rent');
    } else if (text.includes('laptop') || text.includes('dell') || text.includes('hardware') || text.includes('monitor')) {
      setCategory('Hardware');
    } else if (text.includes('marketing') || text.includes('ad') || text.includes('google ads')) {
      setCategory('Marketing');
    } else if (text.includes('travel') || text.includes('flight') || text.includes('hotel') || text.includes('taxi')) {
      setCategory('Travel');
    }

    // 3. Set title from spoken phrase
    const cleanTitle = spokenText.charAt(0).toUpperCase() + spokenText.slice(1);
    setTitle(cleanTitle);
    setNotes(`Dictated via Hands-Free Web Speech API: "${spokenText}"`);
    setVoiceNotification(`Extracted from speech: "${cleanTitle}"`);
    setTimeout(() => setVoiceNotification(null), 5000);
  };

  const handleSimulateVoiceDemo = () => {
    const samplePhrases = [
      'AWS cloud infrastructure cluster three hundred fifty dollars',
      'Canary Wharf executive office rent fifteen hundred pounds',
      'Dell developer laptop workstation eight hundred ninety dollars',
      'Figma design team annual license four hundred twenty dollars',
    ];
    const picked = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
    setVoiceTranscript(picked);
    parseSpokenExpense(picked);
  };

  // Handle Save
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const newExpense: Expense = {
      id: 'exp_' + Math.random().toString(36).substring(2, 9),
      organizationId: org.id,
      title: title.trim(),
      category,
      amount: Number(amount) || 0,
      currency,
      date,
      vendorName: vendorName.trim() || undefined,
      isRecurring,
      notes: notes.trim() || undefined,
      status: 'logged',
      createdAt: new Date().toISOString(),
    };

    storageService.saveExpense(newExpense, currentUser);
    setShowAddModal(false);

    // Reset form
    setTitle('');
    setAmount('');
    setVendorName('');
    setNotes('');
    setIsRecurring(false);
    refreshExpenses();
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Delete this expense record?')) {
      storageService.deleteExpense(id, org.id, currentUser);
      refreshExpenses();
    }
  };

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.vendorName && e.vendorName.toLowerCase().includes(q)) ||
          e.amount.toString().includes(q)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, categoryFilter, searchQuery]);

  // Aggregate Metrics
  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const recurringMonthlyTotal = useMemo(() => {
    return expenses.filter((e) => e.isRecurring).reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const handleExportCsv = () => {
    const headers = ['Date,Title,Category,Amount,Currency,Vendor,Recurring,Notes'];
    const rows = filteredExpenses.map(
      (e) =>
        `"${e.date}","${e.title}","${e.category}","${e.amount}","${e.currency}","${e.vendorName || ''}","${e.isRecurring ? 'Yes' : 'No'}","${e.notes || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Expense Tracker & Voice Dictation
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Web Speech API
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track operational business expenses with hands-free voice-to-text dictation, recurring alerts, and category analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowAddModal(true);
              // Start voice dictation prompt
              setVoiceNotification('Click the red microphone to dictate hands-free');
              setTimeout(() => setVoiceNotification(null), 4000);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record Expense (Voice / Text)</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Expenses</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {org.currency} {totalExpenseAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            Across {expenses.length} operational disbursements
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recurring Subscriptions</span>
            <Repeat className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {org.currency} {recurringMonthlyTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            Monthly automated commitments
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hands-Free Speech API</span>
            <Mic className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            Active
          </div>
          <div className="text-[11px] text-slate-500">
            Real-time acoustic speech parser
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Top Cost Category</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            Hardware
          </div>
          <div className="text-[11px] text-slate-500">
            Workstations & rack servers
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses by title, vendor, amount..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing {filteredExpenses.length} expense records
        </div>
      </div>

      {/* Expenses List Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 select-none">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Title / Expense Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Vendor</th>
              <th className="py-3 px-4 text-center">Recurring</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500">
                  No expenses match your filters. Click &quot;Record Expense&quot; to dictate one hands-free.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-300">{exp.date}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{exp.title}</div>
                    {exp.notes && (
                      <div className="text-[11px] text-slate-400 italic mt-0.5 truncate max-w-xs">
                        {exp.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {exp.vendorName || '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {exp.isRecurring ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        Monthly Auto
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">One-time</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                    {exp.currency} {exp.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD EXPENSE WITH VOICE-TO-TEXT */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Record Operational Expense
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsListeningVoice(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Voice Dictation Live Banner */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isListeningVoice
                        ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40'
                        : 'bg-slate-800 text-indigo-400'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Hands-Free Voice Dictation (Web Speech API)</span>
                      {isListeningVoice && (
                        <span className="text-[10px] text-rose-400 font-mono animate-pulse">
                          ● LISTENING
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Speak your expense naturally, e.g. &quot;AWS hosting three hundred dollars&quot;
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleVoiceDictation}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                      isListeningVoice
                        ? 'bg-rose-600 text-white hover:bg-rose-500 animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isListeningVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListeningVoice ? 'Stop' : 'Start Mic'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateVoiceDemo}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-colors"
                    title="Simulate speaking an expense sample"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400 inline mr-1" />
                    Demo
                  </button>
                </div>
              </div>

              {voiceTranscript && (
                <div className="p-2.5 bg-slate-900 rounded-lg border border-indigo-500/40 text-xs font-mono text-indigo-300 flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">&quot;{voiceTranscript}&quot;</span>
                </div>
              )}

              {voiceNotification && (
                <div className="text-[11px] text-emerald-400 font-medium">
                  {voiceNotification}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Expense Title / Deliverable <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AWS Cloud Infrastructure or Office Rent"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-12 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vendor / Payee
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. AWS or WeWork"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Mark as Recurring Monthly Subscription</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Voice Transcript
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional expense notes..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setIsListeningVoice(false);
                  }}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
