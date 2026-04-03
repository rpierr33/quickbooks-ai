"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 style={{ width: 18, height: 18, color: "#059669", flexShrink: 0 }} />,
  error: <AlertCircle style={{ width: 18, height: 18, color: "#DC2626", flexShrink: 0 }} />,
  info: <Info style={{ width: 18, height: 18, color: "#7C3AED", flexShrink: 0 }} />,
};

const bgColors: Record<ToastType, string> = {
  success: "#F0FDF4",
  error: "#FEF2F2",
  info: "#F5F3FF",
};

const borderColors: Record<ToastType, string> = {
  success: "#BBF7D0",
  error: "#FECACA",
  info: "#DDD6FE",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          bottom: 80,
          right: 16,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
          maxWidth: 380,
          width: "100%",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 12,
              background: bgColors[t.type],
              border: `1px solid ${borderColors[t.type]}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              pointerEvents: "auto",
              animation: "slideInRight 0.25s ease-out",
            }}
          >
            {icons[t.type]}
            <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", flex: 1, margin: 0 }}>
              {t.message}
            </p>
            <button
              onClick={() => dismiss(t.id)}
              className="cursor-pointer"
              style={{
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                padding: 2,
                flexShrink: 0,
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
