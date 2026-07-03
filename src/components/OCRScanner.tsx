import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, HelpCircle, RefreshCw, CheckCircle, AlertTriangle, Play, Sparkles } from 'lucide-react';
import { Transaction, SuggestedMapping, BudgetCategory } from '../types';
import { smartCategorize } from '../utils/parser';

interface OCRScannerProps {
  onAddTransactions: (txs: Transaction[]) => void;
  onAddCategories: (categories: { name: string; id: string }[]) => void;
  existingCategories: BudgetCategory[];
  learnedMappings: Record<string, string>;
  activeMonth: string; // "YYYY-MM"
}

// Sample raw text templates to simulate actual OCR extractions
const DEMO_STATEMENTS = [
  {
    name: "Standard Checking Statement",
    text: `
Statement Period: Jun 28, 2026 - Jul 05, 2026
Page 1 of 1

TRANSACTION DETAILS
Date         Description                           Amount     Balance
Jul 01, 2026 STARBUCKS COFFEE #4512                $4.25      $1,245.20
Jul 01, 2026 PLANET FITNESS MONTHLY FEE            $24.99     $1,220.21
Jul 02, 2026 CHEVRON GAS STATION PRE-AUTH          $1.00      $1,219.21
Jul 02, 2026 AMAZON PRIME MEMBERSHIP               $14.99     $1,204.22
Jul 03, 2026 NETFLIX SUBSCRIBER RECURRING          $15.49     $1,188.73
Jul 03, 2026 TJMAX SHOPPING STORE                  $52.00     $1,136.73
Jul 04, 2026 CHEVRON GAS STATION SETTLED           $34.50     $1,102.23
Jul 04, 2026 WALMART GROCERY SUPERCENTER           $112.40    $989.83
Jul 04, 2026 PENDING TRANSFER - SAVINGS            $200.00    $789.83
`
  },
  {
    name: "Subscription & Gym Statement",
    text: `
ACCOUNT NUMBER: *******9812
TRANSACTIONS LISTING:
07/02/2026 SPOTIFY PREMIUM MUSIC                   $10.99
07/02/2026 GOLD'S GYM ACTIVE MEMB                  $45.00
07/03/2026 LIBERTY MUTUAL INS AUTO                 $120.00
07/03/2026 PRE-AUTH HOLD NY DINER                  $25.00
07/04/2026 STARBUCKS COFFEE                        $6.80
`
  }
];

