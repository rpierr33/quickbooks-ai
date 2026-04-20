"use client";
import React, { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  X,
  FileText,
  Building2,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

const card: React.CSSProperties = {
  background: "var(--paper-2)",
  border: "1px solid var(--rule)",
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

type ImportTab = "csv" | "quickbooks" | "xero" | "ofx";
type Step = "upload" | "mapping" | "preview" | "importing" | "done";

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

const LEDGR_FIELDS = ["date", "description", "amount", "type"] as const;
type LedgrField = (typeof LEDGR_FIELDS)[number];

const FIELD_LABELS: Record<LedgrField, string> = {
  date: "Date",
  description: "Description",
  amount: "Amount",
  type: "Type (income/expense/transfer)",
};

const AUTO_DETECT_MAP: Record<string, LedgrField> = {
  date: "date",
  transaction_date: "date",
  trans_date: "date",
  posted_date: "date",
  posting_date: "date",
  description: "description",
  memo: "description",
  narrative: "description",
  details: "description",
  payee: "description",
  name: "description",
  amount: "amount",
  total: "amount",
  value: "amount",
  sum: "amount",
  debit: "amount",
  credit: "amount",
  type: "type",
  transaction_type: "type",
  category: "type",
};

function parseQbIIF(text: string): { rows: ParsedRow[]; errors: string[] } {
  const rows: ParsedRow[] = [];
  const errors: string[] = [];
  const lines = text.split(/\r?\n/);
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("!TRNS")) {
      headers = line.split("\t").slice(1);
      continue;
    }
    if (!line.startsWith("TRNS")) continue;
    const parts = line.split("\t").slice(1);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = parts[idx] ?? ""; });

    const rawDate = obj["DATE"] ?? obj["date"] ?? "";
    const memo = obj["MEMO"] ?? obj["memo"] ?? obj["NAME"] ?? "";
    const rawAmount = obj["AMOUNT"] ?? obj["amount"] ?? "0";
    const trnsType = (obj["TRNSTYPE"] ?? obj["trnstype"] ?? "").toUpperCase();

    if (!rawDate || !memo) {
      errors.push(`Line ${i + 1}: missing DATE or MEMO`);
      continue;
    }

    let isoDate = rawDate;
    const dateParts = rawDate.split("/");
    if (dateParts.length === 3) {
      const [m, d, y] = dateParts;
      isoDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    const amount = parseFloat(rawAmount.replace(/[^0-9.\-]/g, ""));
    if (isNaN(amount)) {
      errors.push(`Line ${i + 1}: invalid amount "${rawAmount}"`);
      continue;
    }

    let type: ParsedRow["type"] = amount < 0 ? "expense" : "income";
    if (trnsType === "TRANSFER") type = "transfer";
    rows.push({ date: isoDate, description: memo, amount: Math.abs(amount), type });
  }
  return { rows, errors };
}

function parseXeroCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const rows: ParsedRow[] = [];
  const errors: string[] = [];
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rawDate = row["Date"] ?? row["date"] ?? row["Transaction Date"] ?? "";
    const desc = row["Description"] ?? row["description"] ?? row["Payee"] ?? row["Reference"] ?? "";
    const rawAmount = row["Amount"] ?? row["amount"] ?? row["Debit"] ?? row["Credit"] ?? "0";
    const typeHint = (row["Type"] ?? row["type"] ?? "").toLowerCase();

    if (!rawDate || !desc) { errors.push(`Row ${i + 2}: missing Date or Description`); continue; }

    let isoDate = rawDate;
    if (rawDate.includes("/")) {
      const parts = rawDate.split("/");
      if (parts.length === 3 && parts[2].length === 4) {
        isoDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }

    const amount = parseFloat(rawAmount.replace(/[^0-9.\-]/g, ""));
    if (isNaN(amount)) { errors.push(`Row ${i + 2}: invalid amount "${rawAmount}"`); continue; }

    let type: ParsedRow["type"] = amount >= 0 ? "income" : "expense";
    if (typeHint.includes("transfer")) type = "transfer";
    else if (typeHint.includes("expense") || typeHint.includes("debit")) type = "expense";
    else if (typeHint.includes("revenue") || typeHint.includes("credit") || typeHint.includes("income")) type = "income";

    rows.push({ date: isoDate, description: desc, amount: Math.abs(amount), type });
  }
  return { rows, errors: [...result.errors.map((e) => e.message), ...errors] };
}

