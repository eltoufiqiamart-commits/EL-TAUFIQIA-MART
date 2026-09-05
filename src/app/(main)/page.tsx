"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  subcategories: { id: string; nameAr: string; nameEn: string; slug: string }[];
}

interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  price: string;
  discountPercent?: string | null;
  stock: number;
  condition: string;
  mainImageUrl?: string | null;
  partNumber?: string | null;
  warranty?: string | null;
  categoryNameAr?: string | null;
  brandNameAr?: string | null;
  sellerStoreName?: string | null;
}

const HERO_FEATURES = [
  { icon: "shield", title: "قطع أصلية ومضمونة", desc: "نضمن جودة كل منتج يصلك" },
  { icon: "truck", title: "توصيل سريع", desc: "لجميع محافظات مصر" },
  { icon: "car", title: "توافق مع سيارتك", desc: "ابحث بموديل سيارتك" },
  { icon: "store", title: "بائعون موثوقون", desc: "بائعون معتمدون فقط" },
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .finally(() => setLoadingCats(false));

    fetch("/api/products?featured=true&limit=8")
      .then(r => r.json())
      .then(d => setFeaturedProducts(d.products || []))
      .finally(() => setLoadingProds(false));

    fetch("/api/products?sort=newest&limit=12")
      .then(r => r.json())
      .then(d => setLatestProducts(d.products || []));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1565C0] via-[#1565C0] to-[#0D47A1] text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
              سوق قطع غيار السيارات
              <span className="text-[#FF9900]"> الأول</span> في مصر
            </h1>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              آلاف القطع الأصلية والبديلة من أكبر البائعين الموثوقين. ابحث بسهولة بموديل سيارتك أو رقم القطعة.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/search"
                className="bg-[#FF9900] hover:bg-[#E68900] text-white px-6 py-3 rounded-lg font-bold text-base transition-colors"
              >
                تسوق الآن
              </Link>
              <Link
                href="/categories"
                className="bg-white/15 hover:bg-white/25 text-white px-6 py-3 rounded-lg font-medium text-base transition-colors border border-white/30"
              >
                استعرض التصنيفات
              </Link>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
            {HERO_FEATURES.map((feat) => (
              <div key={feat.icon} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-[#FF9900] rounded-lg flex items-center justify-center mb-2">
                  {feat.icon === "shield" && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                  {feat.icon === "truck" && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  )}
                  {feat.icon === "car" && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  )}
                  {feat.icon === "store" && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-white font-semibold text-sm mb-0.5">{feat.title}</h3>
                <p className="text-blue-200 text-xs">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-900">تسوق حسب التصنيف</h2>
            <Link href="/categories" className="text-[#1565C0] text-sm font-medium hover:underline">
              عرض الكل
            </Link>
          </div>
          {loadingCats ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
              {categories.slice(0, 10).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.id}`}
                  className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 hover:bg-[#1565C0] hover:text-white rounded-xl transition-all group text-center border border-blue-100 hover:border-[#1565C0]"
                >
                  <div className="w-8 h-8 bg-[#1565C0] group-hover:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white group-hover:text-[#1565C0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold leading-tight">{cat.nameAr}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>لا توجد تصنيفات بعد</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      {(featuredProducts.length > 0 || loadingProds) && (
        <section className="bg-gray-50 py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">منتجات مميزة</h2>
                <p className="text-sm text-gray-500">أفضل العروض المختارة لك</p>
              </div>
              <Link href="/search?featured=true" className="text-[#1565C0] text-sm font-medium hover:underline">
                عرض الكل
              </Link>
            </div>
            {loadingProds ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Latest Products */}
      <section className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-gray-900">أحدث المنتجات</h2>
              <p className="text-sm text-gray-500">تم إضافتها مؤخراً</p>
            </div>
            <Link href="/search" className="text-[#1565C0] text-sm font-medium hover:underline">
              عرض الكل
            </Link>
          </div>
          {latestProducts.length === 0 && !loadingProds ? (
            <div className="text-center py-16 bg-blue-50 rounded-2xl">
              <svg className="w-16 h-16 text-blue-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد منتجات بعد</h3>
              <p className="text-gray-400 mb-4">انضم كبائع وابدأ في إضافة منتجاتك</p>
              <Link href="/seller/apply" className="bg-[#1565C0] text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-[#0D47A1] transition-colors">
                انضم كبائع
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {latestProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA - Become a Seller */}
      <section className="bg-[#FF9900] py-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            هل تريد البيع معنا؟
          </h2>
          <p className="text-orange-100 text-base mb-6">
            انضم لآلاف البائعين على توفيقية مارت وابدأ في بيع قطع الغيار لملايين العملاء في مصر
          </p>
          <Link
            href="/seller/apply"
            className="bg-white text-[#FF9900] font-bold px-8 py-3 rounded-lg text-base hover:bg-orange-50 transition-colors inline-block"
          >
            قدم الآن كبائع
          </Link>
        </div>
      </section>
    </div>
  );
}
