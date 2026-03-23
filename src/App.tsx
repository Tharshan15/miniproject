import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Brain, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  BookOpen,
  Lightbulb,
  Terminal,
  History,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ControllerAgent } from './services/agentSystem';
import { AgentLog, AgentStatus, AnalysisResult } from './types';

import { CONFIG } from './config';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'gaps' | 'path'>('topics');
  const [showMonitor, setShowMonitor] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if API key is missing
    const provider = CONFIG.PROVIDER;
    const key = provider === "GEMINI" 
      ? (CONFIG.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined))
      : (CONFIG.GROQ_API_KEY || (import.meta as any).env?.VITE_GROQ_API_KEY || (typeof process !== 'undefined' ? process.env?.GROQ_API_KEY : undefined));
    
    if (!key) {
      setApiKeyMissing(true);
    } else {
      setApiKeyMissing(false);
    }
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (log: AgentLog) => {
    setLogs(prev => [...prev, log]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setLogs([]);
        setError(null);
        setActiveTab('topics');
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setLogs([]);
    setError(null);
    setResult(null);

    try {
      const controller = new ControllerAgent(addLog);
      const analysisResult = await controller.runPipeline(image);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'topics', label: 'Core Topics', icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'gaps', label: 'Conceptual Gaps', icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { id: 'path', label: 'Learning Path', icon: Lightbulb, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  ] as const;

  const openMonitorWithLog = (logId: string) => {
    setSelectedLogId(logId);
    setShowMonitor(true);
  };

  useEffect(() => {
    if (showMonitor && selectedLogId) {
      const element = document.getElementById(`log-${selectedLogId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [showMonitor, selectedLogId]);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">
            Handwritten Note Analyzer <span className="text-xs font-mono not-italic opacity-50 ml-2">v1.0.0-agentic</span>
          </h1>
          <p className="text-xs font-mono opacity-60 mt-1 uppercase tracking-widest">Multi-Agent System for Academic Intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setSelectedLogId(null);
              setShowMonitor(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 border border-[#141414] text-[10px] font-mono uppercase tracking-tighter hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
          >
            <History size={12} /> Monitor
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-mono uppercase tracking-tighter">System: {isAnalyzing ? 'Processing' : 'Ready'}</span>
          </div>
        </div>
      </header>

      {/* API Key Warning */}
      <AnimatePresence>
        {apiKeyMissing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-red-500 text-white px-6 py-2 text-xs font-mono flex items-center justify-center gap-2 overflow-hidden"
          >
            <AlertCircle size={14} />
            <span>WARNING: {CONFIG.PROVIDER}_API_KEY is missing. Please paste it in <code>src/config.ts</code>.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Monitoring Modal */}
      <AnimatePresence>
        {showMonitor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#141414]/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#E4E3E0] border border-[#141414] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]"
            >
              <div className="p-6 border-b border-[#141414] flex justify-between items-center bg-white">
                <h2 className="text-xl font-serif font-bold italic flex items-center gap-2">
                  <Terminal size={20} /> Agent Monitoring Console
                </h2>
                <button 
                  onClick={() => setShowMonitor(false)}
                  className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
                >
                  <ChevronRight size={24} className="rotate-90" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {logs.length === 0 ? (
                  <div className="text-center py-12 opacity-40 italic">No agent activity recorded yet.</div>
                ) : (
                  logs.filter(l => l.data).map((log) => (
                    <div 
                      key={log.id} 
                      id={`log-${log.id}`}
                      className={`bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] transition-all ${selectedLogId === log.id ? 'ring-2 ring-emerald-500 shadow-[8px_8px_0px_0px_rgba(16,185,129,0.2)]' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              {log.agentName}
                            </span>
                            <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${
                              log.status === AgentStatus.COMPLETED ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                              log.status === AgentStatus.FAILED ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                              'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold">{log.message}</h3>
                        </div>
                        <span className="text-[10px] font-mono opacity-40">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="bg-[#141414] text-emerald-400 p-4 rounded font-mono text-xs overflow-x-auto">
                        <pre>{JSON.stringify(log.data, null, 2)}</pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 border-t border-[#141414] bg-white text-center">
                <p className="text-[10px] font-mono uppercase opacity-50">End of Session Logs</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Preview */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="text-xs font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
              <Upload size={14} /> Input Source
            </h2>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed border-[#141414]/20 rounded-lg p-8 text-center cursor-pointer hover:bg-[#141414]/5 transition-colors group relative overflow-hidden ${image ? 'border-emerald-500/50' : ''}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              
              {image ? (
                <div className="space-y-4">
                  <img src={image} alt="Preview" className="max-h-64 mx-auto rounded shadow-sm border border-[#141414]/10" />
                  <p className="text-xs font-mono opacity-60">Click to replace image</p>
                </div>
              ) : (
                <div className="space-y-4 py-8">
                  <div className="w-12 h-12 bg-[#141414] text-white rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Upload Handwritten Notes</p>
                    <p className="text-xs opacity-60 mt-1">PNG, JPG or WEBP (Max 10MB)</p>
                  </div>
                </div>
              )}
            </div>

            <button
              disabled={!image || isAnalyzing}
              onClick={startAnalysis}
              className={`w-full mt-6 py-4 px-6 font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3
                ${!image || isAnalyzing 
                  ? 'bg-[#141414]/10 text-[#141414]/40 cursor-not-allowed' 
                  : 'bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]'
                }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain size={18} />
                  Execute Analysis
                </>
              )}
            </button>
          </section>

          {/* Agent Logs */}
          <section className="bg-[#141414] text-[#E4E3E0] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.3)] h-[400px] flex flex-col">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-emerald-400">
              <Terminal size={12} /> Agent Decision Stream
            </h2>
            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/20">
              {logs.length === 0 && !isAnalyzing && (
                <p className="opacity-40 italic">Waiting for process initiation...</p>
              )}
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border-l border-white/10 pl-3 py-1 group/log"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 opacity-50 text-[9px]">
                        <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="uppercase font-bold text-emerald-400">{log.agentName}</span>
                      </div>
                      {log.data && (
                        <button 
                          onClick={() => openMonitorWithLog(log.id)}
                          className="text-[8px] uppercase tracking-tighter bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded opacity-0 group-hover/log:opacity-100 transition-opacity"
                        >
                          View Output
                        </button>
                      )}
                    </div>
                    <p className="mt-1 leading-relaxed">{log.message}</p>
                    {log.status === AgentStatus.FAILED && <AlertCircle size={10} className="text-red-500 inline ml-1" />}
                    {log.status === AgentStatus.COMPLETED && <CheckCircle2 size={10} className="text-emerald-500 inline ml-1" />}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {!result && !isAnalyzing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#141414]/10 rounded-2xl text-center"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#141414]/5">
                  <FileText size={32} className="opacity-20" />
                </div>
                <h3 className="text-xl font-serif italic font-bold">No Analysis Data</h3>
                <p className="text-sm opacity-60 max-w-xs mt-2">Upload your handwritten notes and click 'Execute Analysis' to begin the agentic processing pipeline.</p>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-12 bg-white border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-[#141414]/5 border-t-[#141414] rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain size={32} className="animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-serif italic font-bold mt-8">Orchestrating Agents...</h3>
                <p className="text-sm font-mono opacity-60 mt-2 uppercase tracking-widest">Vision • Knowledge • Analysis • Feedback</p>
              </motion.div>
            ) : result ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <p className="text-[10px] font-mono uppercase opacity-50 mb-1">OCR Confidence</p>
                    <p className="text-2xl font-serif italic font-bold">{(result.confidenceScore * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-white border border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <p className="text-[10px] font-mono uppercase opacity-50 mb-1">Topics Identified</p>
                    <p className="text-2xl font-serif italic font-bold">{result.topics.length}</p>
                  </div>
                  <div className="bg-white border border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <p className="text-[10px] font-mono uppercase opacity-50 mb-1">Missing Concepts</p>
                    <p className="text-2xl font-serif italic font-bold text-amber-600">{result.missingConcepts.length}</p>
                  </div>
                </div>

                {/* Extracted Text */}
                <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <h2 className="text-xs font-mono uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[#141414]/10 pb-2">
                    <FileText size={14} /> Extracted Transcript
                  </h2>
                  <div className="bg-[#F5F5F0] p-6 rounded border border-[#141414]/5 font-serif leading-relaxed text-lg whitespace-pre-wrap italic">
                    {result.extractedText}
                  </div>
                </section>

                {/* Tabbed Insights */}
                <section className="bg-white border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
                  <div className="flex border-b border-[#141414]">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-4 px-6 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                          ${activeTab === tab.id 
                            ? `${tab.bgColor} ${tab.color} font-bold border-b-2 border-[#141414]` 
                            : 'bg-white opacity-40 hover:opacity-100'
                          }`}
                      >
                        <tab.icon size={14} />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-8 min-h-[300px]">
                    <AnimatePresence mode="wait">
                      {activeTab === 'topics' && (
                        <motion.div
                          key="topics"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                              <BookOpen size={24} />
                            </div>
                            <div>
                              <h3 className="text-xl font-serif font-bold italic">Core Topics</h3>
                              <p className="text-xs font-mono opacity-50 uppercase tracking-wider">Primary concepts identified in notes</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {result.topics.map((topic, i) => (
                              <div key={i} className="flex items-center gap-3 p-4 border border-[#141414]/5 bg-emerald-50/30 rounded">
                                <ChevronRight size={14} className="text-emerald-600 opacity-40" />
                                <span className="font-medium">{topic}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'gaps' && (
                        <motion.div
                          key="gaps"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                              <AlertCircle size={24} />
                            </div>
                            <div>
                              <h3 className="text-xl font-serif font-bold italic">Conceptual Gaps</h3>
                              <p className="text-xs font-mono opacity-50 uppercase tracking-wider">Missing or incomplete information</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {result.missingConcepts.map((concept, i) => (
                              <div key={i} className="flex items-start gap-4 p-4 border border-[#141414]/5 bg-amber-50/30 rounded">
                                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                <span className="text-sm leading-relaxed">{concept}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'path' && (
                        <motion.div
                          key="path"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                              <Lightbulb size={24} />
                            </div>
                            <div>
                              <h3 className="text-xl font-serif font-bold italic">Learning Path</h3>
                              <p className="text-xs font-mono opacity-50 uppercase tracking-wider">Personalized study recommendations</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {result.suggestions.map((suggestion, i) => (
                              <div key={i} className="group p-6 border border-[#141414]/5 bg-indigo-50/30 rounded hover:bg-indigo-50/50 transition-colors">
                                <div className="flex gap-4">
                                  <span className="text-xs font-mono font-bold text-indigo-600 opacity-40">0{i + 1}</span>
                                  <p className="text-sm leading-relaxed">{suggestion}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </section>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {error && (
            <div className="bg-red-50 border border-red-500 p-4 flex items-start gap-3 text-red-700 rounded shadow-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold uppercase mb-1">System Error</p>
                <p className="text-sm">{error}</p>
                {error.includes('API key not valid') && (
                  <div className="mt-3 p-3 bg-red-100 rounded border border-red-200 text-xs font-mono">
                    <p className="font-bold mb-1">💡 Troubleshooting Tip:</p>
                    <p>The API key you provided is invalid. Please ensure:</p>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      <li>You copied the <b>entire</b> key correctly.</li>
                      <li>You pasted it inside the quotes in <code>src/config.ts</code>.</li>
                      <li>There are no extra spaces or characters.</li>
                    </ul>
                  </div>
                )}
              </div>
              <button onClick={() => setError(null)} className="hover:opacity-50">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#141414] p-8 text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40">
          Neural Processing Unit • Distributed Agent Architecture • End-to-End Encryption
        </p>
      </footer>
    </div>
  );
}
