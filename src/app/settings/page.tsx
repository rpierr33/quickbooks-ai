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
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <CardTitle>Company Info</CardTitle>
              <CardDescription>Basic information about your business</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Company Name</label>
            <Input defaultValue="My Business" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <Input type="email" defaultValue="admin@mybusiness.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Currency</label>
            <Select defaultValue="USD">
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="CAD">CAD — Canadian Dollar</option>
            </Select>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <div>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Link your bank accounts for automatic import</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-900">Bank Connection</p>
              <p className="text-xs text-gray-500">Connect via Plaid for automatic transaction import</p>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">CSV Import</p>
              <p className="text-xs text-gray-500">Upload bank statements manually</p>
            </div>
            <Badge variant="success">Available</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-400" />
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>Authentication and access control</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Authentication</p>
              <p className="text-xs text-gray-500">User login and session management</p>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
