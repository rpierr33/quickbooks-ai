"use client";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Clock, Play, Pause, Square, Pencil, Trash2, FileText } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

interface TimeEntry {
  id: string;
  date: string;
  client_name: string;
  project_name: string;
  description: string;
  hours: number;
  minutes: number;
  is_billable: boolean;
  hourly_rate: number;
  total_amount: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  client_name: "",
  project_name: "",
  description: "",
  hours: "0",
  minutes: "0",
  is_billable: true,
  hourly_rate: "150",
  notes: "",
};

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function entryDuration(entry: TimeEntry) {
  const total = entry.hours * 60 + entry.minutes;
  if (total < 60) return `${total}m`;
  return `${entry.hours}h ${entry.minutes > 0 ? `${entry.minutes}m` : ""}`.trim();
}

export default function TimeTrackingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop timer dialog
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [stopForm, setStopForm] = useState({
    client_name: "",
    project_name: "",
    description: "",
    is_billable: true,
    hourly_rate: "150",
    notes: "",
  });

  // Manual entry dialog
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Filters
  const [clientFilter, setClientFilter] = useState("all");
  const [billableFilter, setBillableFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: entries, isLoading } = useQuery<TimeEntry[]>({
    queryKey: ["time_entries", clientFilter, billableFilter, dateFrom, dateTo],
    queryFn: () => {
      const p = new URLSearchParams();
      if (clientFilter !== "all") p.set("client", clientFilter);
      if (billableFilter !== "all") p.set("billable", billableFilter);
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo) p.set("date_to", dateTo);
      return fetch(`/api/time-entries?${p}`).then(r => r.json());
    },
  });

  const now = new Date();
  const weekStart = (() => {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split("T")[0];
  })();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const stats = useMemo(() => {
    if (!entries) return { weekHours: 0, monthHours: 0, weekBillable: 0, monthBillable: 0 };
    const toH = (e: TimeEntry) => e.hours + e.minutes / 60;
    const weekEntries = entries.filter(e => e.date >= weekStart);
    const monthEntries = entries.filter(e => e.date >= monthStart);
    return {
      weekHours: weekEntries.reduce((s, e) => s + toH(e), 0),
      monthHours: monthEntries.reduce((s, e) => s + toH(e), 0),
      weekBillable: weekEntries.filter(e => e.is_billable).reduce((s, e) => s + e.total_amount, 0),
      monthBillable: monthEntries.filter(e => e.is_billable).reduce((s, e) => s + e.total_amount, 0),
    };
  }, [entries]);

  const uniqueClients = useMemo(() => {
    if (!entries) return [];
    return [...new Set(entries.map(e => e.client_name))].sort();
  }, [entries]);

  // Timer control
  const startTimer = useCallback(() => {
    setTimerRunning(true);
    setTimerPaused(false);
    intervalRef.current = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerPaused(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerPaused(false);
    intervalRef.current = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    setTimerPaused(false);
    setShowStopDialog(true);
  }, []);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    setTimerPaused(false);
    setTimerSeconds(0);
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          hours: parseInt(data.hours || "0"),
          minutes: parseInt(data.minutes || "0"),
          hourly_rate: parseFloat(data.hourly_rate || "0"),
          is_billable: data.is_billable,
        }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      closeEntryDialog();
      toast("Time entry saved");
    },
    onError: () => toast("Failed to save time entry", "error"),
  });

  const saveTimerMutation = useMutation({
    mutationFn: (data: typeof stopForm) => {
      const totalSecs = timerSeconds;
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      return fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          date: new Date().toISOString().split("T")[0],
          hours,
          minutes,
          hourly_rate: parseFloat(data.hourly_rate || "0"),
          is_billable: data.is_billable,
        }),
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      setShowStopDialog(false);
      resetTimer();
      setStopForm({ client_name: "", project_name: "", description: "", is_billable: true, hourly_rate: "150", notes: "" });
      toast("Time entry saved");
    },
    onError: () => toast("Failed to save time entry", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & typeof form) =>
      fetch(`/api/time-entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          hours: parseInt(data.hours || "0"),
          minutes: parseInt(data.minutes || "0"),
          hourly_rate: parseFloat(data.hourly_rate || "0"),
        }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      closeEntryDialog();
      toast("Time entry updated");
    },
    onError: () => toast("Failed to update time entry", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/time-entries/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      setDeletingId(null);
      toast("Time entry deleted");
    },
    onError: () => toast("Failed to delete time entry", "error"),
  });

  function openEdit(entry: TimeEntry) {
    setForm({
      date: entry.date?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      client_name: entry.client_name,
      project_name: entry.project_name,
      description: entry.description,
      hours: String(entry.hours),
      minutes: String(entry.minutes),
      is_billable: entry.is_billable,
      hourly_rate: String(entry.hourly_rate),
      notes: entry.notes ?? "",
    });
    setEditingId(entry.id);
    setShowEntryDialog(true);
  }

  function closeEntryDialog() {
    setShowEntryDialog(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  const handleSaveEntry = () => {
    if (!form.client_name || !form.project_name || !form.description) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const previewAmount = form.is_billable
    ? (parseInt(form.hours || "0") + parseInt(form.minutes || "0") / 60) * parseFloat(form.hourly_rate || "0")
    : 0;

  const isSaving = createMutation.isPending || updateMutation.isPending || saveTimerMutation.isPending;

  // "Create Invoice from Time" — navigate to invoices with query
  const handleCreateInvoice = () => {
    router.push("/invoices?from=time-tracking");
  };

  const statCards = [
    { label: "Hours This Week", value: `${stats.weekHours.toFixed(1)}h`, sub: "Current week" },
    { label: "Hours This Month", value: `${stats.monthHours.toFixed(1)}h`, sub: "Current month" },
    { label: "Billable This Week", value: formatCurrency(stats.weekBillable), sub: "Revenue earned" },
    { label: "Billable This Month", value: formatCurrency(stats.monthBillable), sub: "Revenue earned" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>Time Tracking</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Track billable hours and generate invoices from your time.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {entries && entries.length > 0 && (
            <Button variant="outline" onClick={handleCreateInvoice} className="cursor-pointer" style={{ padding: "0 14px" }}>
              <FileText style={{ width: 15, height: 15, marginRight: 6 }} /> Create Invoice
            </Button>
          )}
          <Button onClick={() => setShowEntryDialog(true)} className="cursor-pointer" style={{ padding: "0 18px" }}>
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Manual Entry
          </Button>
        </div>
      </div>

      {/* Active Timer Card */}
      <div style={{ ...card, padding: 0 }}>
        <div style={{ padding: "20px 24px", borderBottom: timerRunning || timerSeconds > 0 ? "1px solid #E2E8F0" : "none", display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8", marginBottom: 4 }}>Active Timer</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  fontSize: 36, fontWeight: 700, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums",
                  color: timerRunning && !timerPaused ? "#7C3AED" : "#0F172A",
                  transition: "color 0.3s",
                }}>
                  {formatDuration(timerSeconds)}
                </span>
                {timerRunning && !timerPaused && (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED", animation: "pulse 1.5s infinite" }} />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!timerRunning ? (
                <button
                  onClick={startTimer}
                  className="cursor-pointer"
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #9333EA)", color: "#FFFFFF", border: "none", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 12px rgba(124,58,237,0.3)", transition: "all 0.15s" }}
                >
                  <Play style={{ width: 16, height: 16 }} /> Start
                </button>
              ) : timerPaused ? (
                <>
                  <button onClick={resumeTimer} className="cursor-pointer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, background: "#7C3AED", color: "#FFFFFF", border: "none", fontSize: 13, fontWeight: 600 }}>
                    <Play style={{ width: 14, height: 14 }} /> Resume
                  </button>
                  <button onClick={stopTimer} className="cursor-pointer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, background: "#EF4444", color: "#FFFFFF", border: "none", fontSize: 13, fontWeight: 600 }}>
                    <Square style={{ width: 14, height: 14 }} /> Stop
                  </button>
                </>
              ) : (
                <>
                  <button onClick={pauseTimer} className="cursor-pointer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, background: "#FFFFFF", color: "#475569", border: "1px solid #E2E8F0", fontSize: 13, fontWeight: 600 }}>
                    <Pause style={{ width: 14, height: 14 }} /> Pause
                  </button>
                  <button onClick={stopTimer} className="cursor-pointer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, background: "#EF4444", color: "#FFFFFF", border: "none", fontSize: 13, fontWeight: 600 }}>
                    <Square style={{ width: 14, height: 14 }} /> Stop &amp; Save
                  </button>
                </>
              )}
              {timerSeconds > 0 && !timerRunning && (
                <button onClick={resetTimer} className="cursor-pointer" style={{ padding: "10px 14px", borderRadius: 10, background: "#FFFFFF", color: "#94A3B8", border: "1px solid #E2E8F0", fontSize: 13 }}>
                  Reset
                </button>
              )}
            </div>
          </div>
          {!timerRunning && timerSeconds === 0 && (
            <p style={{ fontSize: 12, color: "#94A3B8" }}>Click Start to begin timing. When you stop, you can assign it to a client and project.</p>
          )}
        </div>
      </div>

      {/* Stats */}
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
        <Select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="w-44">
          <option value="all">All clients</option>
          {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={billableFilter} onChange={e => setBillableFilter(e.target.value)} className="w-36">
          <option value="all">All entries</option>
          <option value="true">Billable only</option>
          <option value="false">Non-billable</option>
        </Select>
        <div className="flex gap-2 items-center">
          <label style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>From</label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140 }} />
        </div>
        <div className="flex gap-2 items-center">
          <label style={{ fontSize: 12, color: "#64748B" }}>To</label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140 }} />
        </div>
        {(dateFrom || dateTo || clientFilter !== "all" || billableFilter !== "all") && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); setClientFilter("all"); setBillableFilter("all"); }} style={{ fontSize: 12, color: "#7C3AED", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
            Clear
          </button>
        )}
      </div>

      {/* Time Entries List */}
      <div style={card}>
        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg animate-shimmer" />)}
          </div>
        ) : !entries || entries.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No time entries yet"
            description="Start the timer above or add a manual entry to begin tracking your billable hours."
            action={<Button size="sm" onClick={() => setShowEntryDialog(true)} className="cursor-pointer"><Plus style={{ width: 16, height: 16, marginRight: 4 }} /> Manual Entry</Button>}
          />
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden">
              {entries.map((entry, i) => (
                <div key={entry.id} style={{ padding: "14px 16px", borderBottom: i < entries.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{entry.client_name} <span style={{ fontWeight: 400, color: "#64748B" }}>/ {entry.project_name}</span></p>
                      <p style={{ fontSize: 12, color: "#475569", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.description}</p>
                      <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{formatDate(entry.date)}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>{entryDuration(entry)}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99, background: entry.is_billable ? "#EDE9FE" : "#F1F5F9", color: entry.is_billable ? "#5B21B6" : "#64748B" }}>
                          {entry.is_billable ? "Billable" : "Non-billable"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: entry.is_billable ? "#059669" : "#94A3B8" }}>
                        {entry.is_billable ? formatCurrency(entry.total_amount) : "—"}
                      </span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => openEdit(entry)} className="cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E8F0", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                          <Pencil style={{ width: 12, height: 12 }} />
                        </button>
                        <button onClick={() => setDeletingId(entry.id)} className="cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", minWidth: 800 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
                    {["Date", "Client", "Project", "Description", "Duration", "Type", "Amount", ""].map((h, ci) => (
                      <th key={ci} style={{ padding: "12px 16px", textAlign: ci >= 4 ? "right" as const : "left" as const, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#64748B" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr key={entry.id}
                      style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 1 ? "#FAFBFC" : "transparent" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? "#FAFBFC" : "transparent")}
                    >
                      <td style={{ padding: "14px 16px", color: "#64748B", whiteSpace: "nowrap" }}>{formatDate(entry.date)}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0F172A" }}>{entry.client_name}</td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>{entry.project_name}</td>
                      <td style={{ padding: "14px 16px", color: "#475569", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.description}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 500, color: "#0F172A", whiteSpace: "nowrap" }}>{entryDuration(entry)}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: entry.is_billable ? "#EDE9FE" : "#F1F5F9", color: entry.is_billable ? "#5B21B6" : "#64748B" }}>
                          {entry.is_billable ? "Billable" : "Non-billable"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, color: entry.is_billable ? "#059669" : "#94A3B8" }}>
                        {entry.is_billable ? formatCurrency(entry.total_amount) : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                          <button onClick={() => openEdit(entry)} className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #E2E8F0", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                            <Pencil style={{ width: 13, height: 13 }} />
                          </button>
                          <button onClick={() => setDeletingId(entry.id)} className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "flex-end", gap: 32 }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>
                {entries.length} entr{entries.length !== 1 ? "ies" : "y"} &middot; {entries.reduce((s, e) => s + e.hours + e.minutes / 60, 0).toFixed(1)}h total
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>
                {formatCurrency(entries.filter(e => e.is_billable).reduce((s, e) => s + e.total_amount, 0))} billable
              </span>
            </div>
          </>
        )}
      </div>

      {/* Stop Timer Dialog */}
      <Dialog open={showStopDialog} onClose={() => { setShowStopDialog(false); resetTimer(); }}>
        <DialogHeader>
          <DialogTitle>Save Time Entry</DialogTitle>
          <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#EDE9FE", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Clock style={{ width: 14, height: 14, color: "#7C3AED" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#5B21B6", fontVariantNumeric: "tabular-nums" }}>{formatDuration(timerSeconds)}</span>
          </div>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Client</label>
                <Input placeholder="e.g., Acme Corp" value={stopForm.client_name} onChange={e => setStopForm({ ...stopForm, client_name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Project</label>
                <Input placeholder="e.g., Website Redesign" value={stopForm.project_name} onChange={e => setStopForm({ ...stopForm, project_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Description</label>
              <Input placeholder="What did you work on?" value={stopForm.description} onChange={e => setStopForm({ ...stopForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Billable Rate ($/hr)</label>
                <Input type="number" min="0" step="5" placeholder="0" value={stopForm.hourly_rate} onChange={e => setStopForm({ ...stopForm, hourly_rate: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 2 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#475569", cursor: "pointer" }}>
                  <input type="checkbox" checked={stopForm.is_billable} onChange={e => setStopForm({ ...stopForm, is_billable: e.target.checked })} style={{ width: 16, height: 16, accentColor: "#7C3AED" }} />
                  Billable
                </label>
              </div>
            </div>
            {stopForm.is_billable && parseFloat(stopForm.hourly_rate || "0") > 0 && (
              <div style={{ borderRadius: 8, padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#15803D" }}>Amount</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#15803D" }}>
                  {formatCurrency((timerSeconds / 3600) * parseFloat(stopForm.hourly_rate || "0"))}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => { setShowStopDialog(false); resetTimer(); }} className="flex-1 cursor-pointer">Discard</Button>
          <Button onClick={() => saveTimerMutation.mutate(stopForm)} disabled={saveTimerMutation.isPending || !stopForm.client_name || !stopForm.description} className="flex-1 cursor-pointer">
            {saveTimerMutation.isPending ? "Saving..." : "Save Entry"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Manual Entry / Edit Dialog */}
      <Dialog open={showEntryDialog} onClose={closeEntryDialog}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Time Entry" : "New Time Entry"}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Date</label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Client</label>
                <Input placeholder="e.g., Acme Corp" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Project</label>
                <Input placeholder="e.g., Website" value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Description</label>
              <Input placeholder="What did you work on?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Hours</label>
                <Input type="number" min="0" placeholder="0" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Minutes</label>
                <Input type="number" min="0" max="59" placeholder="0" value={form.minutes} onChange={e => setForm({ ...form, minutes: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Hourly Rate ($)</label>
                <Input type="number" min="0" step="5" placeholder="0" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 2 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#475569", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.is_billable} onChange={e => setForm({ ...form, is_billable: e.target.checked })} style={{ width: 16, height: 16, accentColor: "#7C3AED" }} />
                  Billable
                </label>
              </div>
            </div>
            {form.is_billable && previewAmount > 0 && (
              <div style={{ borderRadius: 8, padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#15803D" }}>Amount</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#15803D" }}>{formatCurrency(previewAmount)}</span>
              </div>
            )}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Notes (optional)</label>
              <Input placeholder="Any additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={closeEntryDialog} className="flex-1 cursor-pointer">Cancel</Button>
          <Button onClick={handleSaveEntry} disabled={isSaving || !form.client_name || !form.project_name || !form.description} className="flex-1 cursor-pointer">
            {isSaving ? "Saving..." : editingId ? "Update Entry" : "Save Entry"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)}>
        <DialogHeader><DialogTitle>Delete Time Entry</DialogTitle></DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>Are you sure you want to delete this time entry? This cannot be undone.</p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setDeletingId(null)} className="flex-1 cursor-pointer">Cancel</Button>
          <Button
            onClick={() => { if (deletingId) deleteMutation.mutate(deletingId); }}
            disabled={deleteMutation.isPending}
            className="flex-1 cursor-pointer"
            style={{ background: "#EF4444", borderColor: "#EF4444" }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
