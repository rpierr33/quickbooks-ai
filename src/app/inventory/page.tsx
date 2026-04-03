"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Plus, Package, AlertTriangle, Search } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const card: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' };

interface InventoryItem {
  id: string; name: string; sku: string; category: string; quantity: number;
  unit_cost: number; sale_price: number; reorder_point: number; is_active: boolean;
  total_value: number; potential_revenue: number; margin: number; low_stock: boolean;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: '', quantity: '', unit_cost: '', sale_price: '', reorder_point: '' });

  const { data: items, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: () => fetch("/api/inventory").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); setShowAdd(false); setForm({ name: '', sku: '', category: '', quantity: '', unit_cost: '', sale_price: '', reorder_point: '' }); toast("Item added to inventory"); },
    onError: () => { toast("Failed to add item", "error"); },
  });

  const filtered = items?.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())) ?? [];
  const totalValue = filtered.reduce((s, i) => s + i.total_value, 0);
  const totalRevenue = filtered.reduce((s, i) => s + i.potential_revenue, 0);
  const lowStockCount = filtered.filter(i => i.low_stock).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
        <div style={{ ...card, borderLeft: '4px solid #7C3AED', padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Inventory Value</p>
          <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: '#0F172A', marginTop: 4 }}>{formatCurrency(totalValue)}</p>
        </div>
        <div style={{ ...card, borderLeft: '4px solid #059669', padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Potential Revenue</p>
          <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: '#059669', marginTop: 4 }}>{formatCurrency(totalRevenue)}</p>
        </div>
        <div style={{ ...card, borderLeft: `4px solid ${lowStockCount > 0 ? '#EF4444' : '#059669'}`, padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>Low Stock Alerts</p>
          <p style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: lowStockCount > 0 ? '#EF4444' : '#059669', marginTop: 4 }}>{lowStockCount} items</p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94A3B8', pointerEvents: 'none' }} />
          <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <Button onClick={() => setShowAdd(true)} className="cursor-pointer">
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
            <Package style={{ width: 40, height: 40, color: '#CBD5E1', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>No inventory items</p>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>Track products, services, and stock levels.</p>
            <Button size="sm" onClick={() => setShowAdd(true)} className="cursor-pointer"><Plus style={{ width: 14, height: 14, marginRight: 6 }} /> Add Item</Button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                  {['Item', 'SKU', 'Qty', 'Unit Cost', 'Sale Price', 'Margin', 'Value', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Qty' || h === 'Margin' ? 'center' : h === 'Unit Cost' || h === 'Sale Price' || h === 'Value' ? 'right' : 'left', padding: '12px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 1 ? '#FAFBFC' : 'transparent' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.low_stock && <AlertTriangle style={{ width: 14, height: 14, color: '#EF4444', flexShrink: 0 }} />}
                        <div>
                          <p style={{ fontWeight: 500, color: '#0F172A' }}>{item.name}</p>
                          <p style={{ fontSize: 11, color: '#94A3B8' }}>{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#64748B' }}>{item.sku}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: item.low_stock ? '#EF4444' : '#0F172A' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#64748B' }}>{formatCurrency(item.unit_cost)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#0F172A' }}>{formatCurrency(item.sale_price)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: item.margin >= 50 ? '#ECFDF5' : item.margin >= 25 ? '#FFFBEB' : '#FEF2F2', color: item.margin >= 50 ? '#059669' : item.margin >= 25 ? '#D97706' : '#EF4444' }}>{item.margin}%</span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#0F172A' }}>{formatCurrency(item.total_value)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {item.low_stock ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#FEF2F2', color: '#DC2626' }}>Low Stock</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#ECFDF5', color: '#059669' }}>In Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Item Name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Design System License" /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>SKU</label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="DSL-001" /></div>
            </div>
            <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Category</label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Digital Products" /></div>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Quantity</label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="50" /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Reorder Point</label><Input type="number" value={form.reorder_point} onChange={e => setForm({ ...form, reorder_point: e.target.value })} placeholder="10" /></div>
            </div>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Unit Cost</label><Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} placeholder="49.99" /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Sale Price</label><Input type="number" step="0.01" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} placeholder="99.00" /></div>
            </div>
          </div>
        </DialogContent>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1 w-full cursor-pointer">Cancel</Button>
          <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="flex-1 w-full cursor-pointer">{createMutation.isPending ? 'Adding...' : 'Add Item'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
