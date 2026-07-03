import React, { useState } from 'react';
import { Terminal, Sparkles, AlertCircle, CheckCircle, Code, HelpCircle, Upload, FileText, RefreshCw } from 'lucide-react';
import { parseChatLogContext } from '../utils/parser';
import JSZip from 'jszip';

interface ContextImporterProps {
  onMergeLearnedMappings: (newMappings: Record<string, string>) => void;
  learnedMappings: Record<string, string>;
}

export default function ContextImporter({
  onMergeLearnedMappings,
  learnedMappings,
}: ContextImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'zip' | 'text'>('zip');
  const [chatLogText, setChatLogText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    count: number;
    details: string[];
  } | null>(null);

  // ZIP parsing from Claude exported chat backup
  const handleZipUpload = async (file: File) => {
    setIsLoading(true);
    setImportStatus(null);
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      
      // Search for conversations.json in the zip
      const conversationsFileKey = Object.keys(loadedZip.files).find(
        key => key.endsWith('conversations.json')
      );
      
      if (!conversationsFileKey) {
        setImportStatus({
          success: false,
          count: 0,
          details: [
            "Could not find 'conversations.json' in this ZIP.",
            "Claude exports typically contain a 'conversations.json' file at the root."
          ]
        });
        setIsLoading(false);
        return;
      }
      
      const fileContentText = await loadedZip.files[conversationsFileKey].async('text');
      const conversations = JSON.parse(fileContentText);
      
      if (!Array.isArray(conversations)) {
        setImportStatus({
          success: false,
          count: 0,
          details: ["The 'conversations.json' file inside the zip is not in the expected array format."]
        });
        setIsLoading(false);
        return;
      }
      
      // Look for a conversation containing "budget" in its name or messages
      let budgetConvo = conversations.find((c: any) => 
        c.name && c.name.toLowerCase().includes('budget')
      );
      
      // Fallback 1: Look for messages containing "budget"
      if (!budgetConvo) {
        budgetConvo = conversations.find((c: any) => 
          c.chat_messages && c.chat_messages.some(
            (m: any) => m.text && m.text.toLowerCase().includes('budget')
          )
        );
      }
      
      // Fallback 2: Take the first/most recent conversation
      if (!budgetConvo && conversations.length > 0) {
        budgetConvo = conversations[0];
      }
      
      if (!budgetConvo) {
        setImportStatus({
          success: false,
          count: 0,
          details: ["No conversations found in conversations.json."]
        });
        setIsLoading(false);
        return;
      }
      
      const convoName = budgetConvo.name || "Untitled Claude Chat";
      const chatMessages = budgetConvo.chat_messages || [];
      const chatText = chatMessages
        .map((m: any) => m.text || "")
        .join("\n\n");
      
      const parsed = parseChatLogContext(chatText);
      const count = Object.keys(parsed).length;
      
      if (count > 0) {
        onMergeLearnedMappings(parsed);
        setImportStatus({
          success: true,
          count,
          details: [
            `Extracted from conversation: "${convoName}"`,
            ...Object.entries(parsed).map(([m, c]) => `"${m}" mapped to "${c}"`)
          ]
        });
      } else {
        setImportStatus({
          success: false,
          count: 0,
          details: [
            `Found conversation: "${convoName}"`,
            "But could not extract any merchant-to-category associations in this transcript. Make sure the conversation contains mapping rules (e.g., \"Starbucks maps to Food\")."
          ]
        });
      }
    } catch (err: any) {
      console.error(err);
      setImportStatus({
        success: false,
        count: 0,
        details: [`Failed to read or parse ZIP: ${err.message || err}`]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        setUploadedFileName(file.name);
        handleZipUpload(file);
      } else {
        setImportStatus({
          success: false,
          count: 0,
          details: ["Invalid file type. Please upload a valid .zip file containing a Claude chat export."]
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.zip')) {
        setUploadedFileName(file.name);
        handleZipUpload(file);
      } else {
        setImportStatus({
          success: false,
          count: 0,
          details: ["Invalid file type. Please upload a valid .zip file containing a Claude chat export."]
        });
      }
    }
  };

  // Text paste import logic
  const handleTextImport = () => {
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
      setUploadedFileName("");
    }
  };

  return (
    <div className="bg-dark-surface border border-technical-border rounded p-6 text-slate-800 dark:text-slate-100 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="bg-accent-green/10 p-2.5 rounded border border-accent-green/25 text-accent-green">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase font-sans">
              Developer Context Import Engine
              <span className="text-[9px] font-mono bg-accent-green/15 text-accent-green font-bold px-2 py-0.5 rounded border border-accent-green/20">
                AI Memory Syncer
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">Sync custom category mappings directly from AI transcripts</p>
          </div>
        </div>
        <span className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-mono text-xs uppercase tracking-widest">
          {isOpen ? '[ COLLAPSE ]' : '[ EXPAND ]'}
        </span>
      </button>

      {isOpen && (
        <div className="mt-5 space-y-4 border-t border-technical-border/50 pt-4">
          
          {/* Instructions Box */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded border border-technical-border flex gap-3 text-xs text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 font-mono uppercase tracking-wider">How does the transcript synchronizer work?</p>
              <p className="mt-1">
                You can upload a Claude conversation <code className="text-accent-green font-mono">.zip</code> export or paste raw transcripts directly. 
                We automatically scan the conversations, identify the **Budget Conversation**, extract JSON schemas, lists, and shorthand arrows like 
                <code className="text-accent-green font-mono mx-1">{"\"starbucks\" -> \"Food & Dining\""}</code> 
                to align the ledger category auto-mapper!
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex border-b border-technical-border font-mono text-[11px] uppercase tracking-wider gap-2">
            <button
              onClick={() => { setActiveMode('zip'); setImportStatus(null); }}
              className={`pb-2 px-3 transition-colors duration-150 cursor-pointer ${activeMode === 'zip' ? 'border-b-2 border-accent-green font-bold text-accent-green' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Upload Claude ZIP
            </button>
            <button
              onClick={() => { setActiveMode('text'); setImportStatus(null); }}
              className={`pb-2 px-3 transition-colors duration-150 cursor-pointer ${activeMode === 'text' ? 'border-b-2 border-accent-green font-bold text-accent-green' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Paste Raw Transcript
            </button>
          </div>

          {/* Conditional Input UI */}
          {activeMode === 'zip' ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer relative ${
                dragActive 
                  ? 'border-accent-green bg-accent-green/5' 
                  : 'border-technical-border hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50/30 dark:bg-slate-900/10'
              }`}
            >
              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
              />
              
              {isLoading ? (
                <div className="flex flex-col items-center space-y-2 py-4">
                  <RefreshCw className="w-8 h-8 text-accent-green animate-spin" />
                  <span className="text-xs font-mono text-slate-500">Parsing Claude conversations...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-accent-green/10 rounded-full text-accent-green mb-1">
                    <Upload className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                    {uploadedFileName ? `Loaded: ${uploadedFileName}` : "Drag & Drop Claude Zip Export"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {uploadedFileName ? "Click or drag to replace with another file" : "or click to browse local files (.zip)"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono font-bold mb-1.5 tracking-wider">
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
                className="w-full bg-white dark:bg-slate-800 border border-technical-border rounded p-3 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-accent-green h-36 focus:ring-1 focus:ring-accent-green/20"
                disabled={isLoading}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleTextImport}
                  disabled={!chatLogText.trim() || isLoading}
                  className="text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 px-4 py-2 rounded font-bold flex items-center gap-1.5 transition cursor-pointer font-mono uppercase tracking-wider"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent-green" />
                  Sync Memory
                </button>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex justify-between items-center gap-2 border-t border-technical-border/40 pt-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
              Custom Mapped Keys: <span className="text-accent-green font-mono font-bold">{Object.keys(learnedMappings).length} active</span>
            </div>
            {Object.keys(learnedMappings).length > 0 && (
              <button
                type="button"
                onClick={handleClearMemory}
                className="text-xs bg-accent-crimson/10 hover:bg-accent-crimson/20 text-accent-crimson px-3 py-1.5 rounded border border-accent-crimson/20 transition cursor-pointer font-mono uppercase tracking-wider"
              >
                Clear Memory
              </button>
            )}
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

              <div className="max-h-36 overflow-y-auto text-[10px] space-y-1 divide-y divide-technical-border/30">
                {importStatus.details.map((detail, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0">
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
