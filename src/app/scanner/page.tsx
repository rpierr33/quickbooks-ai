"use client";
import React, { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Camera, Upload, Sparkles, Check, X, FileText, Image as ImageIcon,
  Receipt, Loader2, AlertCircle, ChevronRight, Trash2, Eye, Save,
  ArrowRight, Pencil, ScanLine, History, ZoomIn,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import type { ScannedReceipt, ReceiptExtraction } from "@/types";

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

type ViewMode = 'upload' | 'scanning' | 'preview' | 'history';

export default function ScannerPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScannedReceipt | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedExtraction, setEditedExtraction] = useState<ReceiptExtraction | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Fetch scan history
  const { data: history, isLoading: historyLoading } = useQuery<ScannedReceipt[]>({
    queryKey: ["scanned-receipts"],
    queryFn: () => fetch("/api/ai/scan-receipt").then(r => r.json()),
  });

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async (payload: { image: string; mimeType: string; fileName: string; fileSize: number }) => {
      const res = await fetch("/api/ai/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Scan failed");
      }
      return res.json();
    },
    onSuccess: (data: ScannedReceipt) => {
      setScanResult(data);
      setEditedExtraction(data.extraction);
      setViewMode('preview');
      queryClient.invalidateQueries({ queryKey: ["scanned-receipts"] });
      toast(`Receipt scanned — ${data.extraction.vendor} ${formatCurrency(data.extraction.amount)}`, "success");
    },
    onError: (err: Error) => {
      setViewMode('upload');
      toast(`Scan failed: ${err.message}`, "error");
    },
  });

  // Save as transaction mutation
  const saveMutation = useMutation({
    mutationFn: async (extraction: ReceiptExtraction) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: extraction.date,
          description: extraction.vendor,
          amount: extraction.amount,
          type: "expense",
          notes: extraction.notes || `Scanned receipt — ${extraction.line_items.length} item(s)`,
        }),
      });
      if (!res.ok) throw new Error("Failed to save transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["scanned-receipts"] });
      toast("Expense saved — transaction created from receipt", "success");
      resetScanner();
      // Navigate to transactions after a short delay so the toast is visible
      setTimeout(() => router.push("/transactions"), 1200);
    },
    onError: () => {
      toast("Failed to save transaction", "error");
    },
  });

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast("Upload a photo or PDF of your receipt", "error");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast("File too large — maximum 15MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setImagePreview(result);
      setViewMode('scanning');

      scanMutation.mutate({
        image: base64,
        mimeType: file.type,
        fileName: file.name,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  }, [scanMutation, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const resetScanner = () => {
    setViewMode('upload');
    setImagePreview(null);
    setScanResult(null);
    setEditMode(false);
    setEditedExtraction(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateField = (field: keyof ReceiptExtraction, value: any) => {
    if (!editedExtraction) return;
    setEditedExtraction({ ...editedExtraction, [field]: value });
  };

  const confidenceColor = (c: number) => c >= 0.9 ? '#059669' : c >= 0.7 ? '#D97706' : '#DC2626';
  const confidenceLabel = (c: number) => c >= 0.9 ? 'High' : c >= 0.7 ? 'Medium' : 'Low';

  return (
    <div style={{ padding: '24px 24px 100px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Receipt Scanner</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Snap a receipt, let AI extract the details, save as expense</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant={viewMode === 'upload' || viewMode === 'scanning' || viewMode === 'preview' ? 'default' : 'outline'}
            size="sm"
            className="cursor-pointer"
            onClick={resetScanner}
          >
            <ScanLine style={{ width: 16, height: 16, marginRight: 6 }} />
            Scan
          </Button>
          <Button
            variant={viewMode === 'history' ? 'default' : 'outline'}
            size="sm"
            className="cursor-pointer"
            onClick={() => setViewMode('history')}
          >
            <History style={{ width: 16, height: 16, marginRight: 6 }} />
            History
            {history && history.length > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 11, fontWeight: 600,
                background: viewMode === 'history' ? 'rgba(255,255,255,0.2)' : '#7C3AED',
                color: '#fff', padding: '1px 7px', borderRadius: 99,
              }}>
                {history.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Upload View */}
      {viewMode === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>
          {/* Main upload zone */}
          <div className="lg:col-span-2">
            <div style={card}>
              <div
                ref={dropZoneRef}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
                style={{
                  padding: 60,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minHeight: 400,
                  background: dragActive ? 'rgba(124,58,237,0.04)' : '#FAFBFC',
                  border: `2px dashed ${dragActive ? '#7C3AED' : '#CBD5E1'}`,
                  borderRadius: 16,
                  margin: 20,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 80, height: 80, borderRadius: 20,
                  background: dragActive ? 'rgba(124,58,237,0.1)' : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20, transition: 'all 0.2s',
                }}>
                  {dragActive ? (
                    <Upload style={{ width: 36, height: 36, color: '#7C3AED' }} />
                  ) : (
                    <Camera style={{ width: 36, height: 36, color: '#94A3B8' }} />
                  )}
                </div>
                <p style={{ fontSize: 18, fontWeight: 600, color: dragActive ? '#7C3AED' : '#0F172A', marginBottom: 8 }}>
                  {dragActive ? 'Drop your receipt here' : 'Upload a receipt or invoice'}
                </p>
                <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20, textAlign: 'center' }}>
                  Drag & drop an image, or click to browse. Supports JPEG, PNG, WebP, PDF.
                </p>
                <Button variant="default" size="sm" className="cursor-pointer">
                  <Upload style={{ width: 14, height: 14, marginRight: 6 }} />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Side panel: how it works */}
          <div>
            <div style={{ ...card, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles style={{ width: 16, height: 16, color: '#7C3AED' }} />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>How it works</h2>
              </div>
              {[
                { step: '1', title: 'Upload', desc: 'Take a photo or upload a receipt image', icon: Camera },
                { step: '2', title: 'AI Extracts', desc: 'GPT-4o reads vendor, amount, date, items', icon: Sparkles },
                { step: '3', title: 'Review & Edit', desc: 'Verify the extracted data, fix anything', icon: Pencil },
                { step: '4', title: 'Save', desc: 'One tap to create the expense transaction', icon: Save },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 3 ? 20 : 0, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 99, flexShrink: 0,
                    background: '#7C3AED', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {s.step}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{s.title}</p>
                    <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div style={{ ...card, padding: 20, marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Scanner Stats</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>Total scanned</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{history?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>Saved as expenses</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>
                    {history?.filter(h => h.status === 'saved').length || 0}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>Avg. confidence</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#7C3AED' }}>
                    {history && history.length > 0
                      ? `${Math.round((history.reduce((s, h) => s + h.confidence, 0) / history.length) * 100)}%`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanning View */}
      {viewMode === 'scanning' && (
        <div style={{ ...card, padding: 40, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          {imagePreview && (
            <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0', maxHeight: 300 }}>
              <img src={imagePreview} alt="Receipt" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', background: '#F8FAFC' }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="animate-spin" style={{ width: 48, height: 48, borderRadius: 99, border: '3px solid #E2E8F0', borderTopColor: '#7C3AED' }} />
            <div>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Scanning receipt...</p>
              <p style={{ fontSize: 14, color: '#64748B' }}>AI is reading vendor, amounts, items, and date</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="cursor-pointer" style={{ marginTop: 24 }} onClick={resetScanner}>
            Cancel
          </Button>
        </div>
      )}

      {/* Preview / Results View */}
      {viewMode === 'preview' && scanResult && editedExtraction && (
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 24 }}>
          {/* Left: Image preview */}
          <div>
            <div style={card}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Receipt Image</p>
                <button
                  className="cursor-pointer"
                  onClick={() => setShowImageModal(true)}
                  style={{ background: 'transparent', border: 'none', padding: 4, color: '#64748B' }}
                >
                  <ZoomIn style={{ width: 16, height: 16 }} />
                </button>
              </div>
              {imagePreview && (
                <div style={{ padding: 16 }}>
                  <img
                    src={imagePreview}
                    alt="Receipt"
                    style={{ width: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8, background: '#F8FAFC', cursor: 'pointer' }}
                    onClick={() => setShowImageModal(true)}
                  />
                </div>
              )}
            </div>

            {/* Confidence badge */}
            <div style={{ ...card, padding: 16, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles style={{ width: 16, height: 16, color: '#7C3AED' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>AI Confidence</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 120, height: 6, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${scanResult.confidence * 100}%`, height: '100%', borderRadius: 99,
                    background: confidenceColor(scanResult.confidence),
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: confidenceColor(scanResult.confidence),
                }}>
                  {Math.round(scanResult.confidence * 100)}% {confidenceLabel(scanResult.confidence)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Extracted data */}
          <div>
            <div style={card}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Extracted Data</p>
                <Button
                  variant="ghost" size="sm" className="cursor-pointer"
                  onClick={() => setEditMode(!editMode)}
                >
                  <Pencil style={{ width: 14, height: 14, marginRight: 4 }} />
                  {editMode ? 'Done Editing' : 'Edit'}
                </Button>
              </div>

              <div style={{ padding: 20 }}>
                {/* Main fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <FieldRow label="Vendor" value={editedExtraction.vendor} editable={editMode}
                    onChange={(v) => updateField('vendor', v)} />
                  <FieldRow label="Date" value={editedExtraction.date} editable={editMode} type="date"
                    onChange={(v) => updateField('date', v)} />
                  <FieldRow label="Total" value={editedExtraction.amount.toString()} editable={editMode} type="number" prefix="$"
                    onChange={(v) => updateField('amount', parseFloat(v) || 0)} />

                  <div className="grid grid-cols-3" style={{ gap: 12 }}>
                    <FieldRow label="Subtotal" value={editedExtraction.subtotal.toString()} editable={editMode} type="number" prefix="$" compact
                      onChange={(v) => updateField('subtotal', parseFloat(v) || 0)} />
                    <FieldRow label="Tax" value={editedExtraction.tax.toString()} editable={editMode} type="number" prefix="$" compact
                      onChange={(v) => updateField('tax', parseFloat(v) || 0)} />
                    <FieldRow label="Tip" value={editedExtraction.tip.toString()} editable={editMode} type="number" prefix="$" compact
                      onChange={(v) => updateField('tip', parseFloat(v) || 0)} />
                  </div>

                  <FieldRow label="Category" value={editedExtraction.category} editable={editMode}
                    onChange={(v) => updateField('category', v)}
                    options={['Rent','Utilities','Payroll','Marketing','Software & SaaS','Office Supplies','Travel','Meals & Entertainment','Insurance','Professional Services','Other']} />

                  <FieldRow label="Payment Method" value={editedExtraction.payment_method || 'Unknown'} editable={editMode}
                    onChange={(v) => updateField('payment_method', v)}
                    options={['cash','credit','debit']} />

                  <FieldRow label="Currency" value={editedExtraction.currency} editable={editMode}
                    onChange={(v) => updateField('currency', v)} />

                  {editedExtraction.notes && (
                    <FieldRow label="Notes" value={editedExtraction.notes} editable={editMode}
                      onChange={(v) => updateField('notes', v)} />
                  )}
                </div>

                {/* Line items */}
                {editedExtraction.line_items.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Line Items ({editedExtraction.line_items.length})
                    </p>
                    <div style={{ borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC' }}>
                            <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item</th>
                            <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'center', textTransform: 'uppercase' }}>Qty</th>
                            <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'right', textTransform: 'uppercase' }}>Price</th>
                            <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'right', textTransform: 'uppercase' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editedExtraction.line_items.map((item, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '10px 12px', fontSize: 13, color: '#0F172A' }}>{item.description}</td>
                              <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569', textAlign: 'center' }}>{item.quantity}</td>
                              <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569', textAlign: 'right' }}>${item.unit_price.toFixed(2)}</td>
                              <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#0F172A', textAlign: 'right' }}>${item.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={resetScanner}>
                  <X style={{ width: 14, height: 14, marginRight: 4 }} />
                  Discard
                </Button>
                <Button
                  variant="default" size="sm" className="cursor-pointer"
                  onClick={() => saveMutation.mutate(editedExtraction)}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="animate-spin" style={{ width: 14, height: 14, marginRight: 4 }} />
                  ) : (
                    <Save style={{ width: 14, height: 14, marginRight: 4 }} />
                  )}
                  Save as Expense
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History View */}
      {viewMode === 'history' && (
        <div style={card}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Scan History</p>
          </div>
          {historyLoading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: '#94A3B8', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: '#64748B' }}>Loading history...</p>
            </div>
          ) : !history || history.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No receipts scanned yet"
              description="Upload your first receipt to get started"
              action={<Button variant="default" size="sm" className="cursor-pointer" onClick={resetScanner}>
                <ScanLine style={{ width: 14, height: 14, marginRight: 6 }} /> Scan Receipt
              </Button>}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      <th style={{ padding: '10px 20px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>File</th>
                      <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase' }}>Vendor</th>
                      <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'right', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase' }}>Category</th>
                      <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'center', textTransform: 'uppercase' }}>Confidence</th>
                      <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'center', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((receipt) => (
                      <tr key={receipt.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8, background: '#F1F5F9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              {receipt.file_type?.includes('pdf') ? (
                                <FileText style={{ width: 16, height: 16, color: '#EF4444' }} />
                              ) : (
                                <ImageIcon style={{ width: 16, height: 16, color: '#7C3AED' }} />
                              )}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {receipt.file_name}
                              </p>
                              <p style={{ fontSize: 11, color: '#94A3B8' }}>
                                {receipt.file_size ? `${(receipt.file_size / 1024).toFixed(0)} KB` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#0F172A' }}>
                          {receipt.extraction.vendor}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>
                          {formatDate(receipt.extraction.date)}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#0F172A', textAlign: 'right' }}>
                          {formatCurrency(receipt.extraction.amount)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99,
                            background: '#F1F5F9', color: '#475569',
                          }}>
                            {receipt.extraction.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 12, fontWeight: 600,
                            color: confidenceColor(receipt.confidence),
                          }}>
                            {Math.round(receipt.confidence * 100)}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99,
                            background: receipt.status === 'saved' ? '#ECFDF5' : receipt.status === 'confirmed' ? '#EFF6FF' : '#F1F5F9',
                            color: receipt.status === 'saved' ? '#059669' : receipt.status === 'confirmed' ? '#2563EB' : '#64748B',
                          }}>
                            {receipt.status === 'saved' ? 'Saved' : receipt.status === 'confirmed' ? 'Confirmed' : 'Scanned'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden" style={{ padding: 12 }}>
                {history.map((receipt) => (
                  <div key={receipt.id} style={{
                    padding: 16, borderRadius: 12, border: '1px solid #F1F5F9',
                    marginBottom: 8, background: '#FAFBFC',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{receipt.extraction.vendor}</p>
                        <p style={{ fontSize: 12, color: '#64748B' }}>{formatDate(receipt.extraction.date)}</p>
                      </div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{formatCurrency(receipt.extraction.amount)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#F1F5F9', color: '#475569' }}>
                        {receipt.extraction.category}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 99,
                        background: receipt.status === 'saved' ? '#ECFDF5' : '#F1F5F9',
                        color: receipt.status === 'saved' ? '#059669' : '#64748B',
                      }}>
                        {receipt.status}
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, color: confidenceColor(receipt.confidence) }}>
                        {Math.round(receipt.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Image zoom modal */}
      {showImageModal && imagePreview && (
        <Dialog open={showImageModal} onClose={() => setShowImageModal(false)}>
          <DialogContent style={{ maxWidth: 800, padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <button
                className="cursor-pointer"
                onClick={() => setShowImageModal(false)}
                style={{
                  position: 'absolute', top: 12, right: 12, zIndex: 10,
                  width: 32, height: 32, borderRadius: 99,
                  background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
              <img src={imagePreview} alt="Receipt full" style={{ width: '100%', display: 'block' }} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Reusable field row component
function FieldRow({
  label, value, editable, onChange, type = 'text', prefix, options, compact,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
  type?: string;
  prefix?: string;
  options?: string[];
  compact?: boolean;
}) {
  const labelStyle: React.CSSProperties = {
    fontSize: compact ? 11 : 12,
    fontWeight: 500,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: compact ? 14 : 15,
    fontWeight: 600,
    color: '#0F172A',
  };

  if (editable && options) {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
      </div>
    );
  }

  if (editable) {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <div style={{ position: 'relative' }}>
          {prefix && (
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>
              {prefix}
            </span>
          )}
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={prefix ? { paddingLeft: 28 } : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{prefix ? `${prefix}${value}` : value}</p>
    </div>
  );
}
