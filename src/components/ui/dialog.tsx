"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

function Dialog({ open, onClose, children, width }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dialog-scrim" onClick={onClose} role="presentation">
      <div
        className="dialog"
        style={width ? { width } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14, right: 14,
            width: 28, height: 28,
            color: "var(--ink-3)",
            fontFamily: "var(--mono)",
            fontSize: 14,
            zIndex: 10,
          }}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <header className={cn(className)} {...props} />;
}

function DialogTitle({ className, style, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("dtitle", className)}
      style={{
        fontFamily: "var(--display)",
        fontSize: 32,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        fontWeight: 400,
        color: "var(--ink)",
        ...style,
      }}
      {...props}
    />
  );
}

function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("body", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("foot", className)} {...props} />;
}

export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter };
