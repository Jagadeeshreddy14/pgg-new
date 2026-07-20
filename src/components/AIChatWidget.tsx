import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, User, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import api from "../lib/api";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content: "Hello! I am Sri Jagadeesh Reddy's virtual warden assistant. Ask me anything about the hostel rules, dinner menu, rent payments, check-out procedures, or gate timings!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presets = [
    "What are the hostel rules?",
    "When is the gate closure curfew?",
    "How is the security deposit refunded?",
    "What is the Sunday dinner menu?",
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInputValue("");
    setIsLoading(true);

    try {
      // Map history format to standard payload expected by backend
      const historyPayload = messages.slice(1).map((m) => ({
        role: m.role === "model" ? "model" : "user",
        content: m.content,
      }));

      const res = await api.post("/chat", {
        message: text,
        history: historyPayload,
      });

      setMessages((prev) => [...prev, { role: "model", content: res.response }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Apologies, I encountered a minor signal loss. Please ensure you are connected online or contact the warden office directly.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  return (
    <>
      {/* Chat Floating Button */}
      <button
        id="ai-chat-fab"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all z-40 cursor-pointer flex items-center justify-center border border-amber-400"
      >
        <MessageSquare className="w-6 h-6 animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
        </span>
      </button>

      {/* Side Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-50 text-slate-100"
            >
              {/* Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-tr from-amber-500/10 to-amber-500/20 rounded-lg text-amber-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-base text-amber-400">Srinivasa Warden AI</h3>
                    <p className="text-xs text-slate-400 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
                      Active Smart Concierge
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[85%] ${
                        m.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-full ${
                          m.role === "user" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-amber-400"
                        }`}
                      >
                        {m.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>

                      <div
                        className={`p-3 rounded-2xl text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-amber-500 text-slate-950 font-medium rounded-tr-none"
                            : "bg-slate-800/80 text-slate-100 border border-slate-700/50 rounded-tl-none"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 rounded-full bg-slate-800 text-amber-400">
                        <Sparkles className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 rounded-tl-none">
                        <div className="flex space-x-1.5 items-center py-1">
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions / Presets */}
              <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center">
                  <HelpCircle className="w-3 h-3 mr-1" /> Frequently Asked
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(p)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/40 hover:border-slate-600 transition-all text-left truncate max-w-full cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(inputValue)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-500"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={isLoading || !inputValue.trim()}
                  className="p-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-lg active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
