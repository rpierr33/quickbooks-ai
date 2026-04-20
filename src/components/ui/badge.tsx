import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const tone: Record<string, string> = {
    default: "",
    secondary: "draft",
    success: "paid",
    warning: "sent",
    destructive: "overdue",
    outline: "draft",
  };
  return <div className={cn("pill", tone[variant], className)} {...props} />;
}

export { Badge };
export type { BadgeProps };
