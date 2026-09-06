"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category { id: string; nameAr: string; subcategories: { id: string; nameAr: string; }[]; }
interface Brand { id: string; nameAr: string; }

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState({
    nameAr: "", nameEn: "", descriptionAr: "", descriptionEn: "",
    categoryId: "", subcategoryId: "", brandId: "",
    price: "", discountPercent: "0", stock: "1",
    condition: "new", manufacturer: "", partNumber: "", oemNumber: "",
    crossReference: "", warranty: "",
  });
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"idle" | "creating" | "uploading">("idle");

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || []));
    fetch("/api/brands").then(r => r.json()).then(d => setBrands(d.brands || []));
  }, []);

  useEffect(() => {
    return () => {
      if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    };
  }, [pendingImagePreview]);

  const selectedCategory = categories.find(c => c.id === form.categoryId);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("صيغة الملف غير مدعومة. يرجى اختيار صورة JPEG أو PNG أو WebP");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("حجم الصورة أكبر من الحد المسموح (10 ميجابايت)");
      return;
    }
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImage(file);
    setPendingImagePreview(URL.createObjectURL(file));
  };

  const handleRemovePendingImage = () => {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImage(null);
    setPendingImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr || !form.nameEn || !form.categoryId || !form.price) {
      setError("يرجى ملء الحقول المطلوبة"); return;
    }
    setLoading(true);
    setError("");
    try {
      setStage("creating");
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), discountPercent: parseFloat(form.discountPercent), stock: parseInt(form.stock) }),
      });
      const data = await res.json();
      if (!data.product) {
        setError(data.error || "خطأ في إضافة المنتج");
        return;
      }

      if (pendingImage) {
        setStage("uploading");
        const formData = new FormData();
        formData.append("image", pendingImage);
        const uploadRes = await fetch(`/api/seller/products/${data.product.id}/images`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => ({}));
          // The product itself was created successfully; only the image
          // upload failed. Send the seller to the edit page so they can
          // retry the upload instead of losing the product entirely.
          router.push(`/seller/products/${data.product.id}/edit`);
          console.error("Product image upload failed:", uploadData.error);
          return;
        }
      }

      router.push("/seller/dashboard");
    } catch { setError("خطأ في الاتصال"); }
    finally { setLoading(false); setStage("idle"); }
  };

  const CONDITIONS = [
    { value: "new", label: "جديد" },
    { value: "used", label: "مستعمل" },
    { value: "original", label: "أصلي" },
    { value: "aftermarket", label: "بديل" },
    { value: "oem", label: "OEM" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/seller/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← لوحة البائع</Link>
        <h1 className="text-xl font-black text-gray-900">إضافة منتج جديد</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">المعلومات الأساسية</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">اسم المنتج بالعربية *</label>
              <input value={form.nameAr} onChange={e => setForm({...form, nameAr: e.target.value})} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name (English) *</label>
              <input value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} required dir="ltr" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">وصف المنتج</label>
              <textarea value={form.descriptionAr} onChange={e => setForm({...form, descriptionAr: e.target.value})} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] resize-none" />
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">التصنيف</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">التصنيف الرئيسي *</label>
              <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value, subcategoryId: ""})} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]">
                <option value="">اختر التصنيف</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">التصنيف الفرعي</label>
              <select value={form.subcategoryId} onChange={e => setForm({...form, subcategoryId: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" disabled={!form.categoryId}>
                <option value="">اختر التصنيف الفرعي</option>
                {selectedCategory?.subcategories.map(s => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الماركة</label>
              <select value={form.brandId} onChange={e => setForm({...form, brandId: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]">
                <option value="">اختر الماركة</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">السعر والمخزون</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">السعر (جنيه) *</label>
              <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required min="0" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الخصم (%)</label>
              <input type="number" value={form.discountPercent} onChange={e => setForm({...form, discountPercent: e.target.value})} min="0" max="100" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">المخزون</label>
              <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الحالة</label>
              <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]">
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Technical */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">المعلومات التقنية</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">رقم القطعة</label>
              <input value={form.partNumber} onChange={e => setForm({...form, partNumber: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] font-mono" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">رقم OEM</label>
              <input value={form.oemNumber} onChange={e => setForm({...form, oemNumber: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] font-mono" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الصانع</label>
              <input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الضمان</label>
              <input value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} placeholder="مثال: سنة ضمان" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">أرقام مرجعية مكافئة</label>
              <input value={form.crossReference} onChange={e => setForm({...form, crossReference: e.target.value})} placeholder="ادخل الأرقام مفصولة بفاصلة" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] font-mono" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">صورة المنتج</h3>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
              {pendingImagePreview ? (
                <img src={pendingImagePreview} alt="معاينة" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border border-gray-200 hover:border-[#1565C0] hover:text-[#1565C0] text-gray-600 text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
              >
                {pendingImage ? "تغيير الصورة" : "اختيار صورة من جهازك"}
              </button>
              {pendingImage && (
                <button
                  type="button"
                  onClick={handleRemovePendingImage}
                  className="text-red-500 text-sm font-medium mr-3 hover:underline"
                >
                  إزالة
                </button>
              )}
              <p className="text-xs text-gray-400 mt-2">
                JPEG أو PNG أو WebP، بحد أقصى 10 ميجابايت. يمكنك إضافة صور إضافية بعد حفظ المنتج.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelected}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-[#1565C0] hover:bg-[#0D47A1] text-white py-3 rounded-xl font-bold disabled:opacity-60 transition-colors">
            {stage === "creating" ? "جاري إنشاء المنتج..." : stage === "uploading" ? "جاري رفع الصورة..." : "إضافة المنتج"}
          </button>
          <Link href="/seller/dashboard" className="px-6 py-3 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">إلغاء</Link>
        </div>
      </form>
    </div>
  );
}
