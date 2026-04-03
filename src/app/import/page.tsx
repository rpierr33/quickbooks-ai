"use client";
import React, { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight, RotateCcw, X } from "lucide-react";

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const LEDGR_FIELDS = ['date', 'description', 'amount', 'type'] as const;
type LedgrField = typeof LEDGR_FIELDS[number];

const FIELD_LABELS: Record<LedgrField, string> = {
  date: 'Date',
  description: 'Description',
  amount: 'Amount',
  type: 'Type (income/expense/transfer)',
};

// Common CSV column names mapped to Ledgr fields
const AUTO_DETECT_MAP: Record<string, LedgrField> = {
  date: 'date',
  transaction_date: 'date',
  'transaction date': 'date',
  trans_date: 'date',
  posted_date: 'date',
  'posted date': 'date',
  posting_date: 'date',
  description: 'description',
  memo: 'description',
  narrative: 'description',
  details: 'description',
  payee: 'description',
  name: 'description',
  amount: 'amount',
  total: 'amount',
  value: 'amount',
  sum: 'amount',
  debit: 'amount',
  credit: 'amount',
  type: 'type',
  transaction_type: 'type',
  'transaction type': 'type',
  category: 'type',
};

type Step = 'upload' | 'mapping' | 'importing' | 'done';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, LedgrField | ''>>({});
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoDetectMapping = useCallback((csvHeaders: string[]) => {
    const detected: Record<string, LedgrField | ''> = {};
    for (const h of csvHeaders) {
      const normalized = h.toLowerCase().trim();
      if (AUTO_DETECT_MAP[normalized]) {
        // Only assign if this Ledgr field isn't already mapped
        const alreadyMapped = Object.values(detected).includes(AUTO_DETECT_MAP[normalized]);
        detected[h] = alreadyMapped ? '' : AUTO_DETECT_MAP[normalized];
      } else {
        detected[h] = '';
      }
    }
    return detected;
  }, []);

  const handleFile = useCallback((file: File) => {
    setParseError('');
    if (!file.name.endsWith('.csv')) {
      setParseError('Please upload a .csv file.');
      return;
    }
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setParseError('Failed to parse CSV: ' + results.errors[0].message);
          return;
        }
        const data = results.data as Record<string, string>[];
        if (data.length === 0) {
          setParseError('CSV file is empty.');
          return;
        }
        const csvHeaders = Object.keys(data[0]);
        setHeaders(csvHeaders);
        setRows(data);
        setMapping(autoDetectMapping(csvHeaders));
        setStep('mapping');
      },
      error: (err) => {
        setParseError('Failed to parse CSV: ' + err.message);
      },
    });
  }, [autoDetectMapping]);

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

  const updateMapping = (csvCol: string, ledgrField: LedgrField | '') => {
    setMapping(prev => {
      const next = { ...prev };
      // If this ledgr field is already mapped to another column, clear it
      if (ledgrField) {
        for (const key of Object.keys(next)) {
          if (next[key] === ledgrField) next[key] = '';
        }
      }
      next[csvCol] = ledgrField;
      return next;
    });
  };

  const requiredFieldsMapped = LEDGR_FIELDS.every(f => Object.values(mapping).includes(f));

  const reverseMapping = (): Record<LedgrField, string> => {
    const rev: Partial<Record<LedgrField, string>> = {};
    for (const [csvCol, field] of Object.entries(mapping)) {
      if (field) rev[field] = csvCol;
    }
    return rev as Record<LedgrField, string>;
  };

  const startImport = async () => {
    setStep('importing');
    const map = reverseMapping();
    const total = rows.length;
    setImportTotal(total);
    setImportProgress(0);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < total; i++) {
      const row = rows[i];
      const date = row[map.date]?.trim();
      const description = row[map.description]?.trim();
      const amountRaw = row[map.amount]?.trim();
      const typeRaw = row[map.type]?.trim().toLowerCase();

      // Validate required fields
      if (!date || !description || !amountRaw) {
        skipped++;
        errors.push(`Row ${i + 1}: missing required data (date, description, or amount)`);
        setImportProgress(i + 1);
        continue;
      }

      // Parse amount - remove currency symbols and commas
      const amount = parseFloat(amountRaw.replace(/[^0-9.\-]/g, ''));
      if (isNaN(amount)) {
        skipped++;
        errors.push(`Row ${i + 1}: invalid amount "${amountRaw}"`);
        setImportProgress(i + 1);
        continue;
      }

      // Determine type
      let type: 'income' | 'expense' | 'transfer' = 'expense';
      if (typeRaw === 'income' || typeRaw === 'revenue' || typeRaw === 'credit' || typeRaw === 'deposit') {
        type = 'income';
      } else if (typeRaw === 'transfer') {
        type = 'transfer';
      } else if (typeRaw === 'expense' || typeRaw === 'debit' || typeRaw === 'withdrawal') {
        type = 'expense';
      } else if (amount > 0 && !typeRaw) {
        // If no type column mapped or value unrecognized, infer from amount sign
        type = 'income';
      } else if (amount < 0 && !typeRaw) {
        type = 'expense';
      }

      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            description,
            amount: Math.abs(amount),
            type,
          }),
        });

        if (res.ok) {
          imported++;
        } else {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          skipped++;
          errors.push(`Row ${i + 1}: ${err.error || 'Server error'}`);
        }
      } catch {
        skipped++;
        errors.push(`Row ${i + 1}: Network error`);
      }

      setImportProgress(i + 1);
    }

    setResult({ imported, skipped, errors });
    setStep('done');
  };

  const reset = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setParseError('');
    setImportProgress(0);
    setImportTotal(0);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const previewRows = rows.slice(0, 10);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div style={card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Upload style={{ width: 18, height: 18, color: '#7C3AED' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Import Transactions from CSV</h3>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Upload a CSV file from your bank or accounting software</p>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#7C3AED' : '#E2E8F0'}`,
                  borderRadius: 12,
                  padding: '48px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  background: dragOver ? '#F5F3FF' : '#FAFBFC',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: dragOver ? '#EDE9FE' : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  <FileSpreadsheet style={{ width: 28, height: 28, color: dragOver ? '#7C3AED' : '#94A3B8' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
                    {dragOver ? 'Drop your file here' : 'Drag & drop a CSV file here'}
                  </p>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                    or <span style={{ color: '#7C3AED', fontWeight: 500 }}>click to browse</span>
                  </p>
                </div>
                <p style={{ fontSize: 11, color: '#CBD5E1' }}>Supports .csv files up to 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={onFileSelect}
                style={{ display: 'none' }}
              />
              {parseError && (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle style={{ width: 16, height: 16, color: '#EF4444', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#DC2626' }}>{parseError}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Mapping */}
        {step === 'mapping' && (
          <>
            {/* File info */}
            <div style={{ ...card, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileSpreadsheet style={{ width: 18, height: 18, color: '#7C3AED' }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{fileName}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>{rows.length} rows found</p>
                </div>
              </div>
              <button
                onClick={reset}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#94A3B8' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Column Mapping */}
            <div style={card}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ArrowRight style={{ width: 18, height: 18, color: '#7C3AED' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Map Columns</h3>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Match your CSV columns to Ledgr fields. We auto-detected some for you.</p>
                </div>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {headers.map(h => (
                  <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ width: 180, flexShrink: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{h}</p>
                      <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 1 }}>
                        e.g. &quot;{rows[0]?.[h]?.slice(0, 30) || '—'}&quot;
                      </p>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ArrowRight style={{ width: 14, height: 14, color: '#CBD5E1', flexShrink: 0 }} />
                      <select
                        value={mapping[h] || ''}
                        onChange={e => updateMapping(h, e.target.value as LedgrField | '')}
                        style={{
                          flex: 1,
                          maxWidth: 280,
                          padding: '8px 12px',
                          fontSize: 13,
                          borderRadius: 8,
                          border: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                          color: mapping[h] ? '#0F172A' : '#94A3B8',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="">— Skip this column —</option>
                        {LEDGR_FIELDS.map(f => (
                          <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                        ))}
                      </select>
                      {mapping[h] && (
                        <Check style={{ width: 16, height: 16, color: '#059669', flexShrink: 0 }} />
                      )}
                    </div>
                  </div>
                ))}

                {!requiredFieldsMapped && (
                  <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle style={{ width: 16, height: 16, color: '#D97706', flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: '#92400E' }}>
                      Please map all required fields: {LEDGR_FIELDS.filter(f => !Object.values(mapping).includes(f)).map(f => FIELD_LABELS[f]).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Table */}
            <div style={card}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Preview (first {Math.min(previewRows.length, 10)} rows)</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {headers.map(h => (
                        <th key={h} style={{
                          padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748B',
                          background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap',
                        }}>
                          {h}
                          {mapping[h] && (
                            <span style={{ display: 'block', fontSize: 10, fontWeight: 500, color: '#7C3AED', marginTop: 2 }}>
                              → {FIELD_LABELS[mapping[h] as LedgrField]}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        {headers.map(h => (
                          <td key={h} style={{
                            padding: '8px 16px', color: '#0F172A',
                            borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', maxWidth: 200,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: '1px solid #E2E8F0',
                  background: '#FFFFFF', color: '#64748B', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={startImport}
                disabled={!requiredFieldsMapped}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: requiredFieldsMapped ? '#7C3AED' : '#CBD5E1',
                  color: '#FFFFFF', fontSize: 13, fontWeight: 600,
                  cursor: requiredFieldsMapped ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <Upload style={{ width: 14, height: 14 }} />
                Import {rows.length} Transactions
              </button>
            </div>
          </>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div style={card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Upload style={{ width: 18, height: 18, color: '#7C3AED' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Importing Transactions</h3>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Please wait while we process your file...</p>
              </div>
            </div>
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ width: '100%', maxWidth: 400 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>
                    Processing row {importProgress} of {importTotal}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED' }}>
                    {importTotal > 0 ? Math.round((importProgress / importTotal) * 100) : 0}%
                  </p>
                </div>
                <div style={{ width: '100%', height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%`,
                      height: '100%',
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #7C3AED, #9333EA)',
                      transition: 'width 0.15s ease',
                    }}
                  />
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8' }}>{fileName}</p>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && result && (
          <>
            <div style={card}>
              <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: result.imported > 0 ? '#ECFDF5' : '#FEF2F2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {result.imported > 0 ? (
                    <Check style={{ width: 28, height: 28, color: '#059669' }} />
                  ) : (
                    <AlertCircle style={{ width: 28, height: 28, color: '#EF4444' }} />
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Import Complete</h3>
                  <p style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>
                    Imported <strong style={{ color: '#059669' }}>{result.imported}</strong> transaction{result.imported !== 1 ? 's' : ''}.
                    {result.skipped > 0 && (
                      <> <strong style={{ color: '#EF4444' }}>{result.skipped}</strong> skipped (missing data).</>
                    )}
                  </p>
                </div>

                {/* Progress bar at 100% */}
                <div style={{ width: '100%', maxWidth: 400 }}>
                  <div style={{ width: '100%', height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: 4, background: result.imported > 0 ? '#059669' : '#EF4444' }} />
                  </div>
                </div>

                {/* Errors list */}
                {result.errors.length > 0 && (
                  <div style={{ width: '100%', maxWidth: 500, maxHeight: 160, overflowY: 'auto', padding: 12, borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#DC2626', marginBottom: 6 }}>Skipped rows:</p>
                    {result.errors.map((err, i) => (
                      <p key={i} style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: '#7C3AED', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <RotateCcw style={{ width: 14, height: 14 }} />
                Import Another File
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