function parseOFX(text: string): { rows: ParsedRow[]; errors: string[] } {
  const rows: ParsedRow[] = [];
  const errors: string[] = [];
  const txBlockRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>|STMTTRN\b([\s\S]*?)END:STMTTRN/gi;
  let match;
  let txCount = 0;

  while ((match = txBlockRegex.exec(text)) !== null) {
    txCount++;
    const block = match[1] ?? match[2] ?? "";
    const getTag = (tag: string): string => {
      const xmlM = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i").exec(block);
      if (xmlM) return xmlM[1].trim();
      const sgmlM = new RegExp(`<${tag}>([^\n<]+)`, "i").exec(block);
      if (sgmlM) return sgmlM[1].trim();
      return "";
    };

    const rawDate = getTag("DTPOSTED");
    const rawAmount = getTag("TRNAMT");
    const name = getTag("NAME") || getTag("MEMO") || getTag("PAYEE");
    const trnType = getTag("TRNTYPE").toUpperCase();

    if (!rawDate || !rawAmount) { errors.push(`Transaction ${txCount}: missing DTPOSTED or TRNAMT`); continue; }

    const dateOnly = rawDate.replace(/[^0-9]/g, "").slice(0, 8);
    const isoDate = dateOnly.length === 8
      ? `${dateOnly.slice(0, 4)}-${dateOnly.slice(4, 6)}-${dateOnly.slice(6, 8)}`
      : rawDate;

    const amount = parseFloat(rawAmount.replace(/[^0-9.\-]/g, ""));
    if (isNaN(amount)) { errors.push(`Transaction ${txCount}: invalid amount "${rawAmount}"`); continue; }

    let type: ParsedRow["type"] = amount >= 0 ? "income" : "expense";
    if (trnType === "XFER" || trnType === "TRANSFER") type = "transfer";
    else if (trnType === "DEBIT" || trnType === "CHECK" || trnType === "PAYMENT") type = "expense";
    else if (trnType === "CREDIT" || trnType === "DEP" || trnType === "DIRECTDEP") type = "income";

    rows.push({ date: isoDate, description: name || `Transaction ${txCount}`, amount: Math.abs(amount), type });
  }

  if (txCount === 0) errors.push("No transactions found. Make sure this is a valid OFX/QFX file.");
  return { rows, errors };
}

function deduplicate(rows: ParsedRow[]): { unique: ParsedRow[]; dupeCount: number } {
  const seen = new Set<string>();
  const unique: ParsedRow[] = [];
  let dupeCount = 0;
  for (const row of rows) {
    const key = `${row.date}|${row.amount.toFixed(2)}|${row.description.toLowerCase().trim()}`;
    if (seen.has(key)) { dupeCount++; } else { seen.add(key); unique.push(row); }
  }
  return { unique, dupeCount };
}

async function batchImport(rows: ParsedRow[], onProgress: (n: number) => void): Promise<ImportResult> {
  let imported = 0, skipped = 0;
  const errors: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: row.date, description: row.description, amount: row.amount, type: row.type }),
      });
      if (res.ok) { imported++; }
      else { const err = await res.json().catch(() => ({ error: "Unknown" })); skipped++; errors.push(`Row ${i + 1}: ${err.error}`); }
    } catch { skipped++; errors.push(`Row ${i + 1}: Network error`); }
    onProgress(i + 1);
  }
  return { imported, skipped, errors };
}

const TABS: { id: ImportTab; label: string; icon: React.ReactNode; formats: string }[] = [
  { id: "csv", label: "CSV", icon: <FileSpreadsheet style={{ width: 14, height: 14 }} />, formats: ".csv" },
  { id: "quickbooks", label: "QuickBooks", icon: <Building2 style={{ width: 14, height: 14 }} />, formats: ".iif, .qbo" },
  { id: "xero", label: "Xero", icon: <FileText style={{ width: 14, height: 14 }} />, formats: ".csv (Xero export)" },
  { id: "ofx", label: "Bank Statement", icon: <CreditCard style={{ width: 14, height: 14 }} />, formats: ".ofx, .qfx" },
];

