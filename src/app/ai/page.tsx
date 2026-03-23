"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "How much did I spend last month?",
  "What's my most expensive category?",
  "Show me my profit trend",
  "Any unusual spending?",
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.answer || data.error || "I couldn't process that." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] animate-fade-in">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-5 mb-5">
              <Sparkles className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">AI Financial Assistant</h2>
            <p className="text-[13px] text-gray-700 mb-8 max-w-xs leading-relaxed">Ask anything about your finances. I analyze spending, find trends, and surface insights.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="shrink-0 w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            )}
            <div className={`max-w-[78%] rounded-lg px-4 py-2.5 text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="shrink-0 w-7 h-7 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-gray-500" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="shrink-0 w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="bg-white rounded-lg px-4 py-3 border border-gray-200 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="pt-3">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={loading}
            className="flex-1 h-11 rounded-md border border-gray-300 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon" className="h-11 w-11 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
