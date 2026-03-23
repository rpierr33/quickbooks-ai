"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={className} data-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

function TabsList({ children, className, value, onValueChange }: TabsListProps) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue: value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeValue?: string;
  onValueChange?: (value: string) => void;
}

function TabsTrigger({ value, children, className, activeValue, onValueChange }: TabsTriggerProps) {
  const isActive = activeValue === value;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
        className
      )}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabsContent({ value, children, className, ...props }: TabsContentProps & { [key: string]: any }) {
  const parentValue = props.value;
  // This needs context - simplified approach
  return (
    <div className={cn("mt-4", className)} data-tab-value={value}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
