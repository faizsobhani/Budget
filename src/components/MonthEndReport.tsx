import React, { useState } from 'react';
import { ShieldCheck, ArrowDownToLine, Receipt, FileText, CheckCircle2, AlertOctagon, HelpCircle, Landmark, CreditCard as CardIcon } from 'lucide-react';
import { BudgetCategory, Transaction, CreditCard, BankAccount } from '../types';

interface MonthEndReportProps {
  categories: BudgetCategory[];
  transactions: Transaction[];
  totalIncome: number;
  creditCards: CreditCard[];
  bankAccount: BankAccount;
}

export default function MonthEndReport({
  categories,
  transactions,
  totalIncome,
  creditCards,
  bankAccount,
}: MonthEndReportProps) {
  const [selectedReconcileId, setSelectedReconcileId] = useState<string>("bank-checking");
  const [startingBalance, setStartingBalance] = useState<number>(1000);
  const [rewardsRedeemed, setRewardsRedeemed] = useState<number>(0);

  // Helper calculations
  const getActualSpent = (categoryName: string) => {
    return transactions
      .filter(tx => tx.category.toLowerCase() === categoryName.toLowerCase() && !tx.isPending)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const totalSpent = categories.reduce((sum, cat) => sum + getActualSpent(cat.name), 0);
  const netSaved = totalIncome - totalSpent;

  // Payments made to credit cards during the current statement
  const totalPaymentsMade = transactions
    .filter(tx => tx.category === "Payment Made" || tx.merchant.toLowerCase().includes("payment"))
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Ending Balance Reconciliation Logic
  const getReconciledEndingBalance = () => {
    if (selectedReconcileId === "bank-checking") {
      // Checking: Starting Balance + Income - Spent - Payments + Rewards
      return startingBalance + totalIncome - totalSpent - totalPaymentsMade + rewardsRedeemed;
    } else {
      // Credit card: Starting Balance - Payments Made - Rewards Redeemed
      // We also add card expenses to get the current statement balance
      const card = creditCards.find(c => c.id === selectedReconcileId);
      const cardCharges = transactions
        .filter(tx => tx.linkedCardId === selectedReconcileId && !tx.isPending)
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const base = card ? card.currentBalance : startingBalance;
      return base - totalPaymentsMade - rewardsRedeemed + cardCharges;
    }
  };

  return (
    <div className="bg-dark-surface border border-technical-border rounded p-6 text-slate-800">
      {/* Dark Minimalist Header */}
      <div className="flex items-center justify-between border-b border-technical-border/50 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-accent-green/10 p-2.5 rounded border border-accent-green/25 text-accent-green">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase font-sans">Final Month-End Budget Report</h2>
            <p className="text-xs text-slate-500">Minimalist premium overview for close-out reconciliation</p>
          </div>
        </div>
        <span className="text-[9px] font-mono border border-technical-border bg-slate-50 px-3 py-1 rounded text-slate-500 font-bold uppercase tracking-widest">
          Secured Ledger
        </span>
      </div>

      {/* Columns List Grid */}
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-12 gap-2 text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest border-b border-technical-border/40 pb-2 px-2">
          <div className="col-span-4 sm:col-span-5">Category</div>
          <div className="col-span-2 text-right">Budget</div>
          <div className="col-span-2 text-right">Spent</div>
          <div className="col-span-4 sm:col-span-3 text-right">Notes & Status</div>
        </div>

        <div className="divide-y divide-technical-border/30">
          {categories.map(cat => {
            const spent = getActualSpent(cat.name);
            const budgeted = cat.budgeted;
            const diff = budgeted - spent;

            let noteText = "";
            let noteStyle = "";
            let badge = null;

            if (spent === budgeted && budgeted > 0) {
              noteText = "Perfect Match";
              noteStyle = "text-accent-green font-medium";
              badge = (
                <span className="text-[10px] font-mono uppercase tracking-wider bg-accent-green/10 text-accent-green px-2 py-0.5 rounded border border-accent-green/25 inline-flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Matched
                </span>
              );
            } else if (spent > budgeted) {
              noteText = `Over by $${Math.abs(diff).toFixed(2)}`;
              noteStyle = "text-accent-crimson font-bold";
              badge = (
                <span className="text-[10px] font-mono uppercase tracking-wider bg-accent-crimson/10 text-accent-crimson px-2 py-0.5 rounded border border-accent-crimson/25 inline-flex items-center gap-1 shrink-0">
                  <AlertOctagon className="w-3 h-3" />
                  Over
                </span>
              );
            } else {
              noteText = `Saved $${diff.toFixed(2)}`;
              noteStyle = "text-slate-400";
              badge = (
                <span className="text-[10px] font-mono uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-technical-border inline-flex items-center shrink-0">
                  Under cap
                </span>
              );
            }

            return (
              <div key={cat.id} className="grid grid-cols-12 gap-2 py-3 items-center px-2 hover:bg-slate-50">
                <div className="col-span-4 sm:col-span-5 text-xs font-bold text-slate-800 uppercase">{cat.name}</div>
                <div className="col-span-2 text-right font-mono text-xs text-slate-500">${budgeted.toFixed(2)}</div>
                <div className="col-span-2 text-right font-mono text-xs text-slate-700 font-medium">${spent.toFixed(2)}</div>
                <div className="col-span-4 sm:col-span-3 text-right flex items-center justify-end gap-2 text-xs">
                  <span className={`hidden sm:inline text-[11px] font-mono uppercase ${noteStyle}`}>{noteText}</span>
                  {badge}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calculations section */}
      <div className="bg-slate-50 border border-technical-border rounded p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-technical-border">
        <div className="pt-3 sm:pt-0 first:pt-0">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono block mb-1.5">Total Income</span>
          <span className="font-mono text-base font-bold text-slate-800">${totalIncome.toFixed(2)}</span>
        </div>
        <div className="pt-3 sm:pt-0">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono block mb-1.5">Total Spent</span>
          <span className="font-mono text-base font-bold text-accent-crimson">-${totalSpent.toFixed(2)}</span>
        </div>
        <div className="pt-3 sm:pt-0">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono block mb-1.5">Net Saved</span>
          <span className="font-mono text-lg font-bold text-accent-green">${netSaved.toFixed(2)}</span>
        </div>
      </div>

      {/* Account Balance Reconciliation Block */}
      <div className="bg-slate-50 border border-technical-border rounded p-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-technical-border/40">
          <ShieldCheck className="w-4 h-4 text-accent-green" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Account Balance Reconciliation</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-xs font-mono">
          <div>
            <label className="block text-[9px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Choose Account</label>
            <select
              value={selectedReconcileId}
              onChange={e => {
                setSelectedReconcileId(e.target.value);
                if (e.target.value === "bank-checking") {
                  setStartingBalance(bankAccount.balance);
                } else {
                  const card = creditCards.find(c => c.id === e.target.value);
                  setStartingBalance(card ? card.currentBalance : 0);
                }
              }}
              className="bg-white border border-technical-border text-xs text-slate-800 rounded p-2 w-full focus:outline-none focus:border-accent-green"
            >
              <option value="bank-checking">{bankAccount.name} (Checking)</option>
              {creditCards.map(c => (
                <option key={c.id} value={c.id}>{c.name} (Card)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Starting Balance ($)</label>
            <input
              type="number"
              value={startingBalance || ""}
              onChange={e => setStartingBalance(parseFloat(e.target.value) || 0)}
              className="bg-white border border-technical-border text-xs text-slate-800 font-mono rounded p-2 w-full focus:outline-none focus:border-accent-green"
            />
          </div>

          <div>
            <label className="block text-[9px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Rewards Redeemed ($)</label>
            <input
              type="number"
              placeholder="0.00"
              value={rewardsRedeemed || ""}
              onChange={e => setRewardsRedeemed(parseFloat(e.target.value) || 0)}
              className="bg-white border border-technical-border text-xs text-slate-800 font-mono rounded p-2 w-full focus:outline-none focus:border-accent-green"
            />
          </div>
        </div>

        {/* Ending reconciliation totals */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded border border-technical-border">
          <div className="text-xs text-slate-500 font-mono space-y-1.5 uppercase tracking-wide">
            <div className="flex justify-between gap-8">
              <span>Account payments logged:</span>
              <span className="font-mono text-accent-crimson font-bold">-${totalPaymentsMade.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span>Rewards offsets applied:</span>
              <span className="font-mono text-accent-green font-bold">+${rewardsRedeemed.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-right border-t sm:border-t-0 sm:border-l border-technical-border/50 pt-3 sm:pt-0 sm:pl-6 shrink-0 font-mono">
            <span className="text-[9px] text-slate-500 uppercase block font-bold tracking-wider">Calculated Ending Balance</span>
            <span className="font-mono text-base font-bold text-slate-900 block mt-1">
              ${getReconciledEndingBalance().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
