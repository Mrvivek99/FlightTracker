'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/utils/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface DetectedIntent {
  from?: string;
  to?: string;
  date?: string;
}

interface ChatPanelProps {
  onIntentDetected?: (intent: DetectedIntent) => void;
}

const QUICK_SUGGESTIONS = [
  '✈️ Find cheapest flights NYC → London',
  '💰 Compare airlines Delhi to Dubai',
  '📅 Best time to book international flights',
  '📊 Price trends for Singapore → Tokyo',
];

// Simple markdown renderer for chat messages
function MarkdownMessage({ content }: { content: string }) {
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableLines: string[] = [];
    let inTable = false;
    let key = 0;

    const flushTable = () => {
      if (tableLines.length > 0) {
        const rows = tableLines.filter(l => !l.match(/^\|[-| ]+\|$/));
        elements.push(
          <div key={key++} className="overflow-x-auto my-2 rounded-lg border border-[#3a3a3a]">
            <table className="w-full text-xs border-collapse">
              <tbody>
                {rows.map((row, ri) => {
                  const cells = row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
                  return (
                    <tr key={ri} className={ri === 0 ? 'bg-[#2a2a2a] font-bold' : 'border-t border-[#2a2a2a] hover:bg-[#1f1f1f]'}>
                      {cells.map((cell, ci) => (
                        <td key={ci} className="px-2 py-1.5 text-left whitespace-nowrap" dangerouslySetInnerHTML={{ __html: formatInline(cell.trim()) }} />
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        tableLines = [];
        inTable = false;
      }
    };

    for (const line of lines) {
      if (line.startsWith('|')) {
        inTable = true;
        tableLines.push(line);
        continue;
      }

      if (inTable) flushTable();

      if (!line.trim()) {
        elements.push(<div key={key++} className="h-1" />);
      } else if (line.startsWith('## ')) {
        elements.push(<h4 key={key++} className="text-gold font-bold text-sm mt-2 mb-1">{line.slice(3)}</h4>);
      } else if (line.startsWith('# ')) {
        elements.push(<h3 key={key++} className="text-gold font-bold text-base mt-2 mb-1">{line.slice(2)}</h3>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={key++} className="flex gap-1.5 ml-1">
            <span className="text-gold mt-0.5">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
          </div>
        );
      } else {
        elements.push(
          <p key={key++} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        );
      }
    }

    if (inTable) flushTable();
    return elements;
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-[#2a2a2a] px-1 rounded text-xs">$1</code>');
  };

  return (
    <div className="text-sm space-y-0.5 text-gray-100">
      {renderContent(content)}
    </div>
  );
}

export default function ChatPanel({ onIntentDetected }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm **SkyBot** ✈️ your AI-powered flight price tracker!\n\nI can help you:\n- Find cheapest flights between any cities\n- Compare airlines and prices\n- Predict the best time to book\n- Set price drop alerts\n\nJust tell me where you want to fly! 🌍`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const buildHistory = (msgs: ChatMessage[]) =>
    msgs.slice(1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      content: m.content
    }));

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsPending(true);

    try {
      const response = await api.post('/chat', {
        message: messageText,
        history: buildHistory(messages), // send conversation context
        sessionId
      });

      const { message: aiText, sessionId: newSessionId, detectedIntent } = response.data;

      if (newSessionId && !sessionId) setSessionId(newSessionId);
      if (detectedIntent && onIntentDetected) {
        onIntentDetected(detectedIntent);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorContent = error?.response?.data?.message ||
        "I'm having some trouble right now. Please try again! ✈️";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsPending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (suggestion: string) => {
    const cleaned = suggestion.replace(/^[^\w]+/, '').trim();
    sendMessage(cleaned);
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: `Chat cleared! I'm ready for your next flight search. Where would you like to fly? ✈️`,
      timestamp: new Date().toISOString()
    }]);
    setSessionId(null);
  };

  const panelClass = isFullscreen
    ? 'fixed inset-4 md:inset-8 rounded-2xl'
    : 'fixed bottom-24 right-6 w-[420px] h-[620px] rounded-2xl';

  return (
    <>
      {/* Floating chat button */}
      <motion.button
        id="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black rounded-full shadow-2xl shadow-yellow-500/40 flex items-center justify-center text-2xl z-50"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.92 }}
        title="Open AI Travel Assistant"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={isOpen ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
          >
            {isOpen ? '✕' : '✈️'}
          </motion.span>
        </AnimatePresence>

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20 pointer-events-none" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className={`${panelClass} bg-[#111111] border border-[#2a2a2a] shadow-2xl shadow-black/60 flex flex-col z-40 overflow-hidden`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent px-5 py-4 border-b border-[#2a2a2a] flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-lg shadow-lg">
                🤖
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-yellow-400 leading-tight">SkyBot AI</h3>
                <p className="text-[#888] text-xs">Flight Price Tracker Assistant</p>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Online" />
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="ml-2 text-[#666] hover:text-yellow-400 transition p-1.5 rounded-lg hover:bg-white/5"
                  title={isFullscreen ? 'Minimize' : 'Fullscreen'}
                >
                  {isFullscreen ? '⊡' : '⊞'}
                </button>
                <button
                  onClick={clearChat}
                  className="text-[#666] hover:text-red-400 transition p-1.5 rounded-lg hover:bg-white/5 text-xs"
                  title="Clear chat"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
                      : 'bg-[#2a2a2a] text-yellow-400 border border-[#3a3a3a]'
                  }`}>
                    {msg.role === 'assistant' ? '🤖' : '👤'}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[82%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-black rounded-tr-sm font-medium text-sm'
                      : 'bg-[#1e1e1e] border border-[#2a2a2a] rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <MarkdownMessage content={msg.content} />
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-black/60 text-right' : 'text-[#555]'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 items-end"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-xs">
                    🤖
                  </div>
                  <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-yellow-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, delay, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions — only show at top */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex-shrink-0">
                <p className="text-[#555] text-[11px] mb-2 uppercase tracking-widest">Quick Start</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestion(s)}
                      className="text-xs bg-[#1e1e1e] border border-[#2a2a2a] hover:border-yellow-500/50 hover:bg-yellow-500/5 text-[#aaa] hover:text-yellow-400 px-3 py-1.5 rounded-xl transition-all duration-200"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-[#1e1e1e] p-4 bg-[#0d0d0d] flex-shrink-0"
            >
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  id="chat-input"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask about flights, prices, deals..."
                  disabled={isPending}
                  className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] focus:border-yellow-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] outline-none transition-all duration-200 disabled:opacity-50"
                />
                <motion.button
                  type="submit"
                  id="chat-send-btn"
                  disabled={isPending || !input.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black rounded-xl flex items-center justify-center font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-yellow-500/20"
                >
                  {isPending ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : '↑'}
                </motion.button>
              </div>
              <p className="text-[10px] text-[#444] mt-2 text-center">
                Powered by Gemini AI • Press Enter to send
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