const FORMAT_GUIDES: Record<ImportTab, { title: string; steps: string[] }> = {
  csv: {
    title: "How to export a CSV",
    steps: [
      "Export transactions from your bank or accounting software as CSV",
      "Required columns: Date, Description/Memo, Amount",
      "Optional: Type column (income/expense/transfer)",
      "We will auto-detect column names — you can adjust before importing",
    ],
  },
  quickbooks: {
    title: "How to export from QuickBooks",
    steps: [
      "QuickBooks Desktop: File → Utilities → Export → Lists to IIF Files",
      "Select Transaction List and save as .IIF",
      "For QuickBooks Online bank data: Banking → Export → .QBO format",
      "IIF files contain TRNS rows with DATE, MEMO, AMOUNT, TRNSTYPE fields",
    ],
  },
  xero: {
    title: "How to export from Xero",
    steps: [
      "In Xero: Accounting → Bank Accounts → select account → Export",
      "Choose CSV format and your date range",
      "Xero exports include: Date, Description, Amount, Reference columns",
      "Both debit/credit and single-amount formats are supported",
    ],
  },
  ofx: {
    title: "How to export a bank statement",
    steps: [
      "Most banks offer OFX/QFX download under Statements or Export",
      "Look for Microsoft Money, Quicken, or OFX export option",
      "The file contains STMTTRN blocks with dates, amounts, and payee names",
      "Both XML-style and legacy SGML-style OFX formats are supported",
    ],
  },
};

