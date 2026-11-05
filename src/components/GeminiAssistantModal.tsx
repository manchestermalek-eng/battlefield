import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, Globe, Trash2, ArrowRight, BookOpen, Bot, ExternalLink } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: Array<{ title: string; uri: string }>;
  timestamp: string;
}

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STARTER_PROMPTS = [
  'Why did Sir Douglas Haig believe the preliminary bombardment would wipe out German defenses?',
  'What actually happened when Mark I tanks first attacked at Flers-Courcelette on 15 Sept 1916?',
  'How did soldiers on both sides survive trench foot, lice, and giant rats?',
  'What were the key differences between the British Vickers and the German MG 08?',
  'Who was the Red Baron and what was the air war over the Somme like?',
];

export function GeminiAssistantModal({ isOpen, onClose }: GeminiAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: "Greetings. I am your Somme Field Historian and WW1 Intelligence Officer, powered by Gemini with live web access. You can ask me anything about the Battle of the Somme, frontline tactics, trench life, commanders like Haig, or any general history and web question. What would you like to investigate?",
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const query = (questionText || input).trim();
    if (!query || isLoading) return;

    setError(null);
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.answer || 'No response recorded.',
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Failed to get Gemini response:', err);
      setError(err?.message || 'Failed to reach Gemini assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: "Trench records cleared. Ask any question about the Somme, World War One, or anything else from the web.",
        timestamp: 'Just now',
      },
    ]);
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gemini-assistant-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md transition-all"
    >
      <div
        className="somme-panel relative flex h-[85vh] max-h-[720px] w-full max-w-2xl flex-col rounded-2xl border border-amber-300/35 bg-[#17130e]/95 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-amber-200/15 bg-black/40 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/25 to-amber-600/15 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Sparkles className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="somme-kicker text-amber-200/80">Gemini WW1 Intelligence</span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300">
                  <Globe className="h-2.5 w-2.5" />
                  Web Grounded
                </span>
              </div>
              <h2
                id="gemini-assistant-title"
                className="font-military text-base sm:text-lg text-amber-50 uppercase tracking-wide"
              >
                Somme Field Historian & AI Advisor
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear discussion"
              aria-label="Clear discussion"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-200/20 text-amber-100/60 hover:border-amber-200/50 hover:bg-white/5 hover:text-amber-50 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close assistant"
              aria-label="Close assistant"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-200/20 text-amber-100/60 hover:border-amber-200/50 hover:bg-white/5 hover:text-white transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Conversation Thread */}
        <div
          ref={scrollRef}
          className="somme-scroll flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs leading-relaxed"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 sm:p-4 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-amber-400/20 border border-amber-300/40 text-amber-50 rounded-br-xs'
                    : 'bg-black/55 border border-amber-200/15 text-amber-100/90 rounded-bl-xs'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 font-mono text-[9.5px] uppercase tracking-wider text-amber-200/50">
                  {msg.role === 'user' ? (
                    <>
                      <span>Field Officer (You)</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3 text-amber-400" />
                      <span className="text-amber-300 font-semibold">Somme Historian (Gemini)</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </>
                  )}
                </div>

                <div className="whitespace-pre-line text-[12.5px] leading-relaxed text-amber-50/90 font-sans">
                  {msg.text}
                </div>

                {/* Grounding Web Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-amber-200/15">
                    <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-amber-300/70 mb-1.5">
                      <Globe className="h-3 w-3 text-amber-400" />
                      <span>Web Sources & Grounding:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, idx) => (
                        <a
                          key={`${src.uri}-${idx}`}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 border border-amber-300/25 font-mono text-[9.5px] text-amber-200 hover:text-white hover:border-amber-300/60 transition truncate max-w-[240px]"
                          title={src.title}
                        >
                          <span className="truncate">{src.title}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-70" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5 text-xs text-amber-200/70">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 border border-amber-300/30 text-amber-300">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-bl-xs border border-amber-200/15 bg-black/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"></span>
                  <span className="font-mono text-[11px] text-amber-200/80">
                    Consulting military archives and the web...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200">
              {error}
            </div>
          )}
        </div>

          {/* Quick Questions Starter Chips */}
        {messages.length <= 2 && (
          <div className="border-t border-amber-200/10 bg-black/25 px-4 py-2 sm:px-6">
            <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-amber-200/60">
              <BookOpen className="h-3 w-3 text-amber-400" />
              <span>Suggested Field Inquiries:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSend(prompt)}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-black/40 px-2.5 py-1 text-left font-sans text-[10.5px] text-amber-200/80 transition hover:border-amber-300/60 hover:bg-amber-400/15 hover:text-white disabled:opacity-50"
                >
                  <span className="truncate max-w-[280px] sm:max-w-[400px]">{prompt}</span>
                  <ArrowRight className="h-2.5 w-2.5 opacity-50 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <footer className="border-t border-amber-200/15 bg-black/40 p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question about Somme, trenches, or anything from the web..."
                disabled={isLoading}
                className="w-full rounded-xl border border-amber-200/25 bg-black/60 px-3.5 py-2.5 text-xs text-amber-50 placeholder-amber-200/40 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-md transition hover:from-amber-300 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none"
              title="Send question to Gemini"
              aria-label="Send question"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[9.5px] font-mono text-amber-200/40 px-1">
            <span>Powered by Gemini 3.8 Flash & Google Search</span>
            <span>Press Enter to send</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
