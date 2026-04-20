"use client";
import React, { useState, useRef, useEffect } from "react";
import { ProductTour } from "@/components/ui/product-tour";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Where did my money go last month?",
  "How am I doing versus the prior month?",
  "Draft a firm-but-polite nudge for the overdue invoice.",
  "What should I set aside for quarterly taxes?",
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const firstName = "Rosa"; // fallback display name

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer || data.error || "I couldn't read that clearly. Try rewording?" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong on my end. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-shell">
      {messages.length === 0 ? (
        <div className="chat-empty">
          <div className="kicker">Ask Ledgr</div>
          <h1>
            Answers, <em>straight from your books</em>
          </h1>
          <p className="lead">
            Plain language in, plain answers out. I read your transactions, invoices, and categories so you don't have to.
          </p>
          <div className="chat-suggestions" data-tour="suggestion-chips">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} type="button" className="chat-sugg" onClick={() => sendMessage(s)}>
                <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="q">{s}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-thread">
          {messages.map((m, i) => (
            <div key={i} className={"chat-msg " + (m.role === "user" ? "you" : "")}>
              <div className="speaker">{m.role === "user" ? firstName : "Ledgr"}</div>
              <div className="speech">
                {m.content.split("\n").map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg">
              <div className="speaker">Ledgr</div>
              <div className="speech" style={{ color: "var(--ink-3)" }}>
                Reading your books…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <form
        className="chat-input"
        data-tour="chat-input-area"
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
      >
        <input
          data-tour="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about cash, categories, clients…"
          disabled={loading}
        />
        <button
          data-tour="send-btn"
          type="submit"
          className="send"
          disabled={loading || !input.trim()}
          aria-label="Send"
        >
          Send
        </button>
      </form>

      <ProductTour
        tourId="ai-chat"
        delay={800}
        steps={[
          {
            element: '[data-tour="suggestion-chips"]',
            popover: {
              title: "Quick starters",
              description: "Tap any of these to ask a common question. Ledgr pulls from your real data to answer.",
              side: "top",
            },
          },
          {
            element: '[data-tour="chat-input"]',
            popover: {
              title: "Ask in plain words",
              description: "Type any question about your finances. 'Biggest expense?', 'Am I profitable?' — plain English works.",
              side: "top",
            },
          },
        ]}
      />
    </div>
  );
}
