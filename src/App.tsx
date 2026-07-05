import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  HelpCircle, 
  Calendar, 
  ArrowRightLeft, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Database, 
  Settings, 
  DollarSign, 
  RefreshCw, 
  Briefcase, 
  TrendingUp, 
  Receipt,
  FileText,
  Clock,
  ListPlus,
  ArrowRight,
  User,
  Check,
  ChevronDown,
  Sun,
  Moon,
  Target,
  Brain,
  LayoutDashboard
} from 'lucide-react';
import { Transaction, BudgetCategory, CreditCard, BankAccount, RecurringItem, MonthState, SavingsGoal } from './types';
import OCRScanner from './components/OCRScanner';
import CreditCards from './components/CreditCards';
import ContextImporter from './components/ContextImporter';
import BudgetTable from './components/BudgetTable';
import MonthEndReport from './components/MonthEndReport';
import Insights from './components/Insights';
import GeminiThinker from './components/GeminiThinker';
import SavingsGoals from './components/SavingsGoals';
import { parseNaturalLanguageInput, smartCategorize } from './utils/parser';

// Seed initial values for a gorgeous interactive dashboard immediately
const INITIAL_CATEGORIES: BudgetCategory[] = [
  { id: 'cat-food', name: 'Food & Dining', budgeted: 400 },
  { id: 'cat-shopping', name: 'Shopping', budgeted: 300 },
  { id: 'cat-groceries', name: 'Groceries', budgeted: 600 },
  { id: 'cat-gym', name: 'Gym & Fitness', budgeted: 100 },
  { id: 'cat-subs', name: 'Subscriptions', budgeted: 150 },
  { id: 'cat-utilities', name: 'Utilities', budgeted: 250 },
  { id: 'cat-gas', name: 'Gas & Transportation', budgeted: 300 },
  { id: 'cat-insurance', name: 'Car Insurance', budgeted: 150 },
  { id: 'cat-rent', name: 'Rent & Housing', budgeted: 1220 },
  { id: 'cat-savings', name: 'Savings', budgeted: 1530 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', date: '2026-07-01', merchant: 'STARBUCKS COFFEE #4512', amount: 4.25, category: 'Food & Dining', isPending: false },
  { id: 'tx-2', date: '2026-07-01', merchant: 'PLANET FITNESS MONTHLY FEE', amount: 24.99, category: 'Gym & Fitness', isPending: false },
  { id: 'tx-3', date: '2026-07-02', merchant: 'CHEVRON GAS STATION PRE-AUTH', amount: 1.00, category: 'Gas & Transportation', isPending: true, notes: "Temporary Hold" },
  { id: 'tx-4', date: '2026-07-02', merchant: 'AMAZON PRIME MEMBERSHIP', amount: 14.99, category: 'Subscriptions', isPending: false },
  { id: 'tx-5', date: '2026-07-03', merchant: 'SPOTIFY PREMIUM', amount: 10.99, category: 'Subscriptions', isPending: false },
  { id: 'tx-6', date: '2026-07-03', merchant: 'TJMAX SHOPPING STORE', amount: 52.00, category: 'Shopping', isPending: false },
  { id: 'tx-7', date: '2026-07-04', merchant: 'CHEVRON GAS STATION SETTLED', amount: 34.50, category: 'Gas & Transportation', isPending: false },
  { id: 'tx-8', date: '2026-07-04', merchant: 'WALMART GROCERY SUPERCENTER', amount: 112.40, category: 'Groceries', isPending: false },
  { id: 'tx-9', date: '2026-07-04', merchant: 'PENDING TRANSFER - SAVINGS', amount: 200.00, category: 'Savings', isPending: true, notes: "Temporary hold" },
  { id: 'tx-10', date: '2026-07-03', merchant: 'LIBERTY MUTUAL INS AUTO', amount: 120.00, category: 'Car Insurance', isPending: false },
  { id: 'tx-11', date: '2026-07-01', merchant: 'APARTMENT RENT', amount: 1220.00, category: 'Rent & Housing', isPending: false },
];

const INITIAL_INCOME_SOURCES = [
  { id: 'inc-1', name: 'Salary Direct Deposit', amount: 4500 },
  { id: 'inc-2', name: 'Consulting Gig', amount: 500 },
];

const INITIAL_RECURRING: RecurringItem[] = [
  { id: 'rec-1', name: 'Apartment Rent', amount: 1220.00, type: 'expense', category: 'Rent & Housing', dayOfMonth: 1 },
  { id: 'rec-2', name: 'Spotify Premium Music', amount: 10.99, type: 'expense', category: 'Subscriptions', dayOfMonth: 2 },
  { id: 'rec-3', name: 'Netflix Premium Recurring', amount: 15.49, type: 'expense', category: 'Subscriptions', dayOfMonth: 3 },
  { id: 'rec-4', name: 'Planet Fitness Gym Membership', amount: 24.99, type: 'expense', category: 'Gym & Fitness', dayOfMonth: 1 },
  { id: 'rec-5', name: 'Salary Monthly Direct Deposit', amount: 4500.00, type: 'income', category: 'Income', dayOfMonth: 1 },
  { id: 'rec-6', name: 'Side Consulting Retainer', amount: 500.00, type: 'income', category: 'Income', dayOfMonth: 5 },
];

export default function App() {
  const [activeMonth, setActiveMonth] = useState<string>("2026-07");
  
  // Master states
  const [monthsState, setMonthsState] = useState<Record<string, MonthState>>(() => {
    const saved = localStorage.getItem('vibebudget_months');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    // Seed July 2026
    return {
      "2026-07": {
        monthId: "2026-07",
        categories: INITIAL_CATEGORIES,
        transactions: INITIAL_TRANSACTIONS,
        incomeSources: INITIAL_INCOME_SOURCES
      }
    };
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem('vibebudget_cards');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'card-disc', name: 'Discover Card', currentBalance: 245.00, creditLimit: 5000, dueDate: '2026-07-15', statementClosingDate: '2026-07-08' },
      { id: 'card-chase', name: 'Chase Sapphire', currentBalance: 120.00, creditLimit: 12000, dueDate: '2026-07-04', statementClosingDate: '2026-07-01' },
    ];
  });

  const [bankAccount, setBankAccount] = useState<BankAccount>(() => {
    const saved = localStorage.getItem('vibebudget_bank');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { id: 'bank-checking', name: 'Chase Liquidity Checking', balance: 4520.00, type: 'checking' };
  });

  // Navigation, Dark/Light Themes, Savings Goals (User Request)
  const [activeTab, setActiveTab] = useState<'budget' | 'charts' | 'accounts' | 'savings'>(() => {
    const saved = localStorage.getItem('vibebudget_active_tab');
    return (saved as any) || 'budget';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('vibebudget_theme') === 'dark';
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('vibebudget_savings_goals');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'goal-1', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 4520, targetDate: '2026-12-31', category: 'Savings' },
      { id: 'goal-2', name: 'Europe Summer Vacation', targetAmount: 3000, currentAmount: 1200, targetDate: '2026-08-15', category: 'Savings' }
    ];
  });

  const [isAiLoading, setIsAiLoading] = useState(false);

  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(() => {
    const saved = localStorage.getItem('vibebudget_recurring');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_RECURRING;
  });

  const [learnedMappings, setLearnedMappings] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('vibebudget_learned');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  // UI inputs
  const [naturalInput, setNaturalInput] = useState("");
  const [manualTx, setManualTx] = useState({ merchant: '', amount: '', category: 'Uncategorized', isPending: false });
  const [manualInc, setManualInc] = useState({ name: '', amount: '' });
  const [newRecurring, setNewRecurring] = useState({ name: '', amount: '', type: 'expense' as 'income'|'expense', category: 'Food & Dining', dayOfMonth: 1 });
  const [notification, setNotification] = useState<string | null>(null);

  // Write changes to localStorage
  useEffect(() => {
    localStorage.setItem('vibebudget_months', JSON.stringify(monthsState));
  }, [monthsState]);

  useEffect(() => {
    localStorage.setItem('vibebudget_cards', JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem('vibebudget_bank', JSON.stringify(bankAccount));
  }, [bankAccount]);

  useEffect(() => {
    localStorage.setItem('vibebudget_recurring', JSON.stringify(recurringItems));
  }, [recurringItems]);

  useEffect(() => {
    localStorage.setItem('vibebudget_learned', JSON.stringify(learnedMappings));
  }, [learnedMappings]);

  useEffect(() => {
    localStorage.setItem('vibebudget_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('vibebudget_savings_goals', JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  // Dark/Light Theme toggler class applicator (User Request)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vibebudget_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vibebudget_theme', 'light');
    }
  }, [isDarkMode]);



  // Retrieve current active month state, or initialize if empty
  const currentMonthState: MonthState = monthsState[activeMonth] || {
    monthId: activeMonth,
    categories: INITIAL_CATEGORIES.map(c => ({ ...c, budgeted: 0 })), // structural carry forward, but limits reset to 0
    transactions: [],
    incomeSources: []
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  // Switch month or start new
  const handleMonthChange = (month: string) => {
    setActiveMonth(month);
    if (!monthsState[month]) {
      // Lazy initialize new month
      // Rules: custom categories structural memories are carried forward automatically
      const previousMonthId = Object.keys(monthsState).sort().pop() || "2026-07";
      const previousCategories = monthsState[previousMonthId]?.categories || INITIAL_CATEGORIES;
      
      const newMonthState: MonthState = {
        monthId: month,
        categories: previousCategories.map(cat => ({
          ...cat,
          budgeted: cat.budgeted // carry over budgeted limits as structural benchmark
        })),
        transactions: [],
        incomeSources: []
      };

      setMonthsState(prev => ({
        ...prev,
        [month]: newMonthState
      }));
      showToast(`Started New Month ${month}! Shared category structural rules loaded.`);
    }
  };

  // Process Recurring Templates button (Feature 10)
  const processRecurringMonthTemplates = () => {
    const templates = recurringItems;
    
    // 1. Separate Income from Expenses
    const incomesToAdd = templates
      .filter(item => item.type === 'income')
      .map(item => ({
        id: `inc-rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: item.name,
        amount: item.amount
      }));

    const expensesToAdd = templates
      .filter(item => item.type === 'expense')
      .map(item => ({
        id: `tx-rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date: `${activeMonth}-${String(item.dayOfMonth).padStart(2, '0')}`,
        merchant: item.name.toUpperCase(),
        amount: item.amount,
        category: item.category,
        isPending: false,
        notes: "Recurring Template Autoload"
      }));

    // Merge into current active month state
    setMonthsState(prev => {
      const existing = prev[activeMonth] || currentMonthState;
      return {
        ...prev,
        [activeMonth]: {
          ...existing,
          incomeSources: [...existing.incomeSources, ...incomesToAdd],
          transactions: [...existing.transactions, ...expensesToAdd]
        }
      };
    });

    showToast(`Processed recurring fixed templates into ${activeMonth}! Added ${incomesToAdd.length} incomes and ${expensesToAdd.length} expenses.`);
  };

  // Add manually or OCR transactions with Reconcile Engine
  const handleAddTransactions = (txs: Transaction[]) => {
    setMonthsState(prev => {
      const state = prev[activeMonth] || currentMonthState;
      let currentTxs = [...state.transactions];

      // Reconcile Engine Logic:
      // When a new settled transaction comes in, check history for any matching pending holds
      // within a 5-day window, and drop/archive that old hold to keep checking logs accurate.
      txs.forEach(newTx => {
        if (!newTx.isPending) {
          const newTxDate = new Date(newTx.date);
          
          // Find if there's an existing pending hold with same merchant prefix and amount in a 5 day window
          const holdIndex = currentTxs.findIndex(oldTx => {
            if (!oldTx.isPending) return false;
            
            const oldTxDate = new Date(oldTx.date);
            const diffTime = Math.abs(newTxDate.getTime() - oldTxDate.getTime());
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            
            // Check merchant match (e.g., seeing if merchant root phrase matches)
            const m1 = oldTx.merchant.split(' ')[0].toLowerCase();
            const m2 = newTx.merchant.split(' ')[0].toLowerCase();
            
            // Matches if within 5 days and merchant first word matches
            return diffDays <= 5 && m1 === m2;
          });

          if (holdIndex !== -1) {
            // Drop old pre-auth transaction from list
            currentTxs.splice(holdIndex, 1);
            showToast(`Reconcile Engine: Settled transaction merged! Dropped temporary pre-auth hold for "${newTx.merchant}".`);
          }
        }
      });

      // Append new transactions
      return {
        ...prev,
        [activeMonth]: {
          ...state,
          transactions: [...currentTxs, ...txs]
        }
      };
    });
  };

  // Add categories from onboarding scanner mapping
  const handleAddCategories = (catsToCreate: { name: string; id: string }[]) => {
    setMonthsState(prev => {
      const state = prev[activeMonth] || currentMonthState;
      const existingNames = new Set(state.categories.map(c => c.name.toLowerCase()));
      
      const newCats = [...state.categories];
      catsToCreate.forEach(c => {
        if (!existingNames.has(c.name.toLowerCase())) {
          newCats.push({
            id: c.id,
            name: c.name,
            budgeted: 0
          });
        }
      });

      return {
        ...prev,
        [activeMonth]: {
          ...state,
          categories: newCats
        }
      };
    });
  };

  // Background Auto-Remapping Intercept (Feature 9)
  const handleCategoryChange = (txId: string, newCategory: string) => {
    setMonthsState(prev => {
      const state = prev[activeMonth] || currentMonthState;
      const updatedTxs = state.transactions.map(tx => {
        if (tx.id === txId) {
          // If transaction merchant is longer than 3 characters, silently save to localStorage dictionary
          if (tx.merchant && tx.merchant.length > 3) {
            setLearnedMappings(lm => ({
              ...lm,
              [tx.merchant.toLowerCase().trim()]: newCategory
            }));
            showToast(`Memory Saved: Associated "${tx.merchant}" to "${newCategory}" for future logs.`);
          }
          return { ...tx, category: newCategory };
        }
        return tx;
      });

      return {
        ...prev,
        [activeMonth]: {
          ...state,
          transactions: updatedTxs
        }
      };
    });
  };

  // Natural Language Input parse & submit (Feature 5)
  const handleNaturalInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalInput.trim()) return;

    const parsed = parseNaturalLanguageInput(naturalInput);
    
    // Create new transaction object
    const newTx: Transaction = {
      id: `nat-${Date.now()}`,
      date: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
      merchant: parsed.merchant,
      amount: parsed.amount,
      category: parsed.suggestedCategory,
      isPending: false,
    };

    handleAddTransactions([newTx]);
    setNaturalInput("");
    showToast(`Quick Logged: "${parsed.merchant}" for $${parsed.amount.toFixed(2)} [${parsed.suggestedCategory}]`);
  };

  // AI-Driven Natural Language Categorization via Gemini (User Request)
  const handleAiParseAndPost = async () => {
    if (!naturalInput.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await fetch("/api/gemini/categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          naturalInput,
          categories: currentMonthState.categories,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to parse transaction with Gemini.");
      }

      // If category returned is not in our list, double check
      const matchedCategory = currentMonthState.categories.find(
        c => c.name.toLowerCase() === (data.category || "").toLowerCase()
      )?.name || data.category || "Uncategorized";

      const newTx: Transaction = {
        id: `ai-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        merchant: data.merchant || "Unknown Merchant",
        amount: Number(data.amount) || 0,
        category: matchedCategory,
        isPending: false,
        notes: `AI Categorized: ${data.reasoning || ""}`
      };

      handleAddTransactions([newTx]);
      setNaturalInput("");
      showToast(`AI Logged: "${newTx.merchant}" for $${newTx.amount.toFixed(2)} [${newTx.category}]`);
    } catch (err: any) {
      console.error(err);
      showToast(`AI Parsing error: ${err.message || err}. Falling back to local offline parser.`);
      
      // Fallback to local offline parser
      const parsed = parseNaturalLanguageInput(naturalInput);
      const newTx: Transaction = {
        id: `nat-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        merchant: parsed.merchant,
        amount: parsed.amount,
        category: parsed.suggestedCategory,
        isPending: false,
      };
      handleAddTransactions([newTx]);
      setNaturalInput("");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Log savings goals milestone fund contributions (User Request)
  const handleLogSavingsTransaction = (goalName: string, amount: number, categoryName: string) => {
    const newTx: Transaction = {
      id: `sav-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      merchant: `Savings Goal Contribution: ${goalName}`,
      amount: amount,
      category: categoryName,
      isPending: false,
      notes: "Allocated fund deposit"
    };
    handleAddTransactions([newTx]);
    showToast(`Successfully deposited $${amount.toFixed(2)} to savings goal: "${goalName}"!`);
  };

  // Manual Transaction submission
  const handleManualTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTx.merchant || !manualTx.amount) return;

    const amount = parseFloat(manualTx.amount);
    if (isNaN(amount) || amount <= 0) return;

    const newTx: Transaction = {
      id: `man-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      merchant: manualTx.merchant,
      amount,
      category: manualTx.category,
      isPending: manualTx.isPending,
    };

    handleAddTransactions([newTx]);
    setManualTx({ merchant: '', amount: '', category: 'Uncategorized', isPending: false });
  };

  // Manual Income source submission
  const handleManualIncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInc.name || !manualInc.amount) return;

    const amount = parseFloat(manualInc.amount);
    if (isNaN(amount) || amount <= 0) return;

    const newInc = {
      id: `inc-${Date.now()}`,
      name: manualInc.name,
      amount
    };

    setMonthsState(prev => {
      const state = prev[activeMonth] || currentMonthState;
      return {
        ...prev,
        [activeMonth]: {
          ...state,
          incomeSources: [...state.incomeSources, newInc]
        }
      };
    });

    setManualInc({ name: '', amount: '' });
    showToast(`Income added: "${newInc.name}" of $${amount.toFixed(2)}`);
  };

  // Delete transaction row
  const handleDeleteTransaction = (txId: string) => {
    setMonthsState(prev => {
      const state = prev[activeMonth] || currentMonthState;
      return {
        ...prev,
        [activeMonth]: {
          ...state,
          transactions: state.transactions.filter(t => t.id !== txId)
        }
      };
    });
  };

  // Delete income row
  const handleDeleteIncome = (incId: string) => {
    setMonthsState(prev => {
      const state = prev[activeMonth] || currentMonthState;
      return {
        ...prev,
        [activeMonth]: {
          ...state,
          incomeSources: state.incomeSources.filter(i => i.id !== incId)
        }
      };
    });
  };

  // Add dynamic Category manually
  const handleAddCategory = (name: string) => {
    setMonthsState(prev => {
      const state = prev[activeMonth] || currentMonthState;
      const alreadyExists = state.categories.some(c => c.name.toLowerCase() === name.toLowerCase());
      if (alreadyExists) return prev;

      const newCat: BudgetCategory = {
        id: `cat-${Date.now()}`,
        name,
        budgeted: 0
      };

      return {
        ...prev,
        [activeMonth]: {
          ...state,
          categories: [...state.categories, newCat]
        }
      };
    });
  };

  // Delete dynamic category
  const handleDeleteCategory = (id: string) => {
    setMonthsState(prev => {
      const state = prev[activeMonth] || currentMonthState;
      return {
        ...prev,
        [activeMonth]: {
          ...state,
          categories: state.categories.filter(c => c.id !== id)
        }
      };
    });
  };

  // Update whole category budgeted array
  const handleUpdateCategories = (cats: BudgetCategory[]) => {
    setMonthsState(prev => {
      return {
        ...prev,
        [activeMonth]: {
          ...(prev[activeMonth] || currentMonthState),
          categories: cats
        }
      };
    });
  };

  // Manage credit card payments linking checking balance (Feature 3)
  const handleLogCardPayment = (cardName: string, amount: number) => {
    // Generate transaction entry
    const newTx: Transaction = {
      id: `pmt-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      merchant: `Credit Card Payment Made: ${cardName}`,
      amount: amount,
      category: "Payment Made",
      isPending: false,
      notes: "Linked Credit Card Offset"
    };

    setMonthsState(prev => {
      const state = prev[activeMonth] || currentMonthState;
      return {
        ...prev,
        [activeMonth]: {
          ...state,
          transactions: [...state.transactions, newTx]
        }
      };
    });

    showToast(`Payment of $${amount.toFixed(2)} logged! Reduced checking and logged liability reconciliation offset.`);
  };

  // Recurring Items Management
  const handleAddRecurringItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecurring.name || !newRecurring.amount) return;

    const amount = parseFloat(newRecurring.amount);
    if (isNaN(amount) || amount <= 0) return;

    const item: RecurringItem = {
      id: `rec-${Date.now()}`,
      name: newRecurring.name,
      amount,
      type: newRecurring.type,
      category: newRecurring.type === 'income' ? 'Income' : newRecurring.category,
      dayOfMonth: Number(newRecurring.dayOfMonth),
    };

    setRecurringItems([...recurringItems, item]);
    setNewRecurring({ name: '', amount: '', type: 'expense', category: 'Food & Dining', dayOfMonth: 1 });
    showToast(`Added recurring template: "${item.name}"`);
  };

  const handleDeleteRecurringItem = (id: string) => {
    setRecurringItems(recurringItems.filter(r => r.id !== id));
  };

  // Compute stats for current active month
  const totalIncome = currentMonthState.incomeSources.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-dark-bg text-slate-700 dark:text-slate-300 flex flex-col antialiased font-sans transition-colors duration-200">
      {/* Visual Toast Notification Alert */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-dark-surface border border-technical-border text-accent-green text-[11px] font-mono py-3 px-5 rounded shadow-xl flex items-center gap-2.5 max-w-sm">
          <Sparkles className="w-4 h-4 text-accent-green shrink-0 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Main Navigation Bar */}
      <header className="border-b border-technical-border bg-white dark:bg-slate-900 sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <div className="border border-technical-border bg-dark-bg p-2.5 rounded">
            <DollarSign className="w-5 h-5 text-accent-green stroke-[2]" />
          </div>
          <div>
            <h1 id="app-title" className="text-xl font-bold tracking-tighter uppercase text-slate-900 dark:text-slate-100 flex items-center gap-2">
              VibeBudget
              <span className="text-[10px] bg-accent-green/10 text-accent-green px-2 py-0.5 rounded border border-accent-green/20 uppercase tracking-widest font-mono">
                v2.5
              </span>
            </h1>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none mt-1">Zero-Based Budgeting Core</p>
          </div>
        </div>

        {/* Global Toolbar and Selection */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Light/Dark Theme Toggle (User Request) */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="border border-technical-border hover:bg-slate-50 dark:hover:bg-slate-800 p-2.5 rounded text-slate-500 dark:text-slate-400 transition cursor-pointer bg-white dark:bg-slate-900 shrink-0"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Month selector dropdown */}
          <div className="relative flex-grow sm:flex-grow-0 min-w-[110px]">
            <select
              value={activeMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-technical-border text-xs font-mono text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded focus:outline-none focus:border-accent-green cursor-pointer appearance-none pr-8 uppercase"
            >
              <option value="2026-06">June 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-09">September 2026</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={processRecurringMonthTemplates}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white text-[11px] font-bold py-2.5 px-4 rounded uppercase tracking-widest transition cursor-pointer shrink-0 font-sans shadow-sm"
          >
            Process New Month
          </button>
        </div>
      </header>

      {/* Main Responsive Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Shorthand Natural Language Entry Bar (Feature 5) */}
        <div className="bg-dark-surface border border-technical-border p-4 rounded shadow-sm">
          <form onSubmit={handleNaturalInputSubmit} className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="flex items-center gap-3 flex-grow">
              <div className="bg-accent-green/10 text-accent-green p-2.5 rounded border border-accent-green/20 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-grow">
                <input
                  type="text"
                  value={naturalInput}
                  onChange={e => setNaturalInput(e.target.value)}
                  placeholder='Type manual shorthand (e.g., "$52 for tjmax shopping shoes" or "$12.50 starbucks") then choose Parse mode...'
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-technical-border rounded px-3 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 font-mono"
                  disabled={isAiLoading}
                />
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0 justify-end">
              <button
                type="submit"
                className="text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold px-4 py-2.5 rounded uppercase tracking-wider transition cursor-pointer"
                disabled={isAiLoading}
              >
                Quick Log (Local)
              </button>
              <button
                type="button"
                onClick={handleAiParseAndPost}
                className="text-[11px] bg-slate-900 hover:bg-slate-850 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-mono font-bold px-4 py-2.5 rounded uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                disabled={isAiLoading || !naturalInput.trim()}
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-accent-green dark:text-slate-900" />
                    <span>AI Log (Gemini)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Modern Tab Navigation Bar (User Request) */}
        <div className="flex border-b border-technical-border overflow-x-auto no-scrollbar gap-1 pt-1 bg-white dark:bg-slate-900 p-2 rounded border shadow-sm">
          <button
            onClick={() => setActiveTab('budget')}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap rounded ${
              activeTab === 'budget'
                ? 'border-accent-green text-accent-green bg-accent-green/5 dark:bg-accent-green/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Budget & Ledger</span>
          </button>
          
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap rounded ${
              activeTab === 'charts'
                ? 'border-accent-green text-accent-green bg-accent-green/5 dark:bg-accent-green/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Charts & Analytics</span>
          </button>
          
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap rounded ${
              activeTab === 'accounts'
                ? 'border-accent-green text-accent-green bg-accent-green/5 dark:bg-accent-green/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Card Balances</span>
          </button>
          
          <button
            onClick={() => setActiveTab('savings')}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap rounded ${
              activeTab === 'savings'
                ? 'border-accent-green text-accent-green bg-accent-green/5 dark:bg-accent-green/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Savings Goals</span>
          </button>
        </div>

        {/* Tab views conditional routing */}
        <div className="space-y-6">
          {activeTab === 'budget' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT 2 COLUMNS: Operations ledger & zero budgeting table */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Interactive Statement Scan Module (Features 1, 4) */}
                <OCRScanner
                  onAddTransactions={handleAddTransactions}
                  onAddCategories={handleAddCategories}
                  existingCategories={currentMonthState.categories}
                  learnedMappings={learnedMappings}
                  activeMonth={activeMonth}
                />

                {/* Zero-Based Budget Allocations (Features 6, 8) */}
                <BudgetTable
                  categories={currentMonthState.categories}
                  transactions={currentMonthState.transactions}
                  totalIncome={totalIncome}
                  onUpdateCategories={handleUpdateCategories}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                />

                {/* Active Ledger Transactions List with auto learning on Category overrides */}
                <div className="bg-dark-surface border border-technical-border rounded p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-accent-green" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Active Monthly Ledger Rows</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">{currentMonthState.transactions.length} items logged</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider border-b border-technical-border">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-right">Amount ($)</th>
                          <th className="py-2.5 px-3">Category Map</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-technical-border/50">
                        {currentMonthState.transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-slate-500 italic font-mono text-[11px]">No transactions posted to active ledger yet. Use simulated statement OCR scanner above!</td>
                          </tr>
                        ) : (
                          currentMonthState.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{tx.date}</td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-slate-850 dark:text-slate-100 block">{tx.merchant}</span>
                                {tx.isPending && (
                                  <span className="inline-block text-[9px] bg-accent-amber/10 text-accent-amber font-mono font-bold px-1.5 py-0.2 rounded border border-accent-amber/20">
                                    HOLD
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-accent-crimson">-${tx.amount.toFixed(2)}</td>
                              <td className="py-2 px-3">
                                <select
                                  value={tx.category}
                                  onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                                  className="bg-white dark:bg-slate-800 border border-technical-border text-[11px] text-accent-green font-semibold px-2 py-1 rounded focus:outline-none focus:border-accent-green cursor-pointer"
                                >
                                  <option value="Uncategorized">Uncategorized</option>
                                  {currentMonthState.categories.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                  ))}
                                  <option value="Payment Made">Payment Made</option>
                                </select>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  className="text-slate-400 hover:text-accent-crimson transition cursor-pointer"
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
                </div>

              </div>

              {/* RIGHT 1 COLUMN: Side Panel (Income sources & recurring templates) */}
              <div className="space-y-6">
                {/* Income Sources management */}
                <div className="bg-dark-surface border border-technical-border rounded p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-accent-green/10 p-2.5 rounded border border-accent-green/25 text-accent-green">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Active Month Income Pool</h3>
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">Log monthly earnings to expand Zero-Base bounds</p>
                    </div>
                  </div>

                  {/* Income sources list */}
                  <div className="space-y-2 mb-4">
                    {currentMonthState.incomeSources.length === 0 ? (
                      <div className="text-center py-4 bg-slate-50 dark:bg-slate-900/40 border border-technical-border rounded text-slate-400 dark:text-slate-500 italic font-mono text-[11px]">
                        No active income sources added yet.
                      </div>
                    ) : (
                      currentMonthState.incomeSources.map(inc => (
                        <div key={inc.id} className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 p-2.5 rounded border border-technical-border">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{inc.name}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-xs font-bold text-accent-green">+${inc.amount.toFixed(2)}</span>
                            <button
                              onClick={() => handleDeleteIncome(inc.id)}
                              className="text-slate-400 hover:text-accent-crimson cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Income */}
                  <form onSubmit={handleManualIncSubmit} className="space-y-2 border-t border-technical-border pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Source (e.g. Salary)"
                        value={manualInc.name}
                        onChange={e => setManualInc({ ...manualInc, name: e.target.value })}
                        className="bg-slate-50 dark:bg-slate-800 border border-technical-border text-xs text-slate-850 dark:text-white rounded p-2 focus:outline-none focus:border-accent-green"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Amount ($)"
                        value={manualInc.amount}
                        onChange={e => setManualInc({ ...manualInc, amount: e.target.value })}
                        className="bg-slate-50 dark:bg-slate-800 border border-technical-border text-xs text-slate-850 dark:text-white font-mono rounded p-2 focus:outline-none focus:border-accent-green"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-bold text-[11px] py-1.5 rounded uppercase tracking-widest transition hover:bg-slate-850 dark:hover:bg-slate-200 cursor-pointer"
                    >
                      Post Income
                    </button>
                  </form>
                </div>

                {/* Claude Chat Log Context Importer (Feature 2) */}
                <ContextImporter
                  onMergeLearnedMappings={setLearnedMappings}
                  learnedMappings={learnedMappings}
                />

                {/* Recurring Templates Manager (Feature 10) */}
                <div className="bg-dark-surface border border-technical-border rounded p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-accent-amber/10 p-2.5 rounded border border-accent-amber/25 text-accent-amber">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Recurring Items Master</h3>
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">Setup fixed templates that carry forward</p>
                    </div>
                  </div>

                  {/* Recurring template list */}
                  <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
                    {recurringItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 p-2.5 rounded border border-technical-border text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Day {item.dayOfMonth} · {item.type === 'income' ? 'Income' : item.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${item.type === 'income' ? 'text-accent-green' : 'text-slate-600 dark:text-slate-400'}`}>
                            ${item.amount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleDeleteRecurringItem(item.id)}
                            className="text-slate-400 hover:text-accent-crimson cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Create recurring template */}
                  <form onSubmit={handleAddRecurringItem} className="space-y-2 border-t border-technical-border pt-3 font-mono">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Create Fixed Template</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Name (e.g. Gym)"
                        value={newRecurring.name}
                        onChange={e => setNewRecurring({ ...newRecurring, name: e.target.value })}
                        className="bg-slate-50 dark:bg-slate-800 border border-technical-border text-xs rounded p-2 focus:outline-none focus:border-accent-green text-slate-800 dark:text-white"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Amount ($)"
                        value={newRecurring.amount}
                        onChange={e => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                        className="bg-slate-50 dark:bg-slate-800 border border-technical-border text-xs font-mono rounded p-2 focus:outline-none focus:border-accent-green text-slate-800 dark:text-white"
                        required
                      />
                      
                      <select
                        value={newRecurring.type}
                        onChange={e => setNewRecurring({ ...newRecurring, type: e.target.value as 'income'|'expense' })}
                        className="bg-slate-50 dark:bg-slate-800 border border-technical-border text-xs rounded p-2 focus:outline-none focus:border-accent-green text-slate-800 dark:text-white cursor-pointer"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>

                      <input
                        type="number"
                        placeholder="Day of Month (1-28)"
                        value={newRecurring.dayOfMonth}
                        onChange={e => setNewRecurring({ ...newRecurring, dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value))) })}
                        className="bg-slate-50 dark:bg-slate-800 border border-technical-border text-xs font-mono rounded p-2 focus:outline-none focus:border-accent-green text-slate-800 dark:text-white"
                        min="1"
                        max="28"
                        required
                      />
                    </div>

                    {newRecurring.type === 'expense' && (
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Associate Category</label>
                        <select
                          value={newRecurring.category}
                          onChange={e => setNewRecurring({ ...newRecurring, category: e.target.value })}
                          className="bg-slate-50 dark:bg-slate-800 border border-technical-border text-xs rounded p-2 w-full focus:outline-none text-slate-800 dark:text-white cursor-pointer"
                        >
                          {currentMonthState.categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-bold text-[11px] py-1.5 rounded uppercase tracking-widest transition hover:bg-slate-850 dark:hover:bg-slate-200 cursor-pointer font-sans"
                    >
                      Save Recurring Rule
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT 2 COLUMNS: Visual charts */}
              <div className="lg:col-span-2">
                <Insights
                  categories={currentMonthState.categories}
                  transactions={currentMonthState.transactions}
                />
              </div>

              {/* RIGHT 1 COLUMN: Gemini Smart Statistics Analyst */}
              <div>
                <GeminiThinker
                  categories={currentMonthState.categories}
                  transactions={currentMonthState.transactions}
                  incomeSources={currentMonthState.incomeSources}
                />
              </div>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="max-w-4xl mx-auto">
              <CreditCards
                creditCards={creditCards}
                bankAccount={bankAccount}
                onUpdateCreditCards={setCreditCards}
                onUpdateBankAccount={setBankAccount}
                onLogPaymentTransaction={handleLogCardPayment}
              />
            </div>
          )}

          {activeTab === 'savings' && (
            <div className="space-y-6">
              <SavingsGoals
                goals={savingsGoals}
                bankAccount={bankAccount}
                categories={currentMonthState.categories}
                onUpdateGoals={setSavingsGoals}
                onUpdateBankAccount={setBankAccount}
                onLogSavingsTransaction={handleLogSavingsTransaction}
              />

              <MonthEndReport
                categories={currentMonthState.categories}
                transactions={currentMonthState.transactions}
                totalIncome={totalIncome}
                creditCards={creditCards}
                bankAccount={bankAccount}
              />
            </div>
          )}
        </div>

        {/* PWA Settings Info Panel */}
        <div className="bg-dark-surface border border-technical-border rounded p-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 mb-2 text-slate-850 dark:text-slate-200 font-bold uppercase tracking-wider">
            <Check className="w-4 h-4 text-accent-green" />
            <span>PWA & Offline launch verified</span>
          </div>
          <p>
            VibeBudget is packaged as a high-performance Progressive Web App. Our active worker script caches essential static chunks locally inside the browser.
            Add the app to your mobile home screen to experience zero-delay native standalone execution, even during deep network offline disconnects.
          </p>
        </div>

      </main>

      <footer className="border-t border-technical-border bg-white dark:bg-slate-900 py-6 text-center text-[10px] font-mono text-slate-400 mt-12 uppercase tracking-widest transition-colors duration-200">
        <p>© 2026 VibeBudget Corp. All transactions stored securely via sandboxed browser localStorage.</p>
      </footer>
    </div>
  );
}