export default function ImportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ImportTab>("csv");
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState("");

  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, LedgrField | "">>({});

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [dupeCount, setDupeCount] = useState(0);

  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoDetectMapping = useCallback((headers: string[]) => {
    const detected: Record<string, LedgrField | ""> = {};
    for (const h of headers) {
      const norm = h.toLowerCase().trim();
      if (AUTO_DETECT_MAP[norm]) {
        const alreadyMapped = Object.values(detected).includes(AUTO_DETECT_MAP[norm]);
        detected[h] = alreadyMapped ? "" : AUTO_DETECT_MAP[norm];
      } else { detected[h] = ""; }
    }
    return detected;
  }, []);

  const handleFile = useCallback((file: File) => {
    setParseError("");
    setParseWarnings([]);
    setDupeCount(0);
    setFileName(file.name);
    const lower = file.name.toLowerCase();

    if (activeTab === "csv") {
      if (!lower.endsWith(".csv")) { setParseError("Please upload a .csv file."); return; }
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          if (res.errors.length > 0 && res.data.length === 0) { setParseError("Failed to parse CSV: " + res.errors[0].message); return; }
          const data = res.data as Record<string, string>[];
          if (data.length === 0) { setParseError("CSV file is empty."); return; }
          const headers = Object.keys(data[0]);
          setCsvHeaders(headers);
          setCsvRows(data);
          setMapping(autoDetectMapping(headers));
          setStep("mapping");
        },
        error: (err) => setParseError("Failed to parse CSV: " + err.message),
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      let parsed: { rows: ParsedRow[]; errors: string[] };
      if (activeTab === "quickbooks") parsed = parseQbIIF(text);
      else if (activeTab === "xero") parsed = parseXeroCSV(text);
      else parsed = parseOFX(text);

      if (parsed.rows.length === 0 && parsed.errors.length > 0) { setParseError(parsed.errors[0]); return; }
      const { unique, dupeCount: dupes } = deduplicate(parsed.rows);
      setParsedRows(unique);
      setDupeCount(dupes);
      setParseWarnings(parsed.errors.slice(0, 10));
      setStep("preview");
    };
    reader.onerror = () => setParseError("Failed to read file.");
    reader.readAsText(file);
  }, [activeTab, autoDetectMapping]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const updateMapping = (csvCol: string, field: LedgrField | "") => {
    setMapping((prev) => {
      const next = { ...prev };
      if (field) { for (const k of Object.keys(next)) { if (next[k] === field) next[k] = ""; } }
      next[csvCol] = field;
      return next;
    });
  };

  const requiredFieldsMapped = LEDGR_FIELDS.every((f) => Object.values(mapping).includes(f));

  const reverseMapping = (): Record<LedgrField, string> => {
    const rev: Partial<Record<LedgrField, string>> = {};
    for (const [col, field] of Object.entries(mapping)) { if (field) rev[field] = col; }
    return rev as Record<LedgrField, string>;
  };

  const buildCsvRows = (): ParsedRow[] => {
    const map = reverseMapping();
    const rows: ParsedRow[] = [];
    for (const row of csvRows) {
      const date = row[map.date]?.trim() ?? "";
      const desc = row[map.description]?.trim() ?? "";
      const rawAmount = row[map.amount]?.trim() ?? "";
      const typeRaw = row[map.type]?.trim().toLowerCase() ?? "";
      if (!date || !desc || !rawAmount) continue;
      const amount = parseFloat(rawAmount.replace(/[^0-9.\-]/g, ""));
      if (isNaN(amount)) continue;
      let type: ParsedRow["type"] = "expense";
      if (["income", "revenue", "credit", "deposit"].includes(typeRaw)) type = "income";
      else if (typeRaw === "transfer") type = "transfer";
      else if (!typeRaw && amount > 0) type = "income";
      rows.push({ date, description: desc, amount: Math.abs(amount), type });
    }
    return rows;
  };

  const startImport = async (rows: ParsedRow[]) => {
    const { unique, dupeCount: dupes } = deduplicate(rows);
    setStep("importing");
    setImportTotal(unique.length);
    setImportProgress(0);
    if (dupes > 0) setDupeCount((d) => d + dupes);
    const res = await batchImport(unique, (n) => setImportProgress(n));
    setResult(res);
    setStep("done");
  };

  const reset = () => {
    setStep("upload");
    setFileName("");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setParsedRows([]);
    setParseWarnings([]);
    setParseError("");
    setImportProgress(0);
    setImportTotal(0);
    setResult(null);
    setDupeCount(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTabChange = (tab: ImportTab) => {
    if (step !== "importing") { setActiveTab(tab); reset(); }
  };

  const guide = FORMAT_GUIDES[activeTab];
  const accept = activeTab === "csv" ? ".csv" : activeTab === "quickbooks" ? ".iif,.qbo" : activeTab === "xero" ? ".csv" : ".ofx,.qfx";

  return (
    <div className="animate-fade-in" style={{ maxWidth: 960, width: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>Data Import</h2>
        <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>Import transactions from CSV, QuickBooks, Xero, or bank statements</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, background: "var(--paper-3)", padding: 4, borderRadius: 8, marginBottom: 20, overflowX: "auto" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="cursor-pointer"
            style={{
              flex: "0 0 auto",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 9,
              border: "none",
              background: activeTab === tab.id ? "#FFFFFF" : "transparent",
              color: activeTab === tab.id ? "#0F172A" : "#64748B",
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: "pointer",
              boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* UPLOAD STEP */}
        {step === "upload" && (
          <>
            <div style={{ background: "#DDE4EC", border: "1px solid #DDE4EC", borderRadius: 8, padding: "14px 18px" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#3A352A", marginBottom: 6 }}>{guide.title}</p>
              <ol style={{ paddingLeft: 16, margin: 0 }}>
                {guide.steps.map((s, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#171510", marginTop: 3, lineHeight: 1.5 }}>{s}</li>
                ))}
              </ol>
            </div>

            <div style={card}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F5E0D9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Upload style={{ width: 18, height: 18, color: "#B33A1F" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Upload {TABS.find((t) => t.id === activeTab)?.label} File</h3>
                  <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Accepted formats: {TABS.find((t) => t.id === activeTab)?.formats}</p>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? "#B33A1F" : "#E2E8F0"}`,
                    borderRadius: 8,
                    padding: "48px 24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    background: dragOver ? "#F5E0D9" : "#EFE7D5",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 8, background: dragOver ? "#F5E0D9" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    <FileSpreadsheet style={{ width: 28, height: 28, color: dragOver ? "#B33A1F" : "#94A3B8" }} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>{dragOver ? "Drop your file here" : "Drag & drop your file here"}</p>
                    <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>or <span style={{ color: "#B33A1F", fontWeight: 500 }}>click to browse</span></p>
                  </div>
                  <p style={{ fontSize: 11, color: "#CFBF9E" }}>Max file size: 10 MB</p>
                </div>
                <input ref={fileInputRef} type="file" accept={accept} onChange={onFileSelect} style={{ display: "none" }} />
                {parseError && (
                  <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#F5E0D9", border: "1px solid #F5E0D9", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle style={{ width: 16, height: 16, color: "#B33A1F", flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "#922D15" }}>{parseError}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* CSV MAPPING STEP */}
        {step === "mapping" && activeTab === "csv" && (
          <>
            <div style={{ ...card, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FileSpreadsheet style={{ width: 18, height: 18, color: "#B33A1F" }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{fileName}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8" }}>{csvRows.length} rows found</p>
                </div>
              </div>
              <button onClick={reset} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "#94A3B8" }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={card}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F5E0D9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ArrowRight style={{ width: 18, height: 18, color: "#B33A1F" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Map Columns</h3>
                  <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Match your CSV columns to Ledgr fields. We auto-detected some for you.</p>
                </div>
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                {csvHeaders.map((h) => (
                  <div key={h} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ width: 180, flexShrink: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{h}</p>
                      <p style={{ fontSize: 11, color: "#CFBF9E", marginTop: 1 }}>e.g. &quot;{csvRows[0]?.[h]?.slice(0, 30) || "—"}&quot;</p>
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                      <ArrowRight style={{ width: 14, height: 14, color: "#CFBF9E", flexShrink: 0 }} />
                      <select
                        value={mapping[h] || ""}
                        onChange={(e) => updateMapping(h, e.target.value as LedgrField | "")}
                        style={{ flex: 1, maxWidth: 280, padding: "8px 12px", fontSize: 13, borderRadius: 8, border: "1px solid var(--rule)", background: "var(--paper-2)", color: mapping[h] ? "#0F172A" : "#94A3B8", cursor: "pointer", outline: "none" }}
                      >
                        <option value="">— Skip this column —</option>
                        {LEDGR_FIELDS.map((f) => (<option key={f} value={f}>{FIELD_LABELS[f]}</option>))}
                      </select>
                      {mapping[h] && <Check style={{ width: 16, height: 16, color: "#1C3A5B", flexShrink: 0 }} />}
                    </div>
                  </div>
                ))}
                {!requiredFieldsMapped && (
                  <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: "#F2E7D0", border: "1px solid #E8D8B8", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle style={{ width: 16, height: 16, color: "#8A5A1C", flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: "#92400E" }}>
                      Please map: {LEDGR_FIELDS.filter((f) => !Object.values(mapping).includes(f)).map((f) => FIELD_LABELS[f]).join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div style={card}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #F1F5F9" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Preview (first {Math.min(csvRows.length, 5)} rows)</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {csvHeaders.map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#64748B", background: "var(--paper)", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                          {h}
                          {mapping[h] && <span style={{ display: "block", fontSize: 10, fontWeight: 500, color: "#B33A1F", marginTop: 2 }}>→ {FIELD_LABELS[mapping[h] as LedgrField]}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {csvHeaders.map((h) => (
                          <td key={h} style={{ padding: "8px 16px", color: "#0F172A", borderBottom: "1px solid #F1F5F9", whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{row[h] || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={reset} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--rule)", background: "var(--paper-2)", color: "#64748B", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => startImport(buildCsvRows())} disabled={!requiredFieldsMapped} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: requiredFieldsMapped ? "#B33A1F" : "#CFBF9E", color: "#FFFFFF", fontSize: 13, fontWeight: 600, cursor: requiredFieldsMapped ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8 }}>
                <Upload style={{ width: 14, height: 14 }} />
                Import {csvRows.length} Transactions
              </button>
            </div>
          </>
        )}

        {/* PREVIEW STEP for QB/Xero/OFX */}
        {step === "preview" && activeTab !== "csv" && (
          <>
            <div style={{ ...card, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FileText style={{ width: 18, height: 18, color: "#B33A1F" }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{fileName}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8" }}>
                    {parsedRows.length} transaction{parsedRows.length !== 1 ? "s" : ""} found
                    {dupeCount > 0 && `, ${dupeCount} duplicate${dupeCount !== 1 ? "s" : ""} removed`}
                  </p>
                </div>
              </div>
              <button onClick={reset} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "#94A3B8" }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {parseWarnings.length > 0 && (
              <div style={{ padding: 12, borderRadius: 10, background: "#F2E7D0", border: "1px solid #E8D8B8" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#92400E", marginBottom: 4 }}>{parseWarnings.length} row{parseWarnings.length !== 1 ? "s" : ""} skipped during parsing:</p>
                {parseWarnings.map((w, i) => <p key={i} style={{ fontSize: 11, color: "#B45309", marginTop: 2 }}>{w}</p>)}
              </div>
            )}

            <div style={card}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #F1F5F9" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Preview (first {Math.min(parsedRows.length, 5)} of {parsedRows.length})</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--paper)" }}>
                      {["Date", "Description", "Amount", "Type"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#64748B", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "8px 16px", color: "#64748B", whiteSpace: "nowrap" }}>{row.date}</td>
                        <td style={{ padding: "8px 16px", color: "#0F172A", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.description}</td>
                        <td style={{ padding: "8px 16px", fontWeight: 600, color: row.type === "income" ? "#1C3A5B" : row.type === "expense" ? "#922D15" : "#64748B", whiteSpace: "nowrap" }}>
                          {row.type === "income" ? "+" : row.type === "expense" ? "-" : ""}
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.amount)}
                        </td>
                        <td style={{ padding: "8px 16px" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, background: row.type === "income" ? "#DDE4EC" : row.type === "expense" ? "#F5E0D9" : "#F1F5F9", color: row.type === "income" ? "#1C3A5B" : row.type === "expense" ? "#922D15" : "#64748B" }}>{row.type}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && <p style={{ padding: "10px 16px", fontSize: 12, color: "#94A3B8", textAlign: "center", borderTop: "1px solid #F1F5F9" }}>+ {parsedRows.length - 5} more transactions</p>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={reset} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--rule)", background: "var(--paper-2)", color: "#64748B", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => startImport(parsedRows)} disabled={parsedRows.length === 0} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: parsedRows.length > 0 ? "#B33A1F" : "#CFBF9E", color: "#FFFFFF", fontSize: 13, fontWeight: 600, cursor: parsedRows.length > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8 }}>
                <Upload style={{ width: 14, height: 14 }} />
                Import {parsedRows.length} Transactions
              </button>
            </div>
          </>
        )}

        {/* IMPORTING STEP */}
        {step === "importing" && (
          <div style={card}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F5E0D9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Upload style={{ width: 18, height: 18, color: "#B33A1F" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Importing Transactions</h3>
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Please wait while we process your file...</p>
              </div>
            </div>
            <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <div style={{ width: "100%", maxWidth: 400 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>Processing row {importProgress} of {importTotal}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#B33A1F" }}>{importTotal > 0 ? Math.round((importProgress / importTotal) * 100) : 0}%</p>
                </div>
                <div style={{ width: "100%", height: 8, borderRadius: 4, background: "var(--paper-3)", overflow: "hidden" }}>
                  <div style={{ width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%`, height: "100%", borderRadius: 4, background: "var(--stamp)", transition: "width 0.15s ease" }} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#94A3B8" }}>{fileName}</p>
            </div>
          </div>
        )}

        {/* DONE STEP */}
        {step === "done" && result && (
          <>
            <div style={card}>
              <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: result.imported > 0 ? "#DDE4EC" : "#F5E0D9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {result.imported > 0 ? <Check style={{ width: 28, height: 28, color: "#1C3A5B" }} /> : <AlertCircle style={{ width: 28, height: 28, color: "#B33A1F" }} />}
                </div>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>Import Complete</h3>
                  <p style={{ fontSize: 14, color: "#64748B", marginTop: 6 }}>
                    Imported <strong style={{ color: "#1C3A5B" }}>{result.imported}</strong> transaction{result.imported !== 1 ? "s" : ""}.
                    {result.skipped > 0 && <> <strong style={{ color: "#B33A1F" }}>{result.skipped}</strong> skipped.</>}
                    {dupeCount > 0 && <> <strong style={{ color: "#8A5A1C" }}>{dupeCount}</strong> duplicate{dupeCount !== 1 ? "s" : ""} skipped.</>}
                  </p>
                </div>
                <div style={{ width: "100%", maxWidth: 400 }}>
                  <div style={{ width: "100%", height: 8, borderRadius: 4, background: "var(--paper-3)", overflow: "hidden" }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: 4, background: result.imported > 0 ? "#1C3A5B" : "#B33A1F" }} />
                  </div>
                </div>
                {result.errors.length > 0 && (
                  <div style={{ width: "100%", maxWidth: 500, maxHeight: 160, overflowY: "auto", padding: 12, borderRadius: 8, background: "#F5E0D9", border: "1px solid #F5E0D9" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#922D15", marginBottom: 6 }}>Skipped rows:</p>
                    {result.errors.slice(0, 20).map((err, i) => <p key={i} style={{ fontSize: 11, color: "#B91C1C", marginTop: 2 }}>{err}</p>)}
                    {result.errors.length > 20 && <p style={{ fontSize: 11, color: "#B91C1C", marginTop: 4 }}>...and {result.errors.length - 20} more</p>}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button onClick={reset} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid var(--rule)", background: "var(--paper-2)", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <RotateCcw style={{ width: 14, height: 14 }} />
                Import Another File
              </button>
              <button onClick={() => router.push("/transactions")} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#B33A1F", color: "#FFFFFF", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <ExternalLink style={{ width: 14, height: 14 }} />
                View Imported Transactions
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
