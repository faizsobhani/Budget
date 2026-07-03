import React, { useState } from "react";
import { Sparkles, Brain, ArrowRight, HelpCircle, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Transaction, BudgetCategory } from "../types";

interface GeminiThinkerProps {
  categories: BudgetCategory[];
  transactions: Transaction[];
  incomeSources: { id: string; name: string; amount: number }[];
}

const PRESET_PROMPTS = [
  {
    title: "Zero-Based Audit",
    icon: CheckCircle,
    desc: "Verify if every dollar has a job and audit budget alignment.",
    prompt: "Run a full audit of my category allocations against my total income. Does every single dollar of my income have a job? If there is surplus, where should I allocate it based on zero-based budgeting principles?",
  },
  {
    title: "Spending Leaks",
    icon: AlertTriangle,
    desc: "Spot spending anomalies, subscription overlaps, and category drains.",
    prompt: "Scan my active ledger transactions and find potential spending leaks, repetitive merchant charges, and categories where actual spending is out of control compared to the budget limits.",
  },
  {
    title: "Cash Flow Prediction",
    icon: Brain,
    desc: "Forecast end-of-month liquidity based on historical run-rates.",
    prompt: "Project my end-of-month cash flow and checking account balance, comparing my total income pool against actual and pending spending speed.",
  },
];

// Helper to render simple markdown text into clean HTML elements
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");
  return (
    <div className="space-y-3.5 font-sans text-xs leading-relaxed text-slate-700">
      {lines.map((line, i) => {
        // Headers
        if (line.startsWith("### ")) {
          return (
            <h4 key={i} className="text-xs font-bold text-accent-green uppercase font-mono tracking-wider pt-3 pb-1 border-b border-technical-border/30">
              {line.substring(4)}
            </h4>
          );
        }
        if (line.startsWith("## ") || line.startsWith("# ")) {
          const headerText = line.startsWith("## ") ? line.substring(3) : line.substring(2);
          return (
            <h3 key={i} className="text-sm font-bold text-slate-900 uppercase tracking-wider pt-4 pb-1.5 border-b border-technical-border/50">
              {headerText}
            </h3>
          );
        }

        // Bullet list items
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          const content = line.trim().substring(2);
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="text-accent-green font-mono shrink-0 select-none">•</span>
              <span>{parseBoldText(content)}</span>
            </div>
          );
        }

        // Numbered list items
        const numMatch = line.trim().match(/^(\d+)\.\s(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const content = numMatch[2];
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="text-accent-green font-mono font-bold shrink-0 select-none">{num}.</span>
              <span>{parseBoldText(content)}</span>
            </div>
          );
        }

        // Horizontal line
        if (line.trim() === "---") {
          return <hr key={i} className="border-technical-border/40 my-4" />;
        }

        // Standard Paragraphs
        if (line.trim() === "") {
          return null;
        }

        return <p key={i} className="pl-1">{parseBoldText(line)}</p>;
      })}
    </div>
  );
}

// Simple bold formatter helper: replaces **text** with <strong>text</strong>
function parseBoldText(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="text-slate-900 font-semibold font-mono bg-slate-100 px-1 rounded">{part}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function GeminiThinker({ categories, transactions, incomeSources }: GeminiThinkerProps) {
  const [customQuestion, setCustomQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleThink = async (promptText: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/gemini/think", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categories,
          transactions,
          incomeSources,
          customQuestion: promptText,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate statistics.");
      }

      setResult(data.result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while connecting to the budgeting advisor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isLoading) return;
    handleThink(customQuestion);
  };

  return (
    <div id="gemini-thinker-root" className="bg-dark-surface border border-technical-border rounded p-6 text-slate-800 space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-technical-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent-green/10 p-2.5 rounded border border-accent-green/25 text-accent-green">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase font-sans flex items-center gap-2">
              Gemini Financial Intelligence
            </h2>
            <p className="text-xs text-slate-500">Real-time smart statistics & zero-based alignment thinking</p>
          </div>
        </div>
        <span className="text-[9px] font-mono border border-technical-border bg-slate-50 px-2.5 py-1 rounded text-accent-green font-bold uppercase tracking-widest">
          Active AI Core
        </span>
      </div>

      {/* Preset Cards Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRESET_PROMPTS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleThink(item.prompt)}
              disabled={isLoading}
              className="group text-left bg-slate-50 hover:bg-slate-100/80 border border-technical-border/70 hover:border-accent-green/45 p-4 rounded transition-all duration-200 cursor-pointer disabled:opacity-50 flex flex-col justify-between h-full space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-accent-green font-mono text-[10px] uppercase tracking-wider font-bold">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug group-hover:text-slate-700 transition-colors">
                  {item.desc}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold group-hover:text-accent-green transition-colors pt-2 border-t border-technical-border/20 w-full justify-between">
                <span>Run Advisor</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom query form */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="Ask Gemini anything (e.g., 'Do I have enough left to buy a $200 bike?')"
          className="flex-grow bg-white border border-technical-border text-xs rounded px-4 py-2.5 focus:outline-none focus:border-accent-green placeholder-slate-400 text-slate-800 font-mono"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-slate-900 hover:bg-slate-850 text-white text-[11px] font-mono font-bold px-5 py-2.5 rounded uppercase tracking-widest transition cursor-pointer shrink-0 disabled:opacity-50"
          disabled={isLoading || !customQuestion.trim()}
        >
          {isLoading ? "Analyzing..." : "Ask Core"}
        </button>
      </form>

      {/* Processing State */}
      {isLoading && (
        <div className="bg-slate-50 border border-technical-border rounded p-8 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-technical-border rounded-full animate-ping"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-5 h-5 text-accent-green animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 font-mono">
            <p className="text-xs text-slate-700 uppercase tracking-wider animate-pulse">Consulting Gemini Expert Core</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Compiling active ledger rows & zero-base maps...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-accent-crimson/10 border border-accent-crimson/20 rounded p-4 text-xs font-mono text-accent-crimson space-y-2 flex gap-3 items-start">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider">Analysis Failed</p>
            <p className="text-slate-600 leading-relaxed mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Report Result Section */}
      {result && (
        <div className="bg-slate-50 border border-technical-border rounded p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-technical-border/30 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent-green" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">Smart Analysis Report</h3>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-[10px] font-mono text-slate-400 hover:text-slate-600 uppercase tracking-widest border border-technical-border bg-white px-2 py-0.5 rounded"
            >
              Clear
            </button>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {renderMarkdown(result)}
          </div>
        </div>
      )}
    </div>
  );
}
