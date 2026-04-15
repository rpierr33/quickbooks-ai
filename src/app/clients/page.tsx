"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, Users, Building2, Mail, Phone, MapPin, FileText, DollarSign, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { Client, Invoice } from "@/types";

const card: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' };

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '', tax_id: '', type: 'client' as string, notes: '' });

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => fetch("/api/clients").then(r => r.json()),
  });

  const { data: allInvoices = [] } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => fetch("/api/invoices").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }); resetForm(); toast("Contact created successfully"); },
    onError: () => { toast("Failed to create contact", "error"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & typeof form) =>
      fetch(`/api/clients/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }); closeClientDialog(); toast("Contact updated"); },
    onError: () => { toast("Failed to update contact", "error"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/clients/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }); setDeletingId(null); toast("Contact deleted"); },
    onError: () => { toast("Failed to delete contact", "error"); },
  });

  function openEditClient(client: Client) {
    setForm({ name: client.name, email: client.email ?? '', phone: client.phone ?? '', company: client.company ?? '', address: client.address ?? '', tax_id: client.tax_id ?? '', type: client.type, notes: client.notes ?? '' });
    setEditingClient(client);
    setShowCreate(true);
  }

  const resetForm = () => {
    setShowCreate(false);
    setEditingClient(null);
    setForm({ name: '', email: '', phone: '', company: '', address: '', tax_id: '', type: 'client', notes: '' });
  };

  const closeClientDialog = () => {
    setShowCreate(false);
    setEditingClient(null);
    setForm({ name: '', email: '', phone: '', company: '', address: '', tax_id: '', type: 'client', notes: '' });
  };

  const filtered = clients.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.email && c.email.toLowerCase().includes(search.toLowerCase())) || (c.company && c.company.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalOutstanding = clients.reduce((s, c) => s + c.outstanding_balance, 0);
  const totalInvoiced = clients.reduce((s, c) => s + c.total_invoiced, 0);
  const activeClients = clients.filter(c => c.is_active).length;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-shimmer" />)}
        </div>
        <div className="h-96 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
        <div style={{ ...card, borderLeft: '4px solid #7C3AED', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users style={{ width: 16, height: 16, color: '#7C3AED' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Active Contacts</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A' }}>{activeClients}</p>
        </div>
        <div style={{ ...card, borderLeft: '4px solid #059669', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign style={{ width: 16, height: 16, color: '#059669' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Total Invoiced</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{formatCurrency(totalInvoiced)}</p>
        </div>
        <div style={{ ...card, borderLeft: '4px solid #F59E0B', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#F59E0B' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Outstanding</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B' }}>{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 400 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94A3B8' }} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." style={{ paddingLeft: 38 }} />
          </div>
          <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Types</option>
            <option value="client">Clients</option>
            <option value="vendor">Vendors</option>
            <option value="both">Both</option>
          </Select>
        </div>
        <Button onClick={() => setShowCreate(true)} className="cursor-pointer">
          <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Add Contact
        </Button>
      </div>

      {/* Contacts List */}
      {filtered.length === 0 ? (
        <div style={{ ...card, padding: 48, textAlign: 'center' }}>
          <Users style={{ width: 40, height: 40, color: '#CBD5E1', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>No contacts found</p>
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>Add clients and vendors to track invoices, payments, and balances.</p>
          <Button onClick={() => setShowCreate(true)} size="sm" className="cursor-pointer"><Plus style={{ width: 14, height: 14, marginRight: 6 }} /> Add Contact</Button>
        </div>
      ) : (
        <div style={{ ...card }}>
          {/* Mobile cards */}
          <div className="md:hidden">
            {filtered.map((client, i) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                style={{
                  padding: '14px 16px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: client.type === 'vendor' ? '#FEF3C7' : '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: client.type === 'vendor' ? '#D97706' : '#7C3AED' }}>{client.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</p>
                      {client.email && <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</p>}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: client.outstanding_balance > 0 ? '#EF4444' : '#94A3B8' }}>{formatCurrency(client.outstanding_balance)}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>outstanding</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99, background: client.type === 'vendor' ? '#FEF3C7' : client.type === 'both' ? '#F0F9FF' : '#EDE9FE', color: client.type === 'vendor' ? '#D97706' : client.type === 'both' ? '#0284C7' : '#7C3AED', textTransform: 'capitalize' }}>
                    {client.type}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEditClient(client)} title="Edit" className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                      <Pencil style={{ width: 13, height: 13 }} />
                    </button>
                    <button onClick={() => setDeletingId(client.id)} title="Delete" className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 620 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>Contact</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>Type</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>Invoiced</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>Paid</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>Outstanding</th>
                  <th style={{ width: 80, padding: '12px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="cursor-pointer"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: client.type === 'vendor' ? '#FEF3C7' : '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: client.type === 'vendor' ? '#D97706' : '#7C3AED' }}>{client.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#0F172A' }}>{client.name}</p>
                          {client.email && <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{client.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99,
                        background: client.type === 'vendor' ? '#FEF3C7' : client.type === 'both' ? '#F0F9FF' : '#EDE9FE',
                        color: client.type === 'vendor' ? '#D97706' : client.type === 'both' ? '#0284C7' : '#7C3AED',
                        textTransform: 'capitalize',
                      }}>
                        {client.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: '#0F172A' }}>{formatCurrency(client.total_invoiced)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: '#059669' }}>{formatCurrency(client.total_paid)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: client.outstanding_balance > 0 ? '#EF4444' : '#94A3B8' }}>{formatCurrency(client.outstanding_balance)}</td>
                    <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button onClick={() => openEditClient(client)} title="Edit" className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                          <Pencil style={{ width: 13, height: 13 }} />
                        </button>
                        <button onClick={() => setDeletingId(client.id)} title="Delete" className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onClose={() => setSelectedClient(null)}>
          <DialogHeader>
            <DialogTitle>{selectedClient.name}</DialogTitle>
          </DialogHeader>
          <DialogContent>
            {(() => {
              // Match invoices by client name or email
              const clientInvoices = allInvoices
                .filter((inv) =>
                  inv.client_name === selectedClient.name ||
                  (selectedClient.email && inv.client_email === selectedClient.email)
                )
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10);

              const statusColors: Record<string, { bg: string; color: string }> = {
                draft: { bg: '#F1F5F9', color: '#475569' },
                sent: { bg: '#EFF6FF', color: '#2563EB' },
                paid: { bg: '#ECFDF5', color: '#059669' },
                overdue: { bg: '#FEF2F2', color: '#DC2626' },
              };

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Financial summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
                    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                      <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8' }}>Invoiced</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(selectedClient.total_invoiced)}</p>
                    </div>
                    <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                      <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8' }}>Paid</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(selectedClient.total_paid)}</p>
                    </div>
                    <div style={{ background: selectedClient.outstanding_balance > 0 ? '#FEF2F2' : '#F8FAFC', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                      <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8' }}>Outstanding</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: selectedClient.outstanding_balance > 0 ? '#EF4444' : '#94A3B8', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(selectedClient.outstanding_balance)}</p>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedClient.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Mail style={{ width: 14, height: 14, color: '#94A3B8' }} />
                        <span style={{ fontSize: 13, color: '#475569' }}>{selectedClient.email}</span>
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Phone style={{ width: 14, height: 14, color: '#94A3B8' }} />
                        <span style={{ fontSize: 13, color: '#475569' }}>{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.company && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Building2 style={{ width: 14, height: 14, color: '#94A3B8' }} />
                        <span style={{ fontSize: 13, color: '#475569' }}>{selectedClient.company}</span>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MapPin style={{ width: 14, height: 14, color: '#94A3B8' }} />
                        <span style={{ fontSize: 13, color: '#475569' }}>{selectedClient.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Recent Invoices */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', marginBottom: 10 }}>
                      Recent Invoices {clientInvoices.length > 0 && <span style={{ color: '#94A3B8', fontWeight: 400 }}>({clientInvoices.length})</span>}
                    </p>
                    {clientInvoices.length === 0 ? (
                      <div style={{ padding: '20px 0', textAlign: 'center' }}>
                        <FileText style={{ width: 28, height: 28, color: '#CBD5E1', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 13, color: '#94A3B8' }}>No invoices found for this client</p>
                      </div>
                    ) : (
                      <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontSize: 10 }}>Invoice</th>
                              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontSize: 10 }} className="hidden sm:table-cell">Date</th>
                              <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontSize: 10 }}>Amount</th>
                              <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontSize: 10 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientInvoices.map((inv, i) => {
                              const sc = statusColors[inv.status] || statusColors.draft;
                              const invTotal = typeof inv.total === 'string' ? parseFloat(inv.total) : inv.total;
                              return (
                                <tr
                                  key={inv.id}
                                  style={{
                                    borderBottom: i < clientInvoices.length - 1 ? '1px solid #F1F5F9' : 'none',
                                    background: i % 2 === 1 ? '#FAFBFC' : 'transparent',
                                  }}
                                >
                                  <td style={{ padding: '10px 12px', color: '#0F172A', fontFamily: 'monospace', fontSize: 11 }}>{inv.invoice_number}</td>
                                  <td style={{ padding: '10px 12px', color: '#64748B' }} className="hidden sm:table-cell">{formatDate(inv.created_at)}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#0F172A' }}>{formatCurrency(invTotal)}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <span style={{
                                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize',
                                      background: sc.bg, color: sc.color,
                                    }}>
                                      {inv.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClient(null)} className="w-full cursor-pointer">Close</Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)}>
        <DialogHeader>
          <DialogTitle>Delete Contact</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>Are you sure you want to delete this contact? This action cannot be undone.</p>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setDeletingId(null)} className="flex-1 w-full cursor-pointer">Cancel</Button>
          <Button onClick={() => { if (deletingId) deleteMutation.mutate(deletingId); }} disabled={deleteMutation.isPending} className="flex-1 w-full cursor-pointer" style={{ background: '#EF4444', borderColor: '#EF4444' }}>
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate} onClose={closeClientDialog}>
        <DialogHeader>
          <DialogTitle>{editingClient ? "Edit Contact" : "New Contact"}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contact name" />
            </div>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Email</label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Phone</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
              </div>
            </div>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Company</label>
                <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Type</label>
                <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="client">Client</option>
                  <option value="vendor">Vendor</option>
                  <option value="both">Both</option>
                </Select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Address</label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Tax ID / EIN</label>
              <Input value={form.tax_id} onChange={e => setForm({ ...form, tax_id: e.target.value })} placeholder="XX-XXXXXXX" />
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={closeClientDialog} className="flex-1 w-full cursor-pointer">Cancel</Button>
          <Button
            onClick={() => {
              if (editingClient) {
                updateMutation.mutate({ id: editingClient.id, ...form });
              } else {
                createMutation.mutate(form);
              }
            }}
            disabled={(editingClient ? updateMutation.isPending : createMutation.isPending) || !form.name}
            className="flex-1 w-full cursor-pointer"
          >
            {editingClient
              ? (updateMutation.isPending ? "Saving..." : "Update Contact")
              : (createMutation.isPending ? "Creating..." : "Create Contact")}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
