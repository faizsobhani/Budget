import React, { useState } from 'react';
import { Terminal, Sparkles, AlertCircle, CheckCircle, Code, HelpCircle } from 'lucide-react';
import { parseChatLogContext } from '../utils/parser';

interface ContextImporterProps {
  onMergeLearnedMappings: (newMappings: Record<string, string>) => void;
  learnedMappings: Record<string, string>;
}

export default function ContextImporter({
  onMergeLearnedMappings,
  learnedMappings,
}: ContextImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatLogText, setChatLogText] = useState("");
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    count: number;
    details: string[];
  } | null>(null);

  const handleImport = () => {
    if (!chatLogText.trim()) return;

    const parsed = parseChatLogContext(chatLogText);
    const count = Object.keys(parsed).length;

    if (count > 0) {
      onMergeLearnedMappings(parsed);
      setImportStatus({
        success: true,
        count,
        details: Object.entries(parsed).map(([m, c]) => `"${m}" mapped to "${c}"`)
      });
      setChatLogText("");
    } else {
      setImportStatus({
        success: false,
        count: 0,
        details: ["Could not find any clear merchant-to-category associations in this transcript. Try pasting standard JSON structure or key-value formats like 'starbucks -> Food'."]
      });
    }
  };

  const handleClearMemory = () => {
    if (window.confirm("Are you sure you want to clear your custom learned category mappings?")) {
      onMergeLearnedMappings({});
      setImportStatus(null);
    }
  };

  return (
    <div className="bg-dark-surface border border-technical-border rounded p-6 text-slate-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="bg-accent-green/10 p-2.5 rounded border border-accent-green/25 text-accent-green">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 uppercase font-sans">
              Developer Context Import Engine
              <span className="text-[9px] font-mono bg-accent-green/15 text-accent-green font-bold px-2 py-0.5 rounded border border-accent-green/20">
                AI Memory Syncer
              </span>
            </h2>
            <p className="text-xs text-slate-500">Sync custom category mappings directly from AI transcripts</p>
          </div>
        </div>
        <span className="text-slate-400 hover:text-slate-600 font-mono text-xs uppercase tracking-widest">
          {isOpen ? '[ COLLAPSE ]' : '[ EXPAND ]'}
        </span>
      </button>

      {isOpen && (
        <div className="mt-5 space-y-4 border-t border-technical-border/50 pt-4">
          <div className="bg-slate-50 p-4 rounded border border-technical-border flex gap-3 text-xs text-slate-500">
            <HelpCircle className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 font-mono uppercase tracking-wider">How does the transcript synchronizer work?</p>
              <p className="mt-1">
                Paste any copied segment of an AI chat transcript where category structures or mappings were refined. 
                Our local regex model extracts JSON schemas, dictionary lists, or shorthand arrows like 
                <code className="text-accent-green font-mono mx-1">{"\"tjmax\" -> \"Shopping\""}</code> 
                to immediately persist mapping memory globally!
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-mono font-bold mb-1.5 tracking-wider">
              Paste Chat Transcript / Mapping Code block
            </label>
            <textarea
              value={chatLogText}
              onChange={(e) => setChatLogText(e.target.value)}
              placeholder={`Example text to paste:
"Make sure Netflix goes to Subscriptions, Starbucks maps to Food & Dining, and we can map Geico to Car Insurance as requested.

Here is the JSON map:
{
  "planet fitness": "Gym & Fitness",
  "comcast": "Utilities"
}"`}
              className="w-full bg-white border border-technical-border rounded p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-accent-green h-32 focus:ring-1 focus:ring-accent-green/20"
            />
          </div>

          <div className="flex justify-between items-center gap-2">
            <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">
              Custom Mapped Keys: <span className="text-accent-green font-mono font-bold">{Object.keys(learnedMappings).length} active</span>
            </div>
            <div className="flex gap-2">
              {Object.keys(learnedMappings).length > 0 && (
                <button
                  type="button"
                  onClick={handleClearMemory}
                  className="text-xs bg-accent-crimson/10 hover:bg-accent-crimson/20 text-accent-crimson px-3 py-1.5 rounded border border-accent-crimson/20 transition cursor-pointer font-mono uppercase tracking-wider"
                >
                  Clear Memory
                </button>
              )}
              <button
                type="button"
                onClick={handleImport}
                disabled={!chatLogText.trim()}
                className="text-xs bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white disabled:text-slate-400 px-4 py-1.5 rounded font-bold flex items-center gap-1.5 transition border border-transparent disabled:border-technical-border/55 cursor-pointer font-mono uppercase tracking-wider"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Sync Memory
              </button>
            </div>
          </div>

          {/* Import Results Summary */}
          {importStatus && (
            <div className={`rounded p-4 border text-xs font-mono ${importStatus.success ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' : 'bg-accent-crimson/10 border-accent-crimson/20 text-accent-crimson'}`}>
              <div className="flex items-center gap-2 font-bold mb-2 uppercase tracking-wider">
                {importStatus.success ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-accent-green" />
                    Synced {importStatus.count} category behaviors!
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-accent-crimson" />
                    Parsing yielded no matches
                  </>
                )}
              </div>

              <div className="max-h-32 overflow-y-auto text-[10px] space-y-1 divide-y divide-technical-border/30">
                {importStatus.details.map((detail, idx) => (
                  <div key={idx} className="pt-1 first:pt-0">
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
