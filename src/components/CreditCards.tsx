import React, { useState } from 'react';
import { CreditCard as CardIcon, Calendar, ArrowRightLeft, AlertTriangle, Plus, Landmark, Trash2, CheckSquare } from 'lucide-react';
import { CreditCard, BankAccount } from '../types';

interface CreditCardsProps {
  creditCards: CreditCard[];
  bankAccount: BankAccount;
  onUpdateCreditCards: (cards: CreditCard[]) => void;
  onUpdateBankAccount: (account: BankAccount) => void;
  onLogPaymentTransaction: (cardName: string, amount: number) => void;
}

export default function CreditCards({
  creditCards,
  bankAccount,
  onUpdateCreditCards,
  onUpdateBankAccount,
  onLogPaymentTransaction,
}: CreditCardsProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    name: '',
    currentBalance: 0,
    creditLimit: 5000,
    dueDate: '',
    statementClosingDate: '',
  });

  // Log card payment state
  const [payingCardId, setPayingCardId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Helper to determine urgency colors
  const getDueDateUrgency = (dateStr: string) => {
    if (!dateStr) return { label: 'No Due Date', bg: 'bg-slate-800 text-slate-400', level: 'none' };
    
    const today = new Date("2026-07-03"); // hardcoded simulation anchor based on current system time metadata
    const due = new Date(dateStr);
    
    // Calculate difference in days
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'PAST DUE', bg: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse', level: 'crimson' };
    } else if (diffDays === 0) {
      return { label: 'DUE TODAY', bg: 'bg-red-600/25 text-red-200 border border-red-500 animate-pulse', level: 'crimson' };
    } else if (diffDays <= 7) {
      return { label: `Due in ${diffDays}d`, bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', level: 'amber' };
    } else {
      return { label: `Due in ${diffDays}d`, bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', level: 'green' };
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.name || !newCard.dueDate || !newCard.statementClosingDate) return;

    const createdCard: CreditCard = {
      id: `card-${Date.now()}`,
      name: newCard.name,
      currentBalance: Number(newCard.currentBalance),
      creditLimit: Number(newCard.creditLimit),
      dueDate: newCard.dueDate,
      statementClosingDate: newCard.statementClosingDate,
    };

    onUpdateCreditCards([...creditCards, createdCard]);
    setNewCard({
      name: '',
      currentBalance: 0,
      creditLimit: 5000,
      dueDate: '',
      statementClosingDate: '',
    });
    setShowAddCard(false);
  };

  const handleDeleteCard = (cardId: string) => {
    onUpdateCreditCards(creditCards.filter(c => c.id !== cardId));
  };

  const handlePaymentSubmit = (cardId: string) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return;

    if (paymentAmount <= 0) {
      alert("Please enter a valid positive payment amount.");
      return;
    }

    if (paymentAmount > bankAccount.balance) {
      alert(`Insufficient funds in checking account (${bankAccount.name}). Your balance is $${bankAccount.balance.toFixed(2)}.`);
      return;
    }

    // Process payment
    const updatedBankAccount = {
      ...bankAccount,
      balance: bankAccount.balance - paymentAmount
    };

    const updatedCards = creditCards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          currentBalance: Math.max(0, c.currentBalance - paymentAmount)
        };
      }
      return c;
    });

    onUpdateBankAccount(updatedBankAccount);
    onUpdateCreditCards(updatedCards);
    onLogPaymentTransaction(card.name, paymentAmount);

    setPayingCardId(null);
    setPaymentAmount(0);
  };

  return (
    <div className="bg-dark-surface border border-technical-border rounded p-6 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-accent-green/10 p-2.5 rounded border border-accent-green/25 text-accent-green">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase font-sans">Credit Cards & Liquid Accounts</h2>
            <p className="text-xs text-slate-500">Track liabilities, statement closures, and liquid offsets</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddCard(!showAddCard)}
          className="bg-slate-50 hover:bg-slate-100 text-slate-850 px-3 py-1.5 rounded border border-technical-border text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-accent-green" />
          Add Card
        </button>
      </div>

      {/* Checking account card */}
      <div className="bg-slate-50 border border-technical-border rounded p-4 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent-green/20 text-accent-green p-2 rounded">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Liquid Asset Account</div>
            <h4 className="text-sm font-bold text-slate-800">{bankAccount.name}</h4>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Available Funds</div>
          <span className="font-mono text-base font-bold text-accent-green">${bankAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Credit cards list */}
      <div className="space-y-4">
        {creditCards.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-technical-border rounded bg-slate-50">
            <CardIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-mono">No active credit card liability tracked.</p>
          </div>
        ) : (
          creditCards.map(card => {
            const urgency = getDueDateUrgency(card.dueDate);
            const utilization = Math.min(100, (card.currentBalance / card.creditLimit) * 100);
            
            return (
              <div key={card.id} className="bg-slate-50 border border-technical-border rounded p-4 relative overflow-hidden transition hover:bg-slate-50/85">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-accent-crimson/10 text-accent-crimson p-1.5 rounded border border-accent-crimson/20">
                      <CardIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        {card.name}
                        <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${urgency.bg}`}>
                          {urgency.label}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">Closing Date: {card.statementClosingDate}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Current Balance</span>
                    <span className="font-mono text-sm font-bold text-accent-crimson">${card.currentBalance.toFixed(2)}</span>
                    <span className="text-[9px] text-slate-400 font-mono block">/ ${card.creditLimit.toLocaleString()} limit</span>
                  </div>
                </div>

                {/* Utilization gauge */}
                <div className="mb-4 font-mono">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span className="uppercase tracking-wider">Limit Utilization</span>
                    <span className={utilization > 75 ? "text-accent-crimson" : utilization > 40 ? "text-accent-amber" : "text-accent-green"}>
                      {utilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${utilization > 75 ? "bg-accent-crimson" : utilization > 40 ? "bg-accent-amber" : "bg-accent-green"}`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                </div>

                {/* Inline Pay Card Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-technical-border/40">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Due: <span className="text-slate-800 font-mono font-medium">{card.dueDate}</span>
                  </div>

                  {payingCardId === card.id ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 bg-white p-1.5 rounded border border-technical-border">
                      <span className="text-xs text-slate-400 px-1 font-mono">$</span>
                      <input 
                        type="number"
                        placeholder="Amount"
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                        className="bg-transparent border-none text-xs text-accent-green font-mono w-24 focus:outline-none focus:ring-0"
                        min="1"
                        max={bankAccount.balance}
                      />
                      <button 
                        onClick={() => handlePaymentSubmit(card.id)}
                        className="text-[10px] font-mono uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 rounded transition cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => { setPayingCardId(null); setPaymentAmount(0); }}
                        className="text-[10px] font-mono uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold px-2.5 py-1 rounded border border-technical-border transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPayingCardId(card.id);
                          setPaymentAmount(card.currentBalance);
                        }}
                        className="text-[10px] bg-accent-green/10 hover:bg-accent-green border border-accent-green/30 hover:border-accent-green text-accent-green hover:text-white px-2.5 py-1 rounded font-mono font-bold uppercase tracking-widest flex items-center gap-1 transition cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        Log Payment
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-slate-400 hover:text-accent-crimson p-1 rounded transition cursor-pointer"
                        title="Delete credit card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Card Form Modal / Form overlay */}
      {showAddCard && (
        <form onSubmit={handleAddCard} className="bg-slate-50 rounded p-4 border border-technical-border mt-5 space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Add Credit Card Details</div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2">
              <label className="block text-[9px] text-slate-500 mb-1 font-mono uppercase tracking-wider">Card Name</label>
              <input 
                type="text" 
                placeholder="e.g. Discover Card"
                value={newCard.name}
                onChange={e => setNewCard({...newCard, name: e.target.value})}
                className="bg-white border border-technical-border text-xs text-slate-800 rounded p-2 w-full focus:outline-none focus:border-accent-green"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-500 mb-1 font-mono uppercase tracking-wider">Current Balance ($)</label>
              <input 
                type="number" 
                placeholder="0"
                value={newCard.currentBalance || ''}
                onChange={e => setNewCard({...newCard, currentBalance: parseFloat(e.target.value) || 0})}
                className="bg-white border border-technical-border text-xs text-slate-800 rounded p-2 w-full focus:outline-none focus:border-accent-green font-mono"
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-500 mb-1 font-mono uppercase tracking-wider">Credit Limit ($)</label>
              <input 
                type="number" 
                placeholder="5000"
                value={newCard.creditLimit || ''}
                onChange={e => setNewCard({...newCard, creditLimit: parseFloat(e.target.value) || 0})}
                className="bg-white border border-technical-border text-xs text-slate-800 rounded p-2 w-full focus:outline-none focus:border-accent-green font-mono"
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-500 mb-1 font-mono uppercase tracking-wider">Next Due Date</label>
              <input 
                type="date" 
                value={newCard.dueDate}
                onChange={e => setNewCard({...newCard, dueDate: e.target.value})}
                className="bg-white border border-technical-border text-xs text-slate-800 rounded p-2 w-full focus:outline-none focus:border-accent-green font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-500 mb-1 font-mono uppercase tracking-wider">Statement Closing Date</label>
              <input 
                type="date" 
                value={newCard.statementClosingDate}
                onChange={e => setNewCard({...newCard, statementClosingDate: e.target.value})}
                className="bg-white border border-technical-border text-xs text-slate-800 rounded p-2 w-full focus:outline-none focus:border-accent-green font-mono"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-technical-border/40">
            <button 
              type="button" 
              onClick={() => setShowAddCard(false)}
              className="text-xs bg-white hover:bg-slate-50 text-slate-500 px-3 py-1.5 rounded border border-technical-border transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded transition cursor-pointer"
            >
              Save Liability
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
