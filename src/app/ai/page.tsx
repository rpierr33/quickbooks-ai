"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "How much did I spend last month?",
  "What's my most expensive category?",
  "Show me my profit trend",
  "Any unusual spending recently?",
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
      setMessages(prev => [...prev, { role: "assistant", content: data.answer || data.error || "I couldn't process that request." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-indigo-50 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Financial Assistant</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">Ask me anything about your finances. I can analyze spending, find trends, and provide insights.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              </div>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 pt-4">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={loading}
            className="flex-1 h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon" className="h-11 w-11 rounded-xl">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
