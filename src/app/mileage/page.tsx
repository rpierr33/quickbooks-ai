"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Car, Pencil, Trash2, MapPin, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const IRS_RATES: Record<string, number> = {
  business: 0.70,
  medical: 0.21,
  charity: 0.14,
  personal: 0,
};

const PURPOSE_LABELS: Record<string, string> = {
  business: "Business",
  medical: "Medical",
  charity: "Charity",
  personal: "Personal",
};

const PURPOSE_COLORS: Record<string, { bg: string; color: string }> = {
  business: { bg: "#F5E0D9", color: "#5B21B6" },
  medical: { bg: "#DDE4EC", color: "#065F46" },
  charity: { bg: "#FFF7ED", color: "#9A3412" },
  personal: { bg: "#F1F5F9", color: "#475569" },
};

const card: React.CSSProperties = {
  background: "var(--paper-2)",
  border: "1px solid var(--rule)",
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

interface MileageRecord {
  id: string;
  date: string;
  from_location: string;
  to_location: string;
  miles: number;
  purpose: string;
  rate_per_mile: number;
  deduction_amount: number;
  is_round_trip: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  from_location: "",
  to_location: "",
  miles: "",
  purpose: "business",
  is_round_trip: false,
  notes: "",
};

export default function MileagePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: records, isLoading } = useQuery<MileageRecord[]>({
    queryKey: ["mileage", purposeFilter, dateFrom, dateTo],
    queryFn: () => {
      const p = new URLSearchParams();
      if (purposeFilter !== "all") p.set("purpose", purposeFilter);
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo) p.set("date_to", dateTo);
      return fetch(`/api/mileage?${p}`).then(r => r.json());
    },
  });

  const now = new Date();
  const ytdStart = `${now.getFullYear()}-01-01`;
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const stats = useMemo(() => {
    if (!records) return { ytdMiles: 0, ytdDeduction: 0, monthTrips: 0, businessMiles: 0, personalMiles: 0 };
    const ytdMiles = records.filter(r => r.date >= ytdStart).reduce((s, r) => s + r.miles, 0);
    const ytdDeduction = records.filter(r => r.date >= ytdStart).reduce((s, r) => s + r.deduction_amount, 0);
    const monthTrips = records.filter(r => r.date >= monthStart).length;
    const businessMiles = records.filter(r => r.purpose === "business").reduce((s, r) => s + r.miles, 0);
    const personalMiles = records.filter(r => r.purpose === "personal").reduce((s, r) => s + r.miles, 0);
    return { ytdMiles, ytdDeduction, monthTrips, businessMiles, personalMiles };
  }, [records]);

  // Live deduction preview
  const previewMiles = parseFloat(form.miles || "0");
  const effectiveMiles = form.is_round_trip ? previewMiles * 2 : previewMiles;
  const previewDeduction = parseFloat((effectiveMiles * (IRS_RATES[form.purpose] ?? 0)).toFixed(2));

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/mileage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, miles: parseFloat(data.miles || "0") }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mileage"] });
      closeDialog();
      toast("Trip logged successfully");
    },
    onError: () => toast("Failed to log trip", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & typeof form) =>
      fetch(`/api/mileage/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, miles: parseFloat(data.miles || "0") }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mileage"] });
      closeDialog();
      toast("Trip updated");
    },
    onError: () => toast("Failed to update trip", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/mileage/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mileage"] });
      setDeletingId(null);
      toast("Trip deleted");
    },
    onError: () => toast("Failed to delete trip", "error"),
  });

  function openEdit(rec: MileageRecord) {
    setForm({
      date: rec.date?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      from_location: rec.from_location,
      to_location: rec.to_location,
      miles: String(rec.miles),
      purpose: rec.purpose,
      is_round_trip: rec.is_round_trip ?? false,
      notes: rec.notes ?? "",
    });
    setEditingId(rec.id);
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  const handleSubmit = () => {
    if (!form.from_location || !form.to_location || !form.miles) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const statCards = [
    { label: "Total Miles (YTD)", value: `${stats.ytdMiles.toFixed(1)} mi`, sub: "Year to date" },
    { label: "Total Deduction (YTD)", value: formatCurrency(stats.ytdDeduction), sub: "IRS standard rate" },
    { label: "Trips This Month", value: String(stats.monthTrips), sub: "Current month" },
    { label: "Business vs Personal", value: `${stats.businessMiles.toFixed(1)} / ${stats.personalMiles.toFixed(1)}`, sub: "Miles (business / personal)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>Mileage Tracking</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Log trips and calculate IRS deductions automatically.</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="cursor-pointer shrink-0" style={{ padding: "0 18px" }}>
          <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Log Trip
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} style={{ ...card, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Select value={purposeFilter} onChange={e => setPurposeFilter(e.target.value)} className="w-36">
          <option value="all">All purposes</option>
          <option value="business">Business</option>
          <option value="medical">Medical</option>
          <option value="charity">Charity</option>
          <option value="personal">Personal</option>
        </Select>
        <div className="flex gap-2 items-center">
          <label style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>From</label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140 }} />
        </div>
        <div className="flex gap-2 items-center">
          <label style={{ fontSize: 12, color: "#64748B" }}>To</label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140 }} />
        </div>
        {(dateFrom || dateTo || purposeFilter !== "all") && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); setPurposeFilter("all"); }}
            style={{ fontSize: 12, color: "#B33A1F", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* List */}
      <div style={card}>
        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg animate-shimmer" />)}
          </div>
        ) : !records || records.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No trips logged yet"
            description="Start tracking your business mileage to maximize your tax deductions."
            action={<Button size="sm" onClick={() => setShowDialog(true)} className="cursor-pointer"><Plus style={{ width: 16, height: 16, marginRight: 4 }} /> Log Trip</Button>}
          />
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden">
              {records.map((rec, i) => (
                <div key={rec.id} style={{ padding: "14px 16px", borderBottom: i < records.length - 1 ? "1px solid #F1F5F9" : "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{rec.from_location}</span>
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>→</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.to_location}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{formatDate(rec.date)}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>·</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>{rec.miles} mi{rec.is_round_trip ? " (RT)" : ""}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                          background: PURPOSE_COLORS[rec.purpose]?.bg ?? "#F1F5F9",
                          color: PURPOSE_COLORS[rec.purpose]?.color ?? "#475569",
                        }}>
                          {PURPOSE_LABELS[rec.purpose] ?? rec.purpose}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1C3A5B" }}>{formatCurrency(rec.deduction_amount)}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => openEdit(rec)} title="Edit" className="cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--rule)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                          <Pencil style={{ width: 12, height: 12 }} />
                        </button>
                        <button onClick={() => setDeletingId(rec.id)} title="Delete" className="cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #F5E0D9", background: "#F5E0D9", display: "flex", alignItems: "center", justifyContent: "center", color: "#B33A1F" }}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {rec.notes && <p style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>{rec.notes}</p>}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", minWidth: 800 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
                    {["Date", "From", "To", "Miles", "Purpose", "Rate", "Deduction", ""].map((h, ci) => (
                      <th key={ci} style={{ padding: "12px 16px", textAlign: ci >= 3 ? "right" as const : "left" as const, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#64748B", whiteSpace: "nowrap" as const }}>
                        {ci === 7 ? "" : h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, i) => (
                    <tr key={rec.id} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 1 ? "#EFE7D5" : "transparent" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? "#EFE7D5" : "transparent")}
                    >
                      <td style={{ padding: "14px 16px", color: "#64748B", whiteSpace: "nowrap" }}>{formatDate(rec.date)}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 500, color: "#0F172A", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.from_location}</td>
                      <td style={{ padding: "14px 16px", color: "#475569", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.to_location}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 500, color: "#0F172A", whiteSpace: "nowrap" }}>
                        {rec.miles} mi{rec.is_round_trip && <span style={{ marginLeft: 4 }}><RotateCcw style={{ width: 11, height: 11, display: "inline", verticalAlign: "middle", color: "#B33A1F" }} /></span>}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: PURPOSE_COLORS[rec.purpose]?.bg ?? "#F1F5F9", color: PURPOSE_COLORS[rec.purpose]?.color ?? "#475569" }}>
                          {PURPOSE_LABELS[rec.purpose] ?? rec.purpose}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: "#64748B" }}>${rec.rate_per_mile}/mi</td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, color: "#1C3A5B" }}>{formatCurrency(rec.deduction_amount)}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                          <button onClick={() => openEdit(rec)} title="Edit" className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid var(--rule)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                            <Pencil style={{ width: 13, height: 13 }} />
                          </button>
                          <button onClick={() => setDeletingId(rec.id)} title="Delete" className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #F5E0D9", background: "#F5E0D9", display: "flex", alignItems: "center", justifyContent: "center", color: "#B33A1F" }}>
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer totals */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #E2E8F0", background: "var(--paper)", display: "flex", justifyContent: "flex-end", gap: 32 }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>
                {records.length} trip{records.length !== 1 ? "s" : ""} &middot; {records.reduce((s, r) => s + r.miles, 0).toFixed(1)} total miles
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1C3A5B" }}>
                {formatCurrency(records.reduce((s, r) => s + r.deduction_amount, 0))} total deduction
              </span>
            </div>
          </>
        )}
      </div>

      {/* Log / Edit Trip Dialog */}
      <Dialog open={showDialog} onClose={closeDialog}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Trip" : "Log a Trip"}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Date</label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Purpose</label>
                <Select value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}>
                  <option value="business">Business</option>
                  <option value="personal">Personal</option>
                  <option value="medical">Medical</option>
                  <option value="charity">Charity</option>
                </Select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>
                <MapPin style={{ width: 13, height: 13, display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                Start Location
              </label>
              <Input placeholder="e.g., Office – 123 Main St" value={form.from_location} onChange={e => setForm({ ...form, from_location: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>
                <MapPin style={{ width: 13, height: 13, display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                End Location
              </label>
              <Input placeholder="e.g., Client HQ – 456 Park Ave" value={form.to_location} onChange={e => setForm({ ...form, to_location: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Miles Driven</label>
                <Input type="number" step="0.1" min="0" placeholder="0.0" value={form.miles} onChange={e => setForm({ ...form, miles: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 2 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#475569", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.is_round_trip} onChange={e => setForm({ ...form, is_round_trip: e.target.checked })} style={{ width: 16, height: 16, accentColor: "#B33A1F" }} />
                  Round trip
                </label>
                <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Doubles the mileage</p>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Notes (optional)</label>
              <Input placeholder="e.g., Client strategy meeting" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            {/* Deduction preview */}
            {previewMiles > 0 && (
              <div style={{ borderRadius: 10, padding: "12px 16px", background: "#DDE4EC", border: "1px solid #DDE4EC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#1C3A5B" }}>Estimated Deduction</p>
                  <p style={{ fontSize: 11, color: "#4ADE80", marginTop: 2 }}>
                    {form.is_round_trip ? `${(previewMiles * 2).toFixed(1)}` : previewMiles.toFixed(1)} mi × ${IRS_RATES[form.purpose] ?? 0}/mi
                  </p>
                </div>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#1C3A5B" }}>{formatCurrency(previewDeduction)}</span>
              </div>
            )}
            {form.purpose === "personal" && (
              <p style={{ fontSize: 12, color: "#8A5A1C", padding: "8px 12px", background: "#F2E7D0", borderRadius: 8, border: "1px solid #E8D8B8" }}>
                Personal mileage is not tax deductible ($0.00/mi).
              </p>
            )}
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={closeDialog} className="flex-1 cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.from_location || !form.to_location || !form.miles} className="flex-1 cursor-pointer">
            {isSaving ? "Saving..." : editingId ? "Update Trip" : "Log Trip"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)}>
        <DialogHeader><DialogTitle>Delete Trip</DialogTitle></DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>Are you sure you want to delete this trip record? This cannot be undone.</p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setDeletingId(null)} className="flex-1 cursor-pointer">Cancel</Button>
          <Button
            onClick={() => { if (deletingId) deleteMutation.mutate(deletingId); }}
            disabled={deleteMutation.isPending}
            className="flex-1 cursor-pointer"
            style={{ background: "#B33A1F", borderColor: "#B33A1F" }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
