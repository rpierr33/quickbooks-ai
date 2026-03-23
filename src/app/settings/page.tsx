"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CreditCard, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-xl space-y-5 animate-fade-in font-[family-name:var(--font-plus-jakarta)]">
      {/* Company Info */}
      <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 overflow-hidden">
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900">Company Info</h3>
              <p className="text-[11px] text-slate-400">Basic information about your business</p>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">Company Name</label>
            <Input
              defaultValue="My Business"
              className="h-12 rounded-xl bg-white/60 border-slate-200/60 focus:ring-indigo-500/30 text-[13px]"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">Email</label>
            <Input
              type="email"
              defaultValue="admin@mybusiness.com"
              className="h-12 rounded-xl bg-white/60 border-slate-200/60 focus:ring-indigo-500/30 text-[13px]"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">Currency</label>
            <Select
              defaultValue="USD"
              className="h-12 rounded-xl bg-white/60 border-slate-200/60 focus:ring-indigo-500/30 text-[13px]"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="CAD">CAD — Canadian Dollar</option>
            </Select>
          </div>
          <Button className="cursor-pointer rounded-2xl h-12 bg-indigo-600 hover:bg-indigo-700 text-[13px] font-semibold px-6">
            Save Changes
          </Button>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 overflow-hidden">
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900">Connected Accounts</h3>
              <p className="text-[11px] text-slate-400">Link your bank accounts for automatic import</p>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between py-4 border-b border-slate-100/60">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Bank Connection</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Connect via Plaid for automatic transaction import</p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
              Coming Soon
            </span>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">CSV Import</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Upload bank statements manually</p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
              Available
            </span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/80 overflow-hidden">
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900">Security</h3>
              <p className="text-[11px] text-slate-400">Authentication and access control</p>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Authentication</p>
              <p className="text-[11px] text-slate-400 mt-0.5">User login and session management</p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
