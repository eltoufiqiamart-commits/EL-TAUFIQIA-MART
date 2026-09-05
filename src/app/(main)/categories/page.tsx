"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Subcategory { id: string; nameAr: string; nameEn: string; slug: string; }
interface Category { id: string; nameAr: string; nameEn: string; slug: string; subcategories: Subcategory[]; }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-gray-900 mb-6">جميع التصنيفات</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(9)].map((_, i) => <div key={i} className="bg-white h-40 rounded-xl animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>لا توجد تصنيفات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-[#1565C0] transition-all">
              <Link href={`/search?category=${cat.id}`} className="block p-4 bg-[#1565C0] hover:bg-[#0D47A1] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white font-bold">{cat.nameAr}</h2>
                    <p className="text-blue-200 text-xs">{cat.nameEn}</p>
                  </div>
                </div>
              </Link>
              {cat.subcategories.length > 0 && (
                <div className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subcategories.slice(0, 8).map(sub => (
                      <Link
                        key={sub.id}
                        href={`/search?category=${cat.id}&subcategory=${sub.id}`}
                        className="text-xs bg-blue-50 text-blue-700 hover:bg-[#1565C0] hover:text-white px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {sub.nameAr}
                      </Link>
                    ))}
                    {cat.subcategories.length > 8 && (
                      <Link href={`/search?category=${cat.id}`} className="text-xs text-gray-400 hover:text-[#1565C0] px-2 py-1">
                        +{cat.subcategories.length - 8} المزيد
                      </Link>
                    )}
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
