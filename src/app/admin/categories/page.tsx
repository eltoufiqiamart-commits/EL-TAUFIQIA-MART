"use client";

import { useState, useEffect } from "react";

interface Category {
  id: string; nameAr: string; nameEn: string; slug: string;
  isActive: boolean; displayOrder: number;
  subcategories: { id: string; nameAr: string; nameEn: string; isActive: boolean; displayOrder: number; }[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddSub, setShowAddSub] = useState<string | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [msg, setMsg] = useState("");
  const [newCat, setNewCat] = useState({ nameAr: "", nameEn: "", descriptionAr: "", displayOrder: "0" });
  const [newSub, setNewSub] = useState({ nameAr: "", nameEn: "", descriptionAr: "", displayOrder: "0" });

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const addCategory = async () => {
    if (!newCat.nameAr || !newCat.nameEn) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newCat, displayOrder: parseInt(newCat.displayOrder) }),
    });
    const data = await res.json();
    if (data.category) {
      showMsg("تم إضافة التصنيف");
      setNewCat({ nameAr: "", nameEn: "", descriptionAr: "", displayOrder: "0" });
      setShowAddCat(false);
      fetchCategories();
    } else showMsg(data.error || "خطأ");
  };

  const updateCategory = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.success) { showMsg("تم التحديث"); fetchCategories(); }
    else showMsg(data.error || "خطأ");
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف/تعطيل هذا التصنيف؟")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    showMsg(data.message || (data.success ? "تم الحذف" : data.error || "خطأ"));
    fetchCategories();
  };

  const addSubcategory = async (categoryId: string) => {
    if (!newSub.nameAr || !newSub.nameEn) return;
    const res = await fetch("/api/admin/subcategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, ...newSub, displayOrder: parseInt(newSub.displayOrder) }),
    });
    const data = await res.json();
    if (data.subcategory) {
      showMsg("تم إضافة التصنيف الفرعي");
      setNewSub({ nameAr: "", nameEn: "", descriptionAr: "", displayOrder: "0" });
      setShowAddSub(null);
      fetchCategories();
    } else showMsg(data.error || "خطأ");
  };

  const updateSubcategory = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/subcategories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.success) { showMsg("تم التحديث"); fetchCategories(); }
    else showMsg(data.error || "خطأ");
  };

  const deleteSubcategory = async (id: string) => {
    if (!confirm("هل أنت متأكد؟")) return;
    const res = await fetch(`/api/admin/subcategories/${id}`, { method: "DELETE" });
    const data = await res.json();
    showMsg(data.message || (data.success ? "تم" : data.error || "خطأ"));
    fetchCategories();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">إدارة التصنيفات</h1>
        <button
          onClick={() => setShowAddCat(true)}
          className="bg-[#1565C0] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0D47A1] flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          إضافة تصنيف
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.includes("خطأ") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {msg}
        </div>
      )}

      {/* Add Category Form */}
      {showAddCat && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-5">
          <h3 className="font-bold text-gray-900 mb-4">إضافة تصنيف جديد</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الاسم بالعربية *</label>
              <input value={newCat.nameAr} onChange={(e) => setNewCat({ ...newCat, nameAr: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الاسم بالإنجليزية *</label>
              <input value={newCat.nameEn} onChange={(e) => setNewCat({ ...newCat, nameEn: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الوصف</label>
              <input value={newCat.descriptionAr} onChange={(e) => setNewCat({ ...newCat, descriptionAr: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الترتيب</label>
              <input type="number" value={newCat.displayOrder} onChange={(e) => setNewCat({ ...newCat, displayOrder: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addCategory} className="bg-[#1565C0] text-white px-4 py-2 rounded-lg text-sm font-medium">حفظ</button>
            <button onClick={() => setShowAddCat(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm">إلغاء</button>
          </div>
        </div>
      )}

      {/* Categories list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white h-16 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${cat.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                  <div>
                    <span className="font-bold text-gray-900">{cat.nameAr}</span>
                    <span className="text-gray-400 text-sm mx-2">|</span>
                    <span className="text-gray-500 text-sm">{cat.nameEn}</span>
                    <span className="text-xs text-gray-400 mr-2">({cat.subcategories.length} تصنيف فرعي)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCategory(cat.id, { isActive: !cat.isActive })}
                    className={`px-2.5 py-1 rounded text-xs font-medium ${cat.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                  >
                    {cat.isActive ? "تعطيل" : "تفعيل"}
                  </button>
                  <button
                    onClick={() => setShowAddSub(cat.id)}
                    className="px-2.5 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    + فرعي
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    حذف
                  </button>
                </div>
              </div>

              {/* Add subcategory form */}
              {showAddSub === cat.id && (
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input placeholder="اسم بالعربية *" value={newSub.nameAr} onChange={(e) => setNewSub({ ...newSub, nameAr: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#1565C0]" />
                    <input placeholder="English name *" value={newSub.nameEn} onChange={(e) => setNewSub({ ...newSub, nameEn: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#1565C0]" dir="ltr" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addSubcategory(cat.id)} className="bg-[#1565C0] text-white px-3 py-1.5 rounded-lg text-sm">حفظ</button>
                    <button onClick={() => setShowAddSub(null)} className="border border-gray-200 px-3 py-1.5 rounded-lg text-sm">إلغاء</button>
                  </div>
                </div>
              )}

              {/* Subcategories */}
              {cat.subcategories.length > 0 && (
                <div className="p-4">
                  <div className="space-y-2">
                    {cat.subcategories.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${sub.isActive ? "bg-green-400" : "bg-gray-300"}`} />
                          <span className="text-sm text-gray-800">{sub.nameAr}</span>
                          <span className="text-xs text-gray-400">| {sub.nameEn}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateSubcategory(sub.id, { isActive: !sub.isActive })}
                            className={`px-2 py-0.5 rounded text-xs ${sub.isActive ? "text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"}`}
                          >
                            {sub.isActive ? "تعطيل" : "تفعيل"}
                          </button>
                          <button
                            onClick={() => deleteSubcategory(sub.id)}
                            className="px-2 py-0.5 rounded text-xs text-red-400 hover:bg-red-50"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
