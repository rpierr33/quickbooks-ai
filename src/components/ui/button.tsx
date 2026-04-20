import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantClass: Record<string, string> = {
      default: "btn primary",
      destructive: "btn stamp",
      outline: "btn",
      secondary: "btn",
      ghost: "btn ghost",
      link: "btn ghost",
    };
    const sizeClass: Record<string, string> = {
      default: "",
      sm: "sm",
      lg: "lg",
      icon: "sm",
    };
    return (
      <button
        className={cn(variantClass[variant], sizeClass[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
