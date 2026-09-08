"use client";

import { useEffect, useMemo, useState } from "react";

type Subcategory = {
  id: string; categoryId: string; nameAr: string; nameEn: string; slug: string;
  descriptionAr: string | null; descriptionEn: string | null; imageUrl: string | null;
  displayOrder: number; isActive: boolean; productCount: number;
};

type Category = {
  id: string; nameAr: string; nameEn: string; slug: string;
  descriptionAr: string | null; descriptionEn: string | null; imageUrl: string | null;
  displayOrder: number; isActive: boolean; productCount: number;
  subcategories: Subcategory[];
};

type FormState = { nameAr: string; nameEn: string; descriptionAr: string; descriptionEn: string; imageUrl: string; displayOrder: string; isActive: boolean };
const emptyForm: FormState = { nameAr: "", nameEn: "", descriptionAr: "", descriptionEn: "", imageUrl: "", displayOrder: "0", isActive: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [categoryForm, setCategoryForm] = useState<FormState>(emptyForm);
  const [subcategoryForm, setSubcategoryForm] = useState<FormState>(emptyForm);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (activeFilter !== "all") params.set("active", activeFilter);
      const res = await fetch(`/api/admin/categories?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر تحميل التصنيفات");
      setCategories(data.categories || []);
    } catch (e) { setMessage({ text: e instanceof Error ? e.message : "خطأ", error: true }); }
    finally { setLoading(false); }
  };
  useEffect(() => { const t = setTimeout(load, 180); return () => clearTimeout(t); }, [query, activeFilter]);

  const stats = useMemo(() => ({
    categories: categories.length,
    active: categories.filter(c => c.isActive).length,
    subcategories: categories.reduce((n, c) => n + c.subcategories.length, 0),
    products: categories.reduce((n, c) => n + c.productCount, 0),
  }), [categories]);

  const flash = (text: string, error = false) => { setMessage({ text, error }); setTimeout(() => setMessage(null), 3500); };
  const api = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "حدث خطأ");
    return data;
  };

  const saveCategory = async () => {
    if (!categoryForm.nameAr.trim() || !categoryForm.nameEn.trim()) return flash("اكتب اسم التصنيف بالعربي والإنجليزي", true);
    setSaving(true);
    try {
      await api(editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories", editingCategory ? "PATCH" : "POST", { ...categoryForm, displayOrder: Number(categoryForm.displayOrder) || 0 });
      flash(editingCategory ? "تم تحديث التصنيف" : "تم إضافة التصنيف");
      setEditingCategory(null); setShowCategoryForm(false); setCategoryForm(emptyForm); await load();
    } catch (e) { flash(e instanceof Error ? e.message : "خطأ", true); } finally { setSaving(false); }
  };

  const saveSubcategory = async (categoryId: string) => {
    if (!subcategoryForm.nameAr.trim() || !subcategoryForm.nameEn.trim()) return flash("اكتب اسم التصنيف الفرعي بالعربي والإنجليزي", true);
    setSaving(true);
    try {
      await api(editingSubcategory ? `/api/admin/subcategories/${editingSubcategory.id}` : "/api/admin/subcategories", editingSubcategory ? "PATCH" : "POST", { ...subcategoryForm, categoryId, displayOrder: Number(subcategoryForm.displayOrder) || 0 });
      flash(editingSubcategory ? "تم تحديث التصنيف الفرعي" : "تم إضافة التصنيف الفرعي");
      setEditingSubcategory(null); setAddingSubTo(null); setSubcategoryForm(emptyForm); await load();
    } catch (e) { flash(e instanceof Error ? e.message : "خطأ", true); } finally { setSaving(false); }
  };

  const editCategory = (c: Category) => { setEditingCategory(c); setCategoryForm({ nameAr: c.nameAr, nameEn: c.nameEn, descriptionAr: c.descriptionAr || "", descriptionEn: c.descriptionEn || "", imageUrl: c.imageUrl || "", displayOrder: String(c.displayOrder), isActive: c.isActive }); setShowCategoryForm(true); };
  const editSubcategory = (s: Subcategory) => { setEditingSubcategory(s); setSubcategoryForm({ nameAr: s.nameAr, nameEn: s.nameEn, descriptionAr: s.descriptionAr || "", descriptionEn: s.descriptionEn || "", imageUrl: s.imageUrl || "", displayOrder: String(s.displayOrder), isActive: s.isActive }); setAddingSubTo(s.categoryId); };

  const toggleCategory = async (c: Category) => { try { await api(`/api/admin/categories/${c.id}`, "PATCH", { isActive: !c.isActive }); flash(c.isActive ? "تم تعطيل التصنيف" : "تم تفعيل التصنيف"); await load(); } catch (e) { flash(e instanceof Error ? e.message : "خطأ", true); } };
  const toggleSubcategory = async (s: Subcategory) => { try { await api(`/api/admin/subcategories/${s.id}`, "PATCH", { isActive: !s.isActive }); flash(s.isActive ? "تم تعطيل التصنيف الفرعي" : "تم تفعيل التصنيف الفرعي"); await load(); } catch (e) { flash(e instanceof Error ? e.message : "خطأ", true); } };
  const removeCategory = async (c: Category) => { if (!confirm(`هل تريد حذف/تعطيل «${c.nameAr}»؟ إذا كان مرتبطًا بمنتجات أو تصنيفات فرعية سيتم تعطيله بدلًا من الحذف.`)) return; try { const d = await api(`/api/admin/categories/${c.id}`, "DELETE"); flash(d.message || "تمت العملية"); await load(); } catch (e) { flash(e instanceof Error ? e.message : "خطأ", true); } };
  const removeSubcategory = async (s: Subcategory) => { if (!confirm(`هل تريد حذف/تعطيل «${s.nameAr}»؟`)) return; try { const d = await api(`/api/admin/subcategories/${s.id}`, "DELETE"); flash(d.message || "تمت العملية"); await load(); } catch (e) { flash(e instanceof Error ? e.message : "خطأ", true); } };

  return <div className="p-4 sm:p-6 max-w-7xl mx-auto" dir="rtl">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
      <div><p className="text-sm text-gray-500 mb-1">إدارة كتالوج المتجر</p><h1 className="text-2xl sm:text-3xl font-black text-gray-900">التصنيفات والتصنيفات الفرعية</h1><p className="text-sm text-gray-500 mt-2">رتّب هيكل المنتجات، عدّل البيانات، وأوقف أي تصنيف بدون فقد المنتجات المرتبطة به.</p></div>
      <button onClick={() => { setEditingCategory(null); setCategoryForm(emptyForm); setShowCategoryForm(true); }} className="bg-[#1565C0] text-white px-5 py-3 rounded-xl font-bold shadow-sm">+ إضافة تصنيف</button>
    </div>

    {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm border ${message.error ? "bg-red-50 text-red-700 border-red-100" : "bg-green-50 text-green-700 border-green-100"}`}>{message.text}</div>}

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {[["التصنيفات", stats.categories], ["النشطة", stats.active], ["التصنيفات الفرعية", stats.subcategories], ["المنتجات المرتبطة", stats.products]].map(([label, value]) => <div key={String(label)} className="bg-white border border-gray-100 rounded-xl p-4"><div className="text-xs text-gray-500">{label}</div><div className="text-2xl font-black text-gray-900 mt-1">{value}</div></div>)}
    </div>

    <div className="bg-white border border-gray-100 rounded-xl p-3 mb-5 flex flex-col sm:flex-row gap-3">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالاسم العربي أو الإنجليزي أو Slug..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0]" />
      <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"><option value="all">كل الحالات</option><option value="true">نشط فقط</option><option value="false">غير نشط فقط</option></select>
    </div>

    {showCategoryForm && <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 sm:p-5 mb-5">
      <div className="flex justify-between items-center mb-4"><h2 className="font-black">{editingCategory ? "تعديل التصنيف" : "إضافة تصنيف جديد"}</h2><button onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }} className="text-gray-500">إغلاق</button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="الاسم بالعربية *" value={categoryForm.nameAr} onChange={v => setCategoryForm({ ...categoryForm, nameAr: v })} />
        <Field label="الاسم بالإنجليزية *" value={categoryForm.nameEn} dir="ltr" onChange={v => setCategoryForm({ ...categoryForm, nameEn: v })} />
        <Field label="رابط صورة التصنيف" value={categoryForm.imageUrl} dir="ltr" onChange={v => setCategoryForm({ ...categoryForm, imageUrl: v })} />
        <Field label="الوصف بالعربية" value={categoryForm.descriptionAr} onChange={v => setCategoryForm({ ...categoryForm, descriptionAr: v })} />
        <Field label="الوصف بالإنجليزية" value={categoryForm.descriptionEn} dir="ltr" onChange={v => setCategoryForm({ ...categoryForm, descriptionEn: v })} />
        <Field label="ترتيب العرض" value={categoryForm.displayOrder} type="number" onChange={v => setCategoryForm({ ...categoryForm, displayOrder: v })} />
      </div>
      <div className="flex gap-2 mt-4"><button disabled={saving} onClick={saveCategory} className="bg-[#1565C0] text-white px-5 py-2.5 rounded-lg font-bold disabled:opacity-50">{saving ? "جاري الحفظ..." : "حفظ"}</button><button onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }} className="border border-gray-200 bg-white px-5 py-2.5 rounded-lg">إلغاء</button></div>
    </div>}

    {loading ? <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />)}</div> : categories.length === 0 ? <div className="bg-white border border-dashed rounded-xl p-12 text-center text-gray-500">لا توجد تصنيفات مطابقة للبحث.</div> : <div className="space-y-4">
      {categories.map(c => <div key={c.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {c.imageUrl ? <img src={c.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border" /> : <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center font-black">{c.nameAr.slice(0,1)}</div>}
            <button onClick={() => setExpanded({ ...expanded, [c.id]: !expanded[c.id] })} className="text-right min-w-0"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${c.isActive ? "bg-green-500" : "bg-gray-300"}`} /><span className="font-black text-gray-900 truncate">{c.nameAr}</span><span className="text-xs text-gray-400" dir="ltr">{c.nameEn}</span></div><div className="text-xs text-gray-400 mt-1">{c.productCount} منتج · {c.subcategories.length} تصنيف فرعي · {c.slug}</div></button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setExpanded({ ...expanded, [c.id]: !expanded[c.id] })} className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-xs font-bold">{expanded[c.id] ? "إخفاء الفرعي" : "عرض الفرعي"}</button>
            <button onClick={() => { setAddingSubTo(c.id); setEditingSubcategory(null); setSubcategoryForm(emptyForm); setExpanded({ ...expanded, [c.id]: true }); }} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">+ فرعي</button>
            <button onClick={() => editCategory(c)} className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-xs font-bold">تعديل</button>
            <button onClick={() => toggleCategory(c)} className={`px-3 py-2 rounded-lg text-xs font-bold ${c.isActive ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>{c.isActive ? "تعطيل" : "تفعيل"}</button>
            <button onClick={() => removeCategory(c)} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold">حذف</button>
          </div>
        </div>

        {expanded[c.id] && <div className="border-t border-gray-100 bg-gray-50/60 p-3 sm:p-4">
          {addingSubTo === c.id && <div className="bg-white border border-blue-100 rounded-xl p-4 mb-3">
            <h3 className="font-bold mb-3">{editingSubcategory ? "تعديل التصنيف الفرعي" : `إضافة تصنيف فرعي داخل ${c.nameAr}`}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"><Field label="الاسم بالعربية *" value={subcategoryForm.nameAr} onChange={v => setSubcategoryForm({ ...subcategoryForm, nameAr: v })} /><Field label="الاسم بالإنجليزية *" value={subcategoryForm.nameEn} dir="ltr" onChange={v => setSubcategoryForm({ ...subcategoryForm, nameEn: v })} /><Field label="رابط الصورة" value={subcategoryForm.imageUrl} dir="ltr" onChange={v => setSubcategoryForm({ ...subcategoryForm, imageUrl: v })} /><Field label="الوصف بالعربية" value={subcategoryForm.descriptionAr} onChange={v => setSubcategoryForm({ ...subcategoryForm, descriptionAr: v })} /><Field label="الوصف بالإنجليزية" value={subcategoryForm.descriptionEn} dir="ltr" onChange={v => setSubcategoryForm({ ...subcategoryForm, descriptionEn: v })} /><Field label="ترتيب العرض" value={subcategoryForm.displayOrder} type="number" onChange={v => setSubcategoryForm({ ...subcategoryForm, displayOrder: v })} /></div>
            <div className="flex gap-2 mt-4"><button disabled={saving} onClick={() => saveSubcategory(c.id)} className="bg-[#1565C0] text-white px-4 py-2 rounded-lg text-sm font-bold">{saving ? "جاري الحفظ..." : "حفظ"}</button><button onClick={() => { setAddingSubTo(null); setEditingSubcategory(null); }} className="border bg-white px-4 py-2 rounded-lg text-sm">إلغاء</button></div>
          </div>}
          {c.subcategories.length === 0 ? <div className="text-sm text-gray-500 py-5 text-center">لا توجد تصنيفات فرعية.</div> : <div className="space-y-2">{c.subcategories.map(s => <div key={s.id} className="bg-white border border-gray-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">{s.imageUrl ? <img src={s.imageUrl} alt="" className="w-9 h-9 rounded-md object-cover border" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}<div className="min-w-0"><div className="font-bold text-sm text-gray-800 truncate">{s.nameAr}</div><div className="text-xs text-gray-400" dir="ltr">{s.nameEn} · {s.productCount} منتج · ترتيب {s.displayOrder}</div></div></div>
            <div className="flex gap-2"><button onClick={() => editSubcategory(s)} className="px-3 py-1.5 rounded-md bg-gray-50 text-xs font-bold">تعديل</button><button onClick={() => toggleSubcategory(s)} className={`px-3 py-1.5 rounded-md text-xs font-bold ${s.isActive ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>{s.isActive ? "تعطيل" : "تفعيل"}</button><button onClick={() => removeSubcategory(s)} className="px-3 py-1.5 rounded-md bg-red-50 text-red-600 text-xs font-bold">حذف</button></div>
          </div>)}</div>}
        </div>}
      </div>)}
    </div>}
  </div>;
}

function Field({ label, value, onChange, dir, type = "text" }: { label: string; value: string; onChange: (v: string) => void; dir?: "ltr" | "rtl"; type?: string }) {
  return <label className="text-xs font-bold text-gray-600">{label}<input type={type} value={value} dir={dir} onChange={e => onChange(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-normal bg-white outline-none focus:border-[#1565C0]" /></label>;
}
