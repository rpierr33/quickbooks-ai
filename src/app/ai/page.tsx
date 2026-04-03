"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, User, MessageSquare, ArrowRight, Database } from "lucide-react";

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
      const res = await fetch("/api/ai/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text }) });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.answer || data.error || "I couldn't process that." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 'calc(100vh - 160px)', minHeight: 400 }} className="animate-fade-in">
      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16, minHeight: 0 }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 16px' }}>
            {/* Icon */}
            <div style={{ borderRadius: 20, padding: 20, marginBottom: 24, background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', boxShadow: '0 8px 24px rgba(124,58,237,0.25)' }}>
              <Sparkles style={{ width: 32, height: 32, color: '#fff' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>AI Financial Assistant</h2>
            <p style={{ fontSize: 14, color: '#64748B', maxWidth: 340, lineHeight: 1.6 }}>
              Ask anything about your finances. I analyze spending, find trends, and surface insights.
            </p>

            {/* Data context badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#EDE9FE', color: '#7C3AED', fontSize: 12, fontWeight: 500,
              padding: '6px 14px', borderRadius: 99, border: '1px solid #DDD6FE', marginTop: 12,
            }}>
              <Database style={{ width: 14, height: 14 }} />
              I have access to your transactions, invoices, and financial reports.
            </div>

            {/* Try Asking */}
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94A3B8', marginTop: 28, marginBottom: 12 }}>
              Try asking
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10, width: '100%', maxWidth: 480 }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="group cursor-pointer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: 14, minHeight: 56, borderRadius: 12, textAlign: 'left',
                    background: '#FFFFFF', border: '1px solid #E2E8F0',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#A78BFA'; e.currentTarget.style.background = '#FAFAFE'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF'; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageSquare style={{ width: 14, height: 14, color: '#7C3AED' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: '#0F172A' }}>{s}</span>
                  <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: 14, height: 14, color: '#7C3AED', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles style={{ width: 16, height: 16, color: '#fff' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '78%', borderRadius: 16, padding: '12px 16px', fontSize: 14, lineHeight: 1.6,
                  ...(msg.role === 'user'
                    ? { background: '#7C3AED', color: '#FFFFFF' }
                    : { background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0' })
                }}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: 32, height: 32, borderRadius: 12, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User style={{ width: 16, height: 16, color: '#fff' }} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles style={{ width: 16, height: 16, color: '#fff' }} />
                </div>
                <div style={{ borderRadius: 16, padding: '14px 16px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div className="animate-bounce" style={{ width: 8, height: 8, borderRadius: '50%', background: '#A78BFA', animationDelay: '0ms' }} />
                    <div className="animate-bounce" style={{ width: 8, height: 8, borderRadius: '50%', background: '#A78BFA', animationDelay: '150ms' }} />
                    <div className="animate-bounce" style={{ width: 8, height: 8, borderRadius: '50%', background: '#A78BFA', animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div style={{ paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} style={{ display: 'flex', gap: 12 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={loading}
            style={{
              flex: 1, height: 44, borderRadius: 10, padding: '0 16px', fontSize: 14,
              border: '1.5px solid #CBD5E1', color: '#0F172A', background: '#FFFFFF',
              outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'all 0.15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="cursor-pointer shrink-0" style={{ width: 44, height: 44, borderRadius: 10, padding: 0 }}>
            <Send style={{ width: 16, height: 16 }} />
          </Button>
        </form>
        <p style={{ fontSize: 10, color: '#CBD5E1', textAlign: 'center', marginTop: 8 }}>Press Enter to send</p>
      </div>
    </div>
  );
}
