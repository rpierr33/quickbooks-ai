"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Dialog({ open, onClose, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-[61] w-full md:max-w-lg md:mx-4 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl animate-fade-in max-h-[85vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-0 md:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 md:top-4 rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 md:p-6 pb-2", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-xl font-bold text-gray-900", className)} {...props} />;
}

function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-3 md:p-6 md:pt-2", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex gap-3 p-5 md:p-6 pt-3 border-t border-gray-100", className)} {...props} />;
}

export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter };
