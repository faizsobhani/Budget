import React, { useState } from 'react';
import { Percent, TrendingDown, ArrowRightLeft, Plus, CheckCircle, AlertCircle, Sparkles, Trash2, HelpCircle } from 'lucide-react';
import { BudgetCategory, Transaction } from '../types';

interface BudgetTableProps {
  categories: BudgetCategory[];
  transactions: Transaction[];
  totalIncome: number;
  onUpdateCategories: (categories: BudgetCategory[]) => void;
  onAddCategory: (categoryName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export default function BudgetTable({
  categories,
  transactions,
  totalIncome,
  onUpdateCategories,
  onAddCategory,
  onDeleteCategory,
}: BudgetTableProps) {
  const [newCatName, setNewCatName] = useState("");
  const [transfer, setTransfer] = useState({
    fromId: "",
    toId: "",
    amount: 0,
  });
  const [transferMessage, setTransferMessage] = useState("");

  // Calculate actual spending per category for the current month
  const getActualSpent = (categoryName: string) => {
    return transactions
      .filter(tx => tx.category.toLowerCase() === categoryName.toLowerCase() && !tx.isPending)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  // Calculate pending hold amount
  const getPendingHolds = (categoryName: string) => {
    return transactions
      .filter(tx => tx.category.toLowerCase() === categoryName.toLowerCase() && tx.isPending)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  // Calculate unallocated funds
  const totalBudgeted = categories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const unallocatedFunds = totalIncome - totalBudgeted;

  const handleBudgetedChange = (id: string, value: number) => {
    const updated = categories.map(cat => {
      if (cat.id === id) {
        return { ...cat, budgeted: isNaN(value) ? 0 : value };
      }
      return cat;
    });
    onUpdateCategories(updated);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    setNewCatName("");
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const { fromId, toId, amount } = transfer;
    if (!fromId || !toId || amount <= 0) return;
    if (fromId === toId) {
      setTransferMessage("Source and destination categories must differ.");
      return;
    }

    const fromCat = categories.find(c => c.id === fromId);
    if (!fromCat || fromCat.budgeted < amount) {
      setTransferMessage("Insufficient budgeted funds in source category.");
      return;
    }

    const updated = categories.map(cat => {
      if (cat.id === fromId) {
        return { ...cat, budgeted: cat.budgeted - amount };
      }
      if (cat.id === toId) {
        return { ...cat, budgeted: cat.budgeted + amount };
      }
      return cat;
    });

    onUpdateCategories(updated);
    setTransfer(prev => ({ ...prev, amount: 0 }));
    setTransferMessage(`Successfully transferred $${amount.toFixed(2)}!`);
    setTimeout(() => setTransferMessage(""), 4000);
  };

  return (
    <div className="bg-dark-surface border border-technical-border rounded p-6 text-slate-800">
      {/* Zero Based Budgeting Header & Unallocated Meter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-5 border-b border-technical-border">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            Zero-Based Budget allocations
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-green/10 text-accent-green border border-accent-green/20">
              USD ($) FIXED
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Assign every single dollar of your income until the unallocated meter reads $0.00.</p>
        </div>

        {/* Dynamic Meter Gauge */}
        <div className={`p-4 rounded border flex flex-col justify-center min-w-44 text-right transition-all duration-300 ${
          unallocatedFunds === 0 
            ? 'bg-accent-green/5 border-accent-green/20 text-accent-green' 
            : unallocatedFunds > 0 
              ? 'bg-accent-amber/5 border-accent-amber/20 text-accent-amber' 
              : 'bg-accent-crimson/5 border-accent-crimson/20 text-accent-crimson'
        }`}>
          <span className="text-[10px] font-mono uppercase tracking-widest block opacity-70">Unallocated Funds</span>
          <span className="font-mono text-xl font-bold">
            ${unallocatedFunds.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] mt-1 font-mono flex items-center gap-1 justify-end uppercase tracking-wider">
            {unallocatedFunds === 0 ? (
              <>
                <CheckCircle className="w-3 h-3 text-accent-green" /> Perfect Zero-Base!
              </>
            ) : unallocatedFunds > 0 ? (
              <>
                <AlertCircle className="w-3 h-3 text-accent-amber" /> Fund remaining to allocate
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-accent-crimson" /> Budget exceeds income!
              </>
            )}
          </span>
        </div>
      </div>

      {/* Grid List */}
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-12 gap-3 text-[10px] text-slate-500 font-mono uppercase tracking-widest pb-1 px-3 border-b border-technical-border/30">
          <div className="col-span-4 sm:col-span-5">Category Name</div>
          <div className="col-span-3 sm:col-span-3 text-right">Budgeted Limit ($)</div>
          <div className="col-span-2 text-right">Actual Spent</div>
          <div className="col-span-3 sm:col-span-2 text-right">Remaining</div>
        </div>

        {categories.map((cat) => {
          const actual = getActualSpent(cat.name);
          const pending = getPendingHolds(cat.name);
          const remaining = cat.budgeted - actual;
          
          return (
            <div key={cat.id} className="grid grid-cols-12 gap-3 items-center bg-slate-50 hover:bg-slate-100/50 p-3 rounded border border-technical-border/40 transition group">
              <div className="col-span-4 sm:col-span-5 flex items-center gap-2">
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-accent-crimson p-0.5 rounded transition shrink-0 cursor-pointer"
                  title="Remove Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div>
                  <span className="text-xs font-bold text-slate-850 block">{cat.name}</span>
                  {pending > 0 && (
                    <span className="text-[9px] text-accent-amber font-medium font-mono">
                      +${pending.toFixed(2)} hold pending
                    </span>
                  )}
                </div>
              </div>

              {/* Budgeted Input Field */}
              <div className="col-span-3 sm:col-span-3 text-right flex justify-end">
                <div className="relative max-w-28 w-full">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono font-medium">$</span>
                  <input
                    type="number"
                    value={cat.budgeted || 0}
                    onChange={(e) => handleBudgetedChange(cat.id, parseFloat(e.target.value) || 0)}
                    className="bg-white border border-technical-border text-xs font-mono font-bold text-slate-800 rounded py-1.5 pl-6 pr-2.5 text-right w-full focus:outline-none focus:border-accent-green"
                    min="0"
                  />
                </div>
              </div>

              {/* Actual spent */}
              <div className="col-span-2 text-right font-mono text-xs text-slate-500 font-medium">
                ${actual.toFixed(2)}
              </div>

              {/* Remaining */}
              <div className={`col-span-3 sm:col-span-2 text-right font-mono text-xs font-bold ${
                remaining < 0 
                  ? 'text-accent-crimson' 
                  : remaining === 0 
                    ? 'text-slate-400' 
                    : 'text-accent-green'
              }`}>
                ${remaining.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Forms & Tools Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4 border-t border-technical-border">
        
        {/* Create Custom Category */}
        <form onSubmit={handleCreateCategory} className="bg-slate-50 p-4 rounded border border-technical-border">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-accent-green" />
            Add Custom Category
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Travel, Kids, Gifts"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="bg-white border border-technical-border text-xs rounded p-2 flex-grow focus:outline-none focus:border-accent-green text-slate-800"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition cursor-pointer shrink-0"
            >
              Add
            </button>
          </div>
        </form>

        {/* Balance Transfer Tool */}
        <form onSubmit={handleTransfer} className="bg-slate-50 p-4 rounded border border-technical-border space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-accent-amber" />
            Balance Transfer offset tool
          </h4>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono tracking-wider mb-1">From</label>
              <select
                value={transfer.fromId}
                onChange={e => setTransfer({ ...transfer, fromId: e.target.value })}
                className="bg-white border border-technical-border text-[11px] text-slate-850 rounded p-1.5 w-full focus:outline-none focus:border-accent-green"
              >
                <option value="">Select</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono tracking-wider mb-1">To</label>
              <select
                value={transfer.toId}
                onChange={e => setTransfer({ ...transfer, toId: e.target.value })}
                className="bg-white border border-technical-border text-[11px] text-slate-850 rounded p-1.5 w-full focus:outline-none focus:border-accent-green"
              >
                <option value="">Select</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] text-slate-500 uppercase font-mono tracking-wider mb-1 font-mono">Amount ($)</label>
              <input
                type="number"
                placeholder="0"
                value={transfer.amount || ""}
                onChange={e => setTransfer({ ...transfer, amount: parseFloat(e.target.value) || 0 })}
                className="bg-white border border-technical-border text-[11px] text-slate-850 font-mono rounded p-1.5 w-full focus:outline-none focus:border-accent-green"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-technical-border/40 pt-2">
            <span className="text-[10px] text-accent-green font-mono font-bold uppercase tracking-wider">
              {transferMessage && transferMessage}
            </span>
            <button
              type="submit"
              className="bg-accent-amber/10 hover:bg-accent-amber border border-accent-amber/30 hover:border-accent-amber text-accent-amber hover:text-white px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest transition cursor-pointer"
            >
              Transfer
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
