"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminProductImageManager, { AdminProductImage } from "@/components/AdminProductImageManager";

type Product = Record<string, any>;
type Cat = { id: string; nameAr: string; nameEn: string; subcategories: { id: string; nameAr: string; nameEn: string }[] };

const fields: [string, string][] = [
  ["nameAr", "اسم المنتج بالعربي"], ["nameEn", "اسم المنتج بالإنجليزي"], ["price", "السعر"],
  ["discountPercent", "الخصم %"], ["stock", "المخزون"], ["manufacturer", "الصانع"], ["partNumber", "رقم القطعة"],
  ["oemNumber", "رقم OEM"], ["warranty", "الضمان"], ["weight", "الوزن"], ["supplierName", "اسم المورد"],
  ["supplierPhone", "هاتف المورد"], ["supplierAddress", "عنوان المورد"],
];

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [images, setImages] = useState<AdminProductImage[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [a, b, c, d] = await Promise.all([
        fetch(`/api/admin/products/${id}`), fetch("/api/categories"), fetch("/api/brands"), fetch(`/api/admin/products/${id}/images`),
      ]);
      const [pa, ca, br, im] = await Promise.all([a.json(), b.json(), c.json(), d.json()]);
      if (cancelled) return;
      setProduct(pa.product); setCats(ca.categories || []); setBrands(br.brands || []); setImages(im.images || []); setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading || !product) return <div className="p-6">جاري التحميل...</div>;

  const save = async () => {
    const r = await fetch(`/api/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(product) });
    const d = await r.json();
    setMsg(r.ok ? "تم حفظ المنتج" : d.error || "خطأ");
  };
  const sub = cats.find(c => c.id === product.categoryId)?.subcategories || [];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-5">
        <div><Link href="/admin/products" className="text-sm text-[#1565C0]">← المنتجات</Link><h1 className="text-2xl font-black mt-2">تعديل المنتج</h1></div>
        <button onClick={save} className="bg-[#1565C0] text-white px-5 py-2.5 rounded-lg font-bold">حفظ</button>
      </div>
      {msg && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm">{msg}</div>}
      <div className="bg-white rounded-xl border p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(([key, label]) => <label key={key} className="text-sm font-medium">{label}<input type={["price", "discountPercent", "stock", "weight"].includes(key) ? "number" : "text"} value={product[key] ?? ""} onChange={e => setProduct({ ...product, [key]: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>)}
          <label className="text-sm font-medium">التصنيف<select value={product.categoryId ?? ""} onChange={e => setProduct({ ...product, categoryId: e.target.value, subcategoryId: null })} className="mt-1 w-full border rounded-lg px-3 py-2"><option value="">اختر</option>{cats.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}</select></label>
          <label className="text-sm font-medium">التصنيف الفرعي<select value={product.subcategoryId ?? ""} onChange={e => setProduct({ ...product, subcategoryId: e.target.value || null })} className="mt-1 w-full border rounded-lg px-3 py-2"><option value="">بدون</option>{sub.map(s => <option key={s.id} value={s.id}>{s.nameAr}</option>)}</select></label>
          <label className="text-sm font-medium">العلامة التجارية<select value={product.brandId ?? ""} onChange={e => setProduct({ ...product, brandId: e.target.value || null })} className="mt-1 w-full border rounded-lg px-3 py-2"><option value="">بدون</option>{brands.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}</select></label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <label className="text-sm font-medium">الوصف بالعربي<textarea value={product.descriptionAr ?? ""} onChange={e => setProduct({ ...product, descriptionAr: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 min-h-28" /></label>
          <label className="text-sm font-medium">الوصف بالإنجليزي<textarea value={product.descriptionEn ?? ""} onChange={e => setProduct({ ...product, descriptionEn: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 min-h-28" /></label>
        </div>
        <label className="block text-sm font-medium mt-4">ملاحظات المورد (داخلية فقط)<textarea value={product.supplierNotes ?? ""} onChange={e => setProduct({ ...product, supplierNotes: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 min-h-24" /></label>
        <div className="flex gap-5 mt-5 text-sm"><label><input type="checkbox" checked={!!product.isActive} onChange={e => setProduct({ ...product, isActive: e.target.checked })} /> متاح للبيع</label><label><input type="checkbox" checked={!!product.isFeatured} onChange={e => setProduct({ ...product, isFeatured: e.target.checked })} /> مميز</label></div>
      </div>
      <div className="bg-white rounded-xl border p-4 sm:p-6 mt-4"><h2 className="font-bold mb-4">صور المنتج</h2><AdminProductImageManager productId={id} images={images} onChange={setImages} /></div>
    </div>
  );
}
