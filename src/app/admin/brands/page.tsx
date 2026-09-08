"use client";

import { useEffect, useState } from "react";

interface Brand {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  logoUrl: string | null;
  country: string | null;
  isActive: boolean;
  displayOrder: number;
}

const emptyForm = { nameAr: "", nameEn: "", logoUrl: "", country: "", displayOrder: "0" };

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/brands?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ");
      setBrands(data.brands || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تحميل الماركات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const save = async () => {
    if (!form.nameAr.trim() || !form.nameEn.trim()) return flash("اكتب اسم الماركة بالعربي والإنجليزي");
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/brands/${editing.id}` : "/api/admin/brands", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, displayOrder: Number(form.displayOrder) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ");
      flash(editing ? "تم تحديث الماركة" : "تم إضافة الماركة");
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const edit = (brand: Brand) => {
    setEditing(brand);
    setForm({ nameAr: brand.nameAr, nameEn: brand.nameEn, logoUrl: brand.logoUrl || "", country: brand.country || "", displayOrder: String(brand.displayOrder) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = async (brand: Brand) => {
    const res = await fetch(`/api/admin/brands/${brand.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !brand.isActive }) });
    const data = await res.json();
    flash(data.success ? "تم التحديث" : data.error || "خطأ");
    load();
  };

  const remove = async (brand: Brand) => {
    if (!confirm(`هل تريد حذف/تعطيل ماركة ${brand.nameAr}؟`)) return;
    const res = await fetch(`/api/admin/brands/${brand.id}`, { method: "DELETE" });
    const data = await res.json();
    flash(data.message || data.error || "تم التنفيذ");
    load();
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div><h1 className="text-xl sm:text-2xl font-black text-gray-900">إدارة الماركات</h1><p className="text-xs sm:text-sm text-gray-500 mt-1">إضافة وتعديل الماركات المستخدمة في المنتجات</p></div>
        {editing && <button onClick={() => { setEditing(null); setForm(emptyForm); }} className="text-sm text-gray-600 border rounded-lg px-3 py-2">إلغاء التعديل</button>}
      </div>

      {message && <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-blue-50 text-blue-700">{message}</div>}

      <section className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 mb-5">
        <h2 className="font-bold text-gray-900 mb-4">{editing ? "تعديل الماركة" : "إضافة ماركة"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="text-sm">الاسم بالعربية *<input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:border-[#1565C0]" /></label>
          <label className="text-sm">English name *<input dir="ltr" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:border-[#1565C0]" /></label>
          <label className="text-sm">الدولة<input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:border-[#1565C0]" /></label>
          <label className="text-sm">رابط اللوجو<input dir="ltr" value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." className="mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:border-[#1565C0]" /></label>
          <label className="text-sm">الترتيب<input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:border-[#1565C0]" /></label>
        </div>
        <button disabled={saving} onClick={save} className="mt-4 bg-[#1565C0] disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-bold">{saving ? "جاري الحفظ..." : editing ? "حفظ التعديل" : "إضافة الماركة"}</button>
      </section>

      <div className="flex items-center gap-3 mb-4">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث في الماركات..." className="flex-1 max-w-md border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
      </div>

      {loading ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div> : brands.length === 0 ? <div className="bg-white border rounded-xl p-8 text-center text-gray-500">لا توجد ماركات</div> : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {brands.map(brand => (
            <div key={brand.id} className="p-3 sm:p-4 border-b last:border-b-0 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-12 h-12 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="max-w-full max-h-full object-contain" /> : <span className="text-xs text-gray-400">Logo</span>}
              </div>
              <div className="min-w-0 flex-1"><div className="font-bold text-gray-900 truncate">{brand.nameAr}</div><div dir="ltr" className="text-sm text-gray-500 truncate text-right">{brand.nameEn}</div><div className="text-xs text-gray-400">{brand.country || "—"} · ترتيب {brand.displayOrder}</div></div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => toggle(brand)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${brand.isActive ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>{brand.isActive ? "تعطيل" : "تفعيل"}</button>
                <button onClick={() => edit(brand)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">تعديل</button>
                <button onClick={() => remove(brand)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
