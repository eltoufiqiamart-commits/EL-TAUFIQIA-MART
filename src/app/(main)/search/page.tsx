"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

interface Product {
  id: string; nameAr: string; nameEn: string; slug: string;
  price: string; discountPercent?: string | null; stock: number;
  condition: string; mainImageUrl?: string | null; partNumber?: string | null;
  categoryNameAr?: string | null; brandNameAr?: string | null; sellerStoreName?: string | null;
}

interface Category { id: string; nameAr: string; nameEn: string; }
interface Brand { id: string; nameAr: string; nameEn: string; }

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const featuredParam = searchParams.get("featured") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [filters, setFilters] = useState({
    q, category: categoryParam, brand: "", condition: "", minPrice: "", maxPrice: "", sort: "newest", page: 1, featured: featuredParam,
  });

  // Track the URL-derived values filters was last synced to. When the URL's
  // q/category change (e.g. a new search from the header), reset the
  // corresponding filters during render rather than in an effect — this is
  // the "adjusting state when a prop changes" pattern React recommends
  // instead of useEffect, since it avoids an extra render pass.
  const [syncedFromUrl, setSyncedFromUrl] = useState({ q, category: categoryParam });
  if (syncedFromUrl.q !== q || syncedFromUrl.category !== categoryParam) {
    setSyncedFromUrl({ q, category: categoryParam });
    setFilters(f => ({ ...f, q, category: categoryParam, page: 1 }));
  }

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || []));
    fetch("/api/brands").then(r => r.json()).then(d => setBrands(d.brands || []));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.brand) params.set("brand", filters.brand);
    if (filters.condition) params.set("condition", filters.condition);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.featured) params.set("featured", filters.featured);
    params.set("sort", filters.sort);
    params.set("page", filters.page.toString());

    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    setProducts(data.products || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilter = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  };

  const CONDITIONS = [
    { value: "", label: "الكل" },
    { value: "new", label: "جديد" },
    { value: "used", label: "مستعمل" },
    { value: "original", label: "أصلي" },
    { value: "aftermarket", label: "بديل" },
    { value: "oem", label: "OEM" },
  ];

  const SORTS = [
    { value: "newest", label: "الأحدث" },
    { value: "price_asc", label: "السعر: الأقل أولاً" },
    { value: "price_desc", label: "السعر: الأعلى أولاً" },
    { value: "popular", label: "الأكثر مشاهدة" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-4">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">تصفية النتائج</h3>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">التصنيف</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]"
              >
                <option value="">جميع التصنيفات</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
            </div>

            {/* Brand */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">الماركة</label>
              <select
                value={filters.brand}
                onChange={(e) => updateFilter("brand", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]"
              >
                <option value="">جميع الماركات</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
              </select>
            </div>

            {/* Condition */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">الحالة</label>
              <div className="space-y-1">
                {CONDITIONS.map(c => (
                  <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      value={c.value}
                      checked={filters.condition === c.value}
                      onChange={(e) => updateFilter("condition", e.target.value)}
                      className="text-[#1565C0]"
                    />
                    <span className="text-sm text-gray-700">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">نطاق السعر (جنيه)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                  placeholder="من"
                  className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-[#1565C0]"
                />
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                  placeholder="إلى"
                  className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-[#1565C0]"
                />
              </div>
            </div>

            <button
              onClick={() => setFilters({ q: "", category: "", brand: "", condition: "", minPrice: "", maxPrice: "", sort: "newest", page: 1, featured: "" })}
              className="w-full text-sm text-[#1565C0] hover:underline"
            >
              إزالة الفلاتر
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {q ? `نتائج البحث عن "${q}"` : "جميع المنتجات"}
              </h1>
              <p className="text-sm text-gray-500">{total} منتج</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">ترتيب:</label>
              <select
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#1565C0]"
              >
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد نتائج</h3>
              <p className="text-gray-400 text-sm">جرب كلمات بحث مختلفة أو قم بتغيير الفلاتر</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  السابق
                </button>
                <span className="text-sm text-gray-600">صفحة {filters.page}</span>
                <button
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  disabled={products.length < 24}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  التالي
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565C0]"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
