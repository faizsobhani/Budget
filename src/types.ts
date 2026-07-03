export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  amount: number;
  category: string; // category ID or name
  isPending: boolean;
  notes?: string;
  linkedCardId?: string; // if spent on a credit card
  reconciled?: boolean;
}

export interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number; // assigned amount for the month
}

export interface CreditCard {
  id: string;
  name: string;
  currentBalance: number;
  creditLimit: number;
  dueDate: string; // YYYY-MM-DD
  statementClosingDate: string; // YYYY-MM-DD
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings';
}

export interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string; // associated category
  dayOfMonth: number;
}

export interface MonthState {
  monthId: string; // e.g. "2026-07"
  categories: BudgetCategory[];
  transactions: Transaction[];
  incomeSources: { id: string; name: string; amount: number }[];
}

export interface SuggestedMapping {
  merchant: string;
  frequency: number;
  suggestedCategory: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string;
}