export default function OCRScanner({
  onAddTransactions,
  onAddCategories,
  existingCategories,
  learnedMappings,
  activeMonth,
}: OCRScannerProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [parsedTransactions, setParsedTransactions] = useState<Transaction[]>([]);
  
  // Suggestion Engine State
  const [showSuggestionMode, setShowSuggestionMode] = useState(false);
  const [unmappedMerchants, setUnmappedMerchants] = useState<{ merchant: string; count: number; rawText: string; amount: number }[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, { categoryName: string; selected: boolean }>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const processImage = (file: File) => {
    setLoading(true);
    setProgress(0);
    setProgressText("Reading file...");
    
    Tesseract.recognize(
      file,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setProgressText(`Recognizing transaction text... ${Math.round(m.progress * 100)}%`);
          } else {
            setProgressText(m.status);
          }
        }
      }
    ).then(({ data: { text } }) => {
      setExtractedText(text);
      parseStatementText(text);
    }).catch((err) => {
      console.error(err);
      setProgressText("Error parsing image. Try simulated statement mode.");
      setLoading(false);
    });
  };

  const handleSimulate = (index: number) => {
    setLoading(true);
    setProgress(30);
    setProgressText("Initializing simulated scanner...");
    setTimeout(() => {
      setProgress(75);
      setProgressText("Extracting fonts and layouts...");
      setTimeout(() => {
        setProgress(100);
        setLoading(false);
        const demo = DEMO_STATEMENTS[index];
        setExtractedText(demo.text);
        parseStatementText(demo.text);
      }, 500);
    }, 400);
  };

  const parseStatementText = (text: string) => {
    const lines = text.split('\n');
    const tempTxs: Transaction[] = [];

    // Date regexes matching typical formats: Jul 01, 2026, 07/01/2026
    const dateRegexes = [
      /\b([a-zA-Z]{3})\s+(\d{1,2}),?\s+(\d{4})\b/, // Jul 01, 2026
      /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/,     // 07/01/2026
    ];

    // Amount regex
    const amountRegex = /(?:\$)?(\d+\.\d{2})\b/;

    // Let's filter out running balances by detecting "Balance" column or typical smaller patterns
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Attempt to find Date
      let parsedDate = "";
      let matchedDateStr = "";
      
      // Match Jul 01, 2026 format
      const m1 = line.match(dateRegexes[0]);
      if (m1) {
        matchedDateStr = m1[0];
        const monthStr = m1[1];
        const dayStr = m1[2].padStart(2, '0');
        const yearStr = m1[3];
        const monthsMap: Record<string, string> = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
        };
        const monthNum = monthsMap[monthStr.substring(0, 3)] || "07";
        parsedDate = `${yearStr}-${monthNum}-${dayStr}`;
      } else {
        // Match 07/01/2026 format
        const m2 = line.match(dateRegexes[1]);
        if (m2) {
          matchedDateStr = m2[0];
          const m = m2[1].padStart(2, '0');
          const d = m2[2].padStart(2, '0');
          let y = m2[3];
          if (y.length === 2) y = "20" + y;
          parsedDate = `${y}-${m}-${d}`;
        }
      }

      if (!parsedDate) continue; // No date found, skip statement meta rows

      // Extract amounts
      // Often there are two amounts in checking statements: Transaction amount, then Balance.
      // The transaction amount is usually before the balance.
      // Let's find all amounts in the line.
      const cleanedLine = line.replace(matchedDateStr, "");
      const amountMatches = cleanedLine.match(/\b\d+\.\d{2}\b/g) || [];
      
      if (amountMatches.length === 0) continue;

      // First amount is typically the transaction amount
      const rawAmountStr = amountMatches[0];
      const amount = parseFloat(rawAmountStr);

      // Remaining text represents the merchant name
      let merchant = cleanedLine
        .replace(rawAmountStr, "")
        // if there's a second amount (balance), replace that as well
        .replace(amountMatches[1] || "", "")
        .replace(/\$|\bBalance\b/gi, "")
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!merchant) merchant = "Merchant Memo Unknown";

      // Detect pre-auth, pending, or gas station holds
      const lowercaseMerchant = merchant.toLowerCase();
      const isPending = 
        lowercaseMerchant.includes("pending") || 
        lowercaseMerchant.includes("pre-auth") || 
        lowercaseMerchant.includes("hold") ||
        (amount === 1.00 && (lowercaseMerchant.includes("gas") || lowercaseMerchant.includes("chevron") || lowercaseMerchant.includes("shell") || lowercaseMerchant.includes("exxon")));

      // Smart categorize
      const category = smartCategorize(merchant, learnedMappings);

      tempTxs.push({
        id: `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date: parsedDate,
        merchant,
        amount,
        category,
        isPending,
        notes: isPending ? "Temporary Hold" : ""
      });
    }

    setParsedTransactions(tempTxs);
    setLoading(false);

    // Run Frequency Analysis on unrecognized merchants to trigger Discovery & Suggestion Mode
    analyzeUnmappedMerchants(tempTxs);
  };

  const analyzeUnmappedMerchants = (txs: Transaction[]) => {
    // Unmapped means its smart categorization is "Uncategorized" or is not in existingCategories
    const currentCategoryNames = new Set(existingCategories.map(c => c.name.toLowerCase()));
    
    const unmapped: Record<string, { count: number; rawText: string; totalAmount: number }> = {};
    
    txs.forEach(tx => {
      const isUncategorized = tx.category === "Uncategorized" || !currentCategoryNames.has(tx.category.toLowerCase());
      if (isUncategorized) {
        // Clean merchant name to get root phrase (e.g. STARBUCKS COFFEE -> STARBUCKS)
        const root = tx.merchant.split(' ')[0].toUpperCase();
        if (root.length > 2) {
          if (!unmapped[root]) {
            unmapped[root] = { count: 0, rawText: tx.merchant, totalAmount: 0 };
          }
          unmapped[root].count += 1;
          unmapped[root].totalAmount += tx.amount;
        }
      }
    });

    const suggestionsList = Object.entries(unmapped).map(([root, val]) => ({
      merchant: root,
      count: val.count,
      rawText: val.rawText,
      amount: val.totalAmount,
    })).filter(s => s.count >= 1); // Suggest mappings for unrecognized merchants

    setUnmappedMerchants(suggestionsList);
    
    // Auto-generate default suggestions categories based on key terms
    const initialSelections: Record<string, { categoryName: string; selected: boolean }> = {};
    suggestionsList.forEach(s => {
      const mLower = s.merchant.toLowerCase();
      let cat = "Miscellaneous";
      if (mLower.includes("gym") || mLower.includes("fit")) cat = "Gym & Fitness";
      else if (mLower.includes("prime") || mLower.includes("amazon") || mLower.includes("tjmax")) cat = "Shopping";
      else if (mLower.includes("starbucks") || mLower.includes("diner")) cat = "Food & Dining";
      else if (mLower.includes("netflix") || mLower.includes("spotify")) cat = "Subscriptions";
      else if (mLower.includes("gas") || mLower.includes("chevron")) cat = "Gas & Transportation";
      
      initialSelections[s.merchant] = {
        categoryName: cat,
        selected: true
      };
    });
    setSelectedSuggestions(initialSelections);

    if (suggestionsList.length > 0) {
      setShowSuggestionMode(true);
    } else {
      setShowSuggestionMode(false);
    }
  };

  const handleAcceptSuggestions = () => {
    // 1. Create suggested categories that do not exist yet
    const categoriesToCreate: { name: string; id: string }[] = [];
    const addedNames = new Set<string>();

    Object.entries(selectedSuggestions).forEach(([merchant, val]) => {
      const data = val as { categoryName: string; selected: boolean };
      if (data.selected) {
        const alreadyExistsInApp = existingCategories.some(c => c.name.toLowerCase() === data.categoryName.toLowerCase());
        if (!alreadyExistsInApp && !addedNames.has(data.categoryName.toLowerCase())) {
          categoriesToCreate.push({
            name: data.categoryName,
            id: `cat-${data.categoryName.toLowerCase().replace(/\s+/g, '-')}`
          });
          addedNames.add(data.categoryName.toLowerCase());
        }
      }
    });

    if (categoriesToCreate.length > 0) {
      onAddCategories(categoriesToCreate);
    }

    // 2. Map parsed transactions categories based on accepted suggestions
    const finalTransactions = parsedTransactions.map(tx => {
      const root = tx.merchant.split(' ')[0].toUpperCase();
      const suggestion = selectedSuggestions[root];
      if (suggestion && suggestion.selected) {
        return {
          ...tx,
          category: suggestion.categoryName
        };
      }
      return tx;
    });

    onAddTransactions(finalTransactions);
    
    // Clear out OCR state
    setParsedTransactions([]);
    setUnmappedMerchants([]);
    setShowSuggestionMode(false);
    setExtractedText("");
  };

  const handleSkipSuggestions = () => {
    onAddTransactions(parsedTransactions);
    setParsedTransactions([]);
    setUnmappedMerchants([]);
    setShowSuggestionMode(false);
    setExtractedText("");
  };

  return (
    <div className="bg-dark-surface border border-technical-border rounded p-6 text-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-technical-border/50">
        <div className="flex items-center gap-3">
          <div className="bg-accent-green/10 p-2.5 rounded border border-accent-green/25 text-accent-green">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 uppercase font-sans">
              Statement Scanner OCR Engine
              <span className="text-[10px] font-mono bg-accent-green/10 text-accent-green font-semibold px-2 py-0.5 rounded border border-accent-green/20 uppercase tracking-wider">
                Local Client-Side
              </span>
            </h2>
            <p className="text-xs text-slate-500">Drag or simulate statement logs with pending hold logic</p>
          </div>
        </div>
        
        <div className="flex gap-2 font-mono">
          {DEMO_STATEMENTS.map((demo, idx) => (
            <button
              key={idx}
              id={`simulate-btn-${idx}`}
              onClick={() => handleSimulate(idx)}
              className="text-[10px] flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-850 px-3 py-1.5 rounded border border-technical-border font-medium transition cursor-pointer uppercase tracking-wider"
            >
              <Play className="w-3 h-3 text-accent-green fill-accent-green" />
              Simulate #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop File Zone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2 border border-dashed border-technical-border/80 hover:border-accent-green rounded p-6 text-center cursor-pointer transition flex flex-col items-center justify-center bg-slate-50"
             onClick={() => fileInputRef.current?.click()}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <Upload className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm text-slate-700 font-medium">Click to select or drag Statement Screenshot</p>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">Image format (.png, .jpg, .webp). Processed completely locally in browser sandbox.</p>
        </div>

        <div className="bg-slate-50 rounded p-4 border border-technical-border flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Pre-Auth Hold Filter</h4>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Flags merchant holds (e.g. gas station holds of $1.00 or rows with "pending", "pre-auth") as holds to keep checking books accurate.
              </p>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono border-t border-technical-border/60 pt-2 flex justify-between items-center uppercase tracking-widest">
            <span>Reconciliation Engine:</span>
            <span className="text-accent-green font-bold">Active (5-day window)</span>
          </div>
        </div>
      </div>

      {/* Loading Status */}
      {loading && (
        <div className="bg-slate-50 rounded p-6 border border-technical-border text-center flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-accent-green animate-spin mb-3" />
          <p className="text-xs text-slate-800 font-mono uppercase tracking-widest">{progressText}</p>
          <div className="w-full max-w-xs bg-slate-200 h-1 rounded overflow-hidden mt-3">
            <div className="bg-accent-green h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Suggestion Mode / Suggested Action Report */}
      {!loading && showSuggestionMode && (
        <div className="bg-accent-amber/5 border border-accent-amber/20 rounded p-5 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-amber/5 rounded-full blur-2xl" />
          
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-sans flex items-center gap-2">
                Onboarding Suggested Action Report
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                I discovered unrecognized spending patterns on your statement. Would you like to automatically create custom categories and map these transactions?
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
            {unmappedMerchants.map((item, idx) => {
              const currentSel = selectedSuggestions[item.merchant] || { categoryName: "Uncategorized", selected: false };
              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-technical-border rounded">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      id={`chk-suggest-${item.merchant}`}
                      checked={currentSel.selected}
                      onChange={(e) => {
                        setSelectedSuggestions({
                          ...selectedSuggestions,
                          [item.merchant]: {
                            ...currentSel,
                            selected: e.target.checked
                          }
                        });
                      }}
                      className="w-4 h-4 rounded text-accent-green focus:ring-accent-green/30 bg-white border-technical-border"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">{item.merchant}</span>
                        <span className="text-[10px] font-mono bg-slate-100 border border-technical-border text-slate-600 px-1.5 py-0.5 rounded">
                          SEEN {item.count}X
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic mt-0.5">e.g. "{item.rawText}"</p>
                    </div>
                  </div>

                  {currentSel.selected && (
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-500">MAP TO CATEGORY:</span>
                      <select
                        value={currentSel.categoryName}
                        onChange={(e) => {
                          setSelectedSuggestions({
                            ...selectedSuggestions,
                            [item.merchant]: {
                              ...currentSel,
                              categoryName: e.target.value
                            }
                          });
                        }}
                        className="text-xs bg-white border border-technical-border text-accent-green font-semibold rounded px-2 py-1 focus:outline-none focus:border-accent-green"
                      >
                        <option value="Food & Dining">Food & Dining</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Gym & Fitness">Gym & Fitness</option>
                        <option value="Subscriptions">Subscriptions</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Gas & Transportation">Gas & Transportation</option>
                        <option value="Car Insurance">Car Insurance</option>
                        <option value="Rent & Housing">Rent & Housing</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 border-t border-technical-border pt-4">
            <button
              onClick={handleSkipSuggestions}
              className="text-xs bg-white hover:bg-slate-50 text-slate-500 px-3 py-1.5 rounded border border-technical-border transition font-medium cursor-pointer"
            >
              Skip Mappings, Import As-Is
            </button>
            <button
              onClick={handleAcceptSuggestions}
              className="text-xs bg-slate-900 hover:bg-slate-850 text-white px-4 py-1.5 rounded font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Generate Categories & Import
            </button>
          </div>
        </div>
      )}

      {/* Display Extracted Pending and Settled list if suggestions aren't active */}
      {!loading && parsedTransactions.length > 0 && !showSuggestionMode && (
        <div className="bg-slate-50 border border-technical-border rounded p-4 mt-2">
          <div className="flex items-center justify-between mb-3 border-b border-technical-border/50 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Extracted Ledger Logs</h4>
            <span className="text-xs font-mono text-slate-500">{parsedTransactions.length} transactions mapped</span>
          </div>

          <div className="divide-y divide-technical-border/50 max-h-56 overflow-y-auto pr-1">
            {parsedTransactions.map((tx, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="text-slate-500 font-mono">{tx.date}</div>
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      {tx.merchant}
                      {tx.isPending && (
                        <span className="text-[9px] bg-accent-amber/10 text-accent-amber px-1.5 py-0.2 rounded font-semibold border border-accent-amber/20 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          HOLD
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">{tx.category}</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-accent-crimson">-${tx.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t border-technical-border/50 pt-3 mt-3">
            <button
              onClick={() => { setParsedTransactions([]); }}
              className="text-xs bg-white hover:bg-slate-50 text-slate-500 px-3 py-1.5 rounded border border-technical-border transition cursor-pointer"
            >
              Discard All
            </button>
            <button
              onClick={() => {
                onAddTransactions(parsedTransactions);
                setParsedTransactions([]);
                setExtractedText("");
              }}
              className="text-xs bg-slate-900 hover:bg-slate-850 text-white px-4 py-1.5 rounded font-bold transition cursor-pointer"
            >
              Commit to Ledger
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
