"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductImageManager, { ProductImageRow } from "@/components/ProductImageManager";

interface Category { id: string; nameAr: string; subcategories: { id: string; nameAr: string; }[]; }
interface Brand { id: string; nameAr: string; }

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const [form, setForm] = useState({
    nameAr: "", nameEn: "", descriptionAr: "",
    categoryId: "", subcategoryId: "", brandId: "",
    price: "", discountPercent: "0", stock: "0",
    condition: "new", manufacturer: "", partNumber: "", oemNumber: "",
    crossReference: "", warranty: "", isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || []));
    fetch("/api/brands").then(r => r.json()).then(d => setBrands(d.brands || []));
    fetch(`/api/seller/products/${id}/get`).then(r => r.json()).then(d => {
      if (d.product) {
        const p = d.product;
        setForm({
          nameAr: p.nameAr || "", nameEn: p.nameEn || "", descriptionAr: p.descriptionAr || "",
          categoryId: p.categoryId || "", subcategoryId: p.subcategoryId || "", brandId: p.brandId || "",
          price: p.price || "", discountPercent: p.discountPercent || "0", stock: String(p.stock || 0),
          condition: p.condition || "new", manufacturer: p.manufacturer || "", partNumber: p.partNumber || "",
          oemNumber: p.oemNumber || "", crossReference: p.crossReference || "", warranty: p.warranty || "",
          isActive: p.isActive !== false,
        });
      }
      if (Array.isArray(d.images)) setImages(d.images);
    }).finally(() => setLoading(false));
  }, [id]);

  const selectedCategory = categories.find(c => c.id === form.categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/seller/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), discountPercent: parseFloat(form.discountPercent), stock: parseInt(form.stock) }),
      });
      const data = await res.json();
      if (data.success) router.push("/seller/dashboard");
      else setError(data.error || "خطأ في التعديل");
    } catch { setError("خطأ في الاتصال"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565C0]" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/seller/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← لوحة البائع</Link>
        <h1 className="text-xl font-black text-gray-900">تعديل المنتج</h1>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">المعلومات الأساسية</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الاسم بالعربية *</label>
              <input value={form.nameAr} onChange={e => setForm({...form, nameAr: e.target.value})} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">English Name *</label>
              <input value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} required dir="ltr" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">الوصف</label>
              <textarea value={form.descriptionAr} onChange={e => setForm({...form, descriptionAr: e.target.value})} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] resize-none" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">السعر والمخزون</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">السعر *</label>
              <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required min="0" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الخصم %</label>
              <input type="number" value={form.discountPercent} onChange={e => setForm({...form, discountPercent: e.target.value})} min="0" max="100" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">المخزون</label>
              <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="text-[#1565C0]" />
                <span className="text-sm text-gray-700">نشط</span>
              </label>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">التفاصيل التقنية</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">رقم القطعة</label>
              <input value={form.partNumber} onChange={e => setForm({...form, partNumber: e.target.value})} dir="ltr" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">رقم OEM</label>
              <input value={form.oemNumber} onChange={e => setForm({...form, oemNumber: e.target.value})} dir="ltr" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الضمان</label>
              <input value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">صور المنتج</h3>
          <ProductImageManager productId={id} images={images} onImagesChange={setImages} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 bg-[#1565C0] hover:bg-[#0D47A1] text-white py-3 rounded-xl font-bold disabled:opacity-60">
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
          <Link href="/seller/dashboard" className="px-6 py-3 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 flex items-center">إلغاء</Link>
        </div>
      </form>
    </div>
  );
}
