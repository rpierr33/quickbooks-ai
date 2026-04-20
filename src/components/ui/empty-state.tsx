import React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: "full" | "compact";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "full",
  className,
}: EmptyStateProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(className)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: isCompact ? "28px 20px" : "60px 24px",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          border: "1px solid var(--rule)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
          width: isCompact ? 40 : 56,
          height: isCompact ? 40 : 56,
          background: "var(--paper-2)",
        }}
      >
        <Icon
          style={{ width: isCompact ? 18 : 22, height: isCompact ? 18 : 22, color: "var(--ink-3)" }}
          aria-hidden="true"
        />
      </div>
      <h3
        style={{
          fontFamily: "var(--display)",
          fontSize: isCompact ? 22 : 28,
          fontStyle: "italic",
          fontWeight: 400,
          color: "var(--ink)",
          margin: 0,
          letterSpacing: "-0.015em",
          lineHeight: 1.05,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          color: "var(--ink-3)",
          maxWidth: "42ch",
          lineHeight: 1.5,
          marginTop: 10,
          fontSize: isCompact ? 13 : 15,
        }}
      >
        {description}
      </p>
      {action && <div style={{ marginTop: isCompact ? 18 : 24 }}>{action}</div>}
    </div>
  );
}
