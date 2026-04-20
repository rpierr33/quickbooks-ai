"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Plus, Package, AlertTriangle, Search, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const card: React.CSSProperties = { background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 8, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' };

interface InventoryItem {
  id: string; name: string; sku: string; category: string; quantity: number;
  unit_cost: number; sale_price: number; reorder_point: number; is_active: boolean;
  total_value: number; potential_revenue: number; margin: number; low_stock: boolean;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const emptyForm = { name: '', sku: '', category: '', quantity: '', unit_cost: '', sale_price: '', reorder_point: '' };
  const [form, setForm] = useState(emptyForm);

  const { data: items, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: () => fetch("/api/inventory").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); setShowAdd(false); setForm(emptyForm); toast("Item added to inventory"); },
    onError: () => { toast("Failed to add item", "error"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & typeof form) =>
      fetch(`/api/inventory/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); setEditingItem(null); setShowAdd(false); setForm(emptyForm); toast("Item updated"); },
    onError: () => { toast("Failed to update item", "error"); },
  });

  function openEdit(item: InventoryItem) {
    setForm({
      name: item.name,
      sku: item.sku ?? '',
      category: item.category ?? '',
      quantity: String(item.quantity),
      unit_cost: String(item.unit_cost),
      sale_price: String(item.sale_price),
      reorder_point: String(item.reorder_point),
    });
    setEditingItem(item);
    setShowAdd(true);
  }

  const categories = useMemo(() => {
    if (!items) return [];
    return [...new Set(items.map(i => i.category).filter(Boolean))].sort();
  }, [items]);

  const filtered = items?.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || i.category === categoryFilter;
    return matchSearch && matchCat;
  }) ?? [];
  const totalValue = filtered.reduce((s, i) => s + i.total_value, 0);
  const totalRevenue = filtered.reduce((s, i) => s + i.potential_revenue, 0);
  const lowStockCount = filtered.filter(i => i.low_stock).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
        <div style={{ ...card, borderLeft: '4px solid #B33A1F', padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)' }}>Inventory Value</p>
          <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: 'var(--ink)', marginTop: 4 }}>{formatCurrency(totalValue)}</p>
        </div>
        <div style={{ ...card, borderLeft: '4px solid #1C3A5B', padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)' }}>Potential Revenue</p>
          <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: 'var(--pencil)', marginTop: 4 }}>{formatCurrency(totalRevenue)}</p>
        </div>
        <div style={{ ...card, borderLeft: `4px solid ${lowStockCount > 0 ? '#B33A1F' : '#1C3A5B'}`, padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)' }}>Low Stock Alerts</p>
          <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: lowStockCount > 0 ? '#B33A1F' : '#1C3A5B', marginTop: 4 }}>{lowStockCount} items</p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--ink-4)', pointerEvents: 'none' }} />
          <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="cursor-pointer"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink-2)', background: 'var(--paper-2)', outline: 'none' }}
          >
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <Button onClick={() => { setEditingItem(null); setForm(emptyForm); setShowAdd(true); }} className="cursor-pointer">
          <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> Add Item
        </Button>
      </div>

      {/* Table */}
      <div style={card}>
        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-lg animate-shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Package style={{ width: 40, height: 40, color: 'var(--ink-4)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>No inventory items</p>
            <p style={{ fontSize: 13, color: 'var(--ink-4)', marginBottom: 16 }}>Track products, services, and stock levels.</p>
            <Button size="sm" onClick={() => setShowAdd(true)} className="cursor-pointer"><Plus style={{ width: 14, height: 14, marginRight: 6 }} /> Add Item</Button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden">
              {filtered.map((item, i) => (
                <div key={item.id} style={{ padding: '14px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.low_stock && <AlertTriangle style={{ width: 13, height: 13, color: 'var(--stamp)', flexShrink: 0 }} />}
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>
                        <button onClick={() => setCategoryFilter(item.category)} className="cursor-pointer" style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--stamp)', padding: 0, fontWeight: 500 }}>{item.category}</button>
                        {item.sku ? ` · ${item.sku}` : ''}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>{formatCurrency(item.total_value)}</p>
                      <button onClick={() => openEdit(item)} className="cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--rule)', background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
                        <Pencil style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Qty: <strong style={{ color: item.low_stock ? '#B33A1F' : '#0F172A' }}>{item.quantity}</strong></span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Price: <strong>{formatCurrency(item.sale_price)}</strong></span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: item.margin >= 50 ? '#DDE4EC' : item.margin >= 25 ? '#F2E7D0' : '#F5E0D9', color: item.margin >= 50 ? '#1C3A5B' : item.margin >= 25 ? '#8A5A1C' : '#B33A1F' }}>{item.margin}% margin</span>
                    {item.low_stock ? (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'var(--stamp-soft)', color: 'var(--stamp-2)' }}>Low Stock</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'var(--pencil-soft)', color: 'var(--pencil)' }}>In Stock</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                  {['Item', 'SKU', 'Qty', 'Unit Cost', 'Sale Price', 'Margin', 'Value', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: h === 'Qty' || h === 'Margin' ? 'center' : h === 'Unit Cost' || h === 'Sale Price' || h === 'Value' ? 'right' : 'left', padding: '12px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid var(--rule-soft)', background: i % 2 === 1 ? '#EFE7D5' : 'transparent', cursor: 'pointer' }}
                    onClick={() => openEdit(item)}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.low_stock && <AlertTriangle style={{ width: 14, height: 14, color: 'var(--stamp)', flexShrink: 0 }} />}
                        <div>
                          <p style={{ fontWeight: 500, color: 'var(--ink)' }}>{item.name}</p>
                          <button
                            onClick={e => { e.stopPropagation(); setCategoryFilter(item.category); }}
                            className="cursor-pointer"
                            style={{ fontSize: 11, color: 'var(--stamp)', background: 'none', border: 'none', padding: 0, fontWeight: 500 }}
                          >{item.category}</button>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--ink-3)' }}>{item.sku}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: item.low_stock ? '#B33A1F' : '#0F172A' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)' }}>{formatCurrency(item.unit_cost)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--ink)' }}>{formatCurrency(item.sale_price)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: item.margin >= 50 ? '#DDE4EC' : item.margin >= 25 ? '#F2E7D0' : '#F5E0D9', color: item.margin >= 50 ? '#1C3A5B' : item.margin >= 25 ? '#8A5A1C' : '#B33A1F' }}>{item.margin}%</span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--ink)' }}>{formatCurrency(item.total_value)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {item.low_stock ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--stamp-soft)', color: 'var(--stamp-2)' }}>Low Stock</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--pencil-soft)', color: 'var(--pencil)' }}>In Stock</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(item)} title="Edit" className="cursor-pointer" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--rule)', background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
                        <Pencil style={{ width: 13, height: 13 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingItem(null); setForm(emptyForm); }}>
        <DialogHeader><DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle></DialogHeader>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Item Name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Design System License" /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>SKU</label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="DSL-001" /></div>
            </div>
            <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Category</label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Digital Products" /></div>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Quantity</label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="50" /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Reorder Point</label><Input type="number" value={form.reorder_point} onChange={e => setForm({ ...form, reorder_point: e.target.value })} placeholder="10" /></div>
            </div>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Unit Cost</label><Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} placeholder="49.99" /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Sale Price</label><Input type="number" step="0.01" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} placeholder="99.00" /></div>
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => { setShowAdd(false); setEditingItem(null); setForm(emptyForm); }} className="flex-1 w-full cursor-pointer">Cancel</Button>
          <Button
            onClick={() => {
              if (editingItem) {
                updateMutation.mutate({ id: editingItem.id, ...form });
              } else {
                createMutation.mutate(form);
              }
            }}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1 w-full cursor-pointer"
          >
            {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
