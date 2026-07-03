import React, { useState } from 'react';
import { Target, TrendingUp, Plus, Trash2, Calendar, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { SavingsGoal, BankAccount, Transaction, BudgetCategory } from '../types';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  bankAccount: BankAccount;
  categories: BudgetCategory[];
  onUpdateGoals: (goals: SavingsGoal[]) => void;
  onUpdateBankAccount: (account: BankAccount) => void;
  onLogSavingsTransaction: (goalName: string, amount: number, categoryName: string) => void;
}

export default function SavingsGoals({
  goals,
  bankAccount,
  categories,
  onUpdateGoals,
  onUpdateBankAccount,
  onLogSavingsTransaction,
}: SavingsGoalsProps) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: 'Savings',
  });

  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState<string>('');

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) return;

    const targetVal = parseFloat(newGoal.targetAmount);
    const currentVal = parseFloat(newGoal.currentAmount) || 0;

    if (isNaN(targetVal) || targetVal <= 0) return;

    const createdGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      name: newGoal.name,
      targetAmount: targetVal,
      currentAmount: currentVal,
      targetDate: newGoal.targetDate,
      category: newGoal.category,
    };

    onUpdateGoals([...goals, createdGoal]);
    setNewGoal({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      category: 'Savings',
    });
    setShowAddGoal(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    onUpdateGoals(goals.filter(g => g.id !== goalId));
  };

  const handleContributeSubmit = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const amt = parseFloat(contributionAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid positive contribution amount.");
      return;
    }

    if (amt > bankAccount.balance) {
      alert(`Insufficient funds in checking account (${bankAccount.name}). Your balance is $${bankAccount.balance.toFixed(2)}.`);
      return;
    }

    // Process contribution
    // 1. Update bank balance
    const updatedBankAccount = {
      ...bankAccount,
      balance: bankAccount.balance - amt
    };
    onUpdateBankAccount(updatedBankAccount);

    // 2. Update goal current amount
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        return { ...g, currentAmount: g.currentAmount + amt };
      }
      return g;
    });
    onUpdateGoals(updatedGoals);

    // 3. Log a ledger row
    onLogSavingsTransaction(goal.name, amt, goal.category);

    setContributeGoalId(null);
    setContributionAmount('');
  };

  return (
    <div className="bg-dark-surface border border-technical-border rounded p-6 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="flex items-center justify-between border-b border-technical-border/50 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-accent-green/10 p-2.5 rounded border border-accent-green/25 text-accent-green">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase font-sans">Durable Savings Goals</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Allocate and track long-term savings under Zero-Base rules</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded uppercase tracking-wider flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      {showAddGoal && (
        <form onSubmit={handleAddGoal} className="bg-slate-50 dark:bg-slate-900/40 border border-technical-border rounded p-4 mb-6 space-y-3 font-mono text-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Configure Savings Goal</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Goal Name</label>
              <input
                type="text"
                placeholder="e.g. Europe Vacation"
                value={newGoal.name}
                onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                className="bg-white dark:bg-slate-800 border border-technical-border text-xs text-slate-800 dark:text-white rounded p-2 w-full focus:outline-none focus:border-accent-green"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Target Date</label>
              <input
                type="date"
                value={newGoal.targetDate}
                onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                className="bg-white dark:bg-slate-800 border border-technical-border text-xs text-slate-800 dark:text-white rounded p-2 w-full focus:outline-none focus:border-accent-green"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Target Amount ($)</label>
              <input
                type="number"
                placeholder="2500"
                value={newGoal.targetAmount}
                onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                className="bg-white dark:bg-slate-800 border border-technical-border text-xs text-slate-800 dark:text-white rounded p-2 w-full focus:outline-none focus:border-accent-green"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Starting Balance ($)</label>
              <input
                type="number"
                placeholder="0"
                value={newGoal.currentAmount}
                onChange={e => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                className="bg-white dark:bg-slate-800 border border-technical-border text-xs text-slate-800 dark:text-white rounded p-2 w-full focus:outline-none focus:border-accent-green"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Associate Budget Category</label>
              <select
                value={newGoal.category}
                onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
                className="bg-white dark:bg-slate-800 border border-technical-border text-xs text-slate-800 dark:text-white rounded p-2 w-full focus:outline-none"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1.5">
            <button
              type="submit"
              className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-bold py-2 px-4 rounded uppercase tracking-wider transition-colors hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer"
            >
              Initialize Goal
            </button>
            <button
              type="button"
              onClick={() => setShowAddGoal(false)}
              className="border border-technical-border text-slate-500 font-bold py-2 px-4 rounded uppercase tracking-wider transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/20 border border-technical-border rounded text-slate-400 italic font-mono text-xs">
          No active savings goals initialized. Track your milestones and fund them seamlessly under zero-base limits.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const percent = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100));
            const isCompleted = percent >= 100;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="bg-slate-50 dark:bg-slate-900/20 border border-technical-border rounded p-4 flex flex-col justify-between relative group hover:border-accent-green/40 transition-all"
              >
                {/* Delete button top right */}
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-accent-crimson cursor-pointer transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete Savings Goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 max-w-[85%]">
                    <TrendingUp className={`w-4 h-4 shrink-0 mt-0.5 ${isCompleted ? 'text-accent-green' : 'text-slate-400'}`} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{goal.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Category: {goal.category}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-slate-700 dark:text-slate-300">${goal.currentAmount.toFixed(2)}</span>
                      <span className="text-slate-400">of ${goal.targetAmount.toFixed(2)} ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${isCompleted ? 'bg-accent-green' : 'bg-slate-900 dark:bg-slate-100'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <Calendar className="w-3 h-3" />
                    <span>Target Date: {goal.targetDate}</span>
                  </div>
                </div>

                {/* Contribution controls */}
                <div className="mt-4 pt-3.5 border-t border-technical-border/40">
                  {contributeGoalId === goal.id ? (
                    <div className="flex gap-2 font-mono text-xs">
                      <div className="relative flex-grow">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={contributionAmount}
                          onChange={e => setContributionAmount(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-technical-border rounded py-1.5 pl-6 pr-2 focus:outline-none text-slate-800 dark:text-white"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => handleContributeSubmit(goal.id)}
                        className="bg-accent-green text-white font-bold px-3 py-1.5 rounded uppercase tracking-wider hover:bg-emerald-600 cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setContributeGoalId(null)}
                        className="border border-technical-border text-slate-400 px-2 py-1.5 rounded hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        {isCompleted ? 'Goal Fully Achieved!' : `Needs $${remaining.toFixed(2)}`}
                      </span>
                      {!isCompleted && (
                        <button
                          onClick={() => {
                            setContributeGoalId(goal.id);
                            setContributionAmount('');
                          }}
                          className="text-[10px] font-mono font-bold text-accent-green uppercase tracking-widest border border-accent-green/25 hover:border-accent-green/50 bg-accent-green/5 px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>Fund Goal</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
