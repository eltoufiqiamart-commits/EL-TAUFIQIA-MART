"use client";

import { useEffect, useState } from "react";

interface ShippingMethod {
  id: string;
  nameAr: string;
  nameEn: string;
  provider: string | null;
  fee: string;
  estimatedDays: number | null;
  isActive: boolean;
  displayOrder: number;
}

type Form = { nameAr: string; nameEn: string; provider: string; fee: string; estimatedDays: string; displayOrder: string; isActive: boolean };
const empty: Form = { nameAr: "", nameEn: "", provider: "", fee: "0", estimatedDays: "", displayOrder: "0", isActive: true };

export default function AdminShippingMethodsPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [form, setForm] = useState<Form>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/shipping-methods");
    const data = await res.json();
    setMethods(data.methods || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nameAr.trim() || !form.nameEn.trim()) return setMsg("الاسم مطلوب");
    setSaving(true); setMsg("");
    const url = editing ? `/api/admin/shipping-methods/${editing}` : "/api/admin/shipping-methods";
    const res = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, fee: Number(form.fee), estimatedDays: form.estimatedDays, displayOrder: Number(form.displayOrder) }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMsg(data.error || "حدث خطأ");
    setMsg(editing ? "تم تحديث طريقة الشحن" : "تم إضافة طريقة الشحن");
    setEditing(null); setForm(empty); load();
  };

  const edit = (m: ShippingMethod) => setForm({ nameAr: m.nameAr, nameEn: m.nameEn, provider: m.provider || "", fee: m.fee, estimatedDays: m.estimatedDays == null ? "" : String(m.estimatedDays), displayOrder: String(m.displayOrder), isActive: m.isActive });
  const toggle = async (m: ShippingMethod) => { await fetch(`/api/admin/shipping-methods/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !m.isActive }) }); load(); };
  const remove = async (m: ShippingMethod) => { if (!confirm(`هل تريد حذف/تعطيل "${m.nameAr}"؟`)) return; const res = await fetch(`/api/admin/shipping-methods/${m.id}`, { method: "DELETE" }); const data = await res.json(); setMsg(data.message || data.error || "تم"); load(); };

  return <div className="p-4 sm:p-6 max-w-5xl mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div><h1 className="text-2xl font-black text-gray-900">إدارة الشحن</h1><p className="text-sm text-gray-500 mt-1">طرق الشحن والأسعار التي تظهر للعميل في إتمام الطلب.</p></div>
      <button onClick={() => { setEditing(null); setForm(empty); }} className="bg-[#1565C0] text-white px-4 py-2.5 rounded-lg text-sm font-bold">+ إضافة طريقة شحن</button>
    </div>
    {msg && <div className="mb-4 rounded-lg bg-blue-50 text-blue-700 px-4 py-3 text-sm">{msg}</div>}
    <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 mb-6">
      <h2 className="font-bold mb-4">{editing ? "تعديل طريقة الشحن" : "إضافة طريقة شحن"}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input placeholder="الاسم بالعربية *" value={form.nameAr} onChange={e => setForm({...form,nameAr:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm" />
        <input placeholder="English name *" dir="ltr" value={form.nameEn} onChange={e => setForm({...form,nameEn:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm" />
        <input placeholder="شركة الشحن / Provider" value={form.provider} onChange={e => setForm({...form,provider:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm" />
        <input type="number" min="0" step="0.01" placeholder="السعر" value={form.fee} onChange={e => setForm({...form,fee:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm" />
        <input type="number" min="0" placeholder="عدد أيام التوصيل" value={form.estimatedDays} onChange={e => setForm({...form,estimatedDays:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm" />
        <input type="number" placeholder="الترتيب" value={form.displayOrder} onChange={e => setForm({...form,displayOrder:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm" />
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button onClick={save} disabled={saving} className="bg-[#1565C0] text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving ? "جارٍ الحفظ..." : "حفظ"}</button>
        {editing && <button onClick={() => { setEditing(null); setForm(empty); }} className="border px-5 py-2 rounded-lg text-sm">إلغاء</button>}
      </div>
    </div>
    {loading ? <div className="text-center py-10 text-gray-400">جارٍ التحميل...</div> : <div className="space-y-3">
      {methods.map(m => <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${m.isActive ? "bg-green-500" : "bg-gray-300"}`} /><b>{m.nameAr}</b><span className="text-xs text-gray-400">{m.nameEn}</span></div><div className="text-xs text-gray-500 mt-1">{m.provider || "بدون شركة شحن"} · {m.estimatedDays == null ? "مدة غير محددة" : `${m.estimatedDays} يوم`} · ترتيب {m.displayOrder}</div></div>
        <div className="text-lg font-black text-[#1565C0]">{Number(m.fee) === 0 ? "مجاناً" : `${Number(m.fee).toFixed(2)} ج.م`}</div>
        <div className="flex gap-2"><button onClick={() => { setEditing(m.id); edit(m); }} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">تعديل</button><button onClick={() => toggle(m)} className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-xs font-bold">{m.isActive ? "تعطيل" : "تفعيل"}</button><button onClick={() => remove(m)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">حذف</button></div>
      </div>)}
      {methods.length === 0 && <div className="bg-white rounded-xl p-10 text-center text-gray-400">لا توجد طرق شحن حتى الآن.</div>}
    </div>}
  </div>;
}
