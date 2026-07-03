import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { BudgetCategory, Transaction } from '../types';

interface InsightsProps {
  categories: BudgetCategory[];
  transactions: Transaction[];
}

const COLORS = [
  '#3CE0A8', // accent green
  '#F0A03C', // accent amber
  '#E03C5C', // accent crimson
  '#0F172A', // slate 900
  '#94A3B8', // slate
  '#10B981', // emerald
  '#F59E0B', // amber-orange
  '#8B5CF6', // violet
];

export default function Insights({ categories, transactions }: InsightsProps) {
  // 1. Calculate actual spending per category
  const getActualSpent = (categoryName: string) => {
    return transactions
      .filter(tx => tx.category.toLowerCase() === categoryName.toLowerCase() && !tx.isPending)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  // 2. Prepare data for dual-bar chart (Budget vs Actual)
  const barData = categories.map(cat => ({
    name: cat.name,
    Budget: cat.budgeted,
    Actual: getActualSpent(cat.name),
  }));

  // 3. Prepare data for pie/donut chart (Actual spending breakdown)
  const pieData = categories
    .map(cat => {
      const spent = getActualSpent(cat.name);
      return {
        name: cat.name,
        value: Number(spent.toFixed(2)),
      };
    })
    .filter(item => item.value > 0);

  // 4. Calculate total actual spending
  const totalActual = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-dark-surface border border-technical-border rounded p-6 text-slate-800">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-technical-border/50">
        <div className="bg-accent-green/10 p-2.5 rounded border border-accent-green/25 text-accent-green">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase font-sans">Visual spending insights</h2>
          <p className="text-xs text-slate-500">Real-time comparison metrics and budget compliance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Dual Bar Chart (Budget vs Actual) */}
        <div className="bg-slate-50 p-5 rounded border border-technical-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-accent-green" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Limits vs Actual comparison</h4>
          </div>

          <div className="h-[280px] w-full text-xs font-mono">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                No active categories logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                   data={barData}
                   margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94A3B8" 
                    tick={{ fill: '#64748B', fontSize: 9 }}
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    tick={{ fill: '#64748B', fontSize: 9 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '4px' }}
                    labelStyle={{ color: '#0F172A', fontWeight: 'bold', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#10B981', fontFamily: 'monospace' }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`]}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                  <Bar dataKey="Budget" fill="#E2E8F0" stroke="#CBD5E1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Actual" fill="#3CE0A8" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Donut Chart (Spend Breakdown) */}
        <div className="bg-slate-50 p-5 rounded border border-technical-border">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-accent-green" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Category spending split</h4>
          </div>

          <div className="h-[280px] w-full text-xs flex flex-col sm:flex-row items-center gap-4">
            {pieData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400 italic font-mono">
                No actual spending transactions logged yet.
              </div>
            ) : (
              <>
                <div className="h-full w-full sm:w-1/2 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '4px' }}
                        itemStyle={{ color: '#0F172A', fontFamily: 'monospace' }}
                        formatter={(value) => [`$${Number(value).toFixed(2)}`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered overall balance info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest font-mono">Total spent</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">${totalActual.toFixed(2)}</span>
                  </div>
                </div>

                {/* Custom list layout */}
                <div className="w-full sm:w-1/2 space-y-2 max-h-56 overflow-y-auto text-[11px] pr-1 font-mono">
                  {pieData.map((item, index) => {
                    const percentage = totalActual > 0 ? (item.value / totalActual) * 100 : 0;
                    return (
                      <div key={item.name} className="flex items-center justify-between border-b border-technical-border/60 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 shrink-0" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                          />
                          <span className="text-slate-700 font-medium truncate max-w-28 uppercase">{item.name}</span>
                        </div>
                        <span className="text-slate-500 font-bold">
                          ${item.value.toFixed(2)} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
